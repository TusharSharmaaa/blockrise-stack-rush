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
    <div className="bg-card/50 backdrop-blur-sm p-3 space-y-3">
      {/* Active Power-Up Display */}
      {activePowerUp && (
        <div className="space-y-2 animate-fade-in">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-primary">
              {powerUps.find(p => p.id === activePowerUp.type)?.icon} {powerUps.find(p => p.id === activePowerUp.type)?.name} Active
            </span>
            <span className="text-muted-foreground">{Math.ceil(remainingTime / 1000)}s</span>
          </div>
          <Progress value={(remainingTime / activePowerUp.duration) * 100} className="h-2" />
        </div>
      )}

      {/* Power-Up Buttons */}
      <div className="grid grid-cols-4 gap-2">
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
                className={`w-full h-12 text-xl relative ${isActiveType ? 'border-primary border-2' : ''}`}
              >
                {powerUp.icon}
              </Button>
              {hasItem && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {count}
                </Badge>
              )}
              {!hasItem && (
                <div className="absolute inset-0 bg-background/80 rounded-md flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">0</span>
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
