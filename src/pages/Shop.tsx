import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingBag, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameProgress } from '@/hooks/useGameProgress';
import { usePowerUps } from '@/hooks/usePowerUps';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect } from 'react';

const Shop = () => {
  const navigate = useNavigate();
  const { progress, addCoins } = useGameProgress();
  const { addPowerUp, inventory, loadInventory } = usePowerUps();

  const powerPacks = [
    { id: 'slowTime', name: 'Slow Time', description: 'Slows game speed for 30s', icon: '⏱️', price: 100, type: 'slowTime' as const },
    { id: 'clearLine', name: 'Clear Line', description: 'Clear any full line instantly', icon: '✨', price: 150, type: 'clearLine' as const },
    { id: 'shuffle', name: 'Block Shuffle', description: 'Change next 3 blocks', icon: '🔄', price: 75, type: 'shuffle' as const },
    { id: 'bomb', name: 'Bomb', description: 'Clear 3x3 area', icon: '💣', price: 200, type: 'bomb' as const },
  ];

  const [isPurchasing, setIsPurchasing] = useState(false);

  // Load inventory on mount
  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handlePurchasePowerPack = async (powerPack: typeof powerPacks[0]) => {
    if (isPurchasing) return;
    if (progress.totalCoins < powerPack.price) {
      toast.error('Not enough coins!');
      return;
    }
    setIsPurchasing(true);
    try {
      // Deduct coins
      await addCoins(-powerPack.price);
      // Add power-up to inventory
      await addPowerUp(powerPack.type, 1);
      toast.success(`${powerPack.name} purchased! Added to inventory.`);
    } catch (error) {
      console.error('Failed to purchase power-up:', error);
      toast.error('Failed to purchase power-up. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="min-h-full bg-background relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-hero opacity-50 animate-gradient pointer-events-none" />
        
        <div className="container-responsive space-y-4 sm:space-y-6 relative z-10 py-4 sm:py-6 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Shop</h1>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            💰 {progress.totalCoins}
          </Badge>
        </div>

        {/* Power Packs */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-500" />
            Power Packs
          </h2>
          <div className="flex flex-col gap-4">
            {powerPacks.map((powerPack) => {
              const quantity = inventory[powerPack.type] || 0;
              return (
                <Card key={powerPack.id} className="p-6 flex items-center gap-4">
                  <div className="text-4xl">{powerPack.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{powerPack.name}</h3>
                    <p className="text-sm text-muted-foreground">{powerPack.description}</p>
                    {quantity > 0 && (
                      <Badge variant="secondary" className="mt-2 w-fit">
                        Owned: {quantity}
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={() => handlePurchasePowerPack(powerPack)}
                    variant="outline"
                    disabled={progress.totalCoins < powerPack.price || isPurchasing}
                    className="min-w-[120px]"
                  >
                    💰 {powerPack.price}
                  </Button>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
    </ScrollArea>
  );
};

export default Shop;
