import { FunctionCard, OperatorCard } from '../types/game';

type GameCard = FunctionCard | OperatorCard;

/**
 * アクションメッセージを生成する
 */
export const getActionMessage = (selectedCards: GameCard[]): string => {
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
