import { BlockShape } from '@/types/game';

export const BLOCK_SHAPES: BlockShape[] = [
  // I-piece
  [[1, 1, 1, 1]],
  // O-piece
  [[1, 1], [1, 1]],
  // T-piece
  [[0, 1, 0], [1, 1, 1]],
  // L-piece
  [[1, 0], [1, 0], [1, 1]],
  // J-piece
  [[0, 1], [0, 1], [1, 1]],
  // S-piece
  [[0, 1, 1], [1, 1, 0]],
  // Z-piece
  [[1, 1, 0], [0, 1, 1]],
];

export const BLOCK_COLORS = [
  'hsl(195 100% 50%)', // Cyan
  'hsl(280 60% 55%)', // Purple
  'hsl(45 100% 60%)', // Yellow
  'hsl(142 76% 45%)', // Green
  'hsl(0 84% 60%)', // Red
  'hsl(25 95% 53%)', // Orange
  'hsl(217 91% 60%)', // Blue
];

export const GRID_WIDTH = 10;
export const GRID_HEIGHT = 20;

export function getRandomBlock(): { shape: BlockShape; color: string } {
  const shape = BLOCK_SHAPES[Math.floor(Math.random() * BLOCK_SHAPES.length)];
  const color = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
  return { shape, color };
}

export function rotateShape(shape: BlockShape): BlockShape {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated: BlockShape = [];
  
  for (let col = 0; col < cols; col++) {
    const newRow: number[] = [];
    for (let row = rows - 1; row >= 0; row--) {
      newRow.push(shape[row][col]);
    }
    rotated.push(newRow);
  }
  
  return rotated;
}

export function createEmptyGrid(): (string | null)[][] {
  return Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(null));
}
