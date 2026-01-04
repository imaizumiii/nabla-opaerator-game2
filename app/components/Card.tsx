import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import { FunctionCard, OperatorCard } from '../types/game';

interface CardProps {
  card: FunctionCard | OperatorCard;
  onClick?: () => void;
  isSelected?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties; // 追加: 外部からのスタイル制御用
  onMouseEnter?: () => void;   // 追加: ホバー検知用
  onMouseLeave?: () => void;   // 追加: ホバー解除用
}

export const Card: React.FC<CardProps> = ({ card, onClick, isSelected, disabled, style, onMouseEnter, onMouseLeave }) => {
  const isFunction = card.type === 'function';
  // 数学的な方眼紙風背景とセリフフォントを適用
  const bgColor = isFunction ? 'bg-white bg-math-grid' : 'bg-red-50 bg-math-grid';
  // 枠線を少し太く、色を明確に
  // isSelectedによるスタイル変更は親コンポーネント(transform)に任せるため、ここではborder色のみ変更
  const borderColor = isSelected 
    ? 'border-yellow-500 ring-4 ring-yellow-400/50' 
    : isFunction ? 'border-blue-200' : 'border-red-200';
  
  const textColor = disabled ? 'text-gray-400' : 'text-gray-900';

  return (
    <div
      className={`
        relative rounded-lg border-2 ${borderColor} ${bgColor} 
        shadow-md hover:shadow-2xl transition-all duration-300 ease-out cursor-pointer flex flex-col p-2
        math-font
        w-32 h-48 lg:w-36 lg:h-52 select-none
        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
      `}
      style={style}
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header: Card Type & Name (Small) */}
      <div className="flex justify-between items-start border-b border-gray-100 pb-1 mb-1">
         <span className={`text-[8px] md:text-[10px] font-bold uppercase tracking-wider ${isFunction ? 'text-blue-600' : 'text-red-600'}`}>
            {isFunction ? 'Func' : 'Op'}
         </span>
      </div>
      
      {/* Main Content: Math Formula */}
      <div className={`flex-1 flex flex-col items-center justify-center ${textColor}`}>
        {isFunction ? (
          <div className="w-full text-center overflow-hidden">
             {/* 関数は大きく中央に表示 */}
            <div className="text-sm md:text-lg lg:text-xl">
              <BlockMath math={(card as FunctionCard).latex} />
            </div>
          </div>
        ) : (
          <div className="text-center w-full">
            {/* 演算子は記号を大きく */}
            {card.type === 'operator' && (
                <>
                    {/* 名称は小さめに */}
                    <div className="text-[10px] md:text-xs font-semibold mb-1 opacity-80 truncate">{card.name}</div>
                    
                    <div className="text-lg md:text-xl lg:text-2xl">
                        {(card as OperatorCard).operatorType === 'differential' && <BlockMath math="\frac{d}{dx}" />}
                        {(card as OperatorCard).operatorType === 'integral' && <BlockMath math="\int dx" />}
                        {(card as OperatorCard).operatorType === 'limit_infinity' && <BlockMath math="\lim_{x \to \infty}" />}
                        {(card as OperatorCard).operatorType === 'limit_0' && <BlockMath math="\lim_{x \to 0}" />}
                        {(card as OperatorCard).operatorType === 'limit_inf' && <BlockMath math="\lim_{x \to -\infty}" />}
                        {(card as OperatorCard).operatorType === 'limit_sup' && <BlockMath math="\limsup" />}
                        {(card as OperatorCard).operatorType === 'multiply' && <BlockMath math="\times" />}
                        {(card as OperatorCard).operatorType === 'divide' && <BlockMath math="\div" />}
                        {(card as OperatorCard).operatorType === 'log' && <BlockMath math="\ln" />}
                        {(card as OperatorCard).operatorType === 'sqrt' && <BlockMath math="\sqrt{\quad}" />}
                        {(card as OperatorCard).operatorType === 'inverse' && <BlockMath math="f^{-1}" />}
                        {(card as OperatorCard).operatorType === 'nabla' && <BlockMath math="\nabla" />}
                        {(card as OperatorCard).operatorType === 'laplacian' && <BlockMath math="\Delta" />}
                    </div>
                </>
            )}
          </div>
        )}
      </div>

      {/* Footer: Description */}
      <div className="mt-auto pt-1 border-t border-gray-100 hidden md:block">
        <p className="text-[8px] md:text-[10px] text-gray-500 leading-tight text-center font-sans truncate">
          {card.description}
        </p>
      </div>
    </div>
  );
};

