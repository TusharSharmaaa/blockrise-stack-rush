import { Button } from '@/components/ui/button';
import { ArrowLeft, Gift, Calendar, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useBackButton } from '@/hooks/useBackButton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { useAdMob } from '@/hooks/useAdMob';

const DailyRewards = () => {
  const navigate = useNavigate();
  useBackButton(); // Handle Android back button
  const { progress, claimDailyReward } = useGameProgress();
  const [isClaiming, setIsClaiming] = useState(false);
  const { showRewardedAd, isRewardedLoading } = useAdMob();

  const handleClaimReward = async () => {
    if (isClaiming) return;
    setIsClaiming(true);
    try {
      const reward = await claimDailyReward();
      if (reward > 0) {
        toast.success(`Claimed ${reward} coins! Keep your streak going!`);
        const adResult = await showRewardedAd();
        if (!adResult.success) {
          toast.info('Claimed reward! Ad was skipped or failed to load.');
        }
      } else {
        toast.info('Already claimed today. Come back tomorrow!');
      }
    } finally {
      setIsClaiming(false);
    }
  };

  const streakRewards = [50, 60, 70, 80, 90, 100, 120];

  return (
    <ScrollArea className="h-full">
      <div className="min-h-full bg-background relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-hero opacity-50 animate-gradient pointer-events-none" />
        
        <div className="container-responsive space-y-4 sm:space-y-6 relative z-10 py-4 sm:py-6 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-3xl font-bold">Daily Rewards</h1>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            💰 {progress.totalCoins}
          </Badge>
        </div>

        {/* Current Streak */}
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg p-6 card-elevated text-center">
          <Zap className="h-12 w-12 mx-auto mb-3 text-primary" />
          <h2 className="text-3xl font-bold mb-2">{progress.dailyStreak} Day Streak</h2>
          <p className="text-muted-foreground">Keep playing daily to maintain your streak!</p>
        </div>

        {/* Claim Button */}
        <Button
          onClick={handleClaimReward}
          disabled={progress.hasClaimedDailyReward || isClaiming || isRewardedLoading}
          className="w-full h-16 text-lg gradient-primary"
        >
          <Gift className="mr-2 h-5 w-5" />
          {progress.hasClaimedDailyReward
            ? 'Claimed Today'
            : isRewardedLoading
            ? 'Loading reward ad...'
            : 'Claim Daily Reward'}
        </Button>

        {/* Streak Rewards */}
        <div className="bg-card rounded-lg p-6 card-elevated space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Streak Rewards
          </h3>
          <div className="space-y-3">
            {streakRewards.map((reward, index) => {
              const day = index + 1;
              const isCurrentDay = progress.dailyStreak === day;
              const isPastDay = progress.dailyStreak > day;

              return (
                <div
                  key={day}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isCurrentDay
                      ? 'bg-primary/20 border-2 border-primary'
                      : isPastDay
                      ? 'bg-muted/50'
                      : 'bg-muted/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isPastDay ? (
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground text-lg">✓</span>
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="font-bold">{day}</span>
                      </div>
                    )}
                    <span className="font-medium">Day {day}</span>
                  </div>
                  <Badge variant={isCurrentDay ? "default" : "outline"}>
                    {reward} coins
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bonus Info */}
        <div className="bg-card rounded-lg p-6 card-elevated">
          <h3 className="font-semibold mb-2">🎁 Bonus Tips</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Base reward: 50 coins daily</li>
            <li>• Streak bonus: +10 coins per consecutive day</li>
            <li>• Miss a day and your streak resets</li>
            <li>• Week 7+ gives maximum 120 coins daily!</li>
          </ul>
        </div>
      </div>
    </div>
    </ScrollArea>
  );
};

export default DailyRewards;
