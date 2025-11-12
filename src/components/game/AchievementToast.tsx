import { Trophy, Coins } from 'lucide-react';

interface AchievementToastProps {
  title: string;
  reward: number;
}

const AchievementToast = ({ title, reward }: AchievementToastProps) => {
  return (
    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg border border-primary/30 animate-scale-in">
      <div className="p-3 bg-primary/20 rounded-full">
        <Trophy className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-foreground">Achievement Unlocked!</div>
        <div className="text-sm text-muted-foreground">{title}</div>
      </div>
      <div className="flex items-center gap-1 text-yellow-500 font-semibold">
        <Coins className="h-5 w-5" />
        +{reward}
      </div>
    </div>
  );
};

export default AchievementToast;
