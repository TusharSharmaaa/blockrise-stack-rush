import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Medal, MapPin, User, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useBackButton } from '@/hooks/useBackButton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef } from 'react';

const Leaderboard = () => {
  const navigate = useNavigate();
  useBackButton(); // Handle Android back button
  const { profile } = useUserProfile();
  const { entries, userPosition, isLoading } = useLeaderboard(profile?.id);
  const userEntryRef = useRef<HTMLDivElement>(null);

  const getCountryFlag = (country: string) => {
    const flags: { [key: string]: string } = {
      'Japan': '🇯🇵',
      'India': '🇮🇳',
      'USA': '🇺🇸',
      'UK': '🇬🇧',
      'UAE': '🇦🇪',
      'Singapore': '🇸🇬'
    };
    return flags[country] || '🌍';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-7 w-7 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-700" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  // Auto-scroll to user's position when leaderboard loads
  useEffect(() => {
    if (userEntryRef.current && !isLoading) {
      setTimeout(() => {
        userEntryRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 300);
    }
  }, [entries, isLoading, userPosition]);

  if (isLoading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="min-h-full bg-background relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-hero opacity-50 animate-gradient pointer-events-none" />
        
        <div className="container-responsive space-y-4 sm:space-y-6 relative z-10 py-4 sm:py-6 pb-20">
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

        {/* Your Position Section - Always visible if user has profile */}
        {profile && userPosition && (
          <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-accent/10 border-2 border-primary/50 rounded-lg p-4 sm:p-5 shadow-lg mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-bold text-primary">Your Position</h2>
            </div>
            <div className="bg-background/80 rounded-lg p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-12 sm:w-16 flex items-center justify-center flex-shrink-0">
                {getRankIcon(userPosition.rank)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl sm:text-2xl">{getCountryFlag(userPosition.entry?.country || '')}</span>
                  <div className="font-bold text-base sm:text-lg truncate">
                    {userPosition.entry?.username}
                    <Badge className="ml-2 text-xs bg-primary text-primary-foreground">You</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                  <span className="truncate">{userPosition.entry?.city}, {userPosition.entry?.country}</span>
                  <span className="mx-1">•</span>
                  <span className="whitespace-nowrap">Lvl {userPosition.entry?.level}</span>
                  <span className="mx-1">•</span>
                  <span className="whitespace-nowrap">#{userPosition.rank} of {userPosition.totalPlayers}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xl sm:text-2xl font-bold text-primary">{userPosition.entry?.score.toLocaleString()}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">points</div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No leaderboard entries yet. Be the first!</p>
            </div>
          ) : (
            entries.map((entry, idx) => (
              <div
                key={entry.id}
                ref={entry.isCurrentUser ? userEntryRef : null}
                className={`bg-card rounded-lg p-3 sm:p-4 flex items-center gap-2 sm:gap-3 transition-all border ${
                  entry.isCurrentUser 
                    ? 'border-4 border-primary shadow-xl bg-gradient-to-r from-primary/20 via-primary/10 to-accent/10 ring-2 ring-primary/30' 
                    : 'card-elevated border-border'
                } ${idx < 3 && !entry.isCurrentUser ? 'bg-gradient-to-r from-primary/5 to-accent/5' : ''}`}
              >
                <div className="w-10 sm:w-14 flex items-center justify-center flex-shrink-0">
                  {getRankIcon(entry.rank)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                    <span className="text-base sm:text-xl">{getCountryFlag(entry.country)}</span>
                    <div className="font-semibold text-sm sm:text-base truncate">
                      {entry.username}
                      {entry.isCurrentUser && <Badge className="ml-1 sm:ml-2 text-xs">You</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                    <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                    <span className="truncate">{entry.city}, {entry.country}</span>
                    <span className="mx-0.5 sm:mx-1">•</span>
                    <span className="whitespace-nowrap">Lvl {entry.level}</span>
                  </div>
                </div>
                
                <div className="text-right flex-shrink-0">
                  <div className="text-base sm:text-xl font-bold text-primary">{entry.score.toLocaleString()}</div>
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground">points</div>
                </div>
              </div>
            ))
          )}
        </div>

        </div>
      </div>
    </ScrollArea>
  );
};

export default Leaderboard;
