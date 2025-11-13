import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Trophy, Calendar, Settings as SettingsIcon, Layers, ShoppingBag, User, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGameProgress } from "@/hooks/useGameProgress";
import { useAchievements } from "@/hooks/useAchievements";
import { Badge } from "@/components/ui/badge";
import ProfileSetupDialog from "@/components/ProfileSetupDialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const Index = () => {
  const navigate = useNavigate();
  const { progress, isLoading } = useGameProgress();
  const { getUnlockedCount, achievements } = useAchievements();

  if (isLoading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <ProfileSetupDialog />
      <ScrollArea className="h-full">
        <div className="min-h-full bg-background relative overflow-hidden">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-hero opacity-50 animate-gradient pointer-events-none" />
          
          <div className="container-responsive space-y-4 sm:space-y-6 relative z-10 py-4 sm:py-6 pb-20">
        {/* Header */}
        <div className="text-center space-y-2 mb-6 sm:mb-8 animate-slide-up">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
            BlockRise
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Stack • Clear • Dominate</p>
        </div>

        {/* Stats Bar */}
        <div className="flex gap-2 sm:gap-3 justify-center flex-wrap animate-slide-up">
          <Badge variant="glass" className="text-base px-4 py-2 hover:shadow-glow transition-all">
            💰 {progress.totalCoins} Coins
          </Badge>
          <Badge variant="glass" className="text-base px-4 py-2 hover:shadow-glow transition-all">
            🏆 Best: {progress.highestScore}
          </Badge>
          <Badge variant="neon" className="text-base px-4 py-2 animate-pulse-glow">
            🔥 {progress.dailyStreak} Day Streak
          </Badge>
        </div>

        {/* Main Actions Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Card 
            variant="premium" 
            className="p-4 sm:p-6 space-y-3 sm:space-y-4 cursor-pointer hover:scale-105 hover:shadow-glow-lg transition-all duration-300 animate-pulse-glow" 
            onClick={() => navigate('/game')}
          >
            <div className="flex items-center justify-between">
              <Play className="h-6 w-6 sm:h-8 sm:w-8 text-primary drop-shadow-[0_0_10px_hsl(var(--primary))]" />
              <Badge variant="neon" className="text-xs">Level {progress.currentLevel}</Badge>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1">Play</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Continue game</p>
            </div>
          </Card>

          <Card 
            variant="glass" 
            className="p-4 sm:p-6 space-y-3 sm:space-y-4 cursor-pointer hover:scale-105 hover:shadow-glow transition-all duration-300" 
            onClick={() => navigate('/level-select')}
          >
            <div className="flex items-center justify-between">
              <Layers className="h-6 w-6 sm:h-8 sm:w-8 text-accent drop-shadow-[0_0_8px_hsl(var(--accent))]" />
              <Badge variant="glass" className="text-xs">{progress.unlockedLevels.length}/50</Badge>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1">Levels</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">50 challenges</p>
            </div>
          </Card>

          <Card 
            variant="glass" 
            className="p-4 sm:p-6 space-y-3 sm:space-y-4 cursor-pointer hover:scale-105 hover:shadow-glow transition-all duration-300" 
            onClick={() => navigate('/shop')}
          >
            <div className="flex items-center justify-between">
              <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-secondary drop-shadow-[0_0_8px_hsl(var(--secondary))]" />
              <Badge variant="glass" className="text-xs">💰 {progress.totalCoins}</Badge>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1">Shop</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Spend coins</p>
            </div>
          </Card>

          <Card 
            variant="glass" 
            className="p-4 sm:p-6 space-y-3 sm:space-y-4 cursor-pointer hover:scale-105 hover:shadow-glow transition-all duration-300" 
            onClick={() => navigate('/leaderboard')}
          >
            <div className="flex items-center justify-between">
              <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-accent drop-shadow-[0_0_10px_hsl(var(--accent))]" />
              <Badge variant="glass" className="text-xs">Global</Badge>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1">Leaderboard</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Global ranks</p>
            </div>
          </Card>

          <Card 
            variant="gradient" 
            className="p-4 sm:p-6 space-y-3 sm:space-y-4 cursor-pointer hover:scale-105 hover:shadow-glow transition-all duration-300" 
            onClick={() => navigate('/daily-rewards')}
          >
            <div className="flex items-center justify-between">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-success drop-shadow-[0_0_8px_hsl(var(--success))]" />
              {progress.dailyStreak > 0 && (
                <Badge variant="neon" className="text-xs animate-pulse">{progress.dailyStreak}🔥</Badge>
              )}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1">Daily Rewards</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Claim streak</p>
            </div>
          </Card>

          <Card 
            variant="gradient" 
            className="p-4 sm:p-6 space-y-3 sm:space-y-4 cursor-pointer hover:scale-105 hover:shadow-glow transition-all duration-300" 
            onClick={() => navigate('/profile')}
          >
            <div className="flex items-center justify-between">
              <User className="h-6 w-6 sm:h-8 sm:w-8 text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]" />
              <Award className="h-4 w-4 sm:h-5 sm:w-5 text-accent drop-shadow-[0_0_6px_hsl(var(--accent))]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1">Profile</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {getUnlockedCount()}/{achievements.length} badges
              </p>
            </div>
          </Card>
        </div>

        {/* Settings Button */}
        <Card 
          variant="glass" 
          className="p-3 sm:p-4 cursor-pointer hover:scale-[1.02] hover:shadow-glow transition-all duration-300" 
          onClick={() => navigate('/settings')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SettingsIcon className="h-6 w-6 text-muted-foreground drop-shadow-[0_0_6px_hsl(var(--muted-foreground))]" />
              <span className="font-semibold">Settings</span>
            </div>
            <Badge variant="glass">Configure</Badge>
          </div>
        </Card>
          </div>
        </div>
      </ScrollArea>
    </>
  );
};

export default Index;
