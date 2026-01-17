import { GameState, FunctionCard, OperatorCard } from '../types/game';
import { MathEngine, CalculationResult } from '../lib/math-engine';
import { resolveLinearDependence } from '../hooks/useLinearDependence';
import { advanceTurn, checkWinner } from './turnLogic';

/**
 * AoE（全体攻撃）演算子を適用する
 */
export const applyAoEOperator = async (
  operators: OperatorCard[],
  targetField: FunctionCard[],
  targetPlayerState: { field: FunctionCard[] },
  currentPlayerState: { hand: (FunctionCard | OperatorCard)[] }
): Promise<void> => {
  const isNabla = operators.some(o => o.operatorType === 'nabla');
  const isLaplacian = operators.some(o => o.operatorType === 'laplacian');

  // 並列で計算実行するとサーバー負荷でタイムアウトする可能性があるため、直列実行に変更
  const results: { id: string, result: CalculationResult }[] = [];

  try {
    for (const card of targetField) {
      let currentResult: CalculationResult = { 
        expression: card.expression, 
        latex: card.latex, 
        isZero: false 
      };
      
      // ナブラ: 微分1回
      if (isNabla) {
        currentResult = await MathEngine.differentiate(currentResult.expression);
      }
      // ラプラシアン: 微分2回
      if (isLaplacian) {
        const res1 = await MathEngine.differentiate(currentResult.expression);
        if (!res1.isZero) {
          currentResult = await MathEngine.differentiate(res1.expression);
        } else {
          currentResult = res1;
        }
      }
      // 結果の検証
      console.log(`[AoE Log] ${card.name} -> ${currentResult.expression}`, currentResult);
      results.push({ id: card.id, result: currentResult });
    }
  } catch (e: any) {
    console.error("全体攻撃計算エラー:", e);
    throw new Error(`無効な計算です。\n詳細: ${e.message}`);
  }
  
  console.log('[AoE Log] All results:', results);

  // 計算結果を適用
  results.forEach(({ id, result }) => {
    const index = targetPlayerState.field.findIndex(c => c.id === id);
    if (index !== -1) {
      if (result.isZero) {
        targetPlayerState.field.splice(index, 1);
      } else {
        const oldCard = targetPlayerState.field[index];
        targetPlayerState.field[index] = {
          ...oldCard,
          id: `${oldCard.id.split('_u_')[0]}_u_${Date.now()}`,
          expression: result.expression,
          latex: result.latex,
          name: result.expression,
          normalizedExpression: result.normalizedExpression
        };
      }
    }
  });

  // 線形従属チェック (API)
  targetPlayerState.field = await resolveLinearDependence(targetPlayerState.field);

  // 手札消費
  for (const operator of operators) {
    const opIndex = currentPlayerState.hand.findIndex(c => c.id === operator.id);
    if (opIndex !== -1) {
      currentPlayerState.hand.splice(opIndex, 1);
    }
  }
};

/**
 * 単体ターゲット演算子を適用する
 */
