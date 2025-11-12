export type BlockShape = number[][];

export interface Block {
  shape: BlockShape;
  color: string;
  x: number;
  y: number;
  id: string;
}

export interface GameState {
  grid: (string | null)[][];
  currentBlock: Block | null;
  nextBlock: Block | null;
  score: number;
  level: number;
  linesCleared: number;
  gameOver: boolean;
  paused: boolean;
  speed: number;
}

export type GameMode = 'classic' | 'endless' | 'daily';

export interface PowerUp {
  type: 'bomb' | 'shuffle' | 'slowtime' | 'clearline';
  active: boolean;
  duration?: number;
}
