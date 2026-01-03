export type CardType = 'function' | 'operator';

export type FunctionType = 'constant' | 'polynomial' | 'exponential' | 'trigonometric';

export type OperatorType = 
  | 'differential' // 微分
  | 'integral'     // 積分
  | 'nabla'        // 全体微分 (1回)
  | 'laplacian'    // 全体微分 (2回)
  | 'limit_infinity' // 極限(∞)
  | 'limit_0'      // 極限(0)
  | 'limit_sup'    // 上極限
  | 'limit_inf'    // 下極限
  | 'multiply'     // 乗算
  | 'divide'       // 除算
  | 'log'          // 対数
  | 'sqrt'         // 平方根
  | 'inverse';     // 逆関数

export interface Card {
  id: string;
  name: string;
  type: CardType;
  description: string;
}

export interface FunctionCard extends Card {
  type: 'function';
  expression: string; // 数式 (mathjs用)
  latex: string;      // 表示用
  normalizedExpression?: string; // 線形従属判定用 (係数無視)
}

export interface OperatorCard extends Card {
  type: 'operator';
  operatorType: OperatorType;
  value?: string | number; // 乗算の値など
}

export type GamePhase = 'draw' | 'main' | 'cleanup' | 'end';

export interface PlayerState {
  id: string;
  field: FunctionCard[];
  hand: (FunctionCard | OperatorCard)[];
  deck: (FunctionCard | OperatorCard)[];
}

export interface GameState {
  turnCount: number;
  currentPlayer: string; // 'player' | 'opponent'
  phase: GamePhase;
  player: PlayerState;
  opponent: PlayerState;
  winner: string | null;
}