export const applySingleTargetOperator = async (
  operators: OperatorCard[],
  targetCard: FunctionCard,
  targetId: string,
  targetPlayerState: { field: FunctionCard[] },
  currentPlayerState: { hand: (FunctionCard | OperatorCard)[] },
  operandCards?: FunctionCard | FunctionCard[]
): Promise<void> => {
  // オペランドを配列に正規化
  const operandArray: FunctionCard[] = Array.isArray(operandCards) 
    ? operandCards 
    : operandCards 
      ? [operandCards] 
      : [];

  // 乗算・除算の演算子を抽出
  const multiplyDivideOps = operators.filter(op => op.operatorType === 'multiply' || op.operatorType === 'divide');
  
  // 乗算・除算の場合はオペランドが必須
  if (multiplyDivideOps.length > 0) {
    if (operandArray.length < multiplyDivideOps.length) {
      throw new Error(`乗算・除算の演算子が${multiplyDivideOps.length}枚選択されていますが、オペランドが${operandArray.length}枚しかありません。`);
    }
  }

  // 順次適用
  let currentResult: CalculationResult = { 
    expression: targetCard.expression, 
    latex: targetCard.latex, 
    isZero: false 
  };

  try {
    let operandIndex = 0; // オペランドのインデックス
    
    for (const operator of operators) {
      // すでに0になっていたら計算不要
      if (currentResult.isZero) break;

      console.log(`[Math] Executing ${operator.operatorType} on ${currentResult.expression}`);
      let nextResult: CalculationResult = currentResult;

      switch (operator.operatorType) {
        case 'differential':
          nextResult = await MathEngine.differentiate(currentResult.expression);
          break;
        case 'integral':
          nextResult = await MathEngine.integrate(currentResult.expression);
          break;
        case 'limit_infinity':
          nextResult = await MathEngine.limit(currentResult.expression, 'infinity');
          break;
        case 'limit_0':
          nextResult = await MathEngine.limit(currentResult.expression, '0');
          break;
        case 'limit_sup':
          nextResult = await MathEngine.limit(currentResult.expression, 'sup');
          break;
        case 'limit_inf':
          nextResult = await MathEngine.limit(currentResult.expression, 'inf');
          break;
        case 'multiply':
          if (operandIndex < operandArray.length) {
            const operandExpression = operandArray[operandIndex].expression;
            console.log(`[applyOperator] Operand Expression (${operandIndex}): ${operandExpression}`);
            nextResult = await MathEngine.multiply(currentResult.expression, operandExpression);
            operandIndex++;
          } else {
            throw new Error("乗算に必要なオペランドが不足しています");
          }
          break;
        case 'divide':
          if (operandIndex < operandArray.length) {
            const operandExpression = operandArray[operandIndex].expression;
            console.log(`[applyOperator] Operand Expression (${operandIndex}): ${operandExpression}`);
            nextResult = await MathEngine.divide(currentResult.expression, operandExpression);
            operandIndex++;
          } else {
            throw new Error("除算に必要なオペランドが不足しています");
          }
          break;
        case 'log':
          nextResult = await MathEngine.log(currentResult.expression);
          break;
        case 'sqrt':
          nextResult = await MathEngine.sqrt(currentResult.expression);
          break;
        case 'inverse':
          nextResult = await MathEngine.inverse(currentResult.expression);
          break;
      }
      currentResult = nextResult;
      console.log(`[Math] Result:`, currentResult);
    }
  } catch (e: any) {
    console.error(e);
    throw new Error(`無効な計算です。\n詳細: ${e.message}`);
  }

  // 結果をフィールドに適用
  const targetCardIndex = targetPlayerState.field.findIndex(c => c.id === targetId);
  
  console.log(`[Update] Target Index: ${targetCardIndex}`);

  if (targetCardIndex !== -1) {
    if (currentResult.isZero) {
      console.log('[Update] Card removed (isZero)');
      targetPlayerState.field.splice(targetCardIndex, 1);
    } else {
      const oldId = targetPlayerState.field[targetCardIndex].id;
      const newId = `${oldId.split('_u_')[0]}_u_${Date.now()}`;
      console.log(`[Update] Updating card ${oldId} -> ${newId} with expression: ${currentResult.expression}`);
      
      targetPlayerState.field[targetCardIndex] = {
        ...targetPlayerState.field[targetCardIndex],
        id: newId,
        expression: currentResult.expression,
        latex: currentResult.latex,
        name: currentResult.expression,
        normalizedExpression: currentResult.normalizedExpression
      };
    }
    // 線形従属チェック (API)
    targetPlayerState.field = await resolveLinearDependence(targetPlayerState.field);
  } else {
    console.warn(`[Update] Target card ${targetId} not found during update phase.`);
  }

  // 手札消費: 演算子カード（すべて消費）
  for (const operator of operators) {
    const opIndex = currentPlayerState.hand.findIndex(c => c.id === operator.id);
    if (opIndex !== -1) {
      currentPlayerState.hand.splice(opIndex, 1);
    }
  }

  // 手札消費: オペランドとして使った関数カード（すべて消費）
  for (const operandCard of operandArray) {
    const operandIndex = currentPlayerState.hand.findIndex(c => c.id === operandCard.id);
    if (operandIndex !== -1) {
      currentPlayerState.hand.splice(operandIndex, 1);
    }
  }
};
