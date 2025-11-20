import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePowerUps } from '@/hooks/usePowerUps';
import { useEffect, useState, memo } from 'react';

interface PowerUpBarProps {
  onUsePowerUp: (type: 'slowTime' | 'clearLine' | 'shuffle' | 'bomb') => void;
  disabled?: boolean;
}

const PowerUpBar = memo(({ onUsePowerUp, disabled }: PowerUpBarProps) => {
  const { inventory, activePowerUps, getRemainingTime } = usePowerUps();
  const [, forceRefresh] = useState(0);

  useEffect(() => {
    if (Object.keys(activePowerUps).length === 0) return;
    const interval = setInterval(() => {
      forceRefresh(Date.now());
    }, 100);
    return () => clearInterval(interval);
  }, [activePowerUps]);

  const powerUps = [
    { id: 'slowTime' as const, icon: '⏱️', name: 'Slow Time', color: 'bg-blue-500' },
    { id: 'clearLine' as const, icon: '✨', name: 'Clear Line', color: 'bg-purple-500' },
    { id: 'shuffle' as const, icon: '🔄', name: 'Shuffle', color: 'bg-green-500' },
    { id: 'bomb' as const, icon: '💣', name: 'Bomb', color: 'bg-red-500' },
  ];

  return (
    <div className="glass-card py-2 px-3 space-y-2 shadow-glow">
      {/* Active Power-Up Display */}
      {Object.entries(activePowerUps).length > 0 && (
        <div className="space-y-1.5 animate-fade-in glass-card p-2 border border-primary/40 shadow-neon">
          {Object.entries(activePowerUps).map(([type, active]) => {
            if (!active) return null;
            const remainingTime = getRemainingTime(type as keyof typeof inventory);
            const powerUpMeta = powerUps.find(p => p.id === type);
            if (!powerUpMeta) return null;
            return (
              <div key={`${type}-${active.startTime}`} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-primary drop-shadow-[0_0_6px_hsl(var(--primary))]">
                    {powerUpMeta.icon} {powerUpMeta.name} Active
                  </span>
                  <span className="text-muted-foreground font-mono">{Math.max(0, Math.ceil(remainingTime / 1000))}s</span>
                </div>
                <Progress value={(remainingTime / active.duration) * 100} className="h-2 shadow-neon" />
              </div>
            );
          })}
        </div>
      )}

      {/* Power-Up Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {powerUps.map((powerUp) => {
          const count = inventory[powerUp.id];
          const hasItem = count > 0;
          const isActiveType = Boolean(activePowerUps[powerUp.id]);

          return (
            <div key={powerUp.id} className="relative">
              <Button
                onClick={() => onUsePowerUp(powerUp.id)}
                disabled={disabled || !hasItem || isActiveType}
                variant={isActiveType ? "neon" : "outline"}
                size="sm"
                className={`w-full h-12 text-xl transition-all duration-200 ${
                  isActiveType 
                    ? 'animate-pulse-glow scale-105' 
                    : hasItem 
                    ? 'hover:scale-110 hover:shadow-glow' 
                    : 'opacity-50'
                } ${hasItem ? 'brightness-110' : ''} ${
                  !disabled && hasItem && !isActiveType ? 'glass-card border-primary/30' : ''
                }`}
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
});

PowerUpBar.displayName = 'PowerUpBar';

export default PowerUpBar;
