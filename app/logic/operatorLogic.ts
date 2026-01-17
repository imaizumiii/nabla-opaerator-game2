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
  operandCard?: FunctionCard
): Promise<void> => {
  let operandExpression: string | undefined;
  if (operandCard) {
    operandExpression = operandCard.expression;
    console.log(`[applyOperator] Operand Expression: ${operandExpression}`);
  }

  // 乗算・除算の場合はオペランドが必須 (単体演算子の場合)
  if (operators.length === 1) {
    const opType = operators[0].operatorType;
    if ((opType === 'multiply' || opType === 'divide') && !operandExpression) {
      throw new Error("オペランドが必要です（乗算・除算）");
    }
  }

  // 順次適用
  let currentResult: CalculationResult = { 
    expression: targetCard.expression, 
    latex: targetCard.latex, 
    isZero: false 
  };

  try {
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
          if (operandExpression) nextResult = await MathEngine.multiply(currentResult.expression, operandExpression);
          break;
        case 'divide':
          if (operandExpression) nextResult = await MathEngine.divide(currentResult.expression, operandExpression);
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

  // 手札消費: オペランドとして使った関数カード
  if (operandCard) {
    const operandIndex = currentPlayerState.hand.findIndex(c => c.id === operandCard.id);
    if (operandIndex !== -1) {
      currentPlayerState.hand.splice(operandIndex, 1);
    }
  }
};
