import { useEffect, useRef, useState } from 'react';
import { Block } from '@/types/game';
import { GRID_WIDTH, GRID_HEIGHT } from '@/utils/blockShapes';

interface GameBoardProps {
  grid: (string | null)[][];
  currentBlock: Block | null;
}

const GameBoard = ({ grid, currentBlock }: GameBoardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cellSize, setCellSize] = useState(24);

  // Make responsive based on screen width
  useEffect(() => {
    const updateSize = () => {
      const screenWidth = window.innerWidth;
      if (screenWidth < 640) {
        // Mobile
        setCellSize(Math.min(20, Math.floor((screenWidth - 32) / GRID_WIDTH)));
      } else {
        // Desktop
        setCellSize(24);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = 'hsl(220 18% 15%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = 'hsl(220 15% 20%)';
    ctx.lineWidth = 1;
    for (let row = 0; row <= GRID_HEIGHT; row++) {
      ctx.beginPath();
      ctx.moveTo(0, row * cellSize);
      ctx.lineTo(GRID_WIDTH * cellSize, row * cellSize);
      ctx.stroke();
    }
    for (let col = 0; col <= GRID_WIDTH; col++) {
      ctx.beginPath();
      ctx.moveTo(col * cellSize, 0);
      ctx.lineTo(col * cellSize, GRID_HEIGHT * cellSize);
      ctx.stroke();
    }

    // Draw placed blocks
    for (let row = 0; row < GRID_HEIGHT; row++) {
      for (let col = 0; col < GRID_WIDTH; col++) {
        if (grid[row][col]) {
          ctx.fillStyle = grid[row][col] as string;
          ctx.fillRect(col * cellSize + 1, row * cellSize + 1, cellSize - 2, cellSize - 2);
          
          // Add subtle gradient
          const gradient = ctx.createLinearGradient(
            col * cellSize,
            row * cellSize,
            col * cellSize,
            (row + 1) * cellSize
          );
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
          ctx.fillStyle = gradient;
          ctx.fillRect(col * cellSize + 1, row * cellSize + 1, cellSize - 2, cellSize - 2);
        }
      }
    }

    // Draw current block
    if (currentBlock) {
      ctx.fillStyle = currentBlock.color;
      currentBlock.shape.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell) {
            const x = (currentBlock.x + colIndex) * cellSize;
            const y = (currentBlock.y + rowIndex) * cellSize;
            ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
            
            // Add gradient to current block
            const gradient = ctx.createLinearGradient(x, y, x, y + cellSize);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
            ctx.fillStyle = gradient;
            ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
            ctx.fillStyle = currentBlock.color;
          }
        });
      });
    }
  }, [grid, currentBlock, cellSize]);

  return (
    <div className="flex items-center justify-center p-2 sm:p-4">
      <canvas
        ref={canvasRef}
        width={GRID_WIDTH * cellSize}
        height={GRID_HEIGHT * cellSize}
        className="border-2 border-game-border rounded-lg card-elevated max-w-full"
        style={{ 
          width: `${GRID_WIDTH * cellSize}px`,
          height: `${GRID_HEIGHT * cellSize}px`
        }}
      />
    </div>
  );
};

export default GameBoard;
