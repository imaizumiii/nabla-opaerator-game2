export interface CalculationResult {
  expression: string;
  latex: string;
  isZero: boolean;
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

  private static async callApi(expression: string, operation: string): Promise<CalculationResult> {
    try {
      const res = await fetch('/api/py/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression, operation }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      
      return {
        expression: data.expression,
        latex: data.latex,
        isZero: data.is_zero
      };
    } catch (e) {
      console.error("Math API Error:", e);
      // エラー時のフォールバック
      return {
        expression: expression,
        latex: expression,
        isZero: false
      };
    }
  }

  // 同期的なLaTeX変換が必要な場合（初期表示など）のために残すが、
  // クライアントサイドでの完全な変換は難しいため、可能な限りサーバーレスポンスを使うべき
  static toLatex(expression: string): string {
    return expression; 
  }
}
