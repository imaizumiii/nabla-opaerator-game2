from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sympy import sympify, diff, integrate, limit, oo, latex, simplify, Symbol
import sympy

app = FastAPI()

class CalculationRequest(BaseModel):
    expression: str
    operation: str  # differentiate, integrate, limit_infinity, limit_0, limit_sup, limit_inf
    
class CalculationResponse(BaseModel):
    expression: str
    latex: str
    is_zero: bool

@app.post("/calculate", response_model=CalculationResponse)
async def calculate(req: CalculationRequest):
    try:
        # 文字列をSymPyの式に変換
        # セキュリティ上のリスクがあるため、本来は入力を厳密に検証すべきだがプロトタイプとして許可
        x = Symbol('x')
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

        return {
            "expression": result_str.replace('**', '^'), # JS/MathJax向けに調整
            "latex": latex(result),
            "is_zero": is_zero_val
        }

    except Exception as e:
        print(f"Error: {e}")
        # エラー時は元の式を返すか、エラーを投げる
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok"}

