import { FunctionCard, OperatorCard } from '../types/game';

export const INITIAL_DECK: (FunctionCard | OperatorCard)[] = [
  // 微分系
  { id: 'd1', name: '微分', type: 'operator', operatorType: 'differential', description: '関数を微分する' },
  { id: 'd2', name: '微分', type: 'operator', operatorType: 'differential', description: '関数を微分する' },
  { id: 'nabla1', name: 'ナブラ', type: 'operator', operatorType: 'nabla', description: '場の全関数を微分' },
  { id: 'nabla2', name: 'ナブラ', type: 'operator', operatorType: 'nabla', description: '場の全関数を微分' },
  { id: 'lap1', name: 'ラプラシアン', type: 'operator', operatorType: 'laplacian', description: '場の全関数を2回微分' },
  { id: 'lap2', name: 'ラプラシアン', type: 'operator', operatorType: 'laplacian', description: '場の全関数を2回微分' },
  
  // 積分系
  { id: 'i1', name: '積分', type: 'operator', operatorType: 'integral', description: '関数を積分する' },
  { id: 'i2', name: '積分', type: 'operator', operatorType: 'integral', description: '関数を積分する' },

  // 極限系
  { id: 'l_inf1', name: '極限(∞)', type: 'operator', operatorType: 'limit_infinity', description: 'x -> ∞' },
  { id: 'l_inf2', name: '極限(∞)', type: 'operator', operatorType: 'limit_infinity', description: 'x -> ∞' },
  { id: 'l_minf1', name: '極限(-∞)', type: 'operator', operatorType: 'limit_inf', description: 'x -> -∞' },
  { id: 'l_minf2', name: '極限(-∞)', type: 'operator', operatorType: 'limit_inf', description: 'x -> -∞' },
  { id: 'l_0_1', name: '極限(0)', type: 'operator', operatorType: 'limit_0', description: 'x -> 0' },
  { id: 'l_0_2', name: '極限(0)', type: 'operator', operatorType: 'limit_0', description: 'x -> 0' },
  { id: 'l_sup1', name: '上極限', type: 'operator', operatorType: 'limit_sup', description: 'lim sup (最大値)' },
  { id: 'l_sup2', name: '上極限', type: 'operator', operatorType: 'limit_sup', description: 'lim sup (最大値)' },

  // 代数演算系
  { id: 'op_mul1', name: '乗算', type: 'operator', operatorType: 'multiply', description: '手札の関数と掛け合わせる' },
  { id: 'op_mul2', name: '乗算', type: 'operator', operatorType: 'multiply', description: '手札の関数と掛け合わせる' },
  { id: 'op_div1', name: '除算', type: 'operator', operatorType: 'divide', description: '手札の関数で割る' },
  { id: 'op_div2', name: '除算', type: 'operator', operatorType: 'divide', description: '手札の関数で割る' },
  { id: 'op_log1', name: 'log', type: 'operator', operatorType: 'log', description: '自然対数をとる' },
  { id: 'op_log2', name: 'log', type: 'operator', operatorType: 'log', description: '自然対数をとる' },
  { id: 'op_sqrt1', name: '√', type: 'operator', operatorType: 'sqrt', description: '平方根をとる' },
  { id: 'op_sqrt2', name: '√', type: 'operator', operatorType: 'sqrt', description: '平方根をとる' },
  { id: 'op_inv1', name: '逆関数', type: 'operator', operatorType: 'inverse', description: 'f^-1(x)' },
  { id: 'op_inv2', name: '逆関数', type: 'operator', operatorType: 'inverse', description: 'f^-1(x)' },

  // 関数カード
  { id: 'f1_1', name: 'e^x', type: 'function', expression: 'exp(x)', latex: 'e^x', description: '指数関数', normalizedExpression: 'exp(x)' },
  { id: 'f1_2', name: 'e^x', type: 'function', expression: 'exp(x)', latex: 'e^x', description: '指数関数', normalizedExpression: 'exp(x)' },
  { id: 'f2_1', name: 'sin(x)', type: 'function', expression: 'sin(x)', latex: '\\sin(x)', description: '正弦関数', normalizedExpression: 'sin(x)' },
  { id: 'f2_2', name: 'sin(x)', type: 'function', expression: 'sin(x)', latex: '\\sin(x)', description: '正弦関数', normalizedExpression: 'sin(x)' },
  
  // 追加関数
  { id: 'f_cos1', name: 'cos(x)', type: 'function', expression: 'cos(x)', latex: '\\cos(x)', description: '余弦関数', normalizedExpression: 'cos(x)' },
  { id: 'f_cos2', name: 'cos(x)', type: 'function', expression: 'cos(x)', latex: '\\cos(x)', description: '余弦関数', normalizedExpression: 'cos(x)' },
  { id: 'f_x1', name: 'x', type: 'function', expression: 'x', latex: 'x', description: '一次関数', normalizedExpression: 'x' },
  { id: 'f_x2', name: 'x', type: 'function', expression: 'x', latex: 'x', description: '一次関数', normalizedExpression: 'x' },
  { id: 'f_x2_1', name: 'x^2', type: 'function', expression: 'x**2', latex: 'x^2', description: '二次関数', normalizedExpression: 'x**2' },
  { id: 'f_x2_2', name: 'x^2', type: 'function', expression: 'x**2', latex: 'x^2', description: '二次関数', normalizedExpression: 'x**2' },
  { id: 'f_1_1', name: '1', type: 'function', expression: '1', latex: '1', description: '定数関数', normalizedExpression: '1' },
  { id: 'f_1_2', name: '1', type: 'function', expression: '1', latex: '1', description: '定数関数', normalizedExpression: '1' },
  { id: 'f_0_1', name: '0', type: 'function', expression: '0', latex: '0', description: 'ゼロ関数', normalizedExpression: '0' },
  { id: 'f_0_2', name: '0', type: 'function', expression: '0', latex: '0', description: 'ゼロ関数', normalizedExpression: '0' },
];

export const INITIAL_FIELD: FunctionCard[] = [
  { id: 'basis_1', name: '1', type: 'function', expression: '1', latex: '1', description: '定数関数', normalizedExpression: '1' },
  { id: 'basis_x', name: 'x', type: 'function', expression: 'x', latex: 'x', description: '一次関数', normalizedExpression: 'x' },
  { id: 'basis_x2', name: 'x^2', type: 'function', expression: 'x**2', latex: 'x^2', description: '二次関数', normalizedExpression: 'x**2' }, // x**2 for sympy
];

export const shuffleDeck = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};
