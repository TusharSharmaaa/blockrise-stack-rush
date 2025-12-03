import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock, Star, Video, Target, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useAdMob } from '@/hooks/useAdMob';
import { useBackButton } from '@/hooks/useBackButton';
import { useTheme } from '@/components/ThemeProvider';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import FeaturePromoPopup from '@/components/FeaturePromoPopup';
import { useFeaturePromoPopup } from '@/hooks/useFeaturePromoPopup';

const LevelSelect = () => {
  const navigate = useNavigate();
  const { progress, watchAdForLevel, watchAdToCompleteLevel, selectLevel, isLoading, canWatchAdToday, getScoreRequirement, getLevelBestScore, getStarsForLevel } = useGameProgress();
  const selectedLevel = progress.selectedLevel ?? progress.currentLevel;
  
  // Debug logging
  useEffect(() => {
    console.log('🎮 LevelSelect progress updated:', {
      adsWatchedForNextLevel: progress.adsWatchedForNextLevel,
      adsWatchedForUnlockCountToday: progress.adsWatchedForUnlockCountToday,
      maxAdsForUnlockPerDay: progress.maxAdsForUnlockPerDay,
      adsRequiredPerLevel: progress.adsRequiredPerLevel
    });
  }, [progress.adsWatchedForNextLevel, progress.adsWatchedForUnlockCountToday, progress.maxAdsForUnlockPerDay, progress.adsRequiredPerLevel]);
  const { showRewardedAd, isRewardedLoading } = useAdMob();
  const { theme, resolvedTheme } = useTheme();
  useBackButton(); // Handle Android back button

  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const { isOpen, variant, onClose } = useFeaturePromoPopup('level', false);
  
  const handleWatchAdToClearLevel = async () => {
    if (isWatchingAd) return;
    setIsWatchingAd(true);
    try {
      const adResult = await showRewardedAd();
      if (!adResult.success) {
        toast.error('Ad was not completed. Please try again.');
        return;
      }
      // Use the selected level or current level
      const levelToClear = selectedLevel;
      const result = await watchAdToCompleteLevel(levelToClear, 0);
      if (result.success) {
        toast.success(`🎉 Level ${levelToClear} cleared! You can now proceed.`);
      } else {
        toast.error(result.message || 'Failed to clear level.');
      }
    } catch (error) {
      console.error('Failed to watch ad for level clear:', error);
      toast.error('Something went wrong.');
    } finally {
      setIsWatchingAd(false);
    }
  };
  
  // Check if we're in light theme (handles 'system' theme too)
  const isLightTheme = resolvedTheme === 'light' || (theme === 'light');

  const handleLevelSelect = async (level: number) => {
    if (progress.unlockedLevels.includes(level)) {
      await selectLevel(level);
      navigate('/game');
    }
  };

  const handleWatchAdToUnlock = async () => {
    if (isWatchingAd) return;

    if (nextLevelToUnlock <= 2) {
      toast.info('Complete Level 1 to unlock Level 2 without watching ads.');
      return;
    }

    if (!canUnlockLevelToday) {
      toast.error('Daily level unlock limit reached! Come back tomorrow.');
      return;
    }

    // Check unlock-specific ad limit (6 ads per day for unlocking)
    if (progress.adsWatchedForUnlockCountToday >= progress.maxAdsForUnlockPerDay) {
      toast.error('Daily ad limit for unlocking reached! Come back tomorrow.');
      return;
    }

    setIsWatchingAd(true);

    try {
      const adResult = await showRewardedAd();
      if (!adResult.success) {
        toast.error('Ad was not completed. Please try again.');
        return;
      }

      const result = await watchAdForLevel();
      if (!result.success) {
        toast.error(result.message || 'Cannot unlock level');
        return;
      }

      if (result.levelUnlocked) {
        toast.success(`🎉 Level ${result.level} unlocked! +50 coins!`);
      } else {
        toast.success(`Progress saved! ${result.adsRemaining} ads to go. +10 coins!`);
      }
    } catch (error) {
      console.error('Failed to unlock level via ads:', error);
      toast.error('Something went wrong while unlocking the level.');
    } finally {
      setIsWatchingAd(false);
    }
  };

  // Use getStarsForLevel from progress hook instead of calculating here

  const nextLevelToUnlock = Math.max(...progress.unlockedLevels) + 1;
  const unlockProgress = (progress.adsWatchedForNextLevel / progress.adsRequiredPerLevel) * 100;
  const adsRemaining = Math.max(progress.adsRequiredPerLevel - progress.adsWatchedForNextLevel, 0);
  
  // Check if user can unlock more levels via ads today
  const canUnlockLevelToday = progress.adsWatchedForUnlockToday < 2;
  const canUseAdUnlock = nextLevelToUnlock >= 3;

  if (isLoading) {
    return <div className="h-full bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <>
      <FeaturePromoPopup 
        variant={variant} 
        isOpen={isOpen} 
        onClose={onClose}
        onAction={variant === 'watch-ad-clear-level' ? handleWatchAdToClearLevel : undefined}
      />
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
            <h1 className="text-3xl font-bold">Select Level</h1>
          </div>
          <Badge variant="secondary" className={`text-lg px-4 py-2 ${isLightTheme ? 'text-white' : ''}`}>
            💰 {progress.totalCoins}
          </Badge>
        </div>

        {/* Level 2 reminder */}
        {nextLevelToUnlock === 2 && (
          <div className="bg-card rounded-lg p-6 card-elevated space-y-3">
            <h2 className="text-xl font-semibold">Unlock Level 2</h2>
            <p className="text-muted-foreground text-sm">
              Beat Level 1&apos;s target score ({getScoreRequirement(1)} points) to unlock Level 2 automatically. Ads are only needed for Level 3 and above.
            </p>
          </div>
        )}

        {/* Next Level Unlock Card */}
        {canUseAdUnlock && nextLevelToUnlock <= 100 && (
          <div className="bg-card rounded-lg p-6 card-elevated space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Unlock Level {nextLevelToUnlock}</h2>
              <span className="text-sm font-semibold text-muted-foreground">
                {progress.adsWatchedForNextLevel}/{progress.adsRequiredPerLevel} Ads
              </span>
            </div>

            <div className="space-y-2">
              <Progress value={unlockProgress} className="h-3" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ads watched today:</span>
                <Badge variant="outline">
                  {progress.adsWatchedForUnlockCountToday}/{progress.maxAdsForUnlockPerDay}
                </Badge>
              </div>
            </div>

            <Button 
              onClick={handleWatchAdToUnlock}
              disabled={
                isRewardedLoading ||
                isWatchingAd ||
                progress.adsWatchedForUnlockCountToday >= progress.maxAdsForUnlockPerDay ||
                !canUnlockLevelToday
              }
              className="w-full gradient-primary"
            >
              <Video className="mr-2 h-4 w-4" />
              {isWatchingAd
                ? 'Watching ad...'
                : isRewardedLoading
                  ? 'Loading Ad...'
                  : !canUnlockLevelToday
                    ? 'Daily Level Unlock Limit Reached (2/2)'
                    : progress.adsWatchedForUnlockCountToday >= progress.maxAdsForUnlockPerDay
                      ? 'Daily Ad Limit Reached (6/6)'
                      : `Watch Ad to Unlock (${adsRemaining} remaining)`}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Earn 10 coins per ad and a 50-coin bonus when the level unlocks.
            </p>
          </div>
        )}

        {/* Level Grid */}
        <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
          {Array.from({ length: 100 }, (_, i) => i + 1).map((level) => {
            const isUnlocked = progress.unlockedLevels.includes(level);
            const isCurrent = selectedLevel === level;
            const stars = getStarsForLevel(level);
            const scoreReq = getScoreRequirement(level);
            const bestScore = getLevelBestScore(level);

            return (
              <div key={level} className="relative">
                <Button
                  variant={isCurrent ? "default" : isUnlocked ? "outline" : "ghost"}
                  className={`w-full h-20 flex flex-col gap-1 relative ${
                    isCurrent ? 'gradient-primary border-2' : ''
                  } ${!isUnlocked ? 'opacity-40' : ''}`}
                  onClick={() => handleLevelSelect(level)}
                  disabled={!isUnlocked}
                >
                  {!isUnlocked && (
                    <Lock className="absolute top-1 right-1 h-3 w-3" />
                  )}
                  {isCurrent && (
                    <Trophy className="absolute top-1 right-1 h-3 w-3" />
                  )}
                  <span className={`text-xl font-bold ${isCurrent && isLightTheme ? 'text-white' : ''}`}>{level}</span>
                  {isUnlocked && (
                    <div className="flex gap-0.5">
                      {Array.from({ length: 3 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-2.5 w-2.5 ${
                            isCurrent && isLightTheme
                              ? (i < stars ? 'fill-white text-white' : 'text-white/50')
                              : (i < stars ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30')
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  {isUnlocked && (
                    <div className={`text-[10px] flex items-center gap-0.5 ${
                      isCurrent && isLightTheme ? 'text-white' : 'text-muted-foreground'
                    }`}>
                      <Target className="h-2 w-2" />
                      {scoreReq}
                    </div>
                  )}
                </Button>
                {isUnlocked && stars > 0 && bestScore > 0 && (
                  <div className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-primary text-[9px] px-1 rounded-full whitespace-nowrap ${
                    isCurrent && isLightTheme ? 'text-white' : 'text-primary-foreground'
                  }`}>
                    {bestScore}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info Card */}
        <div className="bg-card rounded-lg p-6 card-elevated space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Level System</p>
              <h3 className="text-lg font-semibold mt-1">Know the basics</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs font-semibold">Max 2 unlocks/day</Badge>
              <Badge variant="outline" className="text-xs font-semibold">{progress.adsRequiredPerLevel} ads / level</Badge>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
            <div className="space-y-2">
              <p className="text-foreground font-semibold flex items-center gap-2">
                <Video className="h-4 w-4 text-primary" />
                Unlocking
              </p>
              <ul className="space-y-1">
                <li>Level 1 is open. Beat Level 1 to auto-unlock Level 2.</li>
                <li>Level 3+ need {progress.adsRequiredPerLevel} rewarded ads (limit two unlocks a day).</li>
                <li>Ad progress saves—pick up where you left off.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-foreground font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Finishing & stars
              </p>
              <ul className="space-y-1">
                <li>Hit the target score shown on each tile to clear it.</li>
                <li>Unlock via ad: 0★ and no points until you win normally.</li>
                <li>Score clear: 1 try = 3★, 2 tries = 2★, 3+ tries = 1★.</li>
              </ul>
            </div>
          </div>
        </div>
        </div>
      </div>
    </ScrollArea>
    </>
  );
};

export default LevelSelect;
