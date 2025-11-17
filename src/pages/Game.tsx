import { useEffect, useState } from 'react';
import GameBoard from '@/components/game/GameBoard';
import GameControls from '@/components/game/GameControls';
import GameHUD from '@/components/game/GameHUD';
import { useGameLoop } from '@/hooks/useGameLoop';
import { GAME_CONSTANTS } from '@/utils/gameConstants';
import { GRID_HEIGHT, GRID_WIDTH, getRandomBlock } from '@/utils/blockShapes';
import { useGameProgress, getLevelReached } from '@/hooks/useGameProgress';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAdMob } from '@/hooks/useAdMob';
import { useSound } from '@/hooks/useSound';
import { useAchievements } from '@/hooks/useAchievements';
import { useBackButton } from '@/hooks/useBackButton';
import { usePowerUps } from '@/hooks/usePowerUps';
import PowerUpBar from '@/components/game/PowerUpBar';
import { Button } from '@/components/ui/button';
import { Play, Home, Video, Trophy, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
  const { progress, updateGameStats, addCoins, hasCompletedLevel, getScoreRequirement, watchAdForCoins, canWatchAdToday, incrementLevelAttempt, getStarsForLevel } = useGameProgress();
  const { profile } = useUserProfile();
  const { showInterstitial, showRewardedAd, isRewardedLoading } = useAdMob();
  const { playSound, playMusic, stopMusic } = useSound();
  const { checkAndUnlock } = useAchievements();
  const { usePowerUp, loadInventory, activePowerUp, clearActivePowerUp } = usePowerUps();
  useBackButton(); // Handle Android back button
  const [hasShownGameOverAd, setHasShownGameOverAd] = useState(false);
  const [previousScore, setPreviousScore] = useState(0);
  const [hasTrackedAttempt, setHasTrackedAttempt] = useState(false);
  const [normalSpeed, setNormalSpeed] = useState(GAME_CONSTANTS.BASE_SPEED);
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

  // Track attempt when game starts (when gameOver is false and score is 0)
  useEffect(() => {
    if (!gameState.gameOver && gameState.score === 0 && !hasTrackedAttempt) {
      incrementLevelAttempt(progress.currentLevel);
      setHasTrackedAttempt(true);
    }
    // Reset tracking flag when game ends
    if (gameState.gameOver) {
      setHasTrackedAttempt(false);
    }
  }, [gameState.gameOver, gameState.score, progress.currentLevel, hasTrackedAttempt, incrementLevelAttempt]);

  // Load power-up inventory on mount and when component becomes visible
  useEffect(() => {
    loadInventory();
    
    // Reload inventory when page becomes visible (e.g., returning from shop)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadInventory();
      }
    };
    
    // Also reload on focus (for mobile apps)
    const handleFocus = () => {
      loadInventory();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadInventory]);

  // Track normal speed for current level
  useEffect(() => {
    const baseSpeed = Math.max(
      GAME_CONSTANTS.MIN_SPEED,
      GAME_CONSTANTS.BASE_SPEED - (gameState.level - 1) * GAME_CONSTANTS.SPEED_INCREASE_PER_LEVEL
    );
    setNormalSpeed(baseSpeed);
  }, [gameState.level]);

  // Handle slowTime power-up expiration
  useEffect(() => {
    if (!activePowerUp || activePowerUp.type !== 'slowTime') {
      // Reset speed to normal when slowTime power-up expires
      if (gameState.speed !== normalSpeed) {
        setGameState(state => ({ ...state, speed: normalSpeed }));
      }
    }
  }, [activePowerUp, gameState.speed, normalSpeed]);

  // Play music on mount and prevent body scrolling
  useEffect(() => {
    playMusic();
    // Prevent body scrolling when game is active and remove body padding for edge-to-edge
    const originalBodyOverflow = window.getComputedStyle(document.body).overflow;
    const originalHtmlOverflow = window.getComputedStyle(document.documentElement).overflow;
    const originalBodyPadding = window.getComputedStyle(document.body).padding;
    
    document.body.style.overflow = 'hidden';
    document.body.style.padding = '0';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      stopMusic();
      // Restore original styles
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.padding = originalBodyPadding;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  // Track score changes for achievements
  useEffect(() => {
    if (gameState.score > previousScore) {
      playSound('coin');
      
      // Check score-based achievements
      if (gameState.score >= 1000 && previousScore < 1000) {
        checkAndUnlock('first_1000', gameState.score);
      }
      if (gameState.score >= 5000 && previousScore < 5000) {
        checkAndUnlock('score_5000', gameState.score);
      }
      if (gameState.score >= 10000 && previousScore < 10000) {
        checkAndUnlock('score_10000', gameState.score);
      }
    }
    setPreviousScore(gameState.score);
  }, [gameState.score]);

  // Track level achievements
  useEffect(() => {
    if (gameState.level >= 10) {
      checkAndUnlock('reach_level_10', gameState.level);
    }
    if (gameState.level >= 25) {
      checkAndUnlock('reach_level_25', gameState.level);
    }
  }, [gameState.level]);


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
      
      // Update stats and sync to backend
      updateGameStats(gameState.score, progress.currentLevel).then(() => {
        // Trigger sync indicator animation
        window.dispatchEvent(new Event('progressSynced'));
        
        if (profile?.id) {
          toast.success('Progress saved to cloud! ☁️');
        }
      });
      
      playSound('gameOver');
      stopMusic();
      
      // Check achievements on game over
      checkAndUnlock('play_10_games', progress.totalGamesPlayed);
      if (gameState.score > progress.highestScore) {
        checkAndUnlock('new_high_score', gameState.score);
      }
      
      // Show interstitial ad after game over
      setTimeout(() => {
        showInterstitial();
      }, 1000);
    }
  }, [gameState.gameOver]);

  const handleContinueWithAd = async () => {
    const result = await showRewardedAd();
    if (result.success) {
      toast.success('Continue playing! You got 50 bonus coins!');
      await addCoins(50);
      playSound('coin');
      resetGame();
      setHasShownGameOverAd(false);
      setHasTrackedAttempt(false); // Reset so we track attempt for new game
      // Reload inventory to ensure counts are up to date
      await loadInventory();
      playMusic();
    } else {
      toast.error('Ad was not completed');
    }
  };

  const handleWatchAdForMoney = async () => {
    if (!canWatchAdToday()) {
      toast.error('Daily ad limit reached! Come back tomorrow.');
      return;
    }

    const result = await showRewardedAd();
    if (result.success) {
      const adResult = await watchAdForCoins(100); // Earn 100 coins for watching ad
      if (adResult.success) {
        toast.success(`💰 You earned ${adResult.coinsEarned} coins!`);
        playSound('coin');
        // Navigate to home after crediting coins
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        toast.error(adResult.message || 'Failed to earn coins');
      }
    } else {
      toast.error('Ad was not completed. Please try again.');
    }
  };

  const handlePlayAgain = async () => {
    resetGame();
    setHasShownGameOverAd(false);
    setHasTrackedAttempt(false); // Reset so we track attempt for new game
    clearActivePowerUp(); // Clear any active power-ups
    // Reload inventory to ensure counts are up to date for new game
    await loadInventory();
    playMusic();
  };

  const handleGoToNextLevel = async () => {
    const levelCompleted = hasCompletedLevel(progress.currentLevel, gameState.score);
    if (levelCompleted) {
      const nextLevel = progress.currentLevel + 1;
      // Check if next level is unlocked
      if (progress.unlockedLevels.includes(nextLevel)) {
        await selectLevel(nextLevel);
        resetGame();
        setHasShownGameOverAd(false);
        setHasTrackedAttempt(false);
        clearActivePowerUp();
        await loadInventory();
        playMusic();
      } else {
        // If next level is not unlocked, just restart current level
        handlePlayAgain();
      }
    } else {
      // If level not completed, just restart
      handlePlayAgain();
    }
  };

  // Power-up handlers
  const handleUsePowerUp = async (type: 'slowTime' | 'clearLine' | 'shuffle' | 'bomb') => {
    if (gameState.gameOver || gameState.paused) return;

    const success = await usePowerUp(type, type === 'slowTime' ? 30000 : 0);
    if (!success) {
      toast.error('Cannot use power-up right now');
      return;
    }

    // State is updated synchronously by saveInventory, and custom event notifies PowerUpBar
    // No need to reload here as the event system handles cross-component updates
    playSound('powerup');

    switch (type) {
      case 'slowTime':
        // Slow down the game by doubling the speed interval (higher interval = slower)
        setGameState(state => ({
          ...state,
          speed: state.speed * GAME_CONSTANTS.SLOW_TIME_MULTIPLIER
        }));
        toast.success('⏱️ Time slowed down!');
        break;

      case 'clearLine':
        // Clear the bottom line
        setGameState(state => {
          const bottomLineIndex = GRID_HEIGHT - 1;
          return clearLine(state, bottomLineIndex);
        });
        toast.success('✨ Bottom line cleared!');
        break;

      case 'shuffle':
        // Get a new random block with different shape
        // Keep trying until we get a different shape to ensure it actually changes
        let newBlock = getRandomBlock();
        let attempts = 0;
        while (gameState.currentBlock && 
               JSON.stringify(newBlock.shape) === JSON.stringify(gameState.currentBlock.shape) && 
               attempts < 10) {
          newBlock = getRandomBlock();
          attempts++;
        }
        
        setGameState(state => {
          if (!state.currentBlock) return state;
          
          // Recalculate x position to center the new block based on its width
          const newBlockWidth = newBlock.shape[0].length;
          const newX = Math.max(0, Math.min(
            GRID_WIDTH - newBlockWidth,
            Math.floor(GRID_WIDTH / 2) - Math.floor(newBlockWidth / 2)
          ));
          
          // Keep the same y position
          const currentY = state.currentBlock.y;
          
          // Create completely new block object to ensure React detects the change
          const shuffledBlock = {
            shape: newBlock.shape, // New shape
            color: newBlock.color, // New color
            x: newX, // Recalculated x position
            y: currentY, // Keep current y
            id: Math.random().toString() // New ID to force re-render
          };
          
          return {
            ...state,
            currentBlock: shuffledBlock
          };
        });
        toast.success('🔄 Block shuffled!');
        break;

      case 'bomb':
        // Clear 3x3 area around current block center
        if (gameState.currentBlock) {
          const centerX = gameState.currentBlock.x + Math.floor(gameState.currentBlock.shape[0].length / 2);
          const centerY = gameState.currentBlock.y + Math.floor(gameState.currentBlock.shape.length / 2);
          setGameState(state => clearArea(state, centerX, centerY, GAME_CONSTANTS.BOMB_RADIUS));
          toast.success('💣 Area cleared!');
        }
        break;
    }
  };

  return (
    <div 
      className="bg-background flex flex-col relative"
      style={{ 
        height: '100dvh',
        maxHeight: '100dvh',
        width: '100vw',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        padding: 0
      }}
    >
      {/* Fixed Header - HUD and Progress Bar - With status bar safe area */}
      <div 
        className="flex-shrink-0 bg-background/95 backdrop-blur-sm border-b border-border/30 w-full"
        style={{
          paddingTop: 'env(safe-area-inset-top, 24px)',
          margin: 0,
          position: 'relative',
          zIndex: 10
        }}
      >
        <GameHUD
          score={gameState.score}
          level={gameState.level}
          nextBlock={gameState.nextBlock}
          onPause={togglePause}
        />
        
        {/* Score Progress Bar - Compact but readable */}
        <div 
          className="py-1.5 bg-card/30 backdrop-blur-sm" 
          style={{ 
            minHeight: '24px',
            paddingLeft: 'max(12px, env(safe-area-inset-left, 12px))',
            paddingRight: 'max(12px, env(safe-area-inset-right, 12px))'
          }}
        >
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-[10px] sm:text-xs leading-tight mb-1">
              <span className="text-muted-foreground">Level {progress.currentLevel} Target</span>
              <span className="font-semibold">{gameState.score}/{scoreRequirement}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                style={{ width: `${Math.min(100, (gameState.score / scoreRequirement) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Game Board Area - Fill remaining space, edge-to-edge, no padding */}
      <div 
        className="flex-1 w-full overflow-hidden"
        style={{ 
          minHeight: 0,
          maxHeight: '100%',
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'stretch',
          flex: '1 1 0%',
          margin: 0,
          padding: 0,
          width: '100%'
        }}
      >
        <GameBoard
          grid={gameState.grid}
          currentBlock={gameState.currentBlock}
        />
      </div>

      {/* Power-Up Bar - Between game board and controls */}
      <div 
        className="flex-shrink-0 w-full"
        style={{ 
          paddingLeft: 'max(8px, env(safe-area-inset-left, 8px))',
          paddingRight: 'max(8px, env(safe-area-inset-right, 8px))',
          paddingTop: '8px',
          paddingBottom: '8px'
        }}
      >
        <PowerUpBar
          onUsePowerUp={handleUsePowerUp}
          disabled={gameState.gameOver || gameState.paused}
        />
      </div>
      
      {/* Fixed Bottom Controls - With navigation bar safe area */}
      <div 
        className="flex-shrink-0 w-full bg-background/95 backdrop-blur-sm border-t border-border/30"
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingTop: '0px',
          margin: 0
        }}
      >
        <GameControls
          onRotate={rotate}
          onMoveLeft={moveLeft}
          onMoveRight={moveRight}
          onMoveDown={moveDown}
          disabled={gameState.gameOver || gameState.paused}
        />
      </div>

      {/* Pause Dialog */}
      <Dialog open={gameState.paused && !gameState.gameOver} onOpenChange={togglePause}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Game Paused</DialogTitle>
            <DialogDescription>
              Take a break! Resume when you're ready.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button onClick={() => navigate('/')} variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
            <Button onClick={togglePause} className="gradient-primary">
              <Play className="mr-2 h-4 w-4" />
              Resume
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Game Over Dialog */}
      <Dialog open={gameState.gameOver} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              {hasCompletedLevel(progress.currentLevel, gameState.score) ? 'Level Complete! 🎉' : 'Game Over!'}
            </DialogTitle>
            <DialogDescription>
              {hasCompletedLevel(progress.currentLevel, gameState.score) ? (
                <>Congratulations! You scored {gameState.score} points and reached level {getLevelReached(gameState.score)}!</>
              ) : (
                <>You scored {gameState.score} points and reached level {gameState.level}!</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{gameState.score}</div>
              <div className="text-sm text-muted-foreground">Final Score</div>
            </div>
            
            {hasCompletedLevel(progress.currentLevel, gameState.score) ? (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                <div className="text-lg font-semibold text-primary mb-1">
                  ✨ Level {progress.currentLevel} Completed!
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  Target: {scoreRequirement} | Your Score: {gameState.score}
                </div>
                {progress.levelStars[progress.currentLevel] && (
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-sm font-semibold">Stars:</span>
                    {Array.from({ length: 3 }, (_, i) => (
                      <span key={i} className={`text-lg ${i < progress.levelStars[progress.currentLevel] ? 'text-yellow-500' : 'text-muted'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-sm font-semibold mb-1">
                  Keep trying!
                </div>
                <div className="text-xs text-muted-foreground">
                  Target: {scoreRequirement} | Your Score: {gameState.score}
                </div>
              </div>
            )}

            {gameState.score > progress.highestScore && (
              <div className="text-center text-sm font-semibold text-primary">
                🎉 New Personal Best!
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col gap-2">
            {/* Watch Ad & Earn Coins - Middle button with 100 coins */}
            <Button 
              onClick={handleWatchAdForMoney}
              disabled={isRewardedLoading || !canWatchAdToday()}
              className="w-full gradient-primary"
              variant="default"
            >
              <Coins className="mr-2 h-4 w-4" />
              {isRewardedLoading ? 'Loading...' : 'Watch Ad & Earn Coins (+100 Coins)'}
            </Button>

            {/* Continue Playing Option */}
            <Button 
              onClick={handleContinueWithAd}
              disabled={isRewardedLoading || !canWatchAdToday()}
              className="w-full bg-accent hover:bg-accent/90"
              variant="default"
            >
              <Video className="mr-2 h-4 w-4" />
              {isRewardedLoading ? 'Loading...' : 'Watch Ad & Continue Playing (+50 Coins)'}
            </Button>

            <div className="flex gap-2 w-full">
              <Button onClick={() => navigate('/')} variant="outline" className="flex-1">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
              <Button 
                onClick={hasCompletedLevel(progress.currentLevel, gameState.score) ? handleGoToNextLevel : handlePlayAgain} 
                className="flex-1"
              >
                <Play className="mr-2 h-4 w-4" />
                {hasCompletedLevel(progress.currentLevel, gameState.score) ? 'Go to Next Level' : 'Play Again'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Game;
