import { Button } from '@/components/ui/button';
import { Play, Trophy, Settings, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8 animate-slide-up">
        {/* Logo/Title */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center game-glow">
              <Zap className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            BlockRise
          </h1>
          <p className="text-muted-foreground text-lg">
            Stack, Clear, Conquer
          </p>
        </div>

        {/* Main Menu */}
        <div className="space-y-4">
          <Button
            onClick={() => navigate('/game')}
            className="w-full h-16 text-lg font-semibold gradient-primary game-glow hover:scale-105 transition-transform"
            size="lg"
          >
            <Play className="mr-2 h-6 w-6" />
            Play Classic
          </Button>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-14 bg-card/50 backdrop-blur-sm border-primary/30 hover:bg-primary/20"
              onClick={() => navigate('/game')}
            >
              <Zap className="mr-2 h-5 w-5" />
              Endless
            </Button>
            <Button
              variant="outline"
              className="h-14 bg-card/50 backdrop-blur-sm border-secondary/30 hover:bg-secondary/20"
              onClick={() => navigate('/game')}
            >
              <Trophy className="mr-2 h-5 w-5" />
              Daily
            </Button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-4 pt-4">
          <Button
            variant="outline"
            className="flex-1 bg-card/50 backdrop-blur-sm border-border/50"
            onClick={() => navigate('/leaderboard')}
          >
            <Trophy className="mr-2 h-5 w-5" />
            Leaderboard
          </Button>
          <Button
            variant="outline"
            className="flex-1 bg-card/50 backdrop-blur-sm border-border/50"
            onClick={() => navigate('/settings')}
          >
            <Settings className="mr-2 h-5 w-5" />
            Settings
          </Button>
        </div>

        {/* Ad Placeholder */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border/50 text-center">
          <p className="text-xs text-muted-foreground">Banner Ad Placeholder</p>
          <p className="text-xs text-muted-foreground mt-1">Connect AdMob for monetization</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
