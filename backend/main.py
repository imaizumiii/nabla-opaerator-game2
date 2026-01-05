from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sympy import sympify, diff, integrate, limit, oo, latex, simplify, Symbol, log, sqrt, Poly, solve, nan, zoo, wronskian
from sympy.calculus.util import AccumBounds
import sympy

app = FastAPI()

class CalculationRequest(BaseModel):
    expression: str
    operation: str  # differentiate, integrate, limit_infinity, limit_0, limit_sup, limit_inf, multiply, divide, log, sqrt, inverse
    operand: str | None = None # 乗算・除算用の第2引数
    
class CalculationResponse(BaseModel):
    expression: str
    latex: str
    is_zero: bool
    normalized_expression: str

class LinearDependenceRequest(BaseModel):
    expressions: list[str]

class LinearDependenceResponse(BaseModel):
    is_dependent: bool
    dependent_indices: list[int] # 従属している（削除すべき）関数のインデックス

def normalize_expr(expr, x_symbol):
    """
    数式を正規化する。
    1. 係数の除去 (2x -> x)
    2. 符号の正規化 (-x -> x)
    """
    try:
        # 1. 係数と原始部分に分離
        content, prim = expr.as_content_primitive()
        
        # 2. 符号の正規化
        # 多項式として扱えるか試みる
        try:
            poly = prim.as_poly(x_symbol)
            if poly is not None:
                lc = poly.LC()
                if lc.is_negative:
                    prim = -prim
            else:
                # as_polyがNoneを返す場合
                 c, r = prim.as_coeff_Mul()
                 if c.is_negative:
                     prim = -prim
        except sympy.PolificationFailed:
            # 多項式でない場合(sin(x)など)、as_coeff_Mulで係数チェック
            c, r = prim.as_coeff_Mul()
            if c.is_negative:
                prim = -prim
                
        return prim
    except Exception as e:
        print(f"Normalization error: {e}")
        return expr

@app.post("/check-linear-dependence", response_model=LinearDependenceResponse)
def check_linear_dependence(req: LinearDependenceRequest):
    try:
        x = Symbol('x', real=True)
        # 式をパース
        exprs = [sympify(e, locals={'x': x}) for e in req.expressions]
        
        # 1. 重複（完全一致または定数倍）をチェック
        # 先頭から順に見ていき、既に見たものと従属なら削除リストに入れる
        dependent_indices = []
        unique_exprs = [] # (index, expr)
        
        for i, expr in enumerate(exprs):
            is_dep = False
            for j, u_expr in unique_exprs:
                # 定数倍チェック: simplify(expr / u_expr) が定数か
                # または Wronskian が 0 か (2つの場合)
                
                # 0関数の扱いに注意
                if expr == 0:
                    # 0は常に従属扱いにする（あるいは消滅扱いだが、ここでは従属として報告）
                    is_dep = True
                    break
                
                if u_expr == 0:
                    continue

                # 比率チェック
                try:
                    ratio = simplify(expr / u_expr)
                    if ratio.is_constant():
                        is_dep = True
                        break
                except:
                    pass
                
                # Wronskian チェック (より汎用的)
                # w = wronskian([expr, u_expr], x)
                # if simplify(w) == 0:
                #     is_dep = True
                #     break
            
            if is_dep:
                dependent_indices.append(i)
            else:
                unique_exprs.append((i, expr))
        
        return {
            "is_dependent": len(dependent_indices) > 0,
            "dependent_indices": dependent_indices
        }
    except Exception as e:
        print(f"Linear dependence check error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/calculate", response_model=CalculationResponse)
