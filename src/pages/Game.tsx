import { useEffect, useState, useRef } from 'react';
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
import { useBackButton } from '@/hooks/useBackButton';
import { Button } from '@/components/ui/button';
import { Play, Home, Video, Trophy, Star } from 'lucide-react';
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
  useBackButton(); // Handle Android back button
  const { progress, isLoading, updateGameStats, addCoins, hasCompletedLevel, getScoreRequirement, completeLevel, incrementLevelAttempt, selectLevel, getStarsForLevel } = useGameProgress();
  const { profile } = useUserProfile();
  const { showInterstitial, showRewardedAd, isRewardedLoading } = useAdMob();
  const { playSound, playMusic, stopMusic } = useSound();
  const { usePowerUp: activatePowerUp, loadInventory } = usePowerUps();
  const { checkAndUnlock } = useAchievements();
  const { submitScore } = useLeaderboard();
  const [hasShownGameOverAd, setHasShownGameOverAd] = useState(false);
  const [previousScore, setPreviousScore] = useState(0);
  const [lastTrackedLevel, setLastTrackedLevel] = useState<number | null>(null);
  const [activeLevel, setActiveLevel] = useState(progress.currentLevel);
  const slowTimeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoreRequirement = getScoreRequirement(activeLevel);
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
  const hasMetLevelGoal = hasCompletedLevel(activeLevel, gameState.score);
  const hasNextLevel = activeLevel < 50;
  const nextPlayableLevel = hasNextLevel ? activeLevel + 1 : activeLevel;
  const displayLevelReached = hasMetLevelGoal && hasNextLevel ? nextPlayableLevel : Math.max(activeLevel, gameState.level);
  const starsEarned = getStarsForLevel(activeLevel);
  const canStartNextLevel = hasMetLevelGoal && hasNextLevel && progress.unlockedLevels.includes(nextPlayableLevel);

  // Track attempts when a level run begins
  useEffect(() => {
    if (isLoading) return;
    if (gameState.score !== 0 || gameState.gameOver) return;
    if (lastTrackedLevel === progress.currentLevel) return;
    const recordAttempt = async () => {
      await incrementLevelAttempt(progress.currentLevel);
      setLastTrackedLevel(progress.currentLevel);
    };
    recordAttempt();
  }, [isLoading, progress.currentLevel, incrementLevelAttempt, lastTrackedLevel, gameState.score, gameState.gameOver]);

  useEffect(() => {
    if (isLoading) return;
    const isFreshRun = !gameState.gameOver && gameState.score === 0;
    if (isFreshRun && activeLevel !== progress.currentLevel) {
      setActiveLevel(progress.currentLevel);
    }
  }, [isLoading, progress.currentLevel, gameState.gameOver, gameState.score, activeLevel]);

  // Load power-up inventory on mount
  useEffect(() => {
    loadInventory();
    playMusic();
    return () => {
      stopMusic();
      // Clean up slowTime timeout on unmount
      if (slowTimeTimeoutRef.current) {
        clearTimeout(slowTimeTimeoutRef.current);
        slowTimeTimeoutRef.current = null;
      }
    };
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
        const requirement = getScoreRequirement(activeLevel);
        const hasMetGoal = gameState.score >= requirement;
        if (hasMetGoal) {
          const nextLevel = activeLevel + 1;
          if (nextLevel <= 50) {
            const unlocked = await completeLevel(activeLevel, gameState.score);
            if (unlocked && !progress.unlockedLevels.includes(nextLevel)) {
              toast.success(`Level ${activeLevel} Completed! Level ${nextLevel} unlocked! 🎉`);
            }
          }
        }
      };
      
      checkLevelCompletion();
    }
    setPreviousScore(gameState.score);
  }, [gameState.score, previousScore, checkAndUnlock, addCoins, activeLevel, progress.unlockedLevels, completeLevel, getScoreRequirement, playSound]);

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
    const success = await activatePowerUp(type, 30000);
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
        // Clear any existing slowTime timeout
        if (slowTimeTimeoutRef.current) {
          clearTimeout(slowTimeTimeoutRef.current);
          slowTimeTimeoutRef.current = null;
        }
        // Slow down game speed
        setGameState(prevState => ({
          ...prevState,
          speed: prevState.speed * 2
        }));
        // Reset speed after duration using the same formula as game loop
        slowTimeTimeoutRef.current = setTimeout(() => {
          setGameState(prevState => {
            const BASE_SPEED = 1000;
            const SPEED_INCREASE_PER_LEVEL = 100;
            const MIN_SPEED = 100;
            const calculatedSpeed = Math.max(MIN_SPEED, BASE_SPEED - (prevState.level - 1) * SPEED_INCREASE_PER_LEVEL);
            return {
              ...prevState,
              speed: calculatedSpeed
            };
          });
          slowTimeTimeoutRef.current = null;
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
        const requirement = getScoreRequirement(activeLevel);
        const hasMetGoal = gameState.score >= requirement;
        if (hasMetGoal) {
          const nextLevel = activeLevel + 1;
          if (nextLevel <= 50) {
            await completeLevel(activeLevel, gameState.score);
          }
        }

        // Update stats and sync to backend
        await updateGameStats(gameState.score, activeLevel);
        
        // Trigger sync indicator animation
        window.dispatchEvent(new Event('progressSynced'));
        
        // Submit score to leaderboard if profile exists
        const profileId = profile?.id || localStorage.getItem('profileId');
        if (profileId) {
          await submitScore(profileId, gameState.score, progress.currentLevel);
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
  }, [gameState.gameOver, gameState.score, progress, profile, hasShownGameOverAd, updateGameStats, submitScore, checkAndUnlock, addCoins, showInterstitial, playSound, stopMusic, activeLevel, getScoreRequirement, completeLevel]);

  const handleContinueWithAd = async () => {
    const result = await showRewardedAd();
    if (result.success) {
      toast.success('Continue playing! You got 50 bonus coins!');
      await addCoins(50);
      playSound('coin');
      await resetGame(activeLevel);
      setHasShownGameOverAd(false);
      playMusic();
    } else {
      toast.error('Ad was not completed');
    }
  };

  const handlePlayAgain = async () => {
    await incrementLevelAttempt(progress.currentLevel);
    await resetGame(activeLevel);
    setHasShownGameOverAd(false);
    playMusic();
  };

  const handlePlayNextLevel = async () => {
    if (!canStartNextLevel) return;
    await selectLevel(nextPlayableLevel);
    setLastTrackedLevel(null);
    setActiveLevel(nextPlayableLevel);
    await resetGame(nextPlayableLevel);
    setHasShownGameOverAd(false);
    playMusic();
  };

  const renderStars = (count: number) =>
    Array.from({ length: 3 }, (_, idx) => (
      <Star
        key={idx}
        className={`h-5 w-5 ${idx < count ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'text-muted-foreground'}`}
      />
    ));

  const starMessage = hasMetLevelGoal
    ? starsEarned === 3
      ? 'Perfect run! Ready for the next challenge.'
      : 'Great job! Replay to push for more stars.'
    : starsEarned === 0
      ? 'Reach the target to start earning stars for this level.'
      : 'Current best shown below — beat the target to improve it.';
  const dialogDescription = hasMetLevelGoal
    ? `You scored ${gameState.score} points and unlocked level ${displayLevelReached}!`
    : `You scored ${gameState.score} points. Keep pushing to unlock the next level.`;

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
            <span className="text-muted-foreground">Level {activeLevel} Target</span>
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
      <Dialog open={gameState.gameOver} onOpenChange={(open) => {
        if (!open && gameState.gameOver) {
          handlePlayAgain();
        }
      }}>
        <DialogContent className="glass-card border-primary/30 shadow-premium">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="h-6 w-6 text-primary drop-shadow-[0_0_12px_hsl(var(--primary))]" />
              <span className="text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]">
                {hasMetLevelGoal ? 'Level Complete! 🎉' : 'Game Over!'}
              </span>
            </DialogTitle>
            <DialogDescription className="text-base">
              {dialogDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="glass-card border border-primary/30 p-3 text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                {renderStars(starsEarned)}
              </div>
              <p className="text-xs text-muted-foreground">
                {starsEarned}/3 Stars — {starMessage}
              </p>
            </div>
            <div className="text-center glass-card p-3 border border-primary/20 shadow-glow">
              <div className="text-4xl font-bold text-primary drop-shadow-[0_0_12px_hsl(var(--primary))] mb-1">{gameState.score}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Final Score</div>
            </div>
            
            {hasMetLevelGoal ? (
              <div className="glass-card border border-primary/40 p-4 text-center shadow-neon animate-pulse-glow">
                <div className="text-lg font-semibold text-primary drop-shadow-[0_0_8px_hsl(var(--primary))] mb-1">
                  ✨ Level {activeLevel} Completed!
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
            {hasMetLevelGoal && canStartNextLevel && (
              <Button 
                onClick={handlePlayNextLevel}
                className="w-full shadow-glow-lg"
                variant="neon"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Level {nextPlayableLevel}
              </Button>
            )}
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
