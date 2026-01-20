import React, { useState, useEffect, useRef } from 'react';
import { OperatorCard, FunctionCard } from '../types/game';
import { Card } from './Card';

type CardItem = FunctionCard | OperatorCard;

interface CardWithId {
  card: CardItem;
  id: string;
  type: 'function' | 'operator';
}

interface OperatorOrderPanelProps {
  targetCard: FunctionCard; // Fieldから選択されたターゲット関数
  operators: OperatorCard[];
  operands: FunctionCard[];
  onOrderChanged: (orderedOperators: OperatorCard[], orderedOperands: FunctionCard[]) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const OperatorOrderPanel: React.FC<OperatorOrderPanelProps> = ({
  targetCard,
  operators,
  operands,
  onOrderChanged,
  onConfirm,
  onCancel,
}) => {
  // 初期化フラグ（初回のみ初期化するため）
  const isInitialized = useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // 全カードのリストを管理（ターゲット関数 + 演算子 + オペランド）
  // 初期順序: [ターゲット関数, 演算子1, オペランド1, 演算子2, オペランド2]
  const [cards, setCards] = useState<CardWithId[]>(() => {
    const cardList: CardWithId[] = [
      { card: targetCard, id: `target_${targetCard.id}`, type: 'function' }
    ];
    operators.forEach((op, index) => {
      cardList.push({ card: op, id: `op_${op.id}_${index}`, type: 'operator' });
      if (operands[index]) {
        cardList.push({ card: operands[index], id: `func_${operands[index].id}_${index}`, type: 'function' });
      }
    });
    return cardList;
  });

  // ドラッグ中のカードインデックス
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // タッチ操作用の状態
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const touchElementRef = useRef<HTMLDivElement | null>(null);

  // 順序が正しいかチェック（関数、演算子、関数、演算子、関数の交互）
  const isValidOrder = (cardList: CardWithId[]): boolean => {
    return cardList.every((item, index) => {
      // 偶数インデックス（0, 2, 4）は関数、奇数インデックス（1, 3）は演算子
      if (index % 2 === 0) {
        return item.type === 'function';
      } else {
        return item.type === 'operator';
      }
    });
  };

  const isOrderValid = isValidOrder(cards);

  // 順序変更時に親に通知（cardsが変更された時のみ、かつ順序が正しい場合のみ）
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }

