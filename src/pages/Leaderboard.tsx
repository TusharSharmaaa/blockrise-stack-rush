import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Medal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Leaderboard = () => {
  const navigate = useNavigate();

  // Mock data - will be replaced with real leaderboard
  const mockScores = [
    { rank: 1, name: 'Player1', score: 15420, level: 12 },
    { rank: 2, name: 'Player2', score: 12300, level: 10 },
    { rank: 3, name: 'Player3', score: 9850, level: 9 },
    { rank: 4, name: 'You', score: 7500, level: 7 },
    { rank: 5, name: 'Player5', score: 6200, level: 6 },
  ];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-accent" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-muted-foreground" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-warning" />;
    return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl font-bold">Leaderboard</h1>
        </div>

        <div className="space-y-3">
          {mockScores.map((entry) => (
            <div
              key={entry.rank}
              className={`bg-card rounded-lg p-4 flex items-center gap-4 card-elevated ${
                entry.name === 'You' ? 'border-2 border-primary' : ''
              }`}
            >
              <div className="w-12 flex items-center justify-center">
                {getRankIcon(entry.rank)}
              </div>
              
              <div className="flex-1">
                <div className="font-semibold text-lg">{entry.name}</div>
                <div className="text-sm text-muted-foreground">Level {entry.level}</div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{entry.score}</div>
                <div className="text-xs text-muted-foreground">points</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border/50 text-center">
          <p className="text-sm text-muted-foreground">
            Connect with Cloud for global leaderboards
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
