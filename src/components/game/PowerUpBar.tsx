import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePowerUps } from '@/hooks/usePowerUps';
import { useEffect, useState, useRef } from 'react';
import { Clock, Sparkles, Shuffle, Bomb } from 'lucide-react';

interface PowerUpBarProps {
  onUsePowerUp: (type: 'slowTime' | 'clearLine' | 'shuffle' | 'bomb') => void;
  disabled?: boolean;
}

const PowerUpBar = ({ onUsePowerUp, disabled }: PowerUpBarProps) => {
  const { inventory, activePowerUp, getRemainingTime, hasPowerUp, loadInventory } = usePowerUps();
  const [remainingTime, setRemainingTime] = useState(0);
  const prevActivePowerUpRef = useRef(activePowerUp);

  // Reload inventory on mount to ensure it's up to date
  useEffect(() => {
    loadInventory();
    
    // Listen for inventory changes from other components (e.g., when power-up is used)
    const handleInventoryChange = () => {
      loadInventory();
    };
    
    window.addEventListener('powerUpInventoryChanged', handleInventoryChange);
    
    return () => {
      window.removeEventListener('powerUpInventoryChanged', handleInventoryChange);
    };
  }, [loadInventory]);

  // Reload inventory when activePowerUp changes from a value to null (power-up expired)
  useEffect(() => {
    if (prevActivePowerUpRef.current && !activePowerUp) {
      // Power-up was active and is now null (expired or cleared)
      loadInventory();
    }
    prevActivePowerUpRef.current = activePowerUp;
  }, [activePowerUp, loadInventory]);

  useEffect(() => {
    if (activePowerUp) {
      const interval = setInterval(() => {
        const time = getRemainingTime();
        setRemainingTime(time);
        if (time <= 0) {
          clearInterval(interval);
          // Reload inventory when power-up expires to ensure count is updated
          loadInventory();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [activePowerUp, getRemainingTime, loadInventory]);

  const powerUps = [
    { 
      id: 'slowTime' as const, 
      icon: Clock, 
      name: 'Slow Time', 
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    { 
      id: 'clearLine' as const, 
      icon: Sparkles, 
      name: 'Clear Line', 
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    { 
      id: 'shuffle' as const, 
      icon: Shuffle, 
      name: 'Shuffle', 
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    { 
      id: 'bomb' as const, 
      icon: Bomb, 
      name: 'Bomb', 
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30'
    },
  ];

  return (
    <div className="bg-card/50 backdrop-blur-sm p-2 sm:p-3 space-y-2 sm:space-y-3">
      {/* Active Power-Up Display */}
      {activePowerUp && (() => {
        const activePowerUpData = powerUps.find(p => p.id === activePowerUp.type);
        const IconComponent = activePowerUpData?.icon;
        return (
          <div className="space-y-1 sm:space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-semibold text-primary truncate flex items-center gap-1.5">
                {IconComponent && <IconComponent className="h-4 w-4" />}
                {activePowerUpData?.name} Active
              </span>
              <span className="text-muted-foreground ml-2 flex-shrink-0">{Math.ceil(remainingTime / 1000)}s</span>
            </div>
            <Progress value={(remainingTime / activePowerUp.duration) * 100} className="h-1.5 sm:h-2" />
          </div>
        );
      })()}

      {/* Power-Up Buttons */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {powerUps.map((powerUp) => {
          const count = inventory[powerUp.id];
          const hasItem = count > 0;
          const isActiveType = activePowerUp?.type === powerUp.id;
          const IconComponent = powerUp.icon;

          return (
            <div key={powerUp.id} className="relative">
              <Button
                onClick={() => onUsePowerUp(powerUp.id)}
                disabled={disabled || !hasItem || !!activePowerUp}
                variant="outline"
                size="sm"
                className={`w-full h-10 sm:h-12 relative touch-manipulation ${isActiveType ? 'border-primary border-2' : ''} ${powerUp.bgColor} ${!hasItem ? 'opacity-50' : ''}`}
                style={{ touchAction: 'manipulation' }}
              >
                <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 ${powerUp.color}`} />
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
