import { useState } from 'react';
import { FunctionCard, OperatorCard } from '../types/game';

type GameCard = FunctionCard | OperatorCard;

/**
 * 手札カードの選択状態を管理するカスタムフック
 */
export const useCardSelection = () => {
  const [selectedHandCardIds, setSelectedHandCardIds] = useState<string[]>([]);
  const [hoveredHandCardId, setHoveredHandCardId] = useState<string | null>(null);

  const findHandCard = (
    id: string | null,
    hand: (FunctionCard | OperatorCard)[]
  ): GameCard | undefined => {
    return id ? hand.find(c => c.id === id) : undefined;
  };

  const handleHandCardClick = (
    cardId: string,
    hand: (FunctionCard | OperatorCard)[]
  ) => {
    const card = findHandCard(cardId, hand);
    if (!card) return;

    // 現在選択されているカードのリストを取得
    const currentSelectedCards = selectedHandCardIds
      .map(id => findHandCard(id, hand))
      .filter((c): c is GameCard => c !== undefined);
      
    const isAlreadySelected = selectedHandCardIds.includes(cardId);

    // 既に選択済みなら解除
    if (isAlreadySelected) {
      setSelectedHandCardIds(prev => prev.filter(id => id !== cardId));
      return;
    }

    if (card.type === 'function') {
      // --- 関数カードがクリックされた場合 ---
      
      // ケース1: 乗算・除算の演算子が既に選択されている -> オペランドとして追加（1枚のみ）
      const operatorCard = currentSelectedCards.find(c => c.type === 'operator') as OperatorCard | undefined;
      if (operatorCard && operatorCard.operatorType && operatorCard.operatorType.match(/multiply|divide/)) {
        // 既存の関数カード（オペランド）があれば入れ替え
        setSelectedHandCardIds(prev => [
          ...prev.filter(id => findHandCard(id, hand)?.type !== 'function'), 
          cardId
        ]);
      } 
      // ケース2: 何も選択されていない -> 関数展開用として単一選択
      else if (currentSelectedCards.length === 0) {
        setSelectedHandCardIds([cardId]);
      }
      // ケース3: その他 -> 全選択解除して、これを新規選択
      else {
        setSelectedHandCardIds([cardId]);
      }

    } else if (card.type === 'operator') {
      // --- 演算子カードがクリックされた場合 ---
      const opCard = card as OperatorCard;

      // ケース1: 微分・積分 -> 複数選択（スタック）可能
      if (opCard.operatorType === 'differential' || opCard.operatorType === 'integral') {
        // 現在の選択がすべて「微分」か「積分」か「未選択」なら追加可能
        const isStackable = currentSelectedCards.every(c => 
          c.type === 'operator' && 
          ((c as OperatorCard).operatorType === 'differential' || (c as OperatorCard).operatorType === 'integral')
        );

        if (isStackable) {
          setSelectedHandCardIds(prev => [...prev, cardId]);
        } else {
          // 混ぜられないものが選択されていたらリセットして新規選択
          setSelectedHandCardIds([cardId]);
        }
      }
      // ケース2: その他の演算子 -> 単一選択（既存の関数カード選択は解除）
      else {
        setSelectedHandCardIds([cardId]);
      }
    }
  };

  const clearSelection = () => {
    setSelectedHandCardIds([]);
  };

  const getSelectedCards = (hand: (FunctionCard | OperatorCard)[]): GameCard[] => {
    return selectedHandCardIds
      .map(id => findHandCard(id, hand))
      .filter((c): c is GameCard => c !== undefined);
  };

  return {
    selectedHandCardIds,
    hoveredHandCardId,
    setHoveredHandCardId,
    handleHandCardClick,
    clearSelection,
    getSelectedCards,
    findHandCard,
  };
};
