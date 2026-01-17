import React from 'react';
import { useGameState } from '../hooks/useGameState';
import { useCardSelection } from '../hooks/useCardSelection';
import { FieldArea } from './FieldArea';
import { HandArea } from './HandArea';
import { getActionMessage } from '../utils/gameBoardHelpers';
import { OperatorCard, FunctionCard } from '../types/game';

type GameCard = FunctionCard | OperatorCard;

export const GameBoard: React.FC = () => {
  const { gameState, applyOperator, deployFunction } = useGameState();
  const {
    selectedHandCardIds,
    hoveredHandCardId,
    setHoveredHandCardId,
    handleHandCardClick,
    clearSelection,
    getSelectedCards,
    findHandCard,
  } = useCardSelection();

  // 現在のターンプレイヤーの手札などを取得
  const isPlayerTurn = gameState.currentPlayer === 'player';
  const currentPlayerState = isPlayerTurn ? gameState.player : gameState.opponent;

  const handleFieldCardClick = (targetId: string, isPlayerField: boolean) => {
    executeFieldAction(targetId, isPlayerField);
  };

  const handleFieldAreaClick = (isPlayerField: boolean) => {
    executeFieldAction(null, isPlayerField);
  };

  const executeFieldAction = (targetId: string | null, isPlayerField: boolean) => {
    const selectedCards = getSelectedCards(currentPlayerState.hand);

    if (selectedCards.length === 0) return;

    const targetOwnerId = isPlayerField ? 'player' : 'opponent';

    // パターンA: 関数カードのみ (Deploy)
    if (selectedCards.every(c => c.type === 'function')) {
      if (selectedCards.length !== 1) return; // 基本的に1枚

      // フィールド上限チェック
      const currentField = isPlayerField ? gameState.player.field : gameState.opponent.field;
      if (currentField.length >= 3) {
        alert("フィールドに配置できる関数は３枚までです。");
        return;
      }

      // 線形従属（重複）チェック - 警告を表示
      const isDuplicate = currentField.some(c => c.expression === selectedCards[0].expression);
      if (isDuplicate) {
        const proceed = window.confirm("警告：この関数カードは既に場に存在するため、配置しても次元の冗長性により消滅します（手札から失われます）。実行しますか？");
        if (!proceed) return;
      }

      deployFunction((selectedCards[0] as FunctionCard).id, targetOwnerId);
      clearSelection();
      return;
    }

    // パターンB: 演算子実行 (ターゲット必須 or フィールド指定)
    const operators = selectedCards.filter(c => c.type === 'operator') as OperatorCard[];
    const functions = selectedCards.filter(c => c.type === 'function') as FunctionCard[];

    // ナブラ/ラプラシアンの全体攻撃対応
    if (operators.length > 0) {
      // フィールド全体をターゲットにする演算子かどうか
      const isAoE = operators.some(op => op.operatorType === 'nabla' || op.operatorType === 'laplacian');

      if (isAoE) {
        // AoEの場合は、ターゲットIDがなくても（フィールドクリック等で）実行可能
        const aoETargetOwnerId = isPlayerField ? 'player' : 'opponent';

        applyOperator(operators, null, aoETargetOwnerId, null, functions[0]);
        clearSelection();
        return;
      }

      // 通常演算子はターゲットID必須
      if (!targetId) return;
      
      // ターゲットカードの情報を取得
      const targetField = isPlayerField ? gameState.player.field : gameState.opponent.field;
      const targetCard = targetField.find(c => c.id === targetId);
      
      if (!targetCard) {
        console.error("ターゲットカードが見つかりません");
        return;
      }

      // 乗算・除算チェック
      if (operators.some(op => op.operatorType === 'multiply' || op.operatorType === 'divide')) {
        if (functions.length === 0) {
          alert("手札から関数カードを選択してください。");
          return;
        }
        applyOperator(operators, targetId, targetOwnerId, targetCard, functions[0]);
      } else {
        // 微分・積分・その他
        applyOperator(operators, targetId, targetOwnerId, targetCard);
      }
      clearSelection();
    }
  };

  // アクションメッセージ生成
  const actionMessage = getActionMessage(getSelectedCards(currentPlayerState.hand));

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 gap-4 bg-gray-100">
      {/* Header Info */}
      <div className="flex justify-between items-center bg-white p-2 rounded shadow">
        <div className="font-bold">Turn: {gameState.turnCount}</div>
        <div className="text-xl font-bold text-blue-600">
          {gameState.winner 
            ? `Winner: ${gameState.winner === 'player' ? 'Player' : 'Opponent'}!` 
            : `Current Turn: ${isPlayerTurn ? 'Player 1' : 'Player 2'}`}
        </div>
      </div>

      {/* Opponent Field (Player 2) */}
      <FieldArea
        gameState={gameState}
        isPlayerField={false}
        isPlayerTurn={isPlayerTurn}
        onFieldCardClick={handleFieldCardClick}
        onFieldAreaClick={handleFieldAreaClick}
      />

      {/* Player Field (Player 1) */}
      <FieldArea
        gameState={gameState}
        isPlayerField={true}
        isPlayerTurn={isPlayerTurn}
        onFieldCardClick={handleFieldCardClick}
        onFieldAreaClick={handleFieldAreaClick}
      />

      {/* Current Player's Hand */}
      <HandArea
        hand={currentPlayerState.hand}
        isPlayerTurn={isPlayerTurn}
        selectedHandCardIds={selectedHandCardIds}
        hoveredHandCardId={hoveredHandCardId}
        onCardClick={(cardId) => handleHandCardClick(cardId, currentPlayerState.hand)}
        onCardHover={setHoveredHandCardId}
      />
      
      {/* Footer / Instructions */}
      <div className="text-center text-sm text-gray-500 font-bold min-h-[1.5em]">
        {actionMessage}
      </div>
    </div>
  );
};
