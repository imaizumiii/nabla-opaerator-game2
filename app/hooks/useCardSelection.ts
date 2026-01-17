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
    cardIdOrIndexed: string,
    hand: (FunctionCard | OperatorCard)[]
  ) => {
    // cardIdOrIndexedは "cardId" または "cardId_index" の形式
    let cardId: string;
    let cardIndex: number | undefined;
    
    if (cardIdOrIndexed.includes('_') && !isNaN(parseInt(cardIdOrIndexed.split('_').pop() || '', 10))) {
      // インデックス付きIDの場合
      const parts = cardIdOrIndexed.split('_');
      cardIndex = parseInt(parts[parts.length - 1], 10);
      cardId = parts.slice(0, -1).join('_');
    } else {
      // 通常のIDの場合
      cardId = cardIdOrIndexed;
      cardIndex = hand.findIndex(c => c.id === cardId);
    }
    
    const card = cardIndex !== undefined && cardIndex !== -1 
      ? hand[cardIndex] 
      : findHandCard(cardId, hand);
    if (!card) return;

    // 現在選択されているカードのリストを取得
    const currentSelectedCards = selectedHandCardIds
      .map(id => {
        // インデックス付きIDから元のIDを抽出
        const baseId = id.includes('_') && !isNaN(parseInt(id.split('_').pop() || '', 10))
          ? id.split('_').slice(0, -1).join('_')
          : id;
        return findHandCard(baseId, hand);
      })
      .filter((c): c is GameCard => c !== undefined);
      
    // インデックス付きIDで選択状態をチェック
    const cardIdWithIndex = cardIndex !== undefined && cardIndex !== -1
      ? `${cardId}_${cardIndex}`
      : cardId;
    const isAlreadySelected = selectedHandCardIds.includes(cardIdWithIndex);

    // 既に選択済みなら解除
    if (isAlreadySelected) {
      setSelectedHandCardIds(prev => prev.filter(id => id !== cardIdWithIndex));
      return;
    }

    if (card.type === 'function') {
      // --- 関数カードがクリックされた場合 ---
      
      // ケース1: 乗算・除算の演算子が既に選択されている -> オペランドとして追加（複数枚可能）
      const operatorCards = currentSelectedCards.filter(c => c.type === 'operator') as OperatorCard[];
      const multiplyDivideOps = operatorCards.filter(op => op.operatorType === 'multiply' || op.operatorType === 'divide');
      
      if (multiplyDivideOps.length > 0) {
        // 既存の関数カード（オペランド）を取得
        const existingOperands = currentSelectedCards.filter(c => c.type === 'function') as FunctionCard[];
        
        // 演算子の枚数分のオペランドが必要
        if (existingOperands.length < multiplyDivideOps.length) {
          // まだ足りない場合は追加
          setSelectedHandCardIds(prev => [...prev, cardIdWithIndex]);
        } else {
          // 既に十分な場合は、最後のオペランドを入れ替え
          const operandIds = selectedHandCardIds.filter(id => {
            const baseId = id.includes('_') && !isNaN(parseInt(id.split('_').pop() || '', 10))
              ? id.split('_').slice(0, -1).join('_')
              : id;
            const c = findHandCard(baseId, hand);
            return c && c.type === 'function';
          });
          const lastOperandId = operandIds[operandIds.length - 1];
          setSelectedHandCardIds(prev => [
            ...prev.filter(id => id !== lastOperandId),
            cardIdWithIndex
          ]);
        }
      } 
      // ケース2: 何も選択されていない -> 関数展開用として単一選択
      else if (currentSelectedCards.length === 0) {
        setSelectedHandCardIds([cardIdWithIndex]);
      }
      // ケース3: その他 -> 全選択解除して、これを新規選択
      else {
        setSelectedHandCardIds([cardIdWithIndex]);
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
          setSelectedHandCardIds(prev => [...prev, cardIdWithIndex]);
        } else {
          // 混ぜられないものが選択されていたらリセットして新規選択
          setSelectedHandCardIds([cardIdWithIndex]);
        }
      }
      // ケース2: 乗算・除算 -> 複数選択（スタック）可能（同タイプのみ、同じIDのカードも複数選択可能）
      else if (opCard.operatorType === 'multiply' || opCard.operatorType === 'divide') {
        // 現在選択されている演算子カードを取得
        const selectedOperators = currentSelectedCards.filter(c => c.type === 'operator') as OperatorCard[];
        const selectedFunctions = currentSelectedCards.filter(c => c.type === 'function') as FunctionCard[];
        
        // 演算子カードがすべて「乗算」か「除算」なら追加可能
        // 関数カード（オペランド）が選択されていても問題なし
        const isStackable = selectedOperators.length === 0 || selectedOperators.every(op => 
          op.operatorType === 'multiply' || op.operatorType === 'divide'
        );

        if (isStackable) {
          // 同じIDのカードも複数選択可能（インデックス付きIDを使用）
          setSelectedHandCardIds(prev => [...prev, cardIdWithIndex]);
        } else {
          // 混ぜられないものが選択されていたらリセットして新規選択
          setSelectedHandCardIds([cardIdWithIndex]);
        }
      }
      // ケース3: その他の演算子 -> 単一選択（既存の関数カード選択は解除）
      else {
        setSelectedHandCardIds([cardIdWithIndex]);
      }
    }
  };

  const clearSelection = () => {
    setSelectedHandCardIds([]);
  };

  const getSelectedCards = (hand: (FunctionCard | OperatorCard)[]): GameCard[] => {
    return selectedHandCardIds
      .map(id => {
        // インデックス付きIDから元のIDを抽出
        let baseId = id;
        let cardIndex: number | undefined;
        
        if (id.includes('_') && !isNaN(parseInt(id.split('_').pop() || '', 10))) {
          const parts = id.split('_');
          cardIndex = parseInt(parts[parts.length - 1], 10);
          baseId = parts.slice(0, -1).join('_');
        }
        
        // インデックスが指定されている場合は、そのインデックスのカードを返す
        if (cardIndex !== undefined && cardIndex !== -1 && hand[cardIndex]?.id === baseId) {
          return hand[cardIndex];
        }
        
        // 通常のID検索
        return findHandCard(baseId, hand);
      })
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
