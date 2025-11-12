import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Globe, Check, ChevronsUpDown, WifiOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useCountries } from '@/hooks/useCountries';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { toast } from 'sonner';
import { validateProfileData } from '@/utils/validation';
import Fuse from 'fuse.js';
import { Skeleton } from '@/components/ui/skeleton';

const ProfileSetupDialog = () => {
  const { profile, createProfile, checkNameUnique } = useUserProfile();
  const { countries, isLoading: countriesLoading } = useCountries();
  const isOnline = useOnlineStatus();
  const [open, setOpen] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; country?: string }>({});
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const usernameCheckCacheRef = useRef<Map<string, { available: boolean; timestamp: number }>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Configure Fuse.js for fuzzy search
  const fuse = new Fuse(countries, {
    keys: ['name', 'code'],
    threshold: 0.4, // Lower = stricter matching, Higher = more fuzzy
    includeScore: true,
  });

  // Filter countries using fuzzy search
  const filteredCountries = searchQuery
    ? fuse.search(searchQuery).map(result => result.item)
    : countries;

  useEffect(() => {
    // Show dialog if profile doesn't exist
    if (!profile) {
      setOpen(true);
    }
  }, [profile]);

  // Debounced username availability check
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Reset states if name is empty or too short
    if (!name || name.trim().length < 3) {
      setUsernameAvailable(null);
      setIsCheckingUsername(false);
      setUsernameSuggestions([]);
      return;
    }

    // Don't check if offline
    if (!isOnline) {
      setUsernameAvailable(null);
      setIsCheckingUsername(false);
      setUsernameSuggestions([]);
      return;
    }

    // Start checking state
    setIsCheckingUsername(true);
    setUsernameAvailable(null);
    setUsernameSuggestions([]);

    // Set a timeout to prevent infinite loading (10 seconds max)
    const timeoutId = setTimeout(() => {
      console.error('[ProfileSetup] Username check timeout');
      setIsCheckingUsername(false);
      setUsernameAvailable(null);
      toast.error('Connection timeout. Please try again.');
    }, 10000);

    // Debounce the actual check by 500ms
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const trimmedName = name.trim().toLowerCase();
        
        // Check cache first
        const cached = usernameCheckCacheRef.current.get(trimmedName);
        const now = Date.now();
        
        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
          // Use cached result
          console.log('[ProfileSetup] Using cached result for:', trimmedName);
          clearTimeout(timeoutId);
          setUsernameAvailable(cached.available);
          
          // If username is taken, generate suggestions
          if (!cached.available) {
            await generateUsernameSuggestions(name.trim());
          } else {
            setUsernameSuggestions([]);
          }
          setIsCheckingUsername(false);
          return;
        }
        
        // Make API call if not cached or expired
        console.log('[ProfileSetup] Checking username availability for:', name.trim());
        const isUnique = await checkNameUnique(name.trim());
        console.log('[ProfileSetup] Uniqueness result:', isUnique);
        
        // Cache the result
        usernameCheckCacheRef.current.set(trimmedName, {
          available: isUnique,
          timestamp: now
        });
        
        clearTimeout(timeoutId);
        setUsernameAvailable(isUnique);
        
        // If username is taken, generate suggestions
        if (!isUnique) {
          await generateUsernameSuggestions(name.trim());
        } else {
          setUsernameSuggestions([]);
        }
      } catch (error) {
        console.error('[ProfileSetup] Error checking username:', error);
        clearTimeout(timeoutId);
        setUsernameAvailable(null);
        setUsernameSuggestions([]);
        toast.error('Failed to check username. Please try again.');
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      clearTimeout(timeoutId);
    };
  }, [name, checkNameUnique, isOnline]);

  const generateUsernameSuggestions = async (baseName: string) => {
    const suggestions: string[] = [];
    
    // Get country code if available
    const selectedCountry = countries.find(c => c.name === country);
    const countryCode = selectedCountry?.code?.slice(0, 2).toUpperCase() || '';
    const countryName = country.toLowerCase().replace(/\s+/g, '');
    
    // Generate different types of suggestions
    const candidates = [
      `${baseName}_${countryCode}`,           // username_IN
      `${baseName}_${countryName}`,           // username_india
      `${baseName}${countryCode}`,            // usernameIN
      `${baseName}2`,                         // username2
      `${baseName}_2`,                        // username_2
      `${baseName}3`,                         // username3
      `${baseName}_${Math.floor(Math.random() * 100)}`, // username_42
    ];
    
    // Check availability of each suggestion
    for (const candidate of candidates) {
      if (suggestions.length >= 3) break; // Limit to 3 suggestions
      
      try {
        const candidateLower = candidate.toLowerCase();
        
        // Check cache first
        const cached = usernameCheckCacheRef.current.get(candidateLower);
        const now = Date.now();
        
        let isAvailable: boolean;
        
        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
          // Use cached result
          isAvailable = cached.available;
        } else {
          // Make API call
          isAvailable = await checkNameUnique(candidate);
          
          // Cache the result
          usernameCheckCacheRef.current.set(candidateLower, {
            available: isAvailable,
            timestamp: now
          });
        }
        
        if (isAvailable) {
          suggestions.push(candidate);
        }
      } catch (error) {
        console.error('Error checking suggestion:', candidate, error);
      }
    }
    
    setUsernameSuggestions(suggestions);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setName(suggestion);
    setUsernameAvailable(true);
    setUsernameSuggestions([]);
    setErrors(prev => ({ ...prev, name: undefined }));
    
    // Update cache for the selected suggestion
    const suggestionLower = suggestion.toLowerCase();
    usernameCheckCacheRef.current.set(suggestionLower, {
      available: true,
      timestamp: Date.now()
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Check online status before proceeding
    if (!isOnline) {
      toast.error('No internet connection. Please check your network and try again.');
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    
    console.log('[ProfileSetup] Starting submission:', { name, country });
    
    try {
      // Validate and sanitize inputs
      const validatedData = validateProfileData({
        name,
        country,
      });
      
      console.log('[ProfileSetup] Validation passed');

      // Final check on submit (in case of race conditions)
      console.log('[ProfileSetup] Final uniqueness check...');
      if (usernameAvailable === false) {
        setErrors({ name: 'This username is already taken. Please choose a different name.' });
        setIsSubmitting(false);
        return;
      }

      console.log('[ProfileSetup] Creating profile...');
      const newProfile = await createProfile(validatedData.name, validatedData.country);
      console.log('[ProfileSetup] Profile created successfully');
      
      // Verify profile was saved with valid ID
      if (!newProfile || !newProfile.id) {
        throw new Error('Profile was not saved properly. Please try again.');
      }
      
      // Double-check the profile exists in backend
      console.log('[ProfileSetup] Verifying profile in backend...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', newProfile.id)
        .single();
      
      if (verifyError || !verifyData) {
        console.error('[ProfileSetup] Backend verification failed:', verifyError);
        throw new Error('Could not verify profile was saved. Please try again.');
      }
      
      console.log('[ProfileSetup] Backend verification successful:', verifyData);
      
      // Only mark as complete if everything succeeded
      localStorage.setItem('blockrise_profile_complete', 'true');
      
      toast.success('Profile created! Welcome to BlockRise! 🎉');
      setOpen(false);
    } catch (error: any) {
      console.error('[ProfileSetup] Error during submission:', error);
      const errorMessage = error?.message || 'Saving failed. Check your connection and try again.';
      
      // Handle username conflict specifically
      if (errorMessage === 'USERNAME_TAKEN') {
        setErrors({ name: 'This username is already taken. Please choose a different name.' });
        toast.error('Username already taken');
      } else {
        setErrors({ name: errorMessage });
        toast.error('Failed to save profile');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {
      // Prevent closing - modal is mandatory
      return;
    }}>
      <DialogContent 
        className="sm:max-w-md" 
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Welcome to BlockRise!</DialogTitle>
          <DialogDescription>
            Complete your profile to get started
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isOnline && (
            <Alert variant="destructive">
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                You're offline. Connect to the internet to create your profile.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="setup-name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Name
            </Label>
            <div className="relative">
              <Input
                id="setup-name"
                type="text"
                placeholder="Enter your name (min 3 characters)"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors(prev => ({ ...prev, name: undefined }));
                }}
                maxLength={30}
                required
                disabled={isSubmitting}
                className={cn(
                  "pr-10",
                  usernameAvailable === true && "border-green-500 focus-visible:ring-green-500",
                  usernameAvailable === false && "border-destructive focus-visible:ring-destructive"
                )}
              />
              {/* Availability indicator */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isCheckingUsername && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {!isCheckingUsername && usernameAvailable === true && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {!isCheckingUsername && usernameAvailable === false && (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>
            
            {/* Real-time feedback messages */}
            {!errors.name && name.length >= 3 && !isCheckingUsername && usernameAvailable === true && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Username available!
              </p>
            )}
            
            {/* Loading skeleton while checking */}
            {!errors.name && name.length >= 3 && isCheckingUsername && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-40" />
                  <div className="flex gap-2">
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-7 w-28" />
                    <Skeleton className="h-7 w-20" />
                  </div>
                </div>
              </div>
            )}
            
            {!errors.name && name.length >= 3 && !isCheckingUsername && usernameAvailable === false && (
              <div className="space-y-2">
                <p className="text-sm text-destructive flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Username already taken
                </p>
                
                {/* Username suggestions */}
                {usernameSuggestions.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Try these available usernames:</p>
                    <div className="flex flex-wrap gap-2">
                      {usernameSuggestions.map((suggestion) => (
                        <Button
                          key={suggestion}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs h-7 hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="setup-country" className="flex items-center gap-2">
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
                            setErrors(prev => ({ ...prev, country: undefined }));
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
            {errors.country && (
              <p className="text-sm text-destructive">{errors.country}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full gradient-primary"
            disabled={
              isSubmitting || 
              countriesLoading || 
              !name || 
              !country || 
              !isOnline || 
              isCheckingUsername ||
              usernameAvailable === false ||
              name.length < 3
            }
          >
            {isSubmitting ? 'Saving...' : 
             isCheckingUsername ? 'Checking username...' :
             usernameAvailable === false ? 'Username taken' :
             !isOnline ? 'Offline - Cannot Save' : 
             'Save & Continue'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSetupDialog;
