import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingBag, Coins, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameProgress } from '@/hooks/useGameProgress';
import { usePowerUps } from '@/hooks/usePowerUps';
import { useBackButton } from '@/hooks/useBackButton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface PowerUpItem {
  id: keyof ReturnType<typeof usePowerUps>['inventory'];
  name: string;
  icon: string;
  description: string;
  price: number;
  color: string;
}

const POWER_UPS: PowerUpItem[] = [
  {
    id: 'slowTime',
    name: 'Slow Time',
    icon: '⏱️',
    description: 'Slow down the game speed for 30 seconds',
    price: 150,
    color: 'bg-blue-500'
  },
  {
    id: 'clearLine',
    name: 'Clear Line',
    icon: '✨',
    description: 'Instantly clear the bottom line',
    price: 200,
    color: 'bg-purple-500'
  },
  {
    id: 'shuffle',
    name: 'Shuffle',
    icon: '🔄',
    description: 'Shuffle the current block',
    price: 100,
    color: 'bg-green-500'
  },
  {
    id: 'bomb',
    name: 'Bomb',
    icon: '💣',
    description: 'Clear a 3x3 area around the block',
    price: 250,
    color: 'bg-red-500'
  }
];

const Shop = () => {
  const navigate = useNavigate();
  useBackButton(); // Handle Android back button
  const { progress, addCoins, isLoading } = useGameProgress();
  const { inventory, addPowerUp, loadInventory } = usePowerUps();
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [localProgress, setLocalProgress] = useState(progress);

  // Sync local progress with hook progress
  useEffect(() => {
    setLocalProgress(progress);
  }, [progress]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handlePurchase = async (powerUp: PowerUpItem) => {
    if (isPurchasing) return;
    
    // Use local progress for immediate UI update
    if (localProgress.totalCoins < powerUp.price) {
      toast.error(`Not enough coins! You need ${powerUp.price} coins.`);
      return;
    }

    setIsPurchasing(powerUp.id);
    try {
      // Update local progress immediately for UI responsiveness
      const newCoins = localProgress.totalCoins - powerUp.price;
      setLocalProgress({ ...localProgress, totalCoins: newCoins });
      
      // Deduct coins (this will update the actual progress state)
      await addCoins(-powerUp.price);
      
      // Add power-up to inventory
      await addPowerUp(powerUp.id, 1);
      
      // Reload inventory to ensure it's up to date
      await loadInventory();
      
      toast.success(`Purchased ${powerUp.name}! Check your inventory during gameplay.`);
    } catch (error) {
      console.error('Purchase error:', error);
      // Revert local progress on error
      setLocalProgress(progress);
      toast.error('Failed to purchase. Please try again.');
    } finally {
      setIsPurchasing(null);
    }
  };

  const handleBulkPurchase = async (powerUp: PowerUpItem, quantity: number) => {
    const totalPrice = powerUp.price * quantity;
    
    // Use local progress for immediate UI update
    if (localProgress.totalCoins < totalPrice) {
      toast.error(`Not enough coins! You need ${totalPrice} coins.`);
      return;
    }

    setIsPurchasing(powerUp.id);
    try {
      // Update local progress immediately for UI responsiveness
      const newCoins = localProgress.totalCoins - totalPrice;
      setLocalProgress({ ...localProgress, totalCoins: newCoins });
      
      // Deduct coins (this will update the actual progress state)
      await addCoins(-totalPrice);
      
      // Add power-ups to inventory
      await addPowerUp(powerUp.id, quantity);
      
      // Reload inventory to ensure it's up to date
      await loadInventory();
      
      toast.success(`Purchased ${quantity}x ${powerUp.name}!`);
    } catch (error) {
      console.error('Purchase error:', error);
      // Revert local progress on error
      setLocalProgress(progress);
      toast.error('Failed to purchase. Please try again.');
    } finally {
      setIsPurchasing(null);
    }
  };

  return (
    <ScrollArea className="h-screen">
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-md mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <h1 className="text-3xl font-bold">Shop</h1>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Coins className="h-4 w-4 mr-1" />
              {localProgress.totalCoins}
            </Badge>
          </div>

          {/* Info Card */}
          <Card className="p-4 bg-gradient-to-br from-primary/20 to-primary/5 card-elevated">
            <div className="flex items-start gap-3">
              <ShoppingBag className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Power-Up Shop</h3>
                <p className="text-sm text-muted-foreground">
                  Purchase power-ups to help you during gameplay. Use them strategically to beat high scores!
                </p>
              </div>
            </div>
          </Card>

          {/* Power-Up Items */}
          <div className="space-y-4">
            {POWER_UPS.map((powerUp) => {
              const owned = inventory[powerUp.id];
              const canAfford = localProgress.totalCoins >= powerUp.price;
              const isPurchasingItem = isPurchasing === powerUp.id;

              return (
                <Card key={powerUp.id} className="p-4 sm:p-6 card-elevated">
                  <div className="space-y-4">
                    {/* Power-Up Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`${powerUp.color} rounded-lg p-3 text-2xl`}>
                          {powerUp.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{powerUp.name}</h3>
                          <p className="text-sm text-muted-foreground">{powerUp.description}</p>
                        </div>
                      </div>
                      {owned > 0 && (
                        <Badge variant="secondary" className="text-sm">
                          {owned} owned
                        </Badge>
                      )}
                    </div>

                    {/* Price and Purchase */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-yellow-500" />
                        <span className="text-lg font-bold">{powerUp.price}</span>
                        <span className="text-sm text-muted-foreground">coins</span>
                      </div>
                      
                      <div className="flex gap-2">
                        {/* Single Purchase */}
                        <Button
                          onClick={() => handlePurchase(powerUp)}
                          disabled={!canAfford || isPurchasingItem}
                          variant={canAfford ? "default" : "outline"}
                          size="sm"
                          className="gradient-primary"
                        >
                          {isPurchasingItem ? '...' : 'Buy 1'}
                        </Button>
                        
                        {/* Bulk Purchase (5x) */}
                        {canAfford && localProgress.totalCoins >= powerUp.price * 5 && (
                          <Button
                            onClick={() => handleBulkPurchase(powerUp, 5)}
                            disabled={isPurchasingItem}
                            variant="outline"
                            size="sm"
                          >
                            Buy 5
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* How to Use Info */}
          <Card className="p-4 bg-card card-elevated">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-primary mt-1" />
              <div>
                <h3 className="font-semibold mb-2">How to Use Power-Ups</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Power-ups appear in your inventory during gameplay</li>
                  <li>• Tap a power-up button to activate it</li>
                  <li>• Only one power-up can be active at a time</li>
                  <li>• Power-ups are consumed when used</li>
                  <li>• Earn coins by watching ads, daily rewards, and achievements!</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Ways to Earn Coins */}
          <Card className="p-4 bg-gradient-to-br from-accent/20 to-accent/5 card-elevated">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              Ways to Earn Coins
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Watch ads: 10-75 coins per ad</li>
              <li>• Daily rewards: 50-120 coins (based on streak)</li>
              <li>• Complete achievements: 50-500 coins</li>
              <li>• Unlock levels: 50 bonus coins</li>
            </ul>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
};

export default Shop;

