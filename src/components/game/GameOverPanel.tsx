import { Play, Home, Video, Trophy, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GameOverPanelProps {
  hasMetLevelGoal: boolean;
  dialogDescription: string;
  starsEarned: number;
  starMessage: string;
  score: number;
  scoreRequirement: number;
  hasNewHighScore: boolean;
  canStartNextLevel: boolean;
  nextPlayableLevel: number;
  onPlayNextLevel: () => void;
  onContinueWithAd: () => void;
  onGoHome: () => void;
  onPlayAgain: () => void;
  isRewardedLoading: boolean;
}

const renderStars = (count: number) =>
  Array.from({ length: 3 }, (_, idx) => (
    <Star
      key={idx}
      className={`h-5 w-5 ${idx < count ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'text-muted-foreground'}`}
    />
  ));

const GameOverPanel = ({
  hasMetLevelGoal,
  dialogDescription,
  starsEarned,
  starMessage,
  score,
  scoreRequirement,
  hasNewHighScore,
  canStartNextLevel,
  nextPlayableLevel,
  onPlayNextLevel,
  onContinueWithAd,
  onGoHome,
  onPlayAgain,
  isRewardedLoading,
}: GameOverPanelProps) => (
  <div
    role="dialog"
    aria-modal="true"
    className="glass-card border-primary/30 shadow-premium relative z-10 w-full max-w-lg mx-auto"
  >
    <div className="flex items-center gap-2 text-2xl mb-2">
      <Trophy className="h-6 w-6 text-primary drop-shadow-[0_0_12px_hsl(var(--primary))]" />
      <span className="text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]">
        {hasMetLevelGoal ? 'Level Complete! 🎉' : 'Game Over!'}
      </span>
    </div>
    <p className="text-base text-muted-foreground mb-4">
      {dialogDescription}
    </p>

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
        <div className="text-4xl font-bold text-primary drop-shadow-[0_0_12px_hsl(var(--primary))] mb-1">
          {score}
        </div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">Final Score</div>
      </div>

      {hasMetLevelGoal ? (
        <div className="glass-card border border-primary/40 p-4 text-center shadow-neon animate-pulse-glow">
          <div className="text-lg font-semibold text-primary drop-shadow-[0_0_8px_hsl(var(--primary))] mb-1">
            ✨ Level Completed!
          </div>
          <div className="text-sm text-muted-foreground">
            Target: {scoreRequirement} | Your Score: {score}
          </div>
        </div>
      ) : (
        <div className="glass-card border border-muted/30 p-4 text-center">
          <div className="text-sm font-semibold mb-1">
            Keep trying!
          </div>
          <div className="text-xs text-muted-foreground">
            Target: {scoreRequirement} | Your Score: {score}
          </div>
        </div>
      )}

      {hasNewHighScore && (
        <div className="text-center text-sm font-semibold text-primary drop-shadow-[0_0_8px_hsl(var(--primary))] animate-pulse">
          🎉 New Personal Best!
        </div>
      )}
    </div>

    <div className="mt-6 space-y-3">
      {hasMetLevelGoal && canStartNextLevel && (
        <Button 
          onClick={onPlayNextLevel}
          className="w-full shadow-glow-lg"
          variant="neon"
        >
          <Play className="mr-2 h-4 w-4" />
          Start Level {nextPlayableLevel}
        </Button>
      )}
      <Button 
        onClick={onContinueWithAd}
        disabled={isRewardedLoading}
        className="w-full shadow-glow-lg"
        variant="premium"
      >
        <Video className="mr-2 h-4 w-4" />
        {isRewardedLoading ? 'Loading...' : 'Watch Ad & Continue (+50 Coins)'}
      </Button>
      <div className="flex gap-2 w-full">
        <Button onClick={onGoHome} variant="outline" className="flex-1 glass-card border-primary/20 hover:shadow-glow">
          <Home className="mr-2 h-4 w-4" />
          Home
        </Button>
        <Button onClick={onPlayAgain} variant="neon" className="flex-1">
          <Play className="mr-2 h-4 w-4" />
          Play Again
        </Button>
      </div>
    </div>
  </div>
);

export default GameOverPanel;