    if (isOrderValid) {
      // 演算子とオペランドを抽出（ターゲット関数を除く）
      const orderedOperators: OperatorCard[] = [];
      const orderedOperands: FunctionCard[] = [];
      
      // インデックス1から始まる（ターゲット関数をスキップ）
      for (let i = 1; i < cards.length; i += 2) {
        if (cards[i]?.type === 'operator' && cards[i + 1]?.type === 'function') {
          orderedOperators.push(cards[i].card as OperatorCard);
          orderedOperands.push(cards[i + 1].card as FunctionCard);
        }
      }
      
      onOrderChanged(orderedOperators, orderedOperands);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]); // onOrderChangedを依存配列から削除（無限ループ防止）

  // ドラッグ開始
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  // ドラッグ中
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  // ドラッグ終了
  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      setCards(prev => {
        const newCards = [...prev];
        const [removed] = newCards.splice(draggedIndex, 1);
        newCards.splice(dragOverIndex, 0, removed);
        return newCards;
      });
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // ドラッグ離脱
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // スマホ判定
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // タッチ操作: タッチ開始
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    setTouchStartY(touch.clientY);
    setTouchStartX(touch.clientX);
    setDraggedIndex(index);
    touchElementRef.current = e.currentTarget as HTMLDivElement;
  };

  // タッチ操作: タッチ移動
  const handleTouchMove = (e: React.TouchEvent, index: number) => {
    if (!isMobile || draggedIndex === null || touchStartY === null || touchStartX === null) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartY;
    const deltaX = touch.clientX - touchStartX;
    
    // 横方向の移動が小さい場合はスクロールと判断
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) > 10) {
      return;
    }
    
    e.preventDefault();
    
    // カードを移動中の位置に表示
    if (touchElementRef.current) {
      touchElementRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      touchElementRef.current.style.opacity = '0.5';
      touchElementRef.current.style.zIndex = '1000';
    }
    
    // 他のカードとの位置関係を判定
    const cardElements = document.querySelectorAll('[data-card-index]');
    let newDragOverIndex: number | null = null;
    
    cardElements.forEach((el) => {
      const cardIndex = parseInt(el.getAttribute('data-card-index') || '-1', 10);
      if (cardIndex === -1 || cardIndex === draggedIndex) return;
      
      const rect = el.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const centerX = rect.left + rect.width / 2;
      
      if (
        touch.clientX >= rect.left &&
        touch.clientX <= rect.right &&
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom
      ) {
        newDragOverIndex = cardIndex;
      }
    });
    
    if (newDragOverIndex !== null && newDragOverIndex !== dragOverIndex) {
      setDragOverIndex(newDragOverIndex);
    }
  };

  // タッチ操作: タッチ終了
  const handleTouchEnd = () => {
    if (!isMobile || draggedIndex === null) return;
    
    if (touchElementRef.current) {
      touchElementRef.current.style.transform = '';
      touchElementRef.current.style.opacity = '';
      touchElementRef.current.style.zIndex = '';
    }
    
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      setCards(prev => {
        const newCards = [...prev];
        const [removed] = newCards.splice(draggedIndex, 1);
        newCards.splice(dragOverIndex, 0, removed);
        return newCards;
      });
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
    setTouchStartY(null);
    setTouchStartX(null);
    touchElementRef.current = null;
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[200] p-1 sm:p-4"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)' // Safari対応
      }}
    >
      <div className={`bg-white rounded-lg ${isMobile ? 'p-2' : 'p-6'} max-w-5xl w-full ${isMobile ? 'max-h-[98vh]' : 'max-h-[90vh]'} ${isMobile ? '' : 'overflow-y-auto'}`}>
        <h2 className={`${isMobile ? 'text-base mb-0.5' : 'text-xl mb-2'} font-bold`}>演算の順序を変更</h2>
        <p className={`${isMobile ? 'text-[10px] mb-2' : 'text-sm mb-6'} text-gray-600`}>
          {isMobile 
            ? '乗算・除算の順序によって計算結果が変わります。カードを長押しして左右に移動して順序を変更してください。'
            : '乗算・除算の順序によって計算結果が変わります。カードをドラッグして順序を変更してください。'}
        </p>

        {/* 計算工程を横並びで表示 */}
        <div className={`${isMobile ? 'mb-2 p-0.5' : 'mb-6 p-4'} bg-gray-50 rounded-lg border border-dashed sm:border-2 border-gray-300`}>
          <div className={`flex items-center ${isMobile ? 'justify-center overflow-x-auto' : 'justify-center flex-wrap'} ${isMobile ? 'gap-0' : 'gap-3'} ${isMobile ? 'min-h-[100px]' : 'min-h-[200px]'} ${isMobile ? '' : 'max-h-[40vh] sm:max-h-none'}`}>
            {cards.map((cardItem, index) => (
              <div
                key={cardItem.id}
                data-card-index={index}
                draggable={!isMobile}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDragLeave={handleDragLeave}
                onTouchStart={(e) => handleTouchStart(e, index)}
                onTouchMove={(e) => handleTouchMove(e, index)}
                onTouchEnd={handleTouchEnd}
                className={`flex-shrink-0 transition-all duration-200 ${
                  draggedIndex === index
                    ? 'opacity-50'
                    : dragOverIndex === index
                    ? 'z-10 rounded-lg bg-blue-50'
                    : ''
                } ${isMobile ? '-mx-1' : ''}`}
                style={{ cursor: isMobile ? 'grab' : 'grab', touchAction: isMobile ? 'none' : 'auto' }}
              >
                <div style={isMobile ? { transform: 'scale(0.7)', transformOrigin: 'center', margin: '-8px' } : undefined}>
                  <Card
                    card={cardItem.card}
                    variant="field"
                    disabled={false}
                    onClick={() => {}} // クリック無効化
                  />
                </div>
              </div>
            ))}
          </div>
          <div className={`${isMobile ? 'mt-1 min-h-[16px]' : 'mt-3 min-h-[24px]'} flex items-center justify-center`}>
            {!isOrderValid && (
              <div className={`text-center text-red-600 ${isMobile ? 'text-[10px] px-1' : 'text-sm px-2'} font-semibold`}>
                ⚠️ カードは「関数、演算子、関数、演算子、関数」の順に並べてください
              </div>
            )}
          </div>
        </div>

        <div className={`flex ${isMobile ? 'flex-col gap-1.5' : 'flex-row justify-end gap-3'}`}>
          <button
            onClick={onCancel}
            className={`${isMobile ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-base'} bg-gray-300 text-gray-700 rounded hover:bg-gray-400 active:bg-gray-500 transition-colors touch-manipulation`}
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            disabled={!isOrderValid}
            className={`${isMobile ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-base'} rounded transition-colors touch-manipulation ${
              isOrderValid
                ? 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            順序を確定して実行
          </button>
        </div>
      </div>
    </div>
  );
};
