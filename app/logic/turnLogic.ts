import { GameState, PlayerState } from '../types/game';

/**
 * 次のプレイヤーに手札をドローする
 */
export const drawCardsForNextPlayer = (
  playerState: PlayerState,
  targetHandSize: number = 7
): void => {
  while (playerState.hand.length < targetHandSize && playerState.deck.length > 0) {
    const card = playerState.deck.pop();
    if (card) {
      playerState.hand.push({ 
        ...card, 
        id: `${card.id}_${Date.now()}_${playerState.hand.length}` 
      });
    }
  }
};

/**
 * ターンを終了し、次のプレイヤーに移行する
 * 勝利判定がある場合はターンを進めない
 */
export const advanceTurn = (
  gameState: GameState,
  currentState: GameState
): void => {
  if (gameState.winner) return;

  gameState.turnCount = currentState.turnCount + 1;
  gameState.currentPlayer = currentState.currentPlayer === 'player' ? 'opponent' : 'player';

  // 次のプレイヤーの自動ドロー
  const nextPlayerState = gameState.currentPlayer === 'player' 
    ? gameState.player 
    : gameState.opponent;
  drawCardsForNextPlayer(nextPlayerState);
};

/**
 * 勝利判定を行う
 */
export const checkWinner = (gameState: GameState): void => {
  if (gameState.opponent.field.length === 0) {
    gameState.winner = 'player';
  } else if (gameState.player.field.length === 0) {
    gameState.winner = 'opponent';
  }
};
