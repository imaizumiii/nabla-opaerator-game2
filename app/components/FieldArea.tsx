import React from 'react';
import { Card as CardComponent } from './Card';
import { FunctionCard, GameState } from '../types/game';

interface FieldAreaProps {
  gameState: GameState;
  isPlayerField: boolean;
  isPlayerTurn: boolean;
  onFieldCardClick: (targetId: string, isPlayerField: boolean) => void;
  onFieldAreaClick: (isPlayerField: boolean) => void;
}

export const FieldArea: React.FC<FieldAreaProps> = ({
  gameState,
  isPlayerField,
  isPlayerTurn,
  onFieldCardClick,
  onFieldAreaClick,
}) => {
  const field = isPlayerField ? gameState.player.field : gameState.opponent.field;
  const playerLabel = isPlayerField ? 'Player 1 Field (You)' : 'Player 2 Field (Opponent)';
  const isCurrentTurn = isPlayerField ? isPlayerTurn : !isPlayerTurn;

  return (
    <div 
      className={`flex-1 p-2 sm:p-4 rounded-xl flex flex-col items-center justify-center relative transition-all duration-300 cursor-pointer min-h-[120px] sm:min-h-[150px] ${
        isCurrentTurn 
          ? (isPlayerField ? 'bg-blue-100 border-2 sm:border-4 border-blue-500 shadow-lg' : 'bg-red-100 border-2 sm:border-4 border-red-500 shadow-lg')
          : 'bg-gray-100 border border-gray-300 sm:border-2 opacity-80'
      }`}
      onClick={(e) => {
        // カードクリックイベントがバブリングしてきた場合は無視したいが、
        // Reactのイベント伝播だと単純な判定が難しい場合もあるため、
        // CardComponentのonClickでstopPropagationするのが確実。
        // ここでは簡易的にターゲットが自分自身(div)であれば実行するようにする。
        if (e.target === e.currentTarget) {
          onFieldAreaClick(isPlayerField);
        }
      }}
    >
      <div className="absolute top-1 left-1 sm:top-2 sm:left-2 text-gray-800 font-bold opacity-50 pointer-events-none text-xs sm:text-sm">
        {playerLabel} {isCurrentTurn && " [TURN]"}
      </div>
      <div className="flex gap-2 sm:gap-4 flex-wrap justify-center pointer-events-none w-full px-2">
        {field.map(card => (
          <div key={card.id} className="pointer-events-auto">
            <CardComponent 
              card={card} 
              variant="field"
              onClick={() => onFieldCardClick(card.id, isPlayerField)}
            />
          </div>
        ))}
        {field.length === 0 && (
          <div className={`text-base sm:text-xl md:text-2xl font-bold ${isPlayerField ? 'text-red-500' : 'text-red-400'}`}>
            0 Dimension (LOSE)
          </div>
        )}
      </div>
    </div>
  );
};
