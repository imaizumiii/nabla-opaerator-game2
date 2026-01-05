import React, { useState, useCallback, useEffect } from 'react';
import { GameState, PlayerState, FunctionCard, OperatorCard } from '../types/game';
import { MathEngine, CalculationResult } from '../lib/math-engine';

const INITIAL_DECK: (FunctionCard | OperatorCard)[] = [
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

const INITIAL_FIELD: FunctionCard[] = [
  { id: 'basis_1', name: '1', type: 'function', expression: '1', latex: '1', description: '定数関数', normalizedExpression: '1' },
  { id: 'basis_x', name: 'x', type: 'function', expression: 'x', latex: 'x', description: '一次関数', normalizedExpression: 'x' },
  { id: 'basis_x2', name: 'x^2', type: 'function', expression: 'x**2', latex: 'x^2', description: '二次関数', normalizedExpression: 'x**2' }, // x**2 for sympy
];

const shuffleDeck = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>({
    turnCount: 1,
    currentPlayer: 'player',
    phase: 'draw',
    player: {
      id: 'player',
      field: INITIAL_FIELD.map(c => ({ ...c, id: `p1_${c.id}` })),
      hand: [],
      deck: [...INITIAL_DECK], // Hydration Mismatchを防ぐため、初期状態はシャッフルしない
    },
    opponent: {
      id: 'opponent',
      field: INITIAL_FIELD.map(c => ({ ...c, id: `p2_${c.id}` })),
      hand: [],
      deck: [...INITIAL_DECK], // Hydration Mismatchを防ぐため、初期状態はシャッフルしない
    },
    winner: null,
  });

  // 最新のgameStateを保持するRef (非同期処理内での参照用)
  const stateRef = React.useRef(gameState);
  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  // 初回レンダリング後（クライアントサイド）に初期ドローとシャッフルを実行
  useEffect(() => {
    setGameState(prev => {
        // 既に手札がある場合は初期化済みとみなす
        if (prev.player.hand.length > 0) return prev;

        const newState = { ...prev };
        
        // デッキをシャッフル
        newState.player.deck = shuffleDeck([...INITIAL_DECK]);
        newState.opponent.deck = shuffleDeck([...INITIAL_DECK]);
        
        // プレイヤー1の初期ドロー (7枚)
        while (newState.player.hand.length < 7 && newState.player.deck.length > 0) {
            const card = newState.player.deck.pop();
            if (card) {
                newState.player.hand.push({ ...card, id: `${card.id}_init_${Date.now()}_${newState.player.hand.length}` });
            }
        }
        
        // プレイヤー2(CPU)の初期ドロー (7枚) - こちらもやっておくべき
        while (newState.opponent.hand.length < 7 && newState.opponent.deck.length > 0) {
            const card = newState.opponent.deck.pop();
            if (card) {
                newState.opponent.hand.push({ ...card, id: `${card.id}_init_${Date.now()}_${newState.opponent.hand.length}` });
            }
        }

        return newState;
    });
  }, []);

  // 依存関係チェック (非同期)
  // setGameStateの中で直接呼べないため、ロジックを分離
  const resolveLinearDependence = async (field: FunctionCard[]): Promise<FunctionCard[]> => {
    if (field.length <= 1) return field;

    const expressions = field.map(c => c.expression);
    const { isDependent, dependentIndices } = await MathEngine.checkLinearDependence(expressions);

    if (isDependent && dependentIndices.length > 0) {
        console.log(`[LinearDependence] Removing duplicates at indices:`, dependentIndices);
        // インデックスが大きい方から削除すればズレない
        // dependentIndices は昇順とは限らないのでソート
        const sortedIndices = [...dependentIndices].sort((a, b) => b - a);
        
        const newField = [...field];
        for (const index of sortedIndices) {
            console.log(`[LinearDependence] Removing ${newField[index].name}`);
            newField.splice(index, 1);
        }
        return newField;
    }
    
    return field;
  };

  const deployFunction = useCallback(async (cardId: string, targetPlayerId: string) => {
    // 非同期処理が必要なため、setGameStateの関数更新ではなく、
    // 現在の状態(Ref)を取得して計算し、一括更新するパターンに変更
    const currentState = stateRef.current;
    
    if (currentState.winner) return;

    const newState = { ...currentState };
    newState.player = { ...currentState.player, field: [...currentState.player.field], hand: [...currentState.player.hand], deck: [...currentState.player.deck] };
    newState.opponent = { ...currentState.opponent, field: [...currentState.opponent.field], hand: [...currentState.opponent.hand], deck: [...currentState.opponent.deck] };

    const currentPlayerState = newState.currentPlayer === 'player' ? newState.player : newState.opponent;
    const cardIndex = currentPlayerState.hand.findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) return;
    
    const card = currentPlayerState.hand[cardIndex];
    if (card.type !== 'function') return;

    // 対象フィールドに追加
    const targetPlayerState = targetPlayerId === 'player' ? newState.player : newState.opponent;
    
    // フィールド枚数制限 (3枚まで) - 手札削除前にチェック
    if (targetPlayerState.field.length >= 3) {
        console.warn("Field is full (max 3 cards).");
        return; // 操作をキャンセル（手札は削除しない）
    }

    // 手札から削除
    currentPlayerState.hand.splice(cardIndex, 1);

    // 仮にフィールドに追加
    const newCard = { ...card, id: `${card.id}_deployed_${Date.now()}` } as FunctionCard;
    const tempField = [...targetPlayerState.field, newCard];
    
    // 線形従属チェック (API)
    const resolvedField = await resolveLinearDependence(tempField);
    
    // もし追加したカードが消えていたら（つまり従属していたら）、追加キャンセル扱い
    // APIが「後ろにあるものを削除」する仕様なら、newCard (末尾) が消えるはず
    targetPlayerState.field = resolvedField;
    
    // ターン終了処理
    newState.turnCount = currentState.turnCount + 1;
    newState.currentPlayer = currentState.currentPlayer === 'player' ? 'opponent' : 'player';

    // 次のプレイヤーの自動ドロー
    const nextPlayerState = newState.currentPlayer === 'player' ? newState.player : newState.opponent;
    while (nextPlayerState.hand.length < 7 && nextPlayerState.deck.length > 0) {
      const card = nextPlayerState.deck.pop();
      if (card) {
        nextPlayerState.hand.push({ ...card, id: `${card.id}_${Date.now()}_${nextPlayerState.hand.length}` });
      }
    }

    setGameState(newState);
  }, []);

  const applyOperator = useCallback(async (
    operators: OperatorCard[], 
    targetId: string | null, // null許容
    targetPlayerId: string,
    targetCard: FunctionCard | null, // null許容
    operandCard?: FunctionCard
  ) => {
    console.log(`[applyOperator] Start. TargetID: ${targetId}, Operators:`, operators.map(o => o.operatorType));

    // AoE判定
    const isNabla = operators.some(o => o.operatorType === 'nabla');
    const isLaplacian = operators.some(o => o.operatorType === 'laplacian');

    const currentState = stateRef.current;
    
    if ((isNabla || isLaplacian) && !targetId) {
        // 全体攻撃モード
        console.log('[applyOperator] AoE Mode triggered');
        
        // ここでは簡易的に、現在の gameState を参照して計算を開始する。
        const targetField = targetPlayerId === 'player' ? currentState.player.field : currentState.opponent.field;
        
        // 並列で計算実行するとサーバー負荷でタイムアウトする可能性があるため、直列実行に変更
        const results: { id: string, result: CalculationResult }[] = [];

        try {
            for (const card of targetField) {
                 let currentResult: CalculationResult = { expression: card.expression, latex: card.latex, isZero: false };
                 
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
            console.error("AoE Calculation Error:", e);
            alert(`無効な計算です。\n詳細: ${e.message}`);
            return;
        }
        
        console.log('[AoE Log] All results:', results);

        const newState = { ...currentState };
        // Deep Copyに近い形で行う
        newState.player = { ...currentState.player, field: [...currentState.player.field], hand: [...currentState.player.hand], deck: [...currentState.player.deck] };
        newState.opponent = { ...currentState.opponent, field: [...currentState.opponent.field], hand: [...currentState.opponent.hand], deck: [...currentState.opponent.deck] };
        
        const targetPlayerState = targetPlayerId === 'player' ? newState.player : newState.opponent;
        const currentPlayerState = newState.currentPlayer === 'player' ? newState.player : newState.opponent;

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

        // 勝利判定
        if (newState.opponent.field.length === 0) {
            newState.winner = 'player';
        } else if (newState.player.field.length === 0) {
            newState.winner = 'opponent';
        }

            // ターン終了処理
        if (!newState.winner) {
            newState.turnCount = currentState.turnCount + 1;
            newState.currentPlayer = currentState.currentPlayer === 'player' ? 'opponent' : 'player';

            const nextPlayerState = newState.currentPlayer === 'player' ? newState.player : newState.opponent;
            while (nextPlayerState.hand.length < 7 && nextPlayerState.deck.length > 0) {
                const card = nextPlayerState.deck.pop();
                if (card) {
                nextPlayerState.hand.push({ ...card, id: `${card.id}_${Date.now()}_${nextPlayerState.hand.length}` });
                }
            }
        }

        setGameState(newState);
        return; // AoE終了
    }

    // 通常処理 (Single Target)
    if (!targetCard) return; // AoE以外でターゲットなしはエラー
    
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
            case 'inverse':
              nextResult = await MathEngine.inverse(currentResult.expression);
              break;
          }
          currentResult = nextResult;
          console.log(`[Math] Result:`, currentResult);
      }
    } catch(e: any) {
      console.error(e);
      alert(`無効な計算です。\n詳細: ${e.message}`);
      return;
    }

    // Single Target Update
    const newState = { ...currentState };
    // Deep Copy
    newState.player = { ...currentState.player, field: [...currentState.player.field], hand: [...currentState.player.hand], deck: [...currentState.player.deck] };
    newState.opponent = { ...currentState.opponent, field: [...currentState.opponent.field], hand: [...currentState.opponent.hand], deck: [...currentState.opponent.deck] };

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
        id: newId,
        expression: currentResult.expression,
        latex: currentResult.latex,
        name: currentResult.expression,
        normalizedExpression: currentResult.normalizedExpression
        };
    }
    // 線形従属チェック (API)
    targetPlayer.field = await resolveLinearDependence(targetPlayer.field);
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

    // 計算完了時に自動でターン終了（勝負が決まっていない場合）
    if (!newState.winner) {
        newState.turnCount = currentState.turnCount + 1;
        newState.currentPlayer = currentState.currentPlayer === 'player' ? 'opponent' : 'player';

        // 次のプレイヤーの自動ドロー
        const nextPlayerState = newState.currentPlayer === 'player' ? newState.player : newState.opponent;
        while (nextPlayerState.hand.length < 7 && nextPlayerState.deck.length > 0) {
            const card = nextPlayerState.deck.pop();
            if (card) {
                nextPlayerState.hand.push({ ...card, id: `${card.id}_${Date.now()}_${nextPlayerState.hand.length}` });
            }
        }
    }

    setGameState(newState);
  }, []);

  const drawCard = useCallback(() => {
    setGameState(prev => {
      if (prev.winner) return prev;
      
      const newState = { ...prev };
      newState.player = { ...prev.player, hand: [...prev.player.hand], deck: [...prev.player.deck] };
      newState.opponent = { ...prev.opponent, hand: [...prev.opponent.hand], deck: [...prev.opponent.deck] };

      const currentPlayerState = newState.currentPlayer === 'player' ? newState.player : newState.opponent;

      while (currentPlayerState.hand.length < 7 && currentPlayerState.deck.length > 0) {
        const card = currentPlayerState.deck.pop();
        if (card) {
          currentPlayerState.hand.push({ ...card, id: `${card.id}_${Date.now()}_${currentPlayerState.hand.length}` });
        }
      }
      
      return newState;
    });
  }, []);

  const endTurn = useCallback(() => {
    setGameState(prev => {
      const newState = { ...prev, 
        turnCount: prev.turnCount + 1,
        currentPlayer: prev.currentPlayer === 'player' ? 'opponent' : 'player',
        player: { ...prev.player, hand: [...prev.player.hand], deck: [...prev.player.deck] },
        opponent: { ...prev.opponent, hand: [...prev.opponent.hand], deck: [...prev.opponent.deck] },
      };

      // 次のプレイヤーの自動ドロー
      const nextPlayerState = newState.currentPlayer === 'player' ? newState.player : newState.opponent;
      while (nextPlayerState.hand.length < 7 && nextPlayerState.deck.length > 0) {
        const card = nextPlayerState.deck.pop();
        if (card) {
          nextPlayerState.hand.push({ ...card, id: `${card.id}_${Date.now()}_${nextPlayerState.hand.length}` });
        }
      }
      return newState;
    });
  }, []);

  return {
    gameState,
    applyOperator,
    deployFunction,
    drawCard,
    endTurn
  };
}
