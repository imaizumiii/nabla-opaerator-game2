import React from 'react';
import { Card as CardComponent } from './Card';
import { FunctionCard, OperatorCard } from '../types/game';

interface HandAreaProps {
  hand: (FunctionCard | OperatorCard)[];
  isPlayerTurn: boolean;
  selectedHandCardIds: string[];
  hoveredHandCardId: string | null;
  onCardClick: (cardId: string) => void;
  onCardHover: (cardId: string | null) => void;
}

export const HandArea: React.FC<HandAreaProps> = ({
  hand,
  isPlayerTurn,
  selectedHandCardIds,
  hoveredHandCardId,
  onCardClick,
  onCardHover,
}) => {
  return (
    <div 
      className="bg-white rounded-xl border-t-4 border-gray-300 shadow-inner relative overflow-hidden flex justify-center items-end pb-4 flex-shrink-0"
      style={{ height: '320px', minHeight: '320px' }}
    >
      <div className="text-gray-500 font-bold absolute top-2 left-4 text-sm md:text-base z-0">
        {isPlayerTurn ? "Player 1's Hand" : "Player 2's Hand"}
      </div>
      
      <div className="relative h-full w-full max-w-2xl flex justify-center items-end">
        {hand.map((card, index) => {
          const totalCards = hand.length;
          // 扇状の配置計算 (廃止 -> 直線配置)
          // 中央を0とし、左右に展開
          const centerIndex = (totalCards - 1) / 2;
          const offsetFromCenter = index - centerIndex;
          
          // 角度計算 (廃止)
          const rotation = 0;
          
          // Y軸のオフセット (廃止)
          const yOffset = 0; 

          // ホバー状態の計算
          const cardIdWithIndex = `${card.id}_${index}`;
          const isHovered = hoveredHandCardId === cardIdWithIndex;
          const isSelected = selectedHandCardIds.includes(cardIdWithIndex);
          
          // ホバー時の隣接カード回避計算
          let xTranslate = 0;
          if (hoveredHandCardId) {
            // hoveredHandCardIdは "cardId_index" の形式
            const hoveredIndexStr = hoveredHandCardId.split('_').pop();
            const hoveredIndex = hoveredIndexStr ? parseInt(hoveredIndexStr, 10) : -1;
            if (hoveredIndex !== -1 && !isNaN(hoveredIndex)) {
              const dist = index - hoveredIndex;
              if (dist < 0) xTranslate = -40; // 左に避ける (距離を少し増やす)
              if (dist > 0) xTranslate = 40;  // 右に避ける
              if (dist === 0) xTranslate = 0;
            }
          }

          // スタイルオブジェクトの生成
          const cardStyle: React.CSSProperties = {
            position: 'absolute',
            // 左端からの位置計算 (重ねる量を減らすため、間隔を広げる: 40px -> 80px)
            left: `calc(50% + ${offsetFromCenter * 80}px)`, 
            bottom: '10px', // 少し下げる (20px -> 10px)
            transformOrigin: 'bottom center',
            transform: `
              translateX(-50%) 
              translateX(${xTranslate}px)
              translateY(${isSelected ? -50 : isHovered ? -30 : yOffset}px) 
              rotate(${isHovered || isSelected ? 0 : rotation}deg) 
              scale(${isHovered ? 1.1 : 1}) 
            `,
            // translateYの上昇量も少し抑える (-60/-40 -> -50/-30)
            zIndex: isHovered || isSelected ? 100 : index, // ホバー時は最前面
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          };

          return (
            <CardComponent 
              key={`${card.id}_${index}`} 
              card={card} 
              style={cardStyle}
              isSelected={isSelected}
              onClick={() => onCardClick(`${card.id}_${index}`)}
              onMouseEnter={() => onCardHover(`${card.id}_${index}`)}
              onMouseLeave={() => onCardHover(null)}
            />
          );
        })}
      </div>
    </div>
  );
};
