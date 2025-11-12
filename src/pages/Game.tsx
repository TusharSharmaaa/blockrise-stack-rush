import { useEffect, useState } from 'react';
import GameBoard from '@/components/game/GameBoard';
import GameControls from '@/components/game/GameControls';
import GameHUD from '@/components/game/GameHUD';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useAdMob } from '@/hooks/useAdMob';
import { Button } from '@/components/ui/button';
import { Play, Home, Video, Trophy } from 'lucide-react';
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
  const { progress, updateGameStats, addCoins, hasCompletedLevel, getScoreRequirement } = useGameProgress();
  const { showInterstitial, showRewardedAd, isRewardedLoading } = useAdMob();
  const [hasShownGameOverAd, setHasShownGameOverAd] = useState(false);
  const scoreRequirement = getScoreRequirement(progress.currentLevel);
  const {
    gameState,
    moveLeft,
    moveRight,
    moveDown,
    rotate,
    togglePause,
    resetGame
  } = useGameLoop();

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
      updateGameStats(gameState.score, progress.currentLevel);
      // Show interstitial ad after game over
      setTimeout(() => {
        showInterstitial();
      }, 1000);
    }
  }, [gameState.gameOver]);

  const handleContinueWithAd = async () => {
    const result = await showRewardedAd();
    if (result.success) {
      // Give the player a second chance
      toast.success('Continue playing! You got 50 bonus coins!');
      await addCoins(50);
      resetGame();
      setHasShownGameOverAd(false);
    } else {
      toast.error('Ad was not completed');
    }
  };

  const handlePlayAgain = () => {
    resetGame();
    setHasShownGameOverAd(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
