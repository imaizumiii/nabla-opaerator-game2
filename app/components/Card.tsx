import React from 'react';
import { InlineMath } from 'react-katex';
import { FunctionCard, OperatorCard } from '../types/game';

interface CardProps {
  card: FunctionCard | OperatorCard;
  onClick?: () => void;
  isSelected?: boolean;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({ card, onClick, isSelected, disabled }) => {
  const isFunction = card.type === 'function';
  const bgColor = isFunction ? 'bg-blue-50' : 'bg-red-50';
  const borderColor = isSelected ? 'border-yellow-400 ring-2 ring-yellow-400' : 'border-gray-200';
  const textColor = disabled ? 'text-gray-400' : 'text-gray-800';

  return (
    <div
      className={`
        relative w-32 h-48 rounded-lg border-2 ${borderColor} ${bgColor} 
        shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col p-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={!disabled ? onClick : undefined}
    >
      <div className="text-xs font-bold text-gray-500 mb-1">
        {isFunction ? 'Function' : 'Operator'}
      </div>
      
      <div className={`flex-1 flex items-center justify-center ${textColor}`}>
        {isFunction ? (
          <div className="text-xl">
            <InlineMath math={(card as FunctionCard).latex} />
          </div>
        ) : (
          <div className="text-center">
            <div className="font-bold text-lg">{card.name}</div>
            {card.type === 'operator' && (card as OperatorCard).operatorType === 'differential' && (
              <div className="mt-2 text-xl"><InlineMath math="\frac{d}{dx}" /></div>
            )}
             {card.type === 'operator' && (card as OperatorCard).operatorType === 'integral' && (
              <div className="mt-2 text-xl"><InlineMath math="\int dx" /></div>
            )}
          </div>
        )}
      </div>

      <div className="text-xs text-gray-600 mt-2 border-t pt-1">
        {card.description}
      </div>
    </div>
  );
};

