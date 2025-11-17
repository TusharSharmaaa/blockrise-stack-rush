import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingBag, Coins, Zap, Shield, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useCurrency } from '@/hooks/useCurrency';
import { usePowerUps } from '@/hooks/usePowerUps';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect } from 'react';

const Shop = () => {
  const navigate = useNavigate();
  const { progress, addCoins } = useGameProgress();
  const { formatPrice, isLoading: currencyLoading } = useCurrency();
  const { addPowerUp, inventory, loadInventory } = usePowerUps();

  const coinPacks = [
    { id: 'pack1', coins: 100, priceKey: 'coinPack100' as const, popular: false },
    { id: 'pack2', coins: 500, priceKey: 'coinPack500' as const, popular: true, bonus: 50 },
    { id: 'pack3', coins: 1000, priceKey: 'coinPack1000' as const, popular: false, bonus: 150 },
  ];

  const powerUps = [
    { id: 'slowTime', name: 'Slow Time', description: 'Slows game speed for 30s', icon: '⏱️', price: 100, type: 'slowTime' as const },
    { id: 'clearLine', name: 'Clear Line', description: 'Clear any full line instantly', icon: '✨', price: 150, type: 'clearLine' as const },
    { id: 'shuffle', name: 'Block Shuffle', description: 'Change next 3 blocks', icon: '🔄', price: 75, type: 'shuffle' as const },
    { id: 'bomb', name: 'Bomb', description: 'Clear 3x3 area', icon: '💣', price: 200, type: 'bomb' as const },
  ];

  const premiumItems = [
    { id: 'noads', name: 'Remove Ads', description: 'Remove all ads forever', icon: <Shield className="h-6 w-6" />, priceKey: 'removeAds' as const, popular: true },
    { id: 'premium', name: 'Premium Pass', description: '2x coins, exclusive skins, ad-free', icon: <Star className="h-6 w-6" />, priceKey: 'premium' as const, popular: false },
  ];

  const [isPurchasing, setIsPurchasing] = useState(false);

  // Load inventory on mount
  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handlePurchasePowerUp = async (powerUp: typeof powerUps[0]) => {
    if (isPurchasing) return;
    if (progress.totalCoins < powerUp.price) {
      toast.error('Not enough coins!');
      return;
    }
    setIsPurchasing(true);
    try {
      // Deduct coins
      await addCoins(-powerUp.price);
      // Add power-up to inventory
      await addPowerUp(powerUp.type, 1);
      toast.success(`${powerUp.name} purchased! Added to inventory.`);
    } catch (error) {
      console.error('Failed to purchase power-up:', error);
      toast.error('Failed to purchase power-up. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handlePurchaseIAP = (item: string) => {
    if (isPurchasing) return;
    setIsPurchasing(true);
    toast.info('Opening payment... (Demo mode)');
    setTimeout(() => setIsPurchasing(false), 1000);
  };

  if (currencyLoading) {
    return <div className="h-full bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

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

        {/* Premium Items */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Premium
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {premiumItems.map((item) => (
              <Card key={item.id} className={`p-6 relative ${item.popular ? 'border-2 border-primary' : ''}`}>
                {item.popular && (
                  <Badge className="absolute top-4 right-4 bg-primary">Most Popular</Badge>
                )}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg text-primary">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    <Button
                      onClick={() => handlePurchaseIAP(item.id)}
                      className="w-full mt-4 gradient-primary"
                    >
                      Buy for {formatPrice(item.priceKey)}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Coin Packs */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="h-6 w-6 text-yellow-500" />
            Coin Packs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coinPacks.map((pack) => (
              <Card key={pack.id} className={`p-6 relative ${pack.popular ? 'border-2 border-primary' : ''}`}>
                {pack.popular && (
                  <Badge className="absolute top-4 right-4 bg-primary">Best Value</Badge>
                )}
                <div className="text-center space-y-4">
                  <div className="text-5xl">💰</div>
                  <div>
                    <div className="text-3xl font-bold">{pack.coins}</div>
                    {pack.bonus && (
                      <div className="text-sm text-primary font-semibold">+{pack.bonus} Bonus!</div>
                    )}
                    <div className="text-xs text-muted-foreground">coins</div>
                  </div>
                  <Button
                    onClick={() => handlePurchaseIAP(pack.id)}
                    className="w-full gradient-primary"
                  >
                    {formatPrice(pack.priceKey)}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Power-ups */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-500" />
            Power-ups
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {powerUps.map((powerUp) => {
              const quantity = inventory[powerUp.type] || 0;
              return (
                <Card key={powerUp.id} className="p-4 text-center space-y-3">
                  <div className="text-4xl">{powerUp.icon}</div>
                  <div>
                    <h3 className="font-semibold">{powerUp.name}</h3>
                    <p className="text-xs text-muted-foreground">{powerUp.description}</p>
                    {quantity > 0 && (
                      <Badge variant="secondary" className="mt-1">
                        Owned: {quantity}
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={() => handlePurchasePowerUp(powerUp)}
                    className="w-full"
                    variant="outline"
                    disabled={progress.totalCoins < powerUp.price || isPurchasing}
                  >
                    <Coins className="h-4 w-4 mr-1" />
                    {powerUp.price}
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