def calculate(req: CalculationRequest):
    try:
        # 文字列をSymPyの式に変換
        # セキュリティ上のリスクがあるため、本来は入力を厳密に検証すべきだがプロトタイプとして許可
        # real=Trueを追加して簡約化を促進 (log(exp(x)) -> x など)
        x = Symbol('x', real=True)
        expr = sympify(req.expression, locals={'x': x})
        
        result = None
        
        if req.operation == 'differentiate':
            result = diff(expr, x)
            
        elif req.operation == 'integrate':
            # 不定積分 (積分定数は無視)
            result = integrate(expr, x)
            
        elif req.operation == 'limit_infinity':
            result = limit(expr, x, oo)
            
        elif req.operation == 'limit_0':
            result = limit(expr, x, 0)
            
        elif req.operation == 'limit_sup':
            # 上極限 (limsup)
            # 振動する場合は最大値を採用
            res = limit(expr, x, oo)
            
            # AccumBounds を含む場合は、その最大値に置換して評価を試みる
            # 例: x*sin(x) -> oo * AccumBounds(-1, 1) -> oo * 1 -> oo
            if hasattr(res, 'has') and res.has(AccumBounds):
                # .replace() が効かない場合があるため、atoms() で取得して subs で置換
                bounds = res.atoms(AccumBounds)
                for bound in bounds:
                    res = res.subs(bound, bound.max)
                result = res
            elif isinstance(res, AccumBounds):
                result = res.max
            else:
                result = res

        elif req.operation == 'limit_inf':
            # Note: 通常の "x -> -∞" ではなく "下極限 (liminf)" として動作させるべきか？
            # ユーザーの意図としては "liminf(x->oo)" の可能性が高いが、
            # カード定義(operatorType)によっては "limit_inf" が "x -> -∞" を意味する場合と "liminf" を意味する場合がある。
            # 今回の指示は「liminf(x->oo)は有効」とのことなので、
            # req.operation == 'limit_inf' がもし "x -> -∞" 用なら、別途 'limit_sub' (liminf) を作るか、
            # ここで分岐する必要がある。
            # 一旦、既存の 'limit_inf' は "x -> -∞" として実装されていたが、
            # 指示の文脈的に "limit_inf" カードは "x -> -∞" なのか "liminf x->oo" なのか確認が必要。
            # しかし、指示「liminf(x→oo)は有効」に従い、liminf用のロジックを追加する。
            # frontendの定義を見ると:
            # { id: 'l_minf1', name: '極限(-∞)', type: 'operator', operatorType: 'limit_inf', description: 'x -> -∞' }
            # とあるので、これは "x -> -∞" のこと。
            # "liminf" (下極限) のカードは現在フロントエンドにない（上極限はある）。
            # したがって、既存の 'limit_inf' (x->-oo) はそのままにし、
            # 新たに 'limit_sub' (liminf) を追加するか、あるいは 'limit_sup' の対になる概念として扱うか。
            # 今回は指示された「limsup」の修正を行い、
            # 「liminf」については、もしカードが存在するなら同様に処理するが、
            # "limit_inf" (x -> -∞) と混同しないように注意。
            
            # ユーザー指示: 「liminf(x→oo)は有効」
            # しかし現状 'limit_inf' は x->-oo を指している。
            # ここでは 'limit_inf' は x->-oo のままにし、
            # limsup のロジックだけ修正し、もし将来的に liminf カードが追加されたら対応できるようにする。
            # ただし、もしユーザーが "limit_inf" という名前で liminf を意図しているなら修正が必要。
            # 文脈から、既存の "limit_sup" カードの話をしていると思われる。
            
            # 指示の「liminf」が既存の 'limit_inf' エンドポイントを指しているのか不明確だが、
            # フロントエンドの定義は "極限(-∞)" なので、これは振動とは関係ない通常の極限。
            # したがって、'limit_sup' のみを修正する。
            result = limit(expr, x, -oo)

        elif req.operation == 'multiply':
            if not req.operand:
                raise HTTPException(status_code=400, detail="Operand required for multiplication")
            # 既にsympifyされた式同士の掛け算では、変数が別物として扱われる可能性がある
            # そのため、両方の式を文字列結合してからsympifyするか、明示的にxを共有させる
            
            # 手法1: 文字列で結合してパースしなおす（安全）
            # exprはすでにSymPyオブジェクトなので文字列化が必要
            combined_expr_str = f"({req.expression}) * ({req.operand})"
            result = sympify(combined_expr_str, locals={'x': x})

        elif req.operation == 'divide':
            if not req.operand:
                raise HTTPException(status_code=400, detail="Operand required for division")
            
            # 手法1: 文字列で結合してパースしなおす
            combined_expr_str = f"({req.expression}) / ({req.operand})"
            result = sympify(combined_expr_str, locals={'x': x})
            
            # ゼロ割チェックはSymPyがzooを返すので後の判定で拾えるが、念のため
            if result.is_infinite: # zoo (complex infinity) or oo or -oo
                 raise HTTPException(status_code=400, detail="Division by zero")

        elif req.operation == 'log':
            # 自然対数
            result = log(expr)

        elif req.operation == 'sqrt':
            # 平方根
            result = sqrt(expr)

        elif req.operation == 'inverse':
            # 逆関数 (f^-1(x))
            # y = f(x) を x について解く -> x = g(y) -> g(x) を返す
            y = Symbol('y', real=True)
            # 方程式 y = expr を x について解く
            solutions = solve(y - expr, x)
            
            if not solutions:
                raise HTTPException(status_code=400, detail="Inverse function not found")
            
            # 解が複数ある場合、簡易的に最後の解を採用 (例: x^2 -> sqrt(y))
            # sin(x) -> asin(y) (主値)
            sol = solutions[-1]
            
            # y を x に置換して関数形に戻す
            result = sol.subs(y, x)

        else:
            raise HTTPException(status_code=400, detail="Unknown operation")

        # 振動・不定形のチェック
        # limit_sup (上極限) の場合は AccumBounds が解消されているはずなのでチェックを通過する
        # 通常の limit (infinity/0) の場合は AccumBounds のままなのでここで弾かれる
        # x*sin(x) -> oo * AccumBounds(-1, 1) のような場合、AccumBoundsが式の一部に含まれる
        if isinstance(result, AccumBounds) or result.has(AccumBounds):
            raise HTTPException(status_code=400, detail="Result oscillates (undefined limit)")
        
        if result == nan:
             raise HTTPException(status_code=400, detail="Result is undefined (NaN)")

        # 簡約化
        result = simplify(result)
        
        # 文字列化とLaTeX化
        # infinityなどの扱い
        result_str = str(result)
        
        # 0判定 (oo や -oo も消滅扱いとするなら is_zeroフラグを立てる)
        is_zero_val = False
        if result == 0 or result == oo or result == -oo or result_str == 'nan' or result_str == 'zoo':
            is_zero_val = True
            
        # 正規化
        normalized = normalize_expr(result, x)
        normalized_str = str(normalized)

        return {
            "expression": result_str, 
            "latex": latex(result),
            "is_zero": is_zero_val,
            "normalized_expression": normalized_str
        }

    except Exception as e:
        print(f"Error: {e}")
        # エラー時は元の式を返すか、エラーを投げる
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok"}

