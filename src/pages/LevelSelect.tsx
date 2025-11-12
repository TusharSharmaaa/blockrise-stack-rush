import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock, Play, Star, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useAdMob } from '@/hooks/useAdMob';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const LevelSelect = () => {
  const navigate = useNavigate();
  const { progress, watchAdForLevel, selectLevel, isLoading } = useGameProgress();
  const { showRewardedAd, isRewardedLoading } = useAdMob();

  const handleLevelSelect = async (level: number) => {
    if (progress.unlockedLevels.includes(level)) {
      await selectLevel(level);
      navigate('/game');
    }
  };

  const handleWatchAdToUnlock = async () => {
    const result = await showRewardedAd();
    if (result.success) {
      await watchAdForLevel();
      toast.success(`Progress saved! ${progress.adsRequiredPerLevel - progress.adsWatchedForNextLevel - 1} more ads to unlock next level`);
    } else {
      toast.error('Ad was not completed. Please try again.');
    }
  };

  const getStarsForLevel = (level: number) => {
    // Mock star system based on score achievements
    return Math.min(3, Math.floor(level / 3));
  };

  const nextLevelToUnlock = Math.max(...progress.unlockedLevels) + 1;
  const unlockProgress = (progress.adsWatchedForNextLevel / progress.adsRequiredPerLevel) * 100;

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
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
          <Badge variant="secondary" className="text-lg px-4 py-2">
            💰 {progress.totalCoins}
          </Badge>
        </div>

        {/* Next Level Unlock Card */}
        <div className="bg-card rounded-lg p-6 card-elevated space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Unlock Level {nextLevelToUnlock}</h2>
            <Badge variant="outline">
              {progress.adsWatchedForNextLevel}/{progress.adsRequiredPerLevel} Ads
            </Badge>
          </div>
          <Progress value={unlockProgress} className="h-3" />
          <Button 
            onClick={handleWatchAdToUnlock}
            disabled={isRewardedLoading}
            className="w-full gradient-primary"
          >
            <Video className="mr-2 h-4 w-4" />
            {isRewardedLoading ? 'Loading Ad...' : `Watch Ad to Unlock (${progress.adsRequiredPerLevel - progress.adsWatchedForNextLevel} remaining)`}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Earn 10 coins per ad + 50 bonus coins on unlock!
          </p>
        </div>

        {/* Level Grid */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 20 }, (_, i) => i + 1).map((level) => {
            const isUnlocked = progress.unlockedLevels.includes(level);
            const isCurrent = progress.currentLevel === level;
            const stars = getStarsForLevel(level);

            return (
              <Button
                key={level}
                variant={isCurrent ? "default" : isUnlocked ? "outline" : "ghost"}
                className={`h-24 flex flex-col gap-2 relative ${
                  isCurrent ? 'gradient-primary' : ''
                } ${!isUnlocked ? 'opacity-50' : ''}`}
                onClick={() => handleLevelSelect(level)}
                disabled={!isUnlocked}
              >
                {!isUnlocked && (
                  <Lock className="absolute top-2 right-2 h-4 w-4" />
                )}
                <span className="text-2xl font-bold">{level}</span>
                {isUnlocked && (
                  <div className="flex gap-1">
                    {Array.from({ length: 3 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < stars ? 'fill-yellow-500 text-yellow-500' : 'text-muted'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </Button>
            );
          })}
        </div>

        {/* Info Card */}
        <div className="bg-card rounded-lg p-6 card-elevated">
          <h3 className="font-semibold mb-2">💡 Level System</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• First 3 levels are free to play</li>
            <li>• Watch {progress.adsRequiredPerLevel} ads to unlock each new level</li>
            <li>• Higher levels have faster speed and more challenge</li>
            <li>• Earn bonus coins for unlocking new levels</li>
            <li>• Collect stars based on your performance</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LevelSelect;
