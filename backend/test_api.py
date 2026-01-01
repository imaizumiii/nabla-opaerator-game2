from fastapi.testclient import TestClient
from main import app
import json

client = TestClient(app)

def test_operation(expression, operation, description, operand=None):
    print(f"--- Testing: {description} ---")
    print(f"Expression: {expression}")
    print(f"Operation:  {operation}")
    if operand:
        print(f"Operand:    {operand}")
    
    payload = {
        "expression": expression,
        "operation": operation,
        "operand": operand
    }
    
    try:
        response = client.post("/calculate", json=payload)
        if response.status_code == 200:
            data = response.json()
            print(f"Result:     {data['expression']}")
            print(f"LaTeX:      {data['latex']}")
            print(f"Is Zero:    {data['is_zero']}")
            print("Status:     OK")
        else:
            print(f"Status:     Error {response.status_code}")
            print(f"Detail:     {response.text}")
    except Exception as e:
        print(f"Exception:  {e}")
    print("\n")

def run_all_tests():
    # 1. 微分 (x^2 -> 2x)
    test_operation("x**2", "differentiate", "Differentiation (x^2)")

    # 2. 積分 (2*x -> x^2)
    test_operation("2*x", "integrate", "Integration (2x)")

    # 3. 極限 infinity (1/x -> 0)
    test_operation("1/x", "limit_infinity", "Limit to Infinity (1/x)")

    # 4. 極限 0 (sin(x)/x -> 1)
    test_operation("sin(x)/x", "limit_0", "Limit to 0 (sin(x)/x)")

    # 5. 上極限 (sin(x) -> 1 [簡易実装])
    test_operation("sin(x)", "limit_sup", "Limit Sup (sin(x))")

    # 6. 下極限 (cos(x) -> -1 [簡易実装])
    test_operation("cos(x)", "limit_inf", "Limit Inf (cos(x))")

    # 7. 複雑なケース: 振動しない関数の上極限 (arctan(x) -> pi/2)
    test_operation("atan(x)", "limit_sup", "Limit Sup (atan(x))")

    # 8. 代数演算: 乗算 (x * x -> x^2)
    test_operation("x", "multiply", "Multiplication (x * x)", operand="x")

    # 9. 代数演算: 除算 (1 / x -> 1/x)
    test_operation("1", "divide", "Division (1 / x)", operand="x")

    # 10. 代数演算: 対数 (log(e^x) -> x)
    # SymPyでは exp(x) で e^x
    test_operation("exp(x)", "log", "Logarithm (log(e^x))")

    # 11. 代数演算: 平方根 (sqrt(x^2) -> x)
    test_operation("x**2", "sqrt", "Square Root (sqrt(x^2))")

    # 12. エラーケース: 無効な操作
    test_operation("x", "unknown_op", "Unknown Operation")
    
    # 13. エラーケース: オペランドなしの乗算
    test_operation("x", "multiply", "Multiplication without operand")

if __name__ == "__main__":
    run_all_tests()
