export interface CalculationResult {
  expression: string;
  latex: string;
  isZero: boolean;
  normalizedExpression?: string;
}

export class MathEngine {
  static async differentiate(expression: string): Promise<CalculationResult> {
    return this.callApi(expression, 'differentiate');
  }

  static async integrate(expression: string): Promise<CalculationResult> {
    return this.callApi(expression, 'integrate');
  }

  static async limit(expression: string, type: 'infinity' | '0' | 'sup' | 'inf'): Promise<CalculationResult> {
    let operation = 'limit_infinity';
    if (type === '0') operation = 'limit_0';
    if (type === 'sup') operation = 'limit_sup';
    if (type === 'inf') operation = 'limit_inf';
    
    return this.callApi(expression, operation);
  }

  static async multiply(expression: string, operand: string): Promise<CalculationResult> {
    return this.callApi(expression, 'multiply', operand);
  }

  static async divide(expression: string, operand: string): Promise<CalculationResult> {
    return this.callApi(expression, 'divide', operand);
  }

  static async log(expression: string): Promise<CalculationResult> {
    return this.callApi(expression, 'log');
  }

  static async sqrt(expression: string): Promise<CalculationResult> {
    return this.callApi(expression, 'sqrt');
  }

  static async inverse(expression: string): Promise<CalculationResult> {
    return this.callApi(expression, 'inverse');
  }

  static async checkLinearDependence(expressions: string[]): Promise<{ isDependent: boolean, dependentIndices: number[] }> {
    try {
      const res = await fetch('/api/py/check-linear-dependence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expressions }),
      });

      if (!res.ok) {
         const errorData = await res.json().catch(() => ({}));
         throw new Error(errorData.detail || `API error: ${res.status}`);
      }

      const data = await res.json();
      return {
        isDependent: data.is_dependent,
        dependentIndices: data.dependent_indices
      };
    } catch (e) {
      console.error("Linear Dependence API Error:", e);
      // エラー時は安全側に倒して重複なしとする（あるいは再スロー）
      // ここではゲーム進行を止めないため重複なしとするが、ログは出す
      return { isDependent: false, dependentIndices: [] };
    }
  }

  private static async callApi(expression: string, operation: string, operand?: string): Promise<CalculationResult> {
    try {
      const body: any = { expression, operation };
      if (operand) body.operand = operand;

      const res = await fetch('/api/py/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `API error: ${res.status}`);
      }

      const data = await res.json();
      
      return {
        expression: data.expression,
        latex: data.latex,
        isZero: data.is_zero,
        normalizedExpression: data.normalized_expression
      };
    } catch (e) {
      // エラーは上位(UI側)で処理させるためにそのままスローするが、
      // 開発者コンソールには出しすぎないように制御してもよい。
      // ここでは、useGameState側でcatchしてalertを出すので、単に再スローする。
      throw e;
    }
  }

  // 同期的なLaTeX変換が必要な場合（初期表示など）のために残すが、
  // クライアントサイドでの完全な変換は難しいため、可能な限りサーバーレスポンスを使うべき
  static toLatex(expression: string): string {
    return expression; 
  }
}
