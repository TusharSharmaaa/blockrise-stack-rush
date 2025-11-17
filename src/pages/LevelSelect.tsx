import { useState } from 'react';
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

const LevelSelect = () => {
  const navigate = useNavigate();
  const { progress, watchAdForLevel, selectLevel, isLoading, canWatchAdToday, getScoreRequirement, getLevelBestScore, getStarsForLevel } = useGameProgress();
  const { showRewardedAd, isRewardedLoading } = useAdMob();
  const { theme, resolvedTheme } = useTheme();
  useBackButton(); // Handle Android back button

  const [isWatchingAd, setIsWatchingAd] = useState(false);
  
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

    if (!canUnlockLevelToday) {
      toast.error('Daily level unlock limit reached! Come back tomorrow.');
      return;
    }

    if (!canWatchAdToday()) {
      toast.error('Daily ad limit reached! Come back tomorrow to unlock more levels.');
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
  const previousLevel = Math.max(1, nextLevelToUnlock - 1);

  if (isLoading) {
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

        {/* Next Level Unlock Card */}
        {nextLevelToUnlock <= 50 && (
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
                  {progress.adsWatchedToday}/{progress.maxAdsPerDay}
                </Badge>
              </div>
            </div>

            <Button 
              onClick={handleWatchAdToUnlock}
              disabled={
                isRewardedLoading ||
                isWatchingAd ||
                !canWatchAdToday() ||
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
                    : !canWatchAdToday()
                      ? 'Daily Ad Limit Reached'
                      : `Watch Ad to Unlock (${adsRemaining} remaining)`}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Earn 10 coins per ad and a 50-coin bonus when the level unlocks.
            </p>
          </div>
        )}

        {/* Level Grid */}
        <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
          {Array.from({ length: 50 }, (_, i) => i + 1).map((level) => {
            const isUnlocked = progress.unlockedLevels.includes(level);
            const isCurrent = progress.currentLevel === level;
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
                {isUnlocked && bestScore > 0 && (
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
        <div className="bg-card rounded-lg p-6 card-elevated space-y-3">
          <h3 className="font-semibold mb-2">💡 Level System</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Level 1</strong> is unlocked initially</li>
            <li>• <strong>Level 2</strong> unlocks automatically when you complete Level 1</li>
            <li>• <strong>Level 3+</strong>: Watch {progress.adsRequiredPerLevel} video ads (one per tap) to unlock each level</li>
            <li>• You can unlock <strong>maximum 2 levels per day</strong> by watching ads</li>
            <li>• Reach target score to complete levels</li>
            <li>• <strong>Star System:</strong></li>
            <li className="ml-4">  - Complete via ad: Always 3★ (no points awarded)</li>
            <li className="ml-4">  - Complete by score: 1 attempt = 3★, 2 attempts = 2★, 3+ attempts = 1★</li>
            <li>• <strong>Note:</strong> Levels unlocked via ads do not award any points until you finish them normally</li>
          </ul>
        </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default LevelSelect;
