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
    <div className="flex flex-col gap-3 p-4">
      <div className="flex justify-center">
        <Button
          variant="neon"
          size="lg"
          onClick={onRotate}
          disabled={disabled}
          className="w-16 h-16 rounded-full hover:scale-110 active:scale-95 transition-all duration-200 shadow-neon"
        >
          <RotateCw className="h-6 w-6" />
        </Button>
      </div>
      <div className="flex justify-center gap-3">
        <Button
          variant="neon"
          size="lg"
          onClick={onMoveLeft}
          disabled={disabled}
          className="w-16 h-16 rounded-full hover:scale-110 active:scale-95 transition-all duration-200 shadow-neon"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="neon"
          size="lg"
          onClick={onMoveDown}
          disabled={disabled}
          className="w-16 h-16 rounded-full hover:scale-110 active:scale-95 transition-all duration-200 shadow-neon"
        >
          <ArrowDown className="h-6 w-6" />
        </Button>
        <Button
          variant="neon"
          size="lg"
          onClick={onMoveRight}
          disabled={disabled}
          className="w-16 h-16 rounded-full hover:scale-110 active:scale-95 transition-all duration-200 shadow-neon"
        >
          <ArrowRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default GameControls;
