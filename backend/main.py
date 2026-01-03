from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sympy import sympify, diff, integrate, limit, oo, latex, simplify, Symbol, log, sqrt, Poly
import sympy

app = FastAPI()

class CalculationRequest(BaseModel):
    expression: str
    operation: str  # differentiate, integrate, limit_infinity, limit_0, limit_sup, limit_inf, multiply, divide, log, sqrt
    operand: str | None = None # 乗算・除算用の第2引数
    
class CalculationResponse(BaseModel):
    expression: str
    latex: str
    is_zero: bool
    normalized_expression: str

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

@app.post("/calculate", response_model=CalculationResponse)
async def calculate(req: CalculationRequest):
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
            # 上極限 (簡易実装: 最大値を返すロジック等は複雑なため、振動関数についてはルールベースで対応)
            # SymPyには直接的なlimsup関数はあるが、数列用が多い。
            # ここでは sin/cos の最大値を 1 として扱うなどの特例処理を入れる
            expr_str = str(expr)
            if 'sin' in expr_str or 'cos' in expr_str:
                 result = sympify(1)
            else:
                 result = limit(expr, x, oo) # 振動しなければ通常の極限と同じとみなす(簡易)

        elif req.operation == 'limit_inf':
            # 下極限
            expr_str = str(expr)
            if 'sin' in expr_str or 'cos' in expr_str:
                 result = sympify(-1)
            else:
                 result = limit(expr, x, oo)

        elif req.operation == 'multiply':
            if not req.operand:
                raise HTTPException(status_code=400, detail="Operand required for multiplication")
            op_expr = sympify(req.operand, locals={'x': x})
            result = expr * op_expr

        elif req.operation == 'divide':
            if not req.operand:
                raise HTTPException(status_code=400, detail="Operand required for division")
            op_expr = sympify(req.operand, locals={'x': x})
            # 簡易ゼロ割チェック
            if op_expr == 0:
                 raise HTTPException(status_code=400, detail="Division by zero")
            result = expr / op_expr

        elif req.operation == 'log':
            # 自然対数
            result = log(expr)

        elif req.operation == 'sqrt':
            # 平方根
            result = sqrt(expr)

        else:
            raise HTTPException(status_code=400, detail="Unknown operation")

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

