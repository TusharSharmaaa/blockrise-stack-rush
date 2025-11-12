import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Trophy, Calendar, Settings as SettingsIcon, Layers, ShoppingBag, User, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGameProgress } from "@/hooks/useGameProgress";
import { useAchievements } from "@/hooks/useAchievements";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const navigate = useNavigate();
  const { progress, isLoading } = useGameProgress();
  const { getUnlockedCount, achievements } = useAchievements();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            BlockRise
          </h1>
          <p className="text-muted-foreground">Stack • Clear • Dominate</p>
        </div>

        {/* Stats Bar */}
        <div className="flex gap-3 justify-center flex-wrap">
          <Badge variant="secondary" className="text-base px-4 py-2">
            💰 {progress.totalCoins} Coins
          </Badge>
          <Badge variant="outline" className="text-base px-4 py-2">
            🏆 Best: {progress.highestScore}
          </Badge>
          <Badge variant="outline" className="text-base px-4 py-2">
            🔥 {progress.dailyStreak} Day Streak
          </Badge>
        </div>

        {/* Main Actions Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-6 space-y-4 card-hover cursor-pointer bg-gradient-to-br from-primary/10 to-accent/10" onClick={() => navigate('/game')}>
            <div className="flex items-center justify-between">
              <Play className="h-8 w-8 text-primary" />
              <Badge variant="secondary">Level {progress.currentLevel}</Badge>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">Play</h2>
              <p className="text-sm text-muted-foreground">Continue your game</p>
            </div>
          </Card>

          <Card className="p-6 space-y-4 card-hover cursor-pointer" onClick={() => navigate('/level-select')}>
            <div className="flex items-center justify-between">
              <Layers className="h-8 w-8 text-accent" />
              <Badge variant="secondary">{progress.unlockedLevels.length}/50</Badge>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">Levels</h2>
              <p className="text-sm text-muted-foreground">50 challenges</p>
            </div>
          </Card>

          <Card className="p-6 space-y-4 card-hover cursor-pointer" onClick={() => navigate('/shop')}>
            <div className="flex items-center justify-between">
              <ShoppingBag className="h-8 w-8 text-purple-500" />
              <Badge variant="secondary">💰 {progress.totalCoins}</Badge>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">Shop</h2>
              <p className="text-sm text-muted-foreground">Spend your coins</p>
            </div>
          </Card>

          <Card className="p-6 space-y-4 card-hover cursor-pointer" onClick={() => navigate('/leaderboard')}>
            <Trophy className="h-8 w-8 text-yellow-500" />
            <div>
              <h2 className="text-2xl font-bold mb-1">Leaderboard</h2>
              <p className="text-sm text-muted-foreground">Global rankings</p>
            </div>
          </Card>

          <Card className="p-6 space-y-4 card-hover cursor-pointer" onClick={() => navigate('/daily-rewards')}>
            <div className="flex items-center justify-between">
              <Calendar className="h-8 w-8 text-green-500" />
              {progress.dailyStreak > 0 && (
                <Badge variant="destructive">{progress.dailyStreak}🔥</Badge>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">Daily Rewards</h2>
              <p className="text-sm text-muted-foreground">Claim your streak</p>
            </div>
          </Card>

          <Card className="p-6 space-y-4 card-hover cursor-pointer" onClick={() => navigate('/profile')}>
            <div className="flex items-center justify-between">
              <User className="h-8 w-8 text-blue-500" />
              <Award className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">Profile</h2>
              <p className="text-sm text-muted-foreground">
                {getUnlockedCount()}/{achievements.length} achievements
              </p>
            </div>
          </Card>
        </div>

        {/* Settings Button */}
        <Card className="p-4 card-hover cursor-pointer" onClick={() => navigate('/settings')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SettingsIcon className="h-6 w-6 text-muted-foreground" />
              <span className="font-semibold">Settings</span>
            </div>
            <Badge variant="outline">Configure</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
