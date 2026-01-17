import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, PlayerState, FunctionCard, OperatorCard } from '../types/game';
import { INITIAL_DECK, INITIAL_FIELD, shuffleDeck } from '../constants/initialData';
import { resolveLinearDependence } from './useLinearDependence';
import { applyAoEOperator, applySingleTargetOperator } from '../logic/operatorLogic';
import { deployFunctionCard } from '../logic/deployLogic';
import { advanceTurn, checkWinner, drawCardsForNextPlayer } from '../logic/turnLogic';

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
      drawCardsForNextPlayer(newState.player, 7);
      
      // プレイヤー2(CPU)の初期ドロー (7枚)
      drawCardsForNextPlayer(newState.opponent, 7);

      return newState;
    });
  }, []);

  const deployFunction = useCallback(async (cardId: string, targetPlayerId: string) => {
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

    // 対象フィールド
    const targetPlayerState = targetPlayerId === 'player' ? newState.player : newState.opponent;
    
    try {
      // デプロイ処理
      await deployFunctionCard(
        newState,
        card as FunctionCard,
        targetPlayerId,
        currentPlayerState,
        targetPlayerState
      );

      // 手札から削除（デプロイ成功時のみ）
      currentPlayerState.hand.splice(cardIndex, 1);

      // ターン終了処理
      advanceTurn(newState, currentState);

      setGameState(newState);
    } catch (error: any) {
      console.warn(error.message);
      // エラー時は操作をキャンセル（手札は削除しない）
    }
  }, []);

  const applyOperator = useCallback(async (
    operators: OperatorCard[], 
    targetId: string | null,
    targetPlayerId: string,
    targetCard: FunctionCard | null,
    operandCard?: FunctionCard
  ) => {
    console.log(`[applyOperator] Start. TargetID: ${targetId}, Operators:`, operators.map(o => o.operatorType));

    const currentState = stateRef.current;
    
    // AoE判定
    const isNabla = operators.some(o => o.operatorType === 'nabla');
    const isLaplacian = operators.some(o => o.operatorType === 'laplacian');

    if ((isNabla || isLaplacian) && !targetId) {
      // 全体攻撃モード
      console.log('[applyOperator] AoE Mode triggered');
      
      const targetField = targetPlayerId === 'player' ? currentState.player.field : currentState.opponent.field;
      
      const newState = { ...currentState };
      newState.player = { ...currentState.player, field: [...currentState.player.field], hand: [...currentState.player.hand], deck: [...currentState.player.deck] };
      newState.opponent = { ...currentState.opponent, field: [...currentState.opponent.field], hand: [...currentState.opponent.hand], deck: [...currentState.opponent.deck] };
      
      const targetPlayerState = targetPlayerId === 'player' ? newState.player : newState.opponent;
      const currentPlayerState = newState.currentPlayer === 'player' ? newState.player : newState.opponent;

      try {
        await applyAoEOperator(
          operators,
          targetField,
          targetPlayerState,
          currentPlayerState
        );

        // 勝利判定
        checkWinner(newState);

        // ターン終了処理
        if (!newState.winner) {
          advanceTurn(newState, currentState);
        }

        setGameState(newState);
      } catch (e: any) {
        console.error("全体攻撃計算エラー:", e);
        alert(`無効な計算です。\n詳細: ${e.message}`);
      }
      return;
    }

    // 通常処理 (Single Target)
    if (!targetCard) return;
    
    const newState = { ...currentState };
    newState.player = { ...currentState.player, field: [...currentState.player.field], hand: [...currentState.player.hand], deck: [...currentState.player.deck] };
    newState.opponent = { ...currentState.opponent, field: [...currentState.opponent.field], hand: [...currentState.opponent.hand], deck: [...currentState.opponent.deck] };

    const targetPlayer = targetPlayerId === 'player' ? newState.player : newState.opponent;
    const currentPlayerState = newState.currentPlayer === 'player' ? newState.player : newState.opponent;

    try {
      await applySingleTargetOperator(
        operators,
        targetCard,
        targetId!,
        targetPlayer,
        currentPlayerState,
        operandCard
      );

      // 勝利判定
      checkWinner(newState);

      // 計算完了時に自動でターン終了（勝負が決まっていない場合）
      if (!newState.winner) {
        advanceTurn(newState, currentState);
      }

      setGameState(newState);
    } catch (e: any) {
      console.error(e);
      alert(`無効な計算です。\n詳細: ${e.message}`);
    }
  }, []);

  const drawCard = useCallback(() => {
    setGameState(prev => {
      if (prev.winner) return prev;
      
      const newState = { ...prev };
      newState.player = { ...prev.player, hand: [...prev.player.hand], deck: [...prev.player.deck] };
      newState.opponent = { ...prev.opponent, hand: [...prev.opponent.hand], deck: [...prev.opponent.deck] };

      const currentPlayerState = newState.currentPlayer === 'player' ? newState.player : newState.opponent;
      drawCardsForNextPlayer(currentPlayerState);
      
      return newState;
    });
  }, []);

  const endTurn = useCallback(() => {
    setGameState(prev => {
      const newState = { ...prev, 
        player: { ...prev.player, hand: [...prev.player.hand], deck: [...prev.player.deck] },
        opponent: { ...prev.opponent, hand: [...prev.opponent.hand], deck: [...prev.opponent.deck] },
      };

      advanceTurn(newState, prev);
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
