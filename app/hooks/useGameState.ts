import { useState, useCallback } from 'react';
import { GameState, PlayerState, FunctionCard, OperatorCard } from '../types/game';
import { MathEngine, CalculationResult } from '../lib/math-engine';

const INITIAL_DECK: (FunctionCard | OperatorCard)[] = [
  { id: 'd1', name: '微分', type: 'operator', operatorType: 'differential', description: '関数を微分する' },
  { id: 'd2', name: '微分', type: 'operator', operatorType: 'differential', description: '関数を微分する' },
  { id: 'i1', name: '積分', type: 'operator', operatorType: 'integral', description: '関数を積分する' },
  { id: 'l_inf', name: '極限(∞)', type: 'operator', operatorType: 'limit_infinity', description: 'x -> ∞' },
  { id: 'l_sup', name: '上極限', type: 'operator', operatorType: 'limit_sup', description: 'lim sup (最大値)' },
  { id: 'op_mul', name: '乗算', type: 'operator', operatorType: 'multiply', description: '手札の関数と掛け合わせる' },
  { id: 'op_div', name: '除算', type: 'operator', operatorType: 'divide', description: '手札の関数で割る' },
  { id: 'op_log', name: 'log', type: 'operator', operatorType: 'log', description: '自然対数をとる' },
  { id: 'op_sqrt', name: '√', type: 'operator', operatorType: 'sqrt', description: '平方根をとる' },
  { id: 'f1', name: 'e^x', type: 'function', expression: 'exp(x)', latex: 'e^x', description: '指数関数' }, // exp(x) for sympy
  { id: 'f2', name: 'sin(x)', type: 'function', expression: 'sin(x)', latex: '\\sin(x)', description: '正弦関数' },
];

