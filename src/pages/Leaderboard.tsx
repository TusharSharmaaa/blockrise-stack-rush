import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Medal, MapPin, User, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useBackButton } from '@/hooks/useBackButton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef } from 'react';

const Leaderboard = () => {
  const navigate = useNavigate();
  useBackButton(); // Handle Android back button
  const { profile } = useUserProfile();
  const { progress } = useGameProgress();
  const { entries, userPosition, isLoading } = useLeaderboard(profile?.id);
  const userEntryRef = useRef<HTMLDivElement>(null);
  const currentPlayerLevel = progress.currentLevel;

  const adjustedUserPosition = userPosition
    ? {
        ...userPosition,
        entry: userPosition.entry
          ? {
              ...userPosition.entry,
              level: Math.max(userPosition.entry.level, currentPlayerLevel)
            }
          : userPosition.entry
      }
    : null;

  const adjustedEntries = entries.map(entry =>
    entry.isCurrentUser
      ? {
          ...entry,
          level: Math.max(entry.level, currentPlayerLevel)
        }
      : entry
  );

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
    if (rank === 1) return <Trophy className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-amber-700" />;
    return <span className="text-sm sm:text-base md:text-lg font-bold text-muted-foreground">#{rank}</span>;
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
        
        <div className="container-responsive space-y-3 sm:space-y-4 md:space-y-6 relative z-10 py-3 sm:py-4 md:py-6 pb-16 sm:pb-20 overflow-x-hidden">
        <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Leaderboard</h1>
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
        {profile && adjustedUserPosition && (
          <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-accent/10 border-2 border-primary/50 rounded-lg p-3 sm:p-4 md:p-5 shadow-lg mb-4 sm:mb-6 overflow-hidden">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-primary">Your Position</h2>
            </div>
            <div className="bg-background/80 rounded-lg p-2 sm:p-3 md:p-4 flex items-center gap-2 sm:gap-3 md:gap-4 overflow-hidden">
              <div className="w-10 sm:w-12 md:w-16 flex items-center justify-center flex-shrink-0">
                {getRankIcon(adjustedUserPosition.rank)}
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                  <span className="text-base sm:text-xl md:text-2xl flex-shrink-0">{getCountryFlag(adjustedUserPosition.entry?.country || '')}</span>
                  <div className="font-bold text-sm sm:text-base md:text-lg truncate min-w-0">
                    {adjustedUserPosition.entry?.username}
                    <Badge className="ml-1 sm:ml-2 text-[10px] sm:text-xs bg-primary text-primary-foreground">You</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 text-[10px] sm:text-xs md:text-sm text-muted-foreground overflow-hidden flex-wrap">
                  <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 flex-shrink-0" />
                  <span className="truncate min-w-0">{adjustedUserPosition.entry?.city}, {adjustedUserPosition.entry?.country}</span>
                  <span className="mx-0.5 sm:mx-1 flex-shrink-0">•</span>
                  <span className="whitespace-nowrap flex-shrink-0">Lvl {adjustedUserPosition.entry?.level}</span>
                  <span className="mx-0.5 sm:mx-1 flex-shrink-0">•</span>
                  <span className="whitespace-nowrap flex-shrink-0">#{adjustedUserPosition.rank} of {adjustedUserPosition.totalPlayers}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-1 sm:ml-2">
                <div className="text-base sm:text-xl md:text-2xl font-bold text-primary whitespace-nowrap">{adjustedUserPosition.entry?.score.toLocaleString()}</div>
                <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">points</div>
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
            adjustedEntries.map((entry, idx) => (
              <div
                key={entry.id}
                ref={entry.isCurrentUser ? userEntryRef : null}
                className={`bg-card rounded-lg p-2 sm:p-3 md:p-4 flex items-center gap-1.5 sm:gap-2 md:gap-3 transition-all border overflow-hidden ${
                  entry.isCurrentUser 
                    ? 'border-4 border-primary shadow-xl bg-gradient-to-r from-primary/20 via-primary/10 to-accent/10 ring-2 ring-primary/30' 
                    : 'card-elevated border-border'
                } ${idx < 3 && !entry.isCurrentUser ? 'bg-gradient-to-r from-primary/5 to-accent/5' : ''}`}
              >
                <div className="w-8 sm:w-10 md:w-14 flex items-center justify-center flex-shrink-0">
                  {getRankIcon(entry.rank)}
                </div>
                
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-0.5 sm:mb-1">
                    <span className="text-sm sm:text-base md:text-xl flex-shrink-0">{getCountryFlag(entry.country)}</span>
                    <div className="font-semibold text-xs sm:text-sm md:text-base truncate min-w-0">
                      {entry.username}
                      {entry.isCurrentUser && <Badge className="ml-1 sm:ml-1.5 md:ml-2 text-[10px] sm:text-xs">You</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 text-[9px] sm:text-[10px] md:text-xs text-muted-foreground overflow-hidden">
                    <MapPin className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 flex-shrink-0" />
                    <span className="truncate min-w-0">{entry.city}, {entry.country}</span>
                    <span className="mx-0.5 sm:mx-1 flex-shrink-0">•</span>
                    <span className="whitespace-nowrap flex-shrink-0">Lvl {entry.level}</span>
                  </div>
                </div>
                
                <div className="text-right flex-shrink-0 ml-1 sm:ml-2">
                  <div className="text-sm sm:text-base md:text-xl font-bold text-primary whitespace-nowrap">{entry.score.toLocaleString()}</div>
                  <div className="text-[8px] sm:text-[9px] md:text-[10px] text-muted-foreground">points</div>
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
