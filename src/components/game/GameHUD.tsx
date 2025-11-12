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
    <div className="flex justify-between items-center p-4 bg-card/50 backdrop-blur-sm border-b border-border">
      <div className="flex gap-6">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Score</div>
          <div className="text-2xl font-bold text-primary">{score}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Level</div>
          <div className="text-2xl font-bold text-secondary">{level}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {nextBlock && (
          <div className="flex flex-col items-center gap-1">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Next</div>
            <div className="bg-game-grid p-2 rounded border border-game-border">
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
          variant="outline"
          size="icon"
          onClick={onPause}
          className="bg-card border-primary/30 hover:bg-primary/20"
        >
          <Pause className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default GameHUD;
