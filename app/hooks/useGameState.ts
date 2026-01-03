import { useState, useCallback, useEffect } from 'react';
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

  const checkLinearDependence = (field: FunctionCard[]): FunctionCard[] => {
    const uniqueField: FunctionCard[] = [];
    const seenExpressions = new Set<string>();

    for (const card of field) {
      // 正規化された式があればそれを使う、なければ生の式を使う
      // これにより 2*x (normalized: x) と x (normalized: x) が同一とみなされる
      const expr = card.normalizedExpression || card.expression; 
      
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
        newState.player = { ...prev.player, field: [...prev.player.field], hand: [...prev.player.hand], deck: [...prev.player.deck] };
        newState.opponent = { ...prev.opponent, field: [...prev.opponent.field], hand: [...prev.opponent.hand], deck: [...prev.opponent.deck] };

        const currentPlayerState = newState.currentPlayer === 'player' ? newState.player : newState.opponent;
        const cardIndex = currentPlayerState.hand.findIndex(c => c.id === cardId);
        
        if (cardIndex === -1) return prev;
        
        const card = currentPlayerState.hand[cardIndex];
        if (card.type !== 'function') return prev;

        // 手札から削除
        currentPlayerState.hand.splice(cardIndex, 1);

        // 対象フィールドに追加
        const targetPlayerState = targetPlayerId === 'player' ? newState.player : newState.opponent;
        
        // フィールド枚数制限 (3枚まで)
        if (targetPlayerState.field.length >= 3) {
            console.warn("Field is full (max 3 cards).");
            return prev;
        }

        // 線形従属チェック（既に同じ関数がある場合は消滅）
        const cardExpr = card.normalizedExpression || card.expression;
        const isDuplicate = targetPlayerState.field.some(c => (c.normalizedExpression || c.expression) === cardExpr);
        if (isDuplicate) {
            console.log(`[Deploy] Duplicate detected: ${card.name} (${cardExpr}) vanishes.`);
            // フィールドには追加しない
        } else {
            const newCard = { ...card, id: `${card.id}_deployed_${Date.now()}` } as FunctionCard;
            targetPlayerState.field.push(newCard);
        }
        
        // ターン終了処理 (関数展開後も自動でターン終了)
        newState.turnCount = prev.turnCount + 1;
        newState.currentPlayer = prev.currentPlayer === 'player' ? 'opponent' : 'player';

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

    if ((isNabla || isLaplacian) && !targetId) {
        // 全体攻撃モード
        console.log('[applyOperator] AoE Mode triggered');
        
        // 現在の状態から対象フィールドのカードを取得する必要があるが、
        // Reactのstate更新関数内で非同期処理をループさせるのは難しいため、
        // ここで一旦現在のフィールドを取得して計算を行う
        // ※厳密には stale state の可能性があるが、この関数が呼ばれた時点でのスナップショットで計算する
        
        // 現在のgameStateを参照できないため、setStateのコールバック内で計算できないのが辛い。
        // -> しかし、useGameState内なので gameState は参照可能（クロージャ）
        // ただし、最新の値でない可能性があるので、targetPlayerId から判断して処理する。
        
        // ここでは簡易的に、現在の gameState を参照して計算を開始する。
        const targetField = targetPlayerId === 'player' ? gameState.player.field : gameState.opponent.field;
        
        // 並列で計算実行
        const results = await Promise.all(targetField.map(async (card) => {
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
             return { id: card.id, result: currentResult };
        }));

        setGameState(prev => {
            const newState = { ...prev };
            // Deep Copyに近い形で行う
            newState.player = { ...prev.player, field: [...prev.player.field], hand: [...prev.player.hand], deck: [...prev.player.deck] };
            newState.opponent = { ...prev.opponent, field: [...prev.opponent.field], hand: [...prev.opponent.hand], deck: [...prev.opponent.deck] };
            
            const targetPlayerState = targetPlayerId === 'player' ? newState.player : newState.opponent;
            const currentPlayerState = newState.currentPlayer === 'player' ? newState.player : newState.opponent;

            // 計算結果を適用
            results.forEach(({ id, result }) => {
                const index = targetPlayerState.field.findIndex(c => c.id === id);
                if (index !== -1) {
                    if (result.isZero) {
                        targetPlayerState.field.splice(index, 1);
                         // spliceでインデックスがずれるとforループだと困るが、findIndexなら都度検索するのでOK
                         // ただし、mapの結果を適用しているので、IDで探すのが安全
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

            // 線形従属チェック
            targetPlayerState.field = checkLinearDependence(targetPlayerState.field);

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
                newState.turnCount = prev.turnCount + 1;
                newState.currentPlayer = prev.currentPlayer === 'player' ? 'opponent' : 'player';

                const nextPlayerState = newState.currentPlayer === 'player' ? newState.player : newState.opponent;
                while (nextPlayerState.hand.length < 7 && nextPlayerState.deck.length > 0) {
                  const card = nextPlayerState.deck.pop();
                  if (card) {
                    nextPlayerState.hand.push({ ...card, id: `${card.id}_${Date.now()}_${nextPlayerState.hand.length}` });
                  }
                }
            }

            return newState;
        });

        return; // AoE終了
    }

    // 通常処理 (Single Target)
    if (!targetCard) return; // AoE以外でターゲットなしはエラー
    // ... (以下既存処理)
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
    } catch(e) {
      console.error(e);
      return;
    }

    setGameState(prev => {
      console.log('[Update] Applying state update');
      const newState = { ...prev };
      // 状態更新時はデッキも含めてshallow copyを作成する
      newState.player = { ...prev.player, field: [...prev.player.field], hand: [...prev.player.hand], deck: [...prev.player.deck] };
      newState.opponent = { ...prev.opponent, field: [...prev.opponent.field], hand: [...prev.opponent.hand], deck: [...prev.opponent.deck] };

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
            name: currentResult.expression,
            normalizedExpression: currentResult.normalizedExpression
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

      // 計算完了時に自動でターン終了（勝負が決まっていない場合）
      if (!newState.winner) {
        newState.turnCount = prev.turnCount + 1;
        newState.currentPlayer = prev.currentPlayer === 'player' ? 'opponent' : 'player';

        // 次のプレイヤーの自動ドロー
        const nextPlayerState = newState.currentPlayer === 'player' ? newState.player : newState.opponent;
        while (nextPlayerState.hand.length < 7 && nextPlayerState.deck.length > 0) {
          const card = nextPlayerState.deck.pop();
          if (card) {
            nextPlayerState.hand.push({ ...card, id: `${card.id}_${Date.now()}_${nextPlayerState.hand.length}` });
          }
        }
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
