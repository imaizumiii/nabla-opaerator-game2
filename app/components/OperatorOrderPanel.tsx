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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-2">演算の順序を変更</h2>
        <p className="text-sm text-gray-600 mb-6">
          乗算・除算の順序によって計算結果が変わります。カードをドラッグして順序を変更してください。
        </p>

        {/* 計算工程を横並びで表示 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="flex items-center justify-center gap-3 flex-wrap min-h-[200px]">
            {cards.map((cardItem, index) => (
              <div
                key={cardItem.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDragLeave={handleDragLeave}
                className={`flex-shrink-0 transition-all duration-200 ${
                  draggedIndex === index
                    ? 'opacity-50 scale-95'
                    : dragOverIndex === index
                    ? 'scale-110 z-10 border-2 border-blue-400 rounded-lg p-1 bg-blue-50'
                    : 'hover:scale-105'
                }`}
                style={{ cursor: 'grab' }}
              >
                <Card
                  card={cardItem.card}
                  variant="field"
                  disabled={true}
                />
              </div>
            ))}
          </div>
          {!isOrderValid && (
            <div className="mt-3 text-center text-red-600 text-sm font-semibold">
              ⚠️ カードは「関数、演算子、関数、演算子、関数」の順に並べてください
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            disabled={!isOrderValid}
            className={`px-4 py-2 rounded transition-colors ${
              isOrderValid
                ? 'bg-blue-500 text-white hover:bg-blue-600'
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
