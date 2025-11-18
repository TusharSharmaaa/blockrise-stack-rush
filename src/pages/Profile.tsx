import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, User, Globe, Check, ChevronsUpDown, WifiOff, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useCountries } from '@/hooks/useCountries';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { validateProfileData } from '@/utils/validation';
import Fuse from 'fuse.js';

const Profile = () => {
  const navigate = useNavigate();
  const { profile, updateProfile, checkNameUnique, canChangeUsername, recordUsernameChange } = useUserProfile();
  const { progress, isLoading } = useGameProgress();
  const { countries, isLoading: countriesLoading } = useCountries();
  const isOnline = useOnlineStatus();
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [name, setName] = useState(profile?.username || '');
  const [country, setCountry] = useState(profile?.country || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (profile?.username) {
      setName(profile.username);
    }
    if (profile?.country) {
      setCountry(profile.country);
    }
  }, [profile?.username, profile?.country]);

  // Configure Fuse.js for fuzzy search
  const fuse = new Fuse(countries, {
    keys: ['name', 'code'],
    threshold: 0.4,
    includeScore: true,
  });

  // Filter countries using fuzzy search
  const filteredCountries = searchQuery
    ? fuse.search(searchQuery).map(result => result.item)
    : countries;

  const nameChangeInfo = canChangeUsername(progress.currentLevel || 1);
  const canEditName = !profile?.username || nameChangeInfo.canChange;
  const countryLocked = Boolean(profile?.country);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Check online status before proceeding
    if (!isOnline) {
      toast.error('No internet connection. Please check your network and try again.');
      return;
    }

    setIsSubmitting(true);
    setError(undefined);
    
    try {
      // Validate and sanitize inputs
      const validatedData = validateProfileData({
        name,
        country: countryLocked ? (profile?.country || '') : country,
      });

      const isNameChange = profile?.username && validatedData.name !== profile.username;

      if (isNameChange && !nameChangeInfo.canChange) {
        setError(nameChangeInfo.reason || 'You cannot change your name yet.');
        setIsSubmitting(false);
        return;
      }

      // Check name uniqueness only if name changed
      if (isNameChange) {
        const isUnique = await checkNameUnique(validatedData.name, profile?.user_id);
        if (!isUnique) {
          setError('Name already taken — please choose a different name.');
          setIsSubmitting(false);
          return;
        }
      }

      if (profile) {
        await updateProfile({ 
          username: validatedData.name,
          city: '',
          country: validatedData.country 
        });
        if (isNameChange) {
          recordUsernameChange(progress.currentLevel || 1);
        }
        toast.success('Profile updated!');
      }
      navigate('/leaderboard');
    } catch (error: any) {
      const errorMessage = error?.message || 'Saving failed. Check your connection and try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="min-h-full bg-background relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-hero opacity-50 animate-gradient pointer-events-none" />
        
        <div className="container-responsive space-y-6 relative z-10 py-4 sm:py-6 pb-20">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl font-bold">Your Profile</h1>
        </div>

        {/* Stats Card */}
        <Card className="p-6 space-y-4 bg-gradient-to-br from-primary/10 to-accent/10">
          <h2 className="text-xl font-semibold">Your Stats</h2>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{progress.highestScore.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Best Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{progress.currentLevel}</div>
                <div className="text-xs text-muted-foreground">Current Level</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{progress.totalGamesPlayed.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Games Played</div>
              </div>
            </div>
          )}
        </Card>

        {/* Profile Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isOnline && (
              <Alert variant="destructive">
                <WifiOff className="h-4 w-4" />
                <AlertDescription>
                  You're offline. Connect to the internet to update your profile.
                </AlertDescription>
              </Alert>
            )}
            
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(undefined);
                }}
                maxLength={30}
                required
                disabled={isSubmitting || !canEditName}
              />
              <p
                className={cn(
                  "text-xs",
                  nameChangeInfo.canChange ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                )}
              >
                {profile?.username
                  ? nameChangeInfo.reason
                  : 'This will be shown on the leaderboard'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Country
              </Label>
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full justify-between"
                    disabled={isSubmitting || countriesLoading || countryLocked}
                  >
                    {country || "Type or select your country"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Search country..." 
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup>
                        {filteredCountries.map((c) => (
                          <CommandItem
                            key={c.code}
                            value={c.name}
                            onSelect={(currentValue) => {
                              setCountry(currentValue);
                              setComboboxOpen(false);
                              setSearchQuery('');
                              setError(undefined);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                country === c.name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {c.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p
                className={cn(
                  "text-xs",
                  countryLocked ? "text-muted-foreground" : "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {countryLocked
                  ? "Country is locked after initial setup."
                  : "You can set your country only once."}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary"
              disabled={isSubmitting || !isOnline}
            >
              {isSubmitting ? 'Saving...' : isOnline ? 'Update Profile' : 'Offline - Cannot Save'}
            </Button>
          </form>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Your profile will be visible on the global leaderboard</p>
        </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default Profile;
