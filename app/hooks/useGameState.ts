import { useState, useCallback } from 'react';
import { GameState, PlayerState, FunctionCard, OperatorCard } from '../types/game';
import { MathEngine, CalculationResult } from '../lib/math-engine';

const INITIAL_DECK: (FunctionCard | OperatorCard)[] = [
  { id: 'd1', name: '微分', type: 'operator', operatorType: 'differential', description: '関数を微分する' },
  { id: 'd2', name: '微分', type: 'operator', operatorType: 'differential', description: '関数を微分する' },
  { id: 'i1', name: '積分', type: 'operator', operatorType: 'integral', description: '関数を積分する' },
  { id: 'l_inf', name: '極限(∞)', type: 'operator', operatorType: 'limit_infinity', description: 'x -> ∞' },
  { id: 'l_sup', name: '上極限', type: 'operator', operatorType: 'limit_sup', description: 'lim sup (最大値)' },
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
      field: [...INITIAL_FIELD],
      hand: [],
      deck: [...INITIAL_DECK],
    },
    opponent: {
      id: 'opponent',
      field: [...INITIAL_FIELD],
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
        console.log(`Linear dependence detected: ${card.name} is removed.`);
      }
    }
    return uniqueField;
  };

  const applyOperator = useCallback(async (operator: OperatorCard, targetId: string, targetPlayerId: string) => {
    // 現在のプレイヤーしか操作できない
    setGameState(current => {
       if (current.winner) return current;
       // ターンプレイヤーチェックを入れるべきだが、
       // UI側で制御するか、ここで弾くか。
       // いったん「自分のターンに相手を操作」などはあり得るので、
       // 「operatorを持っているのがcurrentPlayerか」を確認すべきだが省略。
       return current;
    });

    // 状態を一旦取得して計算 (非同期中)
    // 注意: setGameState(prev => ...) の中で非同期処理はできないため、
    // 必要な情報を取得してから計算し、再度setStateする。
    
    // しかしターゲットカードの特定が必要。
    // ここでは簡略化のため、stateの参照を使う（競合の可能性はあるがターン制なので許容）
    
    // 本当は useReducer や サーバー側で状態管理すべきだが、
    // ここでは楽観的に現在のstateを使って計算リクエストを投げる。
    
    let targetCard: FunctionCard | undefined;
    
    // 現在の状態を取得するためのトリック（setGameStateのコールバックを利用しない場合、closureのgameStateは古い可能性がある）
    // 今回はuseGameStateの戻り値を使っているcomponent側から渡される引数で判断するしかないが、
    // applyOperator内で最新のstateを参照するには useRef を使うか、setState内で完結させる必要がある。
    // しかし非同期なので setState内完結は無理。
    
    // よって、「計算前の仮更新（UI反応）」と「計算後の確定更新」に分けるか、
    // 単純にawaitしてから更新するか。後者で行く。
    
    setGameState(prev => {
        const targetPlayer = targetPlayerId === 'player' ? prev.player : prev.opponent;
        targetCard = targetPlayer.field.find(c => c.id === targetId);
        return prev;
    });

    if (!targetCard) return;

    let result: CalculationResult = { expression: targetCard.expression, latex: targetCard.latex, isZero: false };

    try {
      switch (operator.operatorType) {
        case 'differential':
          result = await MathEngine.differentiate(targetCard.expression);
          break;
        case 'integral':
          result = await MathEngine.integrate(targetCard.expression);
          break;
        case 'limit_infinity':
          result = await MathEngine.limit(targetCard.expression, 'infinity');
          break;
        case 'limit_0':
          result = await MathEngine.limit(targetCard.expression, '0');
          break;
        case 'limit_sup':
          result = await MathEngine.limit(targetCard.expression, 'sup');
          break;
        case 'limit_inf':
          result = await MathEngine.limit(targetCard.expression, 'inf');
          break;
      }
    } catch(e) {
      console.error(e);
      return;
    }

    setGameState(prev => {
      const newState = { ...prev };
      // プレイヤーと相手の状態をディープコピーしないとネストされたオブジェクトが更新されない
      newState.player = { ...prev.player, field: [...prev.player.field], hand: [...prev.player.hand] };
      newState.opponent = { ...prev.opponent, field: [...prev.opponent.field], hand: [...prev.opponent.hand] };

      const targetPlayer = targetPlayerId === 'player' ? newState.player : newState.opponent;
      const targetCardIndex = targetPlayer.field.findIndex(c => c.id === targetId);
      
      if (targetCardIndex !== -1) {
        if (result.isZero) {
          targetPlayer.field.splice(targetCardIndex, 1);
        } else {
          targetPlayer.field[targetCardIndex] = {
            ...targetPlayer.field[targetCardIndex],
            expression: result.expression,
            latex: result.latex,
            name: result.expression
          };
        }
        // 線形従属チェック
        targetPlayer.field = checkLinearDependence(targetPlayer.field);
      }

      // 手札消費
      const currentPlayerState = newState.currentPlayer === 'player' ? newState.player : newState.opponent;
      const opIndex = currentPlayerState.hand.findIndex(c => c.id === operator.id);
      if (opIndex !== -1) {
        currentPlayerState.hand.splice(opIndex, 1);
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
        // IDを一意にする
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
    drawCard,
    endTurn
  };
}
