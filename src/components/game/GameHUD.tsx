import { Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Block } from '@/types/game';

interface GameHUDProps {
  score: number;
  level: number;
  nextBlock: Block | null;
  onPause: () => void;
}

const GameHUD = ({ score, level, nextBlock, onPause }: GameHUDProps) => {
  const cellSize = 16;

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
                  ref={(canvas) => {
                    if (canvas) {
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.fillStyle = nextBlock.color;
                        nextBlock.shape.forEach((row, rowIndex) => {
                          row.forEach((cell, colIndex) => {
                            if (cell) {
                              ctx.fillRect(
                                colIndex * cellSize,
                                rowIndex * cellSize,
                                cellSize - 1,
                                cellSize - 1
                              );
                            }
                          });
                        });
                      }
                    }
                  }}
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
};

export default GameHUD;
