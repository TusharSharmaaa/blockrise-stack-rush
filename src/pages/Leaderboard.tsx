import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Medal, MapPin, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useGameProgress } from '@/hooks/useGameProgress';
import { Badge } from '@/components/ui/badge';

const Leaderboard = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const { progress } = useGameProgress();

  // Mock leaderboard with diverse players
  const mockScores = [
    { rank: 1, name: 'DragonSlayer', city: 'Tokyo', country: 'Japan', score: 45820, level: 42, flag: '🇯🇵', isCurrentUser: false },
    { rank: 2, name: 'BlockMaster99', city: 'Mumbai', country: 'India', score: 38500, level: 38, flag: '🇮🇳', isCurrentUser: false },
    { rank: 3, name: 'ProGamer2024', city: 'New York', country: 'USA', score: 32100, level: 35, flag: '🇺🇸', isCurrentUser: false },
    { rank: 4, name: 'RajeshK', city: 'Delhi', country: 'India', score: 28900, level: 32, flag: '🇮🇳', isCurrentUser: false },
    { rank: 5, name: 'SkyWalker', city: 'London', country: 'UK', score: 25600, level: 30, flag: '🇬🇧', isCurrentUser: false },
    { rank: 6, name: 'PriyaS', city: 'Bangalore', country: 'India', score: 22400, level: 28, flag: '🇮🇳', isCurrentUser: false },
    { rank: 7, name: 'TechNinja', city: 'San Francisco', country: 'USA', score: 19800, level: 25, flag: '🇺🇸', isCurrentUser: false },
    { rank: 8, name: 'AmanGupta', city: 'Pune', country: 'India', score: 17200, level: 23, flag: '🇮🇳', isCurrentUser: false },
    { rank: 9, name: 'GameKing', city: 'Dubai', country: 'UAE', score: 15500, level: 20, flag: '🇦🇪', isCurrentUser: false },
    { rank: 10, name: 'NinjaWarrior', city: 'Singapore', country: 'Singapore', score: 13200, level: 18, flag: '🇸🇬', isCurrentUser: false },
  ];

  // Add user if they have a profile
  const leaderboardData = profile 
    ? [
        ...mockScores.slice(0, 9),
        {
          rank: mockScores.length + 1,
          name: profile.username,
          city: profile.city,
          country: profile.country,
          score: progress.highestScore,
          level: progress.currentLevel,
          flag: '👤',
          isCurrentUser: true
        }
      ].sort((a, b) => b.score - a.score).map((entry, idx) => ({ ...entry, rank: idx + 1 }))
    : mockScores;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-7 w-7 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-700" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
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

        {!profile && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center space-y-3">
            <div>
              <User className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-semibold">Create Your Profile</p>
              <p className="text-sm text-muted-foreground mt-1">
                Join the leaderboard and compete with players worldwide!
              </p>
            </div>
            <Button onClick={() => navigate('/profile')} className="gradient-primary">
              Create Profile
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {leaderboardData.map((entry, idx) => (
            <div
              key={`${entry.rank}-${entry.name}`}
              className={`bg-card rounded-lg p-4 flex items-center gap-3 transition-all ${
                entry.isCurrentUser ? 'border-2 border-primary shadow-lg scale-105' : 'card-elevated'
              } ${idx < 3 ? 'bg-gradient-to-r from-primary/5 to-accent/5' : ''}`}
            >
              <div className="w-14 flex items-center justify-center flex-shrink-0">
                {getRankIcon(entry.rank)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{entry.flag}</span>
                  <div className="font-semibold text-base truncate">
                    {entry.name}
                    {entry.isCurrentUser && <Badge className="ml-2 text-xs">You</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{entry.city}, {entry.country}</span>
                  <span className="mx-1">•</span>
                  <span>Level {entry.level}</span>
                </div>
              </div>
              
              <div className="text-right flex-shrink-0">
                <div className="text-xl font-bold text-primary">{entry.score.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground">points</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg border border-border/50 text-center space-y-3">
          <Trophy className="h-10 w-10 text-primary mx-auto" />
          <div>
            <p className="font-semibold text-lg">Compete Globally</p>
            <p className="text-sm text-muted-foreground mt-2">
              Real-time global leaderboards coming soon with Cloud integration
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