const INITIAL_FIELD: FunctionCard[] = [
  { id: 'basis_1', name: '1', type: 'function', expression: '1', latex: '1', description: '定数関数' },
  { id: 'basis_x', name: 'x', type: 'function', expression: 'x', latex: 'x', description: '一次関数' },
  { id: 'basis_x2', name: 'x^2', type: 'function', expression: 'x**2', latex: 'x^2', description: '二次関数' }, // x**2 for sympy
];

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>({
    turnCount: 1,
    currentPlayer: 'player',
    phase: 'draw',
    player: {
      id: 'player',
      field: INITIAL_FIELD.map(c => ({ ...c, id: `p1_${c.id}` })),
      hand: [],
      deck: [...INITIAL_DECK],
    },
    opponent: {
      id: 'opponent',
      field: INITIAL_FIELD.map(c => ({ ...c, id: `p2_${c.id}` })),
      hand: [],
      deck: [...INITIAL_DECK],
    },
    winner: null,
  });

  const checkLinearDependence = (field: FunctionCard[]): FunctionCard[] => {
    const uniqueField: FunctionCard[] = [];
    const seenExpressions = new Set<string>();

    for (const card of field) {
      // APIサーバーからの戻り値は正規化されていると期待して文字比較
      const expr = card.expression; 
      
      if (!seenExpressions.has(expr)) {
        uniqueField.push(card);
        seenExpressions.add(expr);
      } else {
        console.log(`[LinearDependence] Removing duplicate: ${card.name} (${expr})`);
      }
    }
    return uniqueField;
  };

  const deployFunction = useCallback((cardId: string, targetPlayerId: string) => {
    setGameState(prev => {
        if (prev.winner) return prev;

        const newState = { ...prev };
        newState.player = { ...prev.player, field: [...prev.player.field], hand: [...prev.player.hand] };
        newState.opponent = { ...prev.opponent, field: [...prev.opponent.field], hand: [...prev.opponent.hand] };

        const currentPlayerState = newState.currentPlayer === 'player' ? newState.player : newState.opponent;
        const cardIndex = currentPlayerState.hand.findIndex(c => c.id === cardId);
        
        if (cardIndex === -1) return prev;
        
        const card = currentPlayerState.hand[cardIndex];
        if (card.type !== 'function') return prev;

        // 手札から削除
        currentPlayerState.hand.splice(cardIndex, 1);

        // 対象フィールドに追加
        const targetPlayerState = targetPlayerId === 'player' ? newState.player : newState.opponent;
        const newCard = { ...card, id: `${card.id}_deployed_${Date.now()}` } as FunctionCard;
        targetPlayerState.field.push(newCard);
        
        // ターン終了判定を入れるならここだが、アクション後の処理はUI側で制御するか、あるいは自動でエンドではない

        return newState;
    });
  }, []);

  const applyOperator = useCallback(async (
    operators: OperatorCard[], // 配列に変更
    targetId: string, 
    targetPlayerId: string,
    targetCard: FunctionCard, // UIから渡された対象カード
    operandCard?: FunctionCard // UIから渡されたオペランドカード
  ) => {
    console.log(`[applyOperator] Start. TargetID: ${targetId}, Operators:`, operators.map(o => o.operatorType));

    let operandExpression: string | undefined;
    if (operandCard) {
        operandExpression = operandCard.expression;
        console.log(`[applyOperator] Operand Expression: ${operandExpression}`);
    }

    // 乗算・除算の場合はオペランドが必須 (単体演算子の場合)
    if (operators.length === 1) {
        const opType = operators[0].operatorType;
        if ((opType === 'multiply' || opType === 'divide') && !operandExpression) {
            console.error("Operand required for multiply/divide");
            return;
        }
    }

    // 順次適用
    let currentResult: CalculationResult = { expression: targetCard.expression, latex: targetCard.latex, isZero: false };

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
          }
          currentResult = nextResult;
          console.log(`[Math] Result:`, currentResult);
      }
    } catch(e) {
      console.error(e);
      return;
    }

    setGameState(prev => {
      console.log('[Update] Applying state update');
      const newState = { ...prev };
      newState.player = { ...prev.player, field: [...prev.player.field], hand: [...prev.player.hand] };
      newState.opponent = { ...prev.opponent, field: [...prev.opponent.field], hand: [...prev.opponent.hand] };

      const targetPlayer = targetPlayerId === 'player' ? newState.player : newState.opponent;
      const targetCardIndex = targetPlayer.field.findIndex(c => c.id === targetId);
      
      console.log(`[Update] Target Index: ${targetCardIndex}`);

      if (targetCardIndex !== -1) {
        if (currentResult.isZero) {
          console.log('[Update] Card removed (isZero)');
          targetPlayer.field.splice(targetCardIndex, 1);
        } else {
          const oldId = targetPlayer.field[targetCardIndex].id;
          const newId = `${oldId.split('_u_')[0]}_u_${Date.now()}`;
          console.log(`[Update] Updating card ${oldId} -> ${newId} with expression: ${currentResult.expression}`);
          
          targetPlayer.field[targetCardIndex] = {
            ...targetPlayer.field[targetCardIndex],
            // IDを更新して再レンダリングを強制する
            id: newId,
            expression: currentResult.expression,
            latex: currentResult.latex,
            name: currentResult.expression
          };
        }
        targetPlayer.field = checkLinearDependence(targetPlayer.field);
      } else {
          console.warn(`[Update] Target card ${targetId} not found during update phase.`);
      }

      // 手札消費: 演算子カード（すべて消費）
      const currentPlayerState = newState.currentPlayer === 'player' ? newState.player : newState.opponent;
      
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

      // 勝利判定
      if (newState.opponent.field.length === 0) {
        newState.winner = 'player';
      } else if (newState.player.field.length === 0) {
        newState.winner = 'opponent';
      }

      return newState;
    });

  }, []);

  const drawCard = useCallback(() => {
    setGameState(prev => {
      if (prev.winner) return prev;
      
      const newState = { ...prev };
      newState.player = { ...prev.player, hand: [...prev.player.hand], deck: [...prev.player.deck] };
      newState.opponent = { ...prev.opponent, hand: [...prev.opponent.hand], deck: [...prev.opponent.deck] };

      const currentPlayerState = newState.currentPlayer === 'player' ? newState.player : newState.opponent;

      if (currentPlayerState.deck.length === 0) return prev;
      
      const card = currentPlayerState.deck.pop();
      if (card) {
        currentPlayerState.hand.push({ ...card, id: `${card.id}_${Date.now()}` });
      }
      return newState;
    });
  }, []);

  const endTurn = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      turnCount: prev.turnCount + 1,
      currentPlayer: prev.currentPlayer === 'player' ? 'opponent' : 'player',
    }));
  }, []);

  return {
    gameState,
    applyOperator,
    deployFunction,
    drawCard,
    endTurn
  };
}
