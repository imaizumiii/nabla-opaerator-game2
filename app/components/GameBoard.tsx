import React, { useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { Card as CardComponent } from './Card';
import { OperatorCard, FunctionCard } from '../types/game';

type GameCard = FunctionCard | OperatorCard;

export const GameBoard: React.FC = () => {
  const { gameState, applyOperator, deployFunction, drawCard, endTurn } = useGameState();
  const [selectedHandCardIds, setSelectedHandCardIds] = useState<string[]>([]);

  // 現在のターンプレイヤーの手札などを取得
  const isPlayerTurn = gameState.currentPlayer === 'player';
  const currentPlayerState = isPlayerTurn ? gameState.player : gameState.opponent;
  
  const findHandCard = (id: string | null) => id ? currentPlayerState.hand.find(c => c.id === id) : undefined;

  const handleHandCardClick = (cardId: string) => {
    const card = findHandCard(cardId);
    if (!card) return;

    // 現在選択されているカードのリストを取得
    const currentSelectedCards = selectedHandCardIds
      .map(id => findHandCard(id))
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
          ...prev.filter(id => findHandCard(id)?.type !== 'function'), 
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

  const handleFieldCardClick = (targetId: string, isPlayerField: boolean) => {
    // 既存の処理（ターゲット指定など）
    executeFieldAction(targetId, isPlayerField);
  };

  const handleFieldAreaClick = (isPlayerField: boolean) => {
    // フィールド全体をクリックしたときの処理
    // ターゲットIDなしで実行を試みる（主にDeploy用）
    executeFieldAction(null, isPlayerField);
  };

  const executeFieldAction = (targetId: string | null, isPlayerField: boolean) => {
    const selectedCards = selectedHandCardIds
      .map(id => findHandCard(id))
      .filter((c): c is GameCard => c !== undefined);

    if (selectedCards.length === 0) return;

    const targetOwnerId = isPlayerField ? 'player' : 'opponent';

    // パターンA: 関数カードのみ (Deploy)
    if (selectedCards.every(c => c.type === 'function')) {
        if (selectedCards.length !== 1) return; // 基本的に1枚

        // フィールド上限チェック
        const currentField = isPlayerField ? gameState.player.field : gameState.opponent.field;
        if (currentField.length >= 3) {
            alert("Maximum of 3 function cards allowed on the field.");
            return;
        }

        // 線形従属（重複）チェック - 警告を表示
        const isDuplicate = currentField.some(c => c.expression === selectedCards[0].expression);
        if (isDuplicate) {
            const proceed = window.confirm("警告：この関数カードは既に場に存在するため、配置しても次元の冗長性により消滅します（手札から失われます）。実行しますか？");
            if (!proceed) return;
        }

        deployFunction(selectedCards[0].id, targetOwnerId);
        setSelectedHandCardIds([]);
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
            // ただし、ターゲットIDが指定されている場合はそのカードのオーナーフィールドを優先
            // executeFieldActionの引数 targetId は「クリックされたカード」または null
            
            // 処理対象のプレイヤーID
            const aoETargetOwnerId = isPlayerField ? 'player' : 'opponent';

            applyOperator(operators, null, aoETargetOwnerId, null, functions[0]); // functions[0] is undefined usually
            setSelectedHandCardIds([]);
            return;
        }

        // 通常演算子はターゲットID必須
        if (!targetId) return;
        
        // ... (以下、既存の通常処理)
      // ターゲットカードの情報を取得
      const targetField = isPlayerField ? gameState.player.field : gameState.opponent.field;
      const targetCard = targetField.find(c => c.id === targetId);
      
      if (!targetCard) {
          console.error("Target card not found in UI state");
          return;
      }

      // 乗算・除算チェック
      if (operators.some(op => op.operatorType === 'multiply' || op.operatorType === 'divide')) {
          if (functions.length === 0) {
              alert("Please select a function card from your hand to combine with.");
              return;
          }
          applyOperator(operators, targetId, targetOwnerId, targetCard, functions[0]);
      } else {
          // 微分・積分・その他
          applyOperator(operators, targetId, targetOwnerId, targetCard);
      }
      setSelectedHandCardIds([]);
    }
  };

  // インジケータ用のメッセージ生成
  const getActionMessage = () => {
    const selectedCards = selectedHandCardIds
      .map(id => findHandCard(id))
      .filter((c): c is GameCard => c !== undefined);
      
    if (selectedCards.length === 0) return "Select a card from your hand.";

    const operators = selectedCards.filter(c => c.type === 'operator') as OperatorCard[];
    const functions = selectedCards.filter(c => c.type === 'function') as FunctionCard[];

    if (operators.length > 0) {
        // スタック表示
        const diffCount = operators.filter(op => op.operatorType === 'differential').length;
        const intCount = operators.filter(op => op.operatorType === 'integral').length;
        const otherOps = operators.filter(op => op.operatorType !== 'differential' && op.operatorType !== 'integral');
        
        let msg = "Applying: ";
        const parts = [];
        if (diffCount > 0) parts.push(`Differentiation x${diffCount}`);
        if (intCount > 0) parts.push(`Integration x${intCount}`);
        otherOps.forEach(op => parts.push(op.name));
        
        msg += parts.join(", ");

        if (operators.some(op => op.operatorType === 'multiply' || op.operatorType === 'divide')) {
            if (functions.length > 0) {
                msg += ` with ${functions[0].name}`;
            } else {
                msg += " (Select a function card from hand)";
            }
        }
        
        return msg + " -> Select target on field.";
    } else if (functions.length > 0) {
        return `Deploying ${functions[0].name} -> Select field to deploy.`;
    }
    
    return "";
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
      <div 
        className={`flex-1 p-4 rounded-xl flex flex-col items-center justify-center relative transition-all duration-300 cursor-pointer ${!isPlayerTurn ? 'bg-red-100 border-4 border-red-500 shadow-lg' : 'bg-gray-100 border-2 border-gray-300 opacity-80'}`}
        onClick={(e) => {
            // カードクリックイベントがバブリングしてきた場合は無視したいが、
            // Reactのイベント伝播だと単純な判定が難しい場合もあるため、
            // CardComponentのonClickでstopPropagationするのが確実。
            // ここでは簡易的にターゲットが自分自身(div)であれば実行するようにする。
            if (e.target === e.currentTarget) {
                handleFieldAreaClick(false);
            }
        }}
      >
        <div className="absolute top-2 left-2 text-gray-800 font-bold opacity-50 pointer-events-none">Player 2 Field (Opponent) { !isPlayerTurn && " [TURN]" }</div>
        <div className="flex gap-4 flex-wrap justify-center pointer-events-none">
          {gameState.opponent.field.map(card => (
            <div key={card.id} className="pointer-events-auto">
                <CardComponent 
                card={card} 
                onClick={() => handleFieldCardClick(card.id, false)}
                />
            </div>
          ))}
          {gameState.opponent.field.length === 0 && <div className="text-red-400 font-bold text-2xl">0 Dimension (LOSE)</div>}
        </div>
      </div>

      {/* Player Field (Player 1) */}
      <div 
        className={`flex-1 p-4 rounded-xl flex flex-col items-center justify-center relative transition-all duration-300 cursor-pointer ${isPlayerTurn ? 'bg-blue-100 border-4 border-blue-500 shadow-lg' : 'bg-gray-100 border-2 border-gray-300 opacity-80'}`}
        onClick={(e) => {
            if (e.target === e.currentTarget) {
                handleFieldAreaClick(true);
            }
        }}
      >
        <div className="absolute top-2 left-2 text-gray-800 font-bold opacity-50 pointer-events-none">Player 1 Field (You) { isPlayerTurn && " [TURN]" }</div>
        <div className="flex gap-4 flex-wrap justify-center pointer-events-none">
          {gameState.player.field.map(card => (
            <div key={card.id} className="pointer-events-auto">
                <CardComponent 
                card={card} 
                onClick={() => handleFieldCardClick(card.id, true)}
                />
            </div>
          ))}
          {gameState.player.field.length === 0 && <div className="text-red-500 font-bold text-2xl">0 Dimension (LOSE)</div>}
        </div>
      </div>

      {/* Current Player's Hand */}
      <div className="bg-white p-4 rounded-xl border-t-4 border-gray-300 shadow-inner min-h-[280px]">
        <div className="text-gray-500 font-bold mb-2">
            {isPlayerTurn ? "Player 1's Hand" : "Player 2's Hand"}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-4">
          {currentPlayerState.hand.map(card => (
            <div key={card.id} className="flex-shrink-0">
                <CardComponent 
                  card={card} 
                  isSelected={selectedHandCardIds.includes(card.id)}
                  onClick={() => handleHandCardClick(card.id)}
                />
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer / Instructions */}
      <div className="text-center text-sm text-gray-500 font-bold min-h-[1.5em]">
        {getActionMessage()}
      </div>
    </div>
  );
};
