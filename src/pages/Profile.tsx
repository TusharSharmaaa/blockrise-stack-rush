import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, User, MapPin, Globe, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useCountries } from '@/hooks/useCountries';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { validateProfileData } from '@/utils/validation';

const Profile = () => {
  const navigate = useNavigate();
  const { profile, updateProfile, checkNameUnique } = useUserProfile();
  const { progress } = useGameProgress();
  const { countries, isLoading: countriesLoading } = useCountries();
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [name, setName] = useState(profile?.username || '');
  const [country, setCountry] = useState(profile?.country || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(undefined);
    
    try {
      // Validate and sanitize inputs
      const validatedData = validateProfileData({
        name,
        country,
      });

      // Check name uniqueness only if name changed
      if (validatedData.name !== profile?.username) {
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
    <ScrollArea className="h-screen">
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-md mx-auto p-4 sm:p-6 space-y-6">
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
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{progress.highestScore}</div>
              <div className="text-xs text-muted-foreground">Best Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{progress.currentLevel}</div>
              <div className="text-xs text-muted-foreground">Current Level</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{progress.totalGamesPlayed}</div>
              <div className="text-xs text-muted-foreground">Games Played</div>
            </div>
          </div>
        </Card>

        {/* Profile Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
              />
              <p className="text-xs text-muted-foreground">
                This will be shown on the leaderboard
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
                    disabled={isSubmitting || countriesLoading}
                  >
                    {country || "Type or select your country"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search country..." />
                    <CommandList>
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup>
                        {countries.map((c) => (
                          <CommandItem
                            key={c.code}
                            value={c.name}
                            onSelect={(currentValue) => {
                              setCountry(currentValue);
                              setComboboxOpen(false);
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
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Update Profile'}
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
