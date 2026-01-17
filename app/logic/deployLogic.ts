import { GameState, FunctionCard, PlayerState } from '../types/game';
import { resolveLinearDependence } from '../hooks/useLinearDependence';
import { advanceTurn } from './turnLogic';

/**
 * 関数カードをフィールドに配置する
 */
export const deployFunctionCard = async (
  gameState: GameState,
  card: FunctionCard,
  targetPlayerId: string,
  currentPlayerState: PlayerState,
  targetPlayerState: PlayerState
): Promise<void> => {
  // フィールド枚数制限 (3枚まで) - 手札削除前にチェック
  if (targetPlayerState.field.length >= 3) {
    throw new Error("Field is full (max 3 cards).");
  }

  // 仮にフィールドに追加
  const newCard = { ...card, id: `${card.id}_deployed_${Date.now()}` } as FunctionCard;
  const tempField = [...targetPlayerState.field, newCard];
  
  // 線形従属チェック (API)
  const resolvedField = await resolveLinearDependence(tempField);
  
  // もし追加したカードが消えていたら（つまり従属していたら）、追加キャンセル扱い
  // APIが「後ろにあるものを削除」する仕様なら、newCard (末尾) が消えるはず
  targetPlayerState.field = resolvedField;
};
