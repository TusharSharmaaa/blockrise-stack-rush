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
    <div 
      className="flex justify-between items-center px-3 py-2 bg-card/30 backdrop-blur-sm w-full" 
      style={{ 
        minHeight: '50px',
        margin: 0,
        paddingLeft: 'max(12px, env(safe-area-inset-left, 12px))',
        paddingRight: 'max(12px, env(safe-area-inset-right, 12px))'
      }}
    >
      <div className="flex gap-3 sm:gap-4">
        <div>
          <div className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider leading-tight">Score</div>
          <div className="text-base sm:text-lg font-bold text-primary leading-tight">{score}</div>
        </div>
        <div>
          <div className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider leading-tight">Level</div>
          <div className="text-base sm:text-lg font-bold text-secondary leading-tight">{level}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3">
        {nextBlock && (
          <div className="flex flex-col items-center">
            <div className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wider leading-tight hidden sm:block mb-0.5">Next</div>
            <div className="bg-game-grid p-1 rounded border border-game-border/50">
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
                className="w-8 h-8 sm:w-12 sm:h-12"
              />
            </div>
          </div>
        )}
        
        <Button
          variant="outline"
          size="icon"
          onClick={onPause}
          className="bg-card border-primary/30 hover:bg-primary/20 h-9 w-9 sm:h-10 sm:w-10 touch-manipulation min-w-[36px] min-h-[36px]"
          style={{ touchAction: 'manipulation' }}
        >
          <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>
    </div>
  );
};

export default GameHUD;
