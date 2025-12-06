import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, X, Zap } from 'lucide-react';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useAdMob } from '@/hooks/useAdMob';
import { toast } from 'sonner';

const STORAGE_KEY = 'blockrise_daily_reward_dismissed';
const COOLDOWN_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

const DailyRewardPopup = () => {
  const { progress, isLoading, claimDailyReward } = useGameProgress();
  const { showRewardedAd, isRewardedLoading } = useAdMob();
  const [isOpen, setIsOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Check if popup was dismissed recently (within cooldown period)
  const wasDismissedRecently = (): boolean => {
    if (typeof localStorage === 'undefined') return false;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return false;
      
      const dismissalTime = parseInt(stored, 10);
      if (isNaN(dismissalTime)) return false;
      
      const timeSinceDismissal = Date.now() - dismissalTime;
      // If dismissed within cooldown period, don't show
      return timeSinceDismissal < COOLDOWN_TIME;
    } catch {
      return false;
    }
  };

  // Mark popup as dismissed with timestamp (for "Maybe Later")
  const markDismissed = () => {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to save dismissal state:', error);
    }
  };

  // Clear dismissal (when reward is claimed, we don't need this)
  const clearDismissal = () => {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear dismissal state:', error);
    }
  };

  // Show popup when game opens and daily reward is not claimed
  useEffect(() => {
    // If already claimed today, never show (handled by hasClaimedDailyReward)
    // If dismissed recently (Maybe Later), don't show until cooldown expires
    if (!isLoading && !progress.hasClaimedDailyReward && !wasDismissedRecently()) {
      // Small delay to ensure smooth UI transition
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
    }
  }, [isLoading, progress.hasClaimedDailyReward]);

  const handleClaimReward = async () => {
    if (isClaiming || progress.hasClaimedDailyReward) return;
    
    setIsClaiming(true);
    try {
      const adResult = await showRewardedAd();
      if (!adResult.success) {
        toast.error('You must watch the full ad to claim your reward.');
        setIsClaiming(false);
        return;
      }

      const rewardResult = await claimDailyReward({ adVerified: true });
      if (rewardResult.success && rewardResult.reward > 0) {
        toast.success(`🎉 Claimed ${rewardResult.reward} coins! Keep your streak going!`);
        setIsOpen(false);
        // Clear any dismissal state since reward was claimed
        // hasClaimedDailyReward will prevent showing again today
        clearDismissal();
      } else {
        toast.info(rewardResult.message || 'Already claimed today. Come back tomorrow!');
        setIsOpen(false);
        // Clear dismissal since already claimed (hasClaimedDailyReward handles it)
        clearDismissal();
      }
    } catch (error) {
      console.error('Failed to claim daily reward:', error);
      toast.error('Unable to claim reward. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Mark as dismissed with timestamp for "Maybe Later" - can show again after cooldown
    markDismissed();
  };

  // Calculate reward amount
  const baseReward = 50;
  const streakBonus = (progress.dailyStreak || 1) * 10;
  const totalReward = baseReward + streakBonus;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // User closed the dialog (via X button or outside click) - treat as "Maybe Later"
      markDismissed();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="relative">
              <Gift className="h-16 w-16 text-primary animate-pulse" />
              <Zap className="h-8 w-8 text-yellow-400 absolute -top-1 -right-1 animate-bounce" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            Daily Reward Available! 🎁
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            Watch a short video to claim your daily coins!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Streak Info */}
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">Day {progress.dailyStreak || 1} Streak</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Keep opening daily to increase your streak!
            </p>
          </div>

          {/* Reward Amount */}
          <div className="bg-card rounded-lg p-4 border-2 border-primary/30">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">You'll receive:</p>
              <p className="text-3xl font-bold text-primary">
                {totalReward} <span className="text-xl">💰</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Base: {baseReward} + Streak Bonus: {streakBonus}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
            disabled={isClaiming || isRewardedLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Maybe Later
          </Button>
          <Button
            onClick={handleClaimReward}
            disabled={progress.hasClaimedDailyReward || isClaiming || isRewardedLoading}
            className="w-full sm:w-auto gradient-primary"
          >
            <Gift className="mr-2 h-4 w-4" />
            {isRewardedLoading
              ? 'Loading ad...'
              : isClaiming
              ? 'Claiming...'
              : 'Claim Reward'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DailyRewardPopup;

