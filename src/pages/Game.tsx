import { useEffect, useState } from 'react';
import GameBoard from '@/components/game/GameBoard';
import GameControls from '@/components/game/GameControls';
import GameHUD from '@/components/game/GameHUD';
import PowerUpBar from '@/components/game/PowerUpBar';
import SyncIndicator from '@/components/game/SyncIndicator';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAdMob } from '@/hooks/useAdMob';
import { useSound } from '@/hooks/useSound';
import { usePowerUps } from '@/hooks/usePowerUps';
import { useAchievements } from '@/hooks/useAchievements';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Button } from '@/components/ui/button';
import { Play, Home, Video, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getRandomBlock } from '@/utils/blockShapes';
import { hapticNotification } from '@/utils/haptics';
import { NotificationType } from '@capacitor/haptics';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Game = () => {
  const navigate = useNavigate();
  const { progress, isLoading, updateGameStats, addCoins, hasCompletedLevel, getScoreRequirement, completeLevel, incrementLevelAttempt } = useGameProgress();
  const { profile } = useUserProfile();
  const { showInterstitial, showRewardedAd, isRewardedLoading } = useAdMob();
  const { playSound, playMusic, stopMusic } = useSound();
  const { usePowerUp, loadInventory } = usePowerUps();
  const { checkAndUnlock } = useAchievements();
  const { submitScore } = useLeaderboard();
  const [hasShownGameOverAd, setHasShownGameOverAd] = useState(false);
  const [previousScore, setPreviousScore] = useState(0);
  const [lastTrackedLevel, setLastTrackedLevel] = useState<number | null>(null);
  const scoreRequirement = getScoreRequirement(progress.currentLevel);
  const {
    gameState,
    setGameState,
    moveLeft,
    moveRight,
    moveDown,
    rotate,
    togglePause,
    resetGame,
    clearLine,
    clearArea
  } = useGameLoop();

  // Track attempts when a level run begins
  useEffect(() => {
    if (isLoading) return;
    if (lastTrackedLevel === progress.currentLevel) return;
    const recordAttempt = async () => {
      await incrementLevelAttempt(progress.currentLevel);
      setLastTrackedLevel(progress.currentLevel);
    };
    recordAttempt();
  }, [isLoading, progress.currentLevel, incrementLevelAttempt, lastTrackedLevel]);

  // Load power-up inventory on mount
  useEffect(() => {
    loadInventory();
    playMusic();
    return () => stopMusic();
  }, []);

  // Track score changes for achievements and level completion
  useEffect(() => {
    if (gameState.score > previousScore) {
      playSound('coin');
      
      // Check score-based achievements and add coin rewards
      const checkAchievement = async (achievementId: string, progress: number) => {
        const result = await checkAndUnlock(achievementId, progress);
        if (result.unlocked && result.achievement) {
          await addCoins(result.achievement.coinReward);
          toast.success(`Achievement Unlocked: ${result.achievement.title}! +${result.achievement.coinReward} coins! 🎉`);
        }
      };

      if (gameState.score >= 1000 && previousScore < 1000) {
        checkAchievement('first_1000', gameState.score);
      }
      if (gameState.score >= 5000 && previousScore < 5000) {
        checkAchievement('score_5000', gameState.score);
      }
      if (gameState.score >= 10000 && previousScore < 10000) {
        checkAchievement('score_10000', gameState.score);
      }

      // Check for level completion and unlock next level
      const checkLevelCompletion = async () => {
        if (hasCompletedLevel(progress.currentLevel, gameState.score)) {
          const nextLevel = progress.currentLevel + 1;
          if (nextLevel <= 50) {
            const unlocked = await completeLevel(progress.currentLevel, gameState.score);
            if (unlocked && !progress.unlockedLevels.includes(nextLevel)) {
              toast.success(`Level ${progress.currentLevel} Completed! Level ${nextLevel} unlocked! 🎉`);
            }
          }
        }
      };
      
      checkLevelCompletion();
    }
    setPreviousScore(gameState.score);
  }, [gameState.score, previousScore, checkAndUnlock, addCoins, hasCompletedLevel, progress.currentLevel, progress.unlockedLevels, completeLevel]);

  // Track level achievements
  useEffect(() => {
    const checkLevelAchievement = async (achievementId: string, progress: number) => {
      const result = await checkAndUnlock(achievementId, progress);
      if (result.unlocked && result.achievement) {
        await addCoins(result.achievement.coinReward);
        toast.success(`Achievement Unlocked: ${result.achievement.title}! +${result.achievement.coinReward} coins! 🎉`);
      }
    };

    if (gameState.level >= 10 && progress.currentLevel >= 10) {
      checkLevelAchievement('reach_level_10', progress.currentLevel);
    }
    if (gameState.level >= 25 && progress.currentLevel >= 25) {
      checkLevelAchievement('reach_level_25', progress.currentLevel);
    }
    if (gameState.level >= 50 && progress.currentLevel >= 50) {
      checkLevelAchievement('level_50', progress.currentLevel);
    }
  }, [gameState.level, progress.currentLevel, checkAndUnlock, addCoins]);

  const handleUsePowerUp = async (type: 'slowTime' | 'clearLine' | 'shuffle' | 'bomb') => {
    const success = await usePowerUp(type, 30000);
    if (!success) {
      toast.error('Power-up not available');
      return;
    }

    playSound('powerup');
    await hapticNotification(NotificationType.Success);

    switch (type) {
      case 'clearLine':
        // Find the lowest full or nearly-full line and clear it
        setGameState(prevState => {
          let targetLine = -1;
          let maxFilled = 0;
          
          for (let i = prevState.grid.length - 1; i >= 0; i--) {
            const filled = prevState.grid[i].filter(cell => cell !== null).length;
            if (filled > maxFilled && filled >= 7) { // Clear if 70% full
              targetLine = i;
              maxFilled = filled;
            }
          }
          
          if (targetLine >= 0) {
            return clearLine(prevState, targetLine);
          }
          return prevState;
        });
        toast.success('Line cleared!');
        break;
      case 'bomb':
        // Clear a 3x3 area around the current block
        setGameState(prevState => {
          if (!prevState.currentBlock) return prevState;
          const centerX = prevState.currentBlock.x + Math.floor(prevState.currentBlock.shape[0].length / 2);
          const centerY = prevState.currentBlock.y + Math.floor(prevState.currentBlock.shape.length / 2);
          return clearArea(prevState, centerX, centerY, 1);
        });
        toast.success('Bomb exploded! Area cleared!');
        break;
      case 'shuffle':
        // Shuffle next blocks
        setGameState(prevState => ({
          ...prevState,
          nextBlock: {
            ...getRandomBlock(),
            x: 0,
            y: 0,
            id: Math.random().toString()
          }
        }));
        toast.success('Next blocks shuffled!');
        break;
      case 'slowTime':
        // Slow down game speed
        setGameState(prevState => ({
          ...prevState,
          speed: prevState.speed * 2
        }));
        // Reset speed after duration
        setTimeout(() => {
          setGameState(prevState => ({
            ...prevState,
            speed: Math.max(100, 1000 - (prevState.level - 1) * 100)
          }));
        }, 30000);
        toast.success('Time slowed for 30s!');
        break;
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState.gameOver || gameState.paused) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          moveLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveRight();
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveDown();
          break;
        case 'ArrowUp':
        case ' ':
          e.preventDefault();
          rotate();
          break;
        case 'p':
        case 'Escape':
          e.preventDefault();
          togglePause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.gameOver, gameState.paused, moveLeft, moveRight, moveDown, rotate, togglePause]);

  // Show ad when game ends
  useEffect(() => {
    if (gameState.gameOver && !hasShownGameOverAd) {
      setHasShownGameOverAd(true);
      
      const handleGameOver = async () => {
        // Check for level completion and unlock next level
        const levelCompleted = hasCompletedLevel(progress.currentLevel, gameState.score);
        if (levelCompleted) {
          const nextLevel = progress.currentLevel + 1;
          if (nextLevel <= 50) {
            await completeLevel(progress.currentLevel, gameState.score);
          }
        }

        // Update stats and sync to backend
        await updateGameStats(gameState.score, progress.currentLevel);
        
        // Trigger sync indicator animation
        window.dispatchEvent(new Event('progressSynced'));
        
        // Submit score to leaderboard if profile exists
        if (profile?.id) {
          await submitScore(profile.id, gameState.score, progress.currentLevel);
          toast.success('Progress saved to cloud! ☁️');
        }

        // Check achievements on game over and add coin rewards
        const checkGameOverAchievements = async () => {
          // First game achievement
          if (progress.totalGamesPlayed === 0) {
            const firstGameResult = await checkAndUnlock('first_game', 1);
            if (firstGameResult.unlocked && firstGameResult.achievement) {
              await addCoins(firstGameResult.achievement.coinReward);
              toast.success(`Achievement Unlocked: ${firstGameResult.achievement.title}! +${firstGameResult.achievement.coinReward} coins! 🎉`);
            }
          }

          // Play 10 games achievement
          const play10GamesResult = await checkAndUnlock('play_10_games', progress.totalGamesPlayed + 1);
          if (play10GamesResult.unlocked && play10GamesResult.achievement) {
            await addCoins(play10GamesResult.achievement.coinReward);
            toast.success(`Achievement Unlocked: ${play10GamesResult.achievement.title}! +${play10GamesResult.achievement.coinReward} coins! 🎉`);
          }

          // Beat high score achievement
          if (gameState.score > progress.highestScore) {
            const highScoreResult = await checkAndUnlock('new_high_score', 1);
            if (highScoreResult.unlocked && highScoreResult.achievement) {
              await addCoins(highScoreResult.achievement.coinReward);
              toast.success(`Achievement Unlocked: ${highScoreResult.achievement.title}! +${highScoreResult.achievement.coinReward} coins! 🎉`);
            }
          }

          // Check streak achievement
          if (progress.dailyStreak >= 7) {
            const streakResult = await checkAndUnlock('streak_7', progress.dailyStreak);
            if (streakResult.unlocked && streakResult.achievement) {
              await addCoins(streakResult.achievement.coinReward);
              toast.success(`Achievement Unlocked: ${streakResult.achievement.title}! +${streakResult.achievement.coinReward} coins! 🎉`);
            }
          }
        };

        await checkGameOverAchievements();
        
        playSound('gameOver');
        stopMusic();
        
        // Show interstitial ad immediately after game over
        showInterstitial();
      };

      handleGameOver();
    }
  }, [gameState.gameOver, gameState.score, progress, profile, hasShownGameOverAd, updateGameStats, submitScore, checkAndUnlock, addCoins, showInterstitial, playSound, stopMusic]);

  const handleContinueWithAd = async () => {
    const result = await showRewardedAd();
    if (result.success) {
      toast.success('Continue playing! You got 50 bonus coins!');
      await addCoins(50);
      playSound('coin');
      resetGame();
      setHasShownGameOverAd(false);
      playMusic();
    } else {
      toast.error('Ad was not completed');
    }
  };

  const handlePlayAgain = async () => {
    await incrementLevelAttempt(progress.currentLevel);
    resetGame();
    setHasShownGameOverAd(false);
    playMusic();
  };

  return (
    <div className="h-full bg-background flex flex-col relative overflow-hidden">
      {/* Sync Indicator */}
      <div className="absolute top-2 right-2 z-50">
        <SyncIndicator profileId={profile?.id} />
      </div>
      
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-hero opacity-50 animate-gradient pointer-events-none" />
      
      <div className="flex-1 flex flex-col relative z-10">
      <GameHUD
        score={gameState.score}
        level={gameState.level}
        nextBlock={gameState.nextBlock}
        onPause={togglePause}
      />
      
      {/* Score Progress Bar */}
      <div className="container-responsive py-2 glass-card border-t border-glass-border shadow-glow">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Level {progress.currentLevel} Target</span>
            <span className="font-semibold text-primary drop-shadow-[0_0_6px_hsl(var(--primary))]">{gameState.score}/{scoreRequirement}</span>
          </div>
          <div className="h-2 bg-muted/30 rounded-full overflow-hidden backdrop-blur-sm border border-primary/20">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 shadow-glow"
              style={{ width: `${Math.min(100, (gameState.score / scoreRequirement) * 100)}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center">
        <GameBoard
          grid={gameState.grid}
          currentBlock={gameState.currentBlock}
        />

        <PowerUpBar
          onUsePowerUp={handleUsePowerUp}
          disabled={gameState.gameOver || gameState.paused}
        />
        
        <div className="safe-bottom pb-4">
          <GameControls
            onRotate={rotate}
            onMoveLeft={moveLeft}
            onMoveRight={moveRight}
            onMoveDown={moveDown}
            disabled={gameState.gameOver || gameState.paused}
          />
        </div>
      </div>
      </div>

      {/* Pause Dialog */}
      <Dialog open={gameState.paused && !gameState.gameOver} onOpenChange={togglePause}>
        <DialogContent className="glass-card border-primary/30 shadow-premium">
          <DialogHeader>
            <DialogTitle className="text-2xl text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]">Game Paused</DialogTitle>
            <DialogDescription className="text-base">
              Take a break! Resume when you're ready.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button onClick={() => navigate('/')} variant="outline" className="glass-card border-primary/20 hover:shadow-glow">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
            <Button onClick={togglePause} variant="premium" className="shadow-glow-lg">
              <Play className="mr-2 h-4 w-4" />
              Resume
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Game Over Dialog */}
      <Dialog open={gameState.gameOver} onOpenChange={() => {}}>
        <DialogContent className="glass-card border-primary/30 shadow-premium">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="h-6 w-6 text-primary drop-shadow-[0_0_12px_hsl(var(--primary))]" />
              <span className="text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]">
                {hasCompletedLevel(progress.currentLevel, gameState.score) ? 'Level Complete! 🎉' : 'Game Over!'}
              </span>
            </DialogTitle>
            <DialogDescription className="text-base">
              You scored {gameState.score} points and reached level {gameState.level}!
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="text-center glass-card p-4 border border-primary/20 shadow-glow">
              <div className="text-5xl font-bold text-primary drop-shadow-[0_0_12px_hsl(var(--primary))] mb-2">{gameState.score}</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Final Score</div>
            </div>
            
            {hasCompletedLevel(progress.currentLevel, gameState.score) ? (
              <div className="glass-card border border-primary/40 p-4 text-center shadow-neon animate-pulse-glow">
                <div className="text-lg font-semibold text-primary drop-shadow-[0_0_8px_hsl(var(--primary))] mb-1">
                  ✨ Level {progress.currentLevel} Completed!
                </div>
                <div className="text-sm text-muted-foreground">
                  Target: {scoreRequirement} | Your Score: {gameState.score}
                </div>
              </div>
            ) : (
              <div className="glass-card border border-muted/30 p-4 text-center">
                <div className="text-sm font-semibold mb-1">
                  Keep trying!
                </div>
                <div className="text-xs text-muted-foreground">
                  Target: {scoreRequirement} | Your Score: {gameState.score}
                </div>
              </div>
            )}

            {gameState.score > progress.highestScore && (
              <div className="text-center text-sm font-semibold text-primary drop-shadow-[0_0_8px_hsl(var(--primary))] animate-pulse">
                🎉 New Personal Best!
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col gap-2">
            <Button 
              onClick={handleContinueWithAd}
              disabled={isRewardedLoading}
              className="w-full shadow-glow-lg"
              variant="premium"
            >
              <Video className="mr-2 h-4 w-4" />
              {isRewardedLoading ? 'Loading...' : 'Watch Ad & Continue (+50 Coins)'}
            </Button>
            <div className="flex gap-2 w-full">
              <Button onClick={() => navigate('/')} variant="outline" className="flex-1 glass-card border-primary/20 hover:shadow-glow">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
              <Button onClick={handlePlayAgain} variant="neon" className="flex-1">
                <Play className="mr-2 h-4 w-4" />
                Play Again
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Game;
