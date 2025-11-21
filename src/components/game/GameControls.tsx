import { useRef, useEffect, memo } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCw, ArrowLeft, ArrowRight, ArrowDown } from 'lucide-react';

interface GameControlsProps {
  onRotate: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onMoveDown: () => void;
  disabled: boolean;
}

const GameControls = memo(({
  onRotate,
  onMoveLeft,
  onMoveRight,
  onMoveDown,
  disabled
}: GameControlsProps) => {
  const fastDownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef(false);

  const handleDownPress = () => {
    if (disabled) return;
    
    isHoldingRef.current = true;
    
    // Clear any existing intervals/timeouts first
    if (fastDownIntervalRef.current) {
      clearInterval(fastDownIntervalRef.current);
      fastDownIntervalRef.current = null;
    }
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    
    // Immediate first action
    onMoveDown();
    
    // Delay before starting continuous movement (to distinguish tap from hold)
    holdTimeoutRef.current = setTimeout(() => {
      // Double-check that we're still holding and not disabled
      if (isHoldingRef.current && !disabled) {
        // Start continuous movement only if still holding
        fastDownIntervalRef.current = setInterval(() => {
          // Check on each interval to ensure we should continue
          if (!disabled && isHoldingRef.current) {
            onMoveDown();
          } else {
            // Stop if disabled or no longer holding
            handleDownRelease();
          }
        }, 150); // Slower interval for smoother control
      }
    }, 200); // Longer delay before continuous movement starts
  };

  const handleDownRelease = () => {
    // Reset holding state immediately
    isHoldingRef.current = false;
    
    // Clear timeout if it exists
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    
    // Clear interval if it exists
    if (fastDownIntervalRef.current) {
      clearInterval(fastDownIntervalRef.current);
      fastDownIntervalRef.current = null;
    }
  };

  // Cleanup on unmount or when disabled
  useEffect(() => {
    if (disabled) {
      handleDownRelease();
    }
    return () => {
      handleDownRelease();
    };
  }, [disabled]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }
      if (fastDownIntervalRef.current) {
        clearInterval(fastDownIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-2 py-2 px-4">
      <div className="flex justify-center">
        <Button
          variant="neon"
          size="lg"
          onClick={onRotate}
          disabled={disabled}
          className="w-14 h-12 rounded-full hover:scale-110 active:scale-95 transition-all duration-200 shadow-neon"
        >
          <RotateCw className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex justify-center gap-2">
        <Button
          variant="neon"
          size="lg"
          onClick={onMoveLeft}
          disabled={disabled}
          className="w-14 h-14 rounded-full hover:scale-110 active:scale-95 transition-all duration-200 shadow-neon"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="neon"
          size="lg"
          onClick={onMoveDown}
          onMouseDown={handleDownPress}
          onMouseUp={handleDownRelease}
          onMouseLeave={handleDownRelease}
          onTouchStart={(e) => {
            e.preventDefault();
            handleDownPress();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleDownRelease();
          }}
          onTouchCancel={(e) => {
            e.preventDefault();
            handleDownRelease();
          }}
          disabled={disabled}
          className="w-14 h-14 rounded-full hover:scale-110 active:scale-95 transition-all duration-200 shadow-neon"
        >
          <ArrowDown className="h-5 w-5" />
        </Button>
        <Button
          variant="neon"
          size="lg"
          onClick={onMoveRight}
          disabled={disabled}
          className="w-14 h-14 rounded-full hover:scale-110 active:scale-95 transition-all duration-200 shadow-neon"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
});

GameControls.displayName = 'GameControls';

export default GameControls;
