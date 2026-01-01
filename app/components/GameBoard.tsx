import React, { useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { Card } from './Card';
import { OperatorCard } from '../types/game';

export const GameBoard: React.FC = () => {
  const { gameState, applyOperator, drawCard, endTurn } = useGameState();
  const [selectedHandCardId, setSelectedHandCardId] = useState<string | null>(null);

  // 現在のターンプレイヤーの手札などを取得
  const isPlayerTurn = gameState.currentPlayer === 'player';
  const currentPlayerState = isPlayerTurn ? gameState.player : gameState.opponent;
  
  const selectedHandCard = currentPlayerState.hand.find(c => c.id === selectedHandCardId);

  const handleHandCardClick = (cardId: string) => {
    if (selectedHandCardId === cardId) {
      setSelectedHandCardId(null);
    } else {
      setSelectedHandCardId(cardId);
    }
  };

  const handleFieldCardClick = (targetId: string, isPlayerField: boolean) => {
    if (!selectedHandCard || selectedHandCard.type !== 'operator') return;

    const targetOwnerId = isPlayerField ? 'player' : 'opponent';
    applyOperator(selectedHandCard as OperatorCard, targetId, targetOwnerId);
    setSelectedHandCardId(null);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 gap-4 bg-gray-100">
      {/* Header Info */}
      <div className="flex justify-between items-center bg-white p-2 rounded shadow">
        <div className="font-bold">Turn: {gameState.turnCount}</div>
        <div className="text-xl font-bold text-blue-600">
            {gameState.winner ? `Winner: ${gameState.winner === 'player' ? 'Player' : 'Opponent'}!` : `Current Turn: ${isPlayerTurn ? 'Player 1' : 'Player 2'}`}
        </div>
        <div className="flex gap-2">
            <button 
            onClick={drawCard}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={!!gameState.winner}
            >
            Draw Card
            </button>
            <button 
            onClick={endTurn}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            disabled={!!gameState.winner}
            >
            End Turn
            </button>
        </div>
      </div>

      {/* Opponent Field (Player 2) */}
      <div className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center justify-center relative transition-colors ${!isPlayerTurn ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-200'}`}>
        <div className="absolute top-2 left-2 text-gray-800 font-bold opacity-50">Player 2 Field (Opponent)</div>
        <div className="flex gap-4 flex-wrap justify-center">
          {gameState.opponent.field.map(card => (
            <Card 
              key={card.id} 
              card={card} 
              onClick={() => handleFieldCardClick(card.id, false)}
            />
          ))}
          {gameState.opponent.field.length === 0 && <div className="text-red-400 font-bold text-2xl">0 Dimension (LOSE)</div>}
        </div>
      </div>

      {/* Player Field (Player 1) */}
      <div className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center justify-center relative transition-colors ${isPlayerTurn ? 'bg-yellow-50 border-yellow-300' : 'bg-blue-50 border-blue-200'}`}>
        <div className="absolute top-2 left-2 text-gray-800 font-bold opacity-50">Player 1 Field (You)</div>
        <div className="flex gap-4 flex-wrap justify-center">
          {gameState.player.field.map(card => (
            <Card 
              key={card.id} 
              card={card} 
              onClick={() => handleFieldCardClick(card.id, true)}
            />
          ))}
          {gameState.player.field.length === 0 && <div className="text-red-500 font-bold text-2xl">0 Dimension (LOSE)</div>}
        </div>
      </div>

      {/* Current Player's Hand */}
      <div className="h-64 bg-white p-4 rounded-xl border-t-4 border-gray-300 shadow-inner overflow-x-auto">
        <div className="text-gray-500 font-bold mb-2">
            {isPlayerTurn ? "Player 1's Hand" : "Player 2's Hand"}
        </div>
        <div className="flex gap-2">
          {currentPlayerState.hand.map(card => (
            <Card 
              key={card.id} 
              card={card} 
              isSelected={selectedHandCardId === card.id}
              onClick={() => handleHandCardClick(card.id)}
            />
          ))}
        </div>
      </div>
      
      {/* Footer / Instructions */}
      <div className="text-center text-sm text-gray-500">
        {selectedHandCard 
          ? `Select a target function on the field to apply ${selectedHandCard.name}.` 
          : "Select a card from your hand."}
      </div>
    </div>
  );
};
