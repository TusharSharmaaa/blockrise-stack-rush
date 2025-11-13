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
    <div className="glass-card p-3 space-y-3 shadow-glow">
      {/* Active Power-Up Display */}
      {activePowerUp && (
        <div className="space-y-2 animate-fade-in glass-card p-3 border border-primary/40 shadow-neon">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-primary drop-shadow-[0_0_6px_hsl(var(--primary))]">
              {powerUps.find(p => p.id === activePowerUp.type)?.icon} {powerUps.find(p => p.id === activePowerUp.type)?.name} Active
            </span>
            <span className="text-muted-foreground font-mono">{Math.ceil(remainingTime / 1000)}s</span>
          </div>
          <Progress value={(remainingTime / activePowerUp.duration) * 100} className="h-2 shadow-neon" />
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
                variant={isActiveType ? "neon" : "outline"}
                size="sm"
                className={`w-full h-12 text-xl transition-all duration-200 ${
                  isActiveType 
                    ? 'animate-pulse-glow scale-105' 
                    : hasItem 
                    ? 'hover:scale-110 hover:shadow-glow' 
                    : 'opacity-50'
                } ${!disabled && hasItem && !activePowerUp ? 'glass-card border-primary/30' : ''}`}
              >
                {powerUp.icon}
              </Button>
              {hasItem && (
                <Badge 
                  variant="neon" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
                >
                  {count}
                </Badge>
              )}
              {!hasItem && (
                <div className="absolute -bottom-1 -right-1 bg-muted/80 backdrop-blur-sm rounded-full h-4 w-4 flex items-center justify-center border border-muted">
                  <span className="text-[8px] text-muted-foreground">0</span>
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
