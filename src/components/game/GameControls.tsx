import { Button } from '@/components/ui/button';
import { RotateCw, ArrowLeft, ArrowRight, ArrowDown } from 'lucide-react';

interface GameControlsProps {
  onRotate: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onMoveDown: () => void;
  disabled: boolean;
}

const GameControls = ({
  onRotate,
  onMoveLeft,
  onMoveRight,
  onMoveDown,
  disabled
}: GameControlsProps) => {
  return (
    <div 
      className="flex flex-col gap-0.5 py-0.5 w-full" 
      style={{ 
        minHeight: '60px',
        paddingLeft: 'max(8px, env(safe-area-inset-left, 8px))',
        paddingRight: 'max(8px, env(safe-area-inset-right, 8px))'
      }}
    >
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="lg"
          onClick={onRotate}
          disabled={disabled}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-card border-primary/30 hover:bg-primary/20 active:bg-primary/30 touch-manipulation p-0"
          style={{ touchAction: 'manipulation' }}
        >
          <RotateCw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </Button>
      </div>
      <div className="flex justify-center gap-0.5">
        <Button
          variant="outline"
          size="lg"
          onClick={onMoveLeft}
          disabled={disabled}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-card border-primary/30 hover:bg-primary/20 active:bg-primary/30 touch-manipulation p-0"
          style={{ touchAction: 'manipulation' }}
        >
          <ArrowLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={onMoveDown}
          disabled={disabled}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-card border-primary/30 hover:bg-primary/20 active:bg-primary/30 touch-manipulation p-0"
          style={{ touchAction: 'manipulation' }}
        >
          <ArrowDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={onMoveRight}
          disabled={disabled}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-card border-primary/30 hover:bg-primary/20 active:bg-primary/30 touch-manipulation p-0"
          style={{ touchAction: 'manipulation' }}
        >
          <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default GameControls;
