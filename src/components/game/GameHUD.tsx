import { Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Block } from '@/types/game';
import { memo, useEffect, useRef } from 'react';

interface GameHUDProps {
  score: number;
  level: number;
  nextBlock: Block | null;
  onPause: () => void;
}

const GameHUD = memo(({ score, level, nextBlock, onPause }: GameHUDProps) => {
  const cellSize = 16;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Optimize canvas rendering with useEffect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !nextBlock) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    requestAnimationFrame(() => {
      // Clear canvas with background color
      const gameGridColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--game-grid')
        .trim();
      ctx.fillStyle = `hsl(${gameGridColor})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate block dimensions
      const blockWidth = nextBlock.shape[0]?.length || 0;
      const blockHeight = nextBlock.shape.length || 0;
      
      // Center the block in the 4x4 canvas
      const offsetX = Math.floor((4 - blockWidth) / 2);
      const offsetY = Math.floor((4 - blockHeight) / 2);

      // Draw each cell with proper spacing (like main game board)
      nextBlock.shape.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell) {
            const x = (offsetX + colIndex) * cellSize + 1;
            const y = (offsetY + rowIndex) * cellSize + 1;
            const size = cellSize - 2;
            
            // Draw block cell
            ctx.fillStyle = nextBlock.color;
            ctx.fillRect(x, y, size, size);
            
            // Add subtle gradient for depth
            const gradient = ctx.createLinearGradient(
              (offsetX + colIndex) * cellSize,
              (offsetY + rowIndex) * cellSize,
              (offsetX + colIndex) * cellSize,
              (offsetY + rowIndex + 1) * cellSize
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, size, size);
            
            // Add subtle outline for sharper edges
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
          }
        });
      });
    });
  }, [nextBlock]);

  return (
    <div className="glass-card py-2 px-4 border-b border-glass-border shadow-glow">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <div className="space-y-0.5">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Score</div>
            <div className="text-xl font-bold text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]">{score}</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Level</div>
            <div className="text-xl font-bold text-secondary drop-shadow-[0_0_8px_hsl(var(--secondary))]">{level}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {nextBlock && (
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Next</div>
              <div className="bg-game-grid p-2 rounded border border-primary/30 shadow-neon">
                <canvas
                  ref={canvasRef}
                  width={cellSize * 4}
                  height={cellSize * 4}
                />
              </div>
            </div>
          )}
          
          <Button
            variant="neon"
            size="icon"
            onClick={onPause}
            className="hover:scale-110 transition-all duration-200"
          >
            <Pause className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
});

GameHUD.displayName = 'GameHUD';

export default GameHUD;
