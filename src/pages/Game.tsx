import { useEffect, useState, useRef, useCallback } from 'react';
import GameBoard, { HighlightCell } from '@/components/game/GameBoard';
import GameControls from '@/components/game/GameControls';
import GameHUD from '@/components/game/GameHUD';
import PowerUpBar from '@/components/game/PowerUpBar';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAdMob } from '@/hooks/useAdMob';
import { usePowerUps } from '@/hooks/usePowerUps';
import { useAchievements } from '@/hooks/useAchievements';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useBackButton } from '@/hooks/useBackButton';
import { Button } from '@/components/ui/button';
import { Play, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getRandomBlock, GRID_WIDTH, GRID_HEIGHT } from '@/utils/blockShapes';
import { hapticVibrate } from '@/utils/haptics';
import { calculateLevelSpeed } from '@/utils/gameConstants';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import GameOverPanel from '@/components/game/GameOverPanel';

const POWER_UP_DURATIONS: Record<'slowTime' | 'clearLine' | 'shuffle' | 'bomb', number> = {
  slowTime: 30000,
  clearLine: 1200,
  shuffle: 800,
  bomb: 1500,
};

const Game = () => {
  const navigate = useNavigate();
  useBackButton(); // Handle Android back button
  const { progress, isLoading, updateGameStats, addCoins, hasCompletedLevel, getScoreRequirement, completeLevel, selectLevel, getStarsForLevel } = useGameProgress();
  const selectedLevel = progress.selectedLevel ?? progress.currentLevel;
  const { profile } = useUserProfile();
  const { showInterstitial, showRewardedAd, isRewardedLoading } = useAdMob();
  const { usePowerUp: activatePowerUp, loadInventory, addPowerUp } = usePowerUps();
  const { checkAndUnlock } = useAchievements();
  const { submitScore } = useLeaderboard();
  const [hasShownGameOverAd, setHasShownGameOverAd] = useState(false);
  const [previousScore, setPreviousScore] = useState(0);
  const [activeLevel, setActiveLevel] = useState(selectedLevel);
  const [hasShownLevelCompleteToast, setHasShownLevelCompleteToast] = useState(false);
  const [hasForcedLevelCompletion, setHasForcedLevelCompletion] = useState(false);
  // Session-based attempt counter: tracks consecutive attempts for the current level session
  // Resets when level changes or when navigating away
  const [sessionAttemptCount, setSessionAttemptCount] = useState<{ [level: number]: number }>({});
  const [currentSessionLevel, setCurrentSessionLevel] = useState<number | null>(null);
  const slowTimeTimeoutRef = useRef<number | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);
  const downHapticCooldownRef = useRef(0);
  const [powerUpHighlights, setPowerUpHighlights] = useState<HighlightCell[]>([]);

  const triggerHighlights = useCallback((cells: HighlightCell[], duration: number = 700) => {
    if (!cells.length) return;
    setPowerUpHighlights(cells);
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    if (typeof window !== 'undefined') {
      highlightTimeoutRef.current = window.setTimeout(() => {
        setPowerUpHighlights([]);
        highlightTimeoutRef.current = null;
      }, duration);
    }
  }, []);

  const findBestLineToClear = useCallback((grid: (string | null)[][]): number => {
    let candidate = -1;
    let filled = 0;
    for (let row = grid.length - 1; row >= 0; row--) {
      const rowFilled = grid[row].reduce((count, cell) => count + (cell ? 1 : 0), 0);
      if (rowFilled > filled) {
        filled = rowFilled;
        candidate = row;
      }
    }
    return filled >= 3 ? candidate : -1;
  }, []);

  const createLineHighlight = useCallback((lineIndex: number): HighlightCell[] => {
    if (lineIndex < 0) return [];
    return Array.from({ length: GRID_WIDTH }, (_, x) => ({
      x,
      y: lineIndex,
      color: 'rgba(255,255,255,0.95)',
      alpha: 0.9
    }));
  }, []);

  const createAreaHighlight = useCallback((centerX: number, centerY: number, radius: number, color: string): HighlightCell[] => {
    const cells: HighlightCell[] = [];
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
          cells.push({
            x,
            y,
            color,
            alpha: 0.85
          });
        }
      }
    }
    return cells;
  }, []);

  const createSpawnHighlight = useCallback((): HighlightCell[] => {
    const cells: HighlightCell[] = [];
    const startX = Math.max(0, Math.floor(GRID_WIDTH / 2) - 2);
    const endX = Math.min(GRID_WIDTH - 1, Math.floor(GRID_WIDTH / 2) + 1);
    for (let y = 0; y < 4; y++) {
      for (let x = startX; x <= endX; x++) {
        cells.push({
          x,
          y,
          color: 'rgba(52,211,153,0.8)',
          alpha: 0.6
        });
      }
    }
    return cells;
  }, []);

  const createBoardHighlight = useCallback((): HighlightCell[] => {
    const cells: HighlightCell[] = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        cells.push({
          x,
          y,
          color: 'rgba(59,130,246,0.65)',
          alpha: 0.22
        });
      }
    }
    return cells;
  }, []);
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

  // Reset session attempt counter when level changes or when navigating to game
  useEffect(() => {
    if (isLoading) return;
    
    const latestSelectedLevel = selectedLevel;

    // If level changed, reset the session counter for the new level and start at attempt 1
    if (currentSessionLevel !== null && currentSessionLevel !== latestSelectedLevel) {
      setSessionAttemptCount({
        [latestSelectedLevel]: 1 // Start new level session at attempt 1
      });
      setCurrentSessionLevel(latestSelectedLevel);
    } else if (currentSessionLevel === null) {
      // First time entering game, set the current level and start at attempt 1
      setCurrentSessionLevel(latestSelectedLevel);
      setSessionAttemptCount({
        [latestSelectedLevel]: 1 // First attempt when opening level
      });
    }
  }, [isLoading, selectedLevel, currentSessionLevel]);

  useEffect(() => {
    if (isLoading) return;
    const isFreshRun = !gameState.gameOver && gameState.score === 0;
    if (isFreshRun && activeLevel !== selectedLevel) {
      setActiveLevel(selectedLevel);
      // Reset session counter when switching to a different level and start at attempt 1
      setSessionAttemptCount({
        [selectedLevel]: 1
      });
      setCurrentSessionLevel(selectedLevel);
    }
  }, [isLoading, selectedLevel, gameState.gameOver, gameState.score, activeLevel]);

  // Load power-up inventory on mount
  useEffect(() => {
    loadInventory();
    return () => {
      // Clean up slowTime timeout on unmount
      if (slowTimeTimeoutRef.current) {
        clearTimeout(slowTimeTimeoutRef.current);
        slowTimeTimeoutRef.current = null;
      }
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = null;
      }
      setPowerUpHighlights([]);
      // Reset session counter when leaving the game (navigating away)
      setSessionAttemptCount({});
      setCurrentSessionLevel(null);
    };
  }, [loadInventory]);

  // Reset level completion helpers when starting a fresh run or switching levels
  useEffect(() => {
    if (!gameState.gameOver && gameState.score === 0) {
      setHasShownLevelCompleteToast(false);
      setHasForcedLevelCompletion(false);
    }
  }, [gameState.gameOver, gameState.score]);

  useEffect(() => {
    setHasShownLevelCompleteToast(false);
    setHasForcedLevelCompletion(false);
    // Reset session counter when level changes and start at attempt 1
    setSessionAttemptCount({
      [activeLevel]: 1
    });
    setCurrentSessionLevel(activeLevel);
  }, [activeLevel]);

  // Track score changes for achievements and level completion
  // Optimized to prevent excessive re-renders and race conditions
  useEffect(() => {
    if (gameState.score <= previousScore) {
      return; // Early return if score didn't increase
    }

    // Use refs to avoid stale closures in async operations
    const currentScore = gameState.score;
    const currentPreviousScore = previousScore;
    const currentActiveLevel = activeLevel;
    const currentUnlockedLevels = progress.unlockedLevels;
    
    // Check score-based achievements and add coin rewards (async, non-blocking)
    const checkAchievement = async (achievementId: string, progress: number) => {
      try {
        const result = await checkAndUnlock(achievementId, progress);
        if (result.unlocked && result.achievement) {
          await addCoins(result.achievement.coinReward);
          toast.success(`Achievement Unlocked: ${result.achievement.title}! +${result.achievement.coinReward} coins! 🎉`);
        }
      } catch (error) {
        console.error('Error checking achievement:', error);
      }
    };

    // Batch achievement checks to avoid race conditions
    if (currentScore >= 1000 && currentPreviousScore < 1000) {
      checkAchievement('first_1000', currentScore);
    }
    if (currentScore >= 5000 && currentPreviousScore < 5000) {
      checkAchievement('score_5000', currentScore);
    }
    if (currentScore >= 10000 && currentPreviousScore < 10000) {
      checkAchievement('score_10000', currentScore);
    }

    // Check for level completion and unlock next level (async, non-blocking)
    const checkLevelCompletion = async () => {
      try {
        const requirement = getScoreRequirement(currentActiveLevel);
        const hasMetGoal = currentScore >= requirement;
        if (hasMetGoal) {
          const nextLevel = currentActiveLevel + 1;
          if (nextLevel <= 50) {
            const unlocked = await completeLevel(currentActiveLevel, currentScore);
            if (unlocked && !currentUnlockedLevels.includes(nextLevel)) {
              toast.success(`Level ${currentActiveLevel} Completed! Level ${nextLevel} unlocked! 🎉`);
            }
          }
        }
      } catch (error) {
        console.error('Error checking level completion:', error);
      }
    };
    
    checkLevelCompletion();

    // Show level completion toast (only once)
    const requirement = getScoreRequirement(currentActiveLevel);
    if (currentScore >= requirement && !hasShownLevelCompleteToast) {
      const nextLevel = Math.min(currentActiveLevel + 1, 50);
      const alreadyUnlocked = currentUnlockedLevels.includes(nextLevel);
      const message = alreadyUnlocked
        ? `Level ${currentActiveLevel} target reached!`
        : `Level ${currentActiveLevel} completed! Level ${nextLevel} unlocked! 🎉`;
      toast.success(message, {
        duration: 1500,
        position: 'top-center'
      });
      setHasShownLevelCompleteToast(true);
    }
    
    setPreviousScore(currentScore);
  }, [gameState.score, previousScore, checkAndUnlock, addCoins, activeLevel, progress.unlockedLevels, completeLevel, getScoreRequirement, hasShownLevelCompleteToast]);

  // Automatically wrap up the level once the target score is reached
  useEffect(() => {
    if (!hasMetLevelGoal || gameState.gameOver || hasForcedLevelCompletion) {
      return;
    }

    setHasForcedLevelCompletion(true);
    setGameState(prev => ({
      ...prev,
      gameOver: true,
      paused: false
    }));
  }, [hasMetLevelGoal, gameState.gameOver, hasForcedLevelCompletion, setGameState]);

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

  const triggerMovePulse = useCallback(() => {
    hapticVibrate(12);
  }, []);

  const triggerDownPulse = useCallback(() => {
    const now = Date.now();
    if (now - downHapticCooldownRef.current < 50) return; // Reduced cooldown for faster response
    downHapticCooldownRef.current = now;
    hapticVibrate(18);
  }, []);

  const handleMoveLeft = useCallback(() => {
    triggerMovePulse();
    moveLeft();
  }, [moveLeft, triggerMovePulse]);

  const handleMoveRight = useCallback(() => {
    triggerMovePulse();
    moveRight();
  }, [moveRight, triggerMovePulse]);

  const handleMoveDown = useCallback(() => {
    triggerDownPulse();
    moveDown();
  }, [moveDown, triggerDownPulse]);

  const handleRotate = useCallback(() => {
    triggerMovePulse();
    rotate();
  }, [rotate, triggerMovePulse]);

  const handleUsePowerUp = async (type: 'slowTime' | 'clearLine' | 'shuffle' | 'bomb') => {
    if (gameState.gameOver) {
      toast.error('Finish the current game to use power-ups.');
      return;
    }

    let preCheckPassed = true;

    switch (type) {
      case 'clearLine': {
        const lineIndex = findBestLineToClear(gameState.grid);
        if (lineIndex === -1) {
          toast.info('No dense line to clear right now.');
          preCheckPassed = false;
        }
        break;
      }
      case 'bomb': {
        if (!gameState.currentBlock) {
          toast.info('Place a block before using the bomb.');
          preCheckPassed = false;
        }
        break;
      }
      default:
        break;
    }

    if (!preCheckPassed) {
      return;
    }

    const success = await activatePowerUp(type, POWER_UP_DURATIONS[type]);
    if (!success) {
      toast.error('Power-up not available');
      return;
    }

    switch (type) {
      case 'clearLine': {
        let clearedLineIndex = -1;
        setGameState(prevState => {
          const targetLine = findBestLineToClear(prevState.grid);
          if (targetLine === -1) {
            clearedLineIndex = -1;
            return prevState;
          }
          clearedLineIndex = targetLine;
          return clearLine(prevState, targetLine);
        });
        if (clearedLineIndex === -1) {
          toast.info('Line was already cleared.');
          await addPowerUp('clearLine', 1);
          return;
        }
        triggerHighlights(createLineHighlight(clearedLineIndex), 900);
        toast.success('Line cleared!');
        break;
      }
      case 'bomb': {
        let areaCenter: { x: number; y: number } | null = null;
        setGameState(prevState => {
          if (!prevState.currentBlock) {
            areaCenter = null;
            return prevState;
          }
          const centerX = prevState.currentBlock.x + Math.floor(prevState.currentBlock.shape[0].length / 2);
          const centerY = prevState.currentBlock.y + Math.floor(prevState.currentBlock.shape.length / 2);
          areaCenter = { x: centerX, y: centerY };
          return clearArea(prevState, centerX, centerY, 1);
        });
        if (!areaCenter) {
          toast.info('No block to detonate.');
          await addPowerUp('bomb', 1);
          return;
        }
        triggerHighlights(createAreaHighlight(areaCenter.x, areaCenter.y, 1, 'rgba(248,113,113,0.95)'), 1100);
        toast.success('Bomb exploded! Area cleared!');
        break;
      }
      case 'shuffle': {
        setGameState(prevState => ({
          ...prevState,
          nextBlock: {
            ...getRandomBlock(),
            x: 0,
            y: 0,
            id: Math.random().toString()
          }
        }));
        triggerHighlights(createSpawnHighlight(), 800);
        toast.success('Next blocks shuffled!');
        break;
      }
      case 'slowTime': {
        if (slowTimeTimeoutRef.current) {
          clearTimeout(slowTimeTimeoutRef.current);
          slowTimeTimeoutRef.current = null;
        }
        setGameState(prevState => ({
          ...prevState,
          speed: prevState.speed * 2
        }));
        triggerHighlights(createBoardHighlight(), 900);
        slowTimeTimeoutRef.current = window.setTimeout(() => {
          setGameState(prevState => ({
            ...prevState,
            speed: calculateLevelSpeed(prevState.level)
          }));
          slowTimeTimeoutRef.current = null;
        }, POWER_UP_DURATIONS.slowTime);
        toast.success('Time slowed for 30s!');
        break;
      }
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState.gameOver || gameState.paused) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handleMoveLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleMoveRight();
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleMoveDown();
          break;
        case 'ArrowUp':
        case ' ':
          e.preventDefault();
          handleRotate();
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
  }, [gameState.gameOver, gameState.paused, handleMoveLeft, handleMoveRight, handleMoveDown, handleRotate, togglePause]);

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

        // Get session attempt count for star calculation
        const attempts = sessionAttemptCount[activeLevel] || 1;
        
        // Update stats and sync to backend
        await updateGameStats(gameState.score, activeLevel, attempts);
        
        // Submit score to leaderboard if profile exists
        const profileId = profile?.id || localStorage.getItem('profileId');
        if (profileId) {
          await submitScore(profileId, gameState.score, activeLevel);
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
        
        // Show interstitial ad immediately after game over
        showInterstitial();
      };

      handleGameOver();
    }
  }, [gameState.gameOver, gameState.score, progress, profile, hasShownGameOverAd, updateGameStats, submitScore, checkAndUnlock, addCoins, showInterstitial, activeLevel, getScoreRequirement, completeLevel]);

  const handleContinueWithAd = async () => {
    const result = await showRewardedAd();
    if (result.success) {
      toast.success('Continue playing! You got 50 bonus coins!');
      await addCoins(50);
      await resetGame(activeLevel);
      setHasShownGameOverAd(false);
    } else {
      toast.error('Ad was not completed');
    }
  };

  const handlePlayAgain = async () => {
    // Increment session attempt counter for retry (this will be attempt 2, 3, etc.)
    setSessionAttemptCount(prev => ({
      ...prev,
      [activeLevel]: (prev[activeLevel] || 1) + 1
    }));
    await resetGame(activeLevel);
    setHasShownGameOverAd(false);
  };

  const handlePlayNextLevel = async () => {
    if (!canStartNextLevel) return;
    await selectLevel(nextPlayableLevel);
    // Reset session counter when switching to next level and start at attempt 1
    setSessionAttemptCount({
      [nextPlayableLevel]: 1
    });
    setCurrentSessionLevel(nextPlayableLevel);
    setActiveLevel(nextPlayableLevel);
    await resetGame(nextPlayableLevel);
    setHasShownGameOverAd(false);
  };

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
      <div className="container-responsive py-1 glass-card border-t border-glass-border shadow-glow">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between text-xs mb-0.5">
            <span className="text-muted-foreground">Level {activeLevel} Target</span>
            <span className="font-semibold text-primary drop-shadow-[0_0_6px_hsl(var(--primary))]">{gameState.score}/{scoreRequirement}</span>
          </div>
          <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden backdrop-blur-sm border border-primary/20">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 shadow-glow"
              style={{ width: `${Math.min(100, (gameState.score / scoreRequirement) * 100)}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col py-1">
        <div className="flex-1 min-h-0">
          <GameBoard
            grid={gameState.grid}
            currentBlock={gameState.currentBlock}
            highlights={powerUpHighlights}
          />
        </div>

        <PowerUpBar
          onUsePowerUp={handleUsePowerUp}
          disabled={gameState.gameOver || gameState.paused}
        />
        
        <div className="safe-bottom pb-2">
          <GameControls
            onRotate={handleRotate}
            onMoveLeft={handleMoveLeft}
            onMoveRight={handleMoveRight}
            onMoveDown={handleMoveDown}
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

      {/* Game Over Overlay */}
      {gameState.gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg">
            <GameOverPanel
              hasMetLevelGoal={hasMetLevelGoal}
              dialogDescription={dialogDescription}
              starsEarned={starsEarned}
              starMessage={starMessage}
              score={gameState.score}
              scoreRequirement={scoreRequirement}
              hasNewHighScore={gameState.score > progress.highestScore}
              canStartNextLevel={canStartNextLevel}
              nextPlayableLevel={nextPlayableLevel}
              onPlayNextLevel={handlePlayNextLevel}
              onContinueWithAd={handleContinueWithAd}
              onGoHome={() => navigate('/')}
              onPlayAgain={handlePlayAgain}
              isRewardedLoading={isRewardedLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
