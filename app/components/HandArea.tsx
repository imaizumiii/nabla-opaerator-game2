import React, { useState, useEffect } from 'react';
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div 
      className="bg-white rounded-xl border-t-4 border-gray-300 shadow-inner relative overflow-x-auto overflow-y-hidden flex justify-center items-end pb-2 sm:pb-4 flex-shrink-0"
      style={{ height: isMobile ? '240px' : '280px', minHeight: isMobile ? '240px' : '280px' }}
    >
      <div className="text-gray-500 font-bold absolute top-1.5 sm:top-2 left-2 sm:left-4 text-xs sm:text-sm md:text-base z-0">
        {isPlayerTurn ? "Player 1's Hand" : "Player 2's Hand"}
      </div>
      
      {/* カード配置エリア */}
      <div className={`relative h-full ${isMobile ? 'w-full' : 'w-full max-w-2xl'} flex justify-center items-end ${isMobile ? 'min-w-full' : ''}`}>
        {isMobile ? (
          // スマホ: absolute配置で中央揃え（重なりを再現）、横スクロール可能
          <div 
            className="relative h-full w-full flex justify-center items-end"
            style={{
              // カードがはみ出さないように、左右に十分なパディングを追加
              // カード幅96px、間隔45px、最大7枚程度を想定して計算
              paddingLeft: '48px',
              paddingRight: '48px',
              // カードが多すぎる場合に備えて、最小幅を設定
              minWidth: hand.length > 5 
                ? `${(hand.length - 1) * 45 + 96 + 96}px` 
                : '100%',
            }}
          >
            {hand.map((card, index) => {
              const totalCards = hand.length;
              const centerIndex = (totalCards - 1) / 2;
              const offsetFromCenter = index - centerIndex;
              
              const cardIdWithIndex = `${card.id}_${index}`;
              const isHovered = hoveredHandCardId === cardIdWithIndex;
              const isSelected = selectedHandCardIds.includes(cardIdWithIndex);
              
              // ホバー時の隣接カード回避計算（スマホでは小さめに）
              let xTranslate = 0;
              if (hoveredHandCardId) {
                const hoveredIndexStr = hoveredHandCardId.split('_').pop();
                const hoveredIndex = hoveredIndexStr ? parseInt(hoveredIndexStr, 10) : -1;
                if (hoveredIndex !== -1 && !isNaN(hoveredIndex)) {
                  const dist = index - hoveredIndex;
                  if (dist < 0) xTranslate = -20; // より小さく調整
                  if (dist > 0) xTranslate = 20;
                  if (dist === 0) xTranslate = 0;
                }
              }

              // スマホでのカード間隔: カード幅96pxに対して45px間隔で重なりを大きく（重なり約51px）
              const cardStyle: React.CSSProperties = {
                position: 'absolute',
                left: `calc(50% + ${offsetFromCenter * 45}px)`, // 45px間隔に変更（重なり約51px）
                bottom: '8px',
                transformOrigin: 'bottom center',
                transform: `
                  translateX(-50%) 
                  translateX(${xTranslate}px)
                  translateY(${isSelected ? -20 : isHovered ? -15 : 0}px) 
                  scale(${isHovered ? 1.05 : 1}) 
                `,
                zIndex: isHovered || isSelected ? 100 : index,
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
        ) : (
          // PC: absolute配置で中央揃え
          <div className="relative h-full w-full flex justify-center items-end">
            {hand.map((card, index) => {
              const totalCards = hand.length;
              const centerIndex = (totalCards - 1) / 2;
              const offsetFromCenter = index - centerIndex;
              
              const cardIdWithIndex = `${card.id}_${index}`;
              const isHovered = hoveredHandCardId === cardIdWithIndex;
              const isSelected = selectedHandCardIds.includes(cardIdWithIndex);
              
              // ホバー時の隣接カード回避計算
              let xTranslate = 0;
              if (hoveredHandCardId) {
                const hoveredIndexStr = hoveredHandCardId.split('_').pop();
                const hoveredIndex = hoveredIndexStr ? parseInt(hoveredIndexStr, 10) : -1;
                if (hoveredIndex !== -1 && !isNaN(hoveredIndex)) {
                  const dist = index - hoveredIndex;
                  if (dist < 0) xTranslate = -40;
                  if (dist > 0) xTranslate = 40;
                  if (dist === 0) xTranslate = 0;
                }
              }

              const cardStyle: React.CSSProperties = {
                position: 'absolute',
                left: `calc(50% + ${offsetFromCenter * 80}px)`,
                bottom: '10px',
                transformOrigin: 'bottom center',
                transform: `
                  translateX(-50%) 
                  translateX(${xTranslate}px)
                  translateY(${isSelected ? -50 : isHovered ? -30 : 0}px) 
                  scale(${isHovered ? 1.1 : 1}) 
                `,
                zIndex: isHovered || isSelected ? 100 : index,
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
        )}
      </div>
    </div>
  );
};
