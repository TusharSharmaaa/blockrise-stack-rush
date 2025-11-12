import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePowerUps } from '@/hooks/usePowerUps';
import { useEffect, useState } from 'react';

interface PowerUpBarProps {
  onUsePowerUp: (type: 'slowTime' | 'clearLine' | 'shuffle' | 'bomb') => void;
  disabled?: boolean;
}

const PowerUpBar = ({ onUsePowerUp, disabled }: PowerUpBarProps) => {
  const { inventory, activePowerUp, getRemainingTime, hasPowerUp } = usePowerUps();
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    if (activePowerUp) {
      const interval = setInterval(() => {
        const time = getRemainingTime();
        setRemainingTime(time);
        if (time <= 0) {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [activePowerUp, getRemainingTime]);

  const powerUps = [
    { id: 'slowTime' as const, icon: '⏱️', name: 'Slow Time', color: 'bg-blue-500' },
    { id: 'clearLine' as const, icon: '✨', name: 'Clear Line', color: 'bg-purple-500' },
    { id: 'shuffle' as const, icon: '🔄', name: 'Shuffle', color: 'bg-green-500' },
    { id: 'bomb' as const, icon: '💣', name: 'Bomb', color: 'bg-red-500' },
  ];

  return (
    <div className="bg-card/50 backdrop-blur-sm p-2 sm:p-3 space-y-2 sm:space-y-3">
      {/* Active Power-Up Display */}
      {activePowerUp && (
        <div className="space-y-1 sm:space-y-2 animate-fade-in">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-semibold text-primary truncate">
              {powerUps.find(p => p.id === activePowerUp.type)?.icon} {powerUps.find(p => p.id === activePowerUp.type)?.name} Active
            </span>
            <span className="text-muted-foreground ml-2 flex-shrink-0">{Math.ceil(remainingTime / 1000)}s</span>
          </div>
          <Progress value={(remainingTime / activePowerUp.duration) * 100} className="h-1.5 sm:h-2" />
        </div>
      )}

      {/* Power-Up Buttons */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {powerUps.map((powerUp) => {
          const count = inventory[powerUp.id];
          const hasItem = count > 0;
          const isActiveType = activePowerUp?.type === powerUp.id;

          return (
            <div key={powerUp.id} className="relative">
              <Button
                onClick={() => onUsePowerUp(powerUp.id)}
                disabled={disabled || !hasItem || !!activePowerUp}
                variant="outline"
                size="sm"
                className={`w-full h-10 sm:h-12 text-lg sm:text-xl relative touch-manipulation ${isActiveType ? 'border-primary border-2' : ''}`}
                style={{ touchAction: 'manipulation' }}
              >
                {powerUp.icon}
              </Button>
              {hasItem && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-[10px] sm:text-xs"
                >
                  {count}
                </Badge>
              )}
              {!hasItem && (
                <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 bg-muted/50 rounded-full h-3 w-3 sm:h-4 sm:w-4 flex items-center justify-center">
                  <span className="text-[6px] sm:text-[8px] text-muted-foreground/60">0</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PowerUpBar;
