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
  const { progress, updateGameStats, addCoins, hasCompletedLevel, getScoreRequirement } = useGameProgress();
  const { profile } = useUserProfile();
  const { showInterstitial, showRewardedAd, isRewardedLoading } = useAdMob();
  const { playSound, playMusic, stopMusic } = useSound();
  const { usePowerUp, loadInventory } = usePowerUps();
  const { checkAndUnlock } = useAchievements();
  const [hasShownGameOverAd, setHasShownGameOverAd] = useState(false);
  const [previousScore, setPreviousScore] = useState(0);
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

  // Load power-up inventory on mount
  useEffect(() => {
    loadInventory();
    playMusic();
    return () => stopMusic();
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
      playMusic();
    } else {
      toast.error('Ad was not completed');
    }
  };

  const handlePlayAgain = () => {
    resetGame();
    setHasShownGameOverAd(false);
    playMusic();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sync Indicator */}
      <div className="absolute top-2 right-2 z-50">
        <SyncIndicator profileId={profile?.id} />
      </div>
      
      <GameHUD
        score={gameState.score}
        level={gameState.level}
        nextBlock={gameState.nextBlock}
        onPause={togglePause}
      />
      
      {/* Score Progress Bar */}
      <div className="px-4 py-2 bg-card/50 backdrop-blur-sm">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Level {progress.currentLevel} Target</span>
            <span className="font-semibold">{gameState.score}/{scoreRequirement}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
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
        
        <div style={{ paddingBottom: 'calc(var(--safe-area-inset-bottom) + 16px)' }}>
          <GameControls
            onRotate={rotate}
            onMoveLeft={moveLeft}
            onMoveRight={moveRight}
            onMoveDown={moveDown}
            disabled={gameState.gameOver || gameState.paused}
          />
        </div>
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
              You scored {gameState.score} points and reached level {gameState.level}!
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
                <div className="text-sm text-muted-foreground">
                  Target: {scoreRequirement} | Your Score: {gameState.score}
                </div>
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
            <Button 
              onClick={handleContinueWithAd}
              disabled={isRewardedLoading}
              className="w-full gradient-primary"
              variant="default"
            >
              <Video className="mr-2 h-4 w-4" />
              {isRewardedLoading ? 'Loading...' : 'Watch Ad & Continue (+50 Coins)'}
            </Button>
            <div className="flex gap-2 w-full">
              <Button onClick={() => navigate('/')} variant="outline" className="flex-1">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
              <Button onClick={handlePlayAgain} className="flex-1">
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
