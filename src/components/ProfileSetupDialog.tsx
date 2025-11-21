import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { sanitizeUsername, validateProfileData } from '@/utils/validation';
import { Skeleton } from '@/components/ui/skeleton';
import Fuse from 'fuse.js';

const USERNAME_CACHE_DURATION_MS = 5 * 60 * 1000;

const ProfileSetupDialog = () => {
  const { profile, isLoading: profileLoading, createProfile, checkNameUnique } = useUserProfile();
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
  const [showSkipValidation, setShowSkipValidation] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const skipButtonTimerRef = useRef<NodeJS.Timeout | null>(null);
  const usernameCheckCacheRef = useRef<Map<string, { available: boolean; timestamp: number }>>(new Map());
  const checkNameUniqueRef = useRef(checkNameUnique);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const countryButtonRef = useRef<HTMLButtonElement>(null);
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const countrySearchInputRef = useRef<HTMLInputElement>(null);

  const generateUsernameSuggestions = useCallback(async (baseName: string) => {
    const normalizedBase = sanitizeUsername(baseName);
    if (!normalizedBase) {
      setUsernameSuggestions([]);
      return;
    }
    const suggestions: string[] = [];
    
    // Get country code if available
    const selectedCountry = countries.find(c => c.name === country);
    const countryCode = selectedCountry?.code?.slice(0, 2).toUpperCase() || '';
    const countryName = country.toLowerCase().replace(/\s+/g, '');
    
    // Generate different types of suggestions
    const candidates = [
      `${normalizedBase}_${countryCode}`,           // username_IN
      `${normalizedBase}_${countryName}`,           // username_india
      `${normalizedBase}${countryCode}`,            // usernameIN
      `${normalizedBase}2`,                         // username2
      `${normalizedBase}_2`,                        // username_2
      `${normalizedBase}3`,                         // username3
      `${normalizedBase}_${Math.floor(Math.random() * 100)}`, // username_42
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
        
        if (cached && (now - cached.timestamp) < USERNAME_CACHE_DURATION_MS) {
          // Use cached result
          isAvailable = cached.available;
        } else {
          // Make API call
          isAvailable = await checkNameUniqueRef.current(candidate);
          
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
  }, [countries, country]);

  // Keep ref updated with latest function
  useEffect(() => {
    checkNameUniqueRef.current = checkNameUnique;
  }, [checkNameUnique]);

  // Auto-focus country search input when popover opens
  useEffect(() => {
    if (comboboxOpen && countrySearchInputRef.current) {
      // Small delay to ensure popover is fully rendered
      setTimeout(() => {
        countrySearchInputRef.current?.focus();
      }, 150);
    }
  }, [comboboxOpen]);

  // Configure Fuse.js for fuzzy search with more lenient matching for incremental typing
  const fuse = useMemo(() => new Fuse(countries, {
    keys: ['name', 'code'],
    threshold: 0.3, // More lenient threshold for better incremental search (0.0 = exact, 1.0 = match anything)
    includeScore: true,
    ignoreLocation: true, // Search anywhere in the string
    minMatchCharLength: 1, // Match even single characters
    findAllMatches: true, // Find all matches, not just best
  }), [countries]);

  // Filter countries using fuzzy search with fallback for short queries
  const filteredCountries = useMemo(() => {
    // If no search query, show ALL countries
    if (!searchQuery || searchQuery.trim() === '') {
      console.log('[ProfileSetup] Showing all countries:', countries.length);
      return countries;
    }
    
    const query = searchQuery.trim().toLowerCase();
    console.log('[ProfileSetup] Filtering countries with query:', query);
    
    // For very short queries (1-2 chars), use simple prefix matching for better UX
    if (query.length <= 2) {
      const prefixMatches = countries.filter(c => 
        c.name.toLowerCase().startsWith(query) || 
        c.code.toLowerCase().startsWith(query)
      );
      console.log('[ProfileSetup] Prefix matches found:', prefixMatches.length);
      if (prefixMatches.length > 0) {
        return prefixMatches;
      }
    }
    
    // For longer queries, use fuzzy search
    const fuzzyResults = fuse.search(searchQuery);
    const matchedCountries = fuzzyResults.map(result => result.item);
    console.log('[ProfileSetup] Fuzzy search matches found:', matchedCountries.length);
    return matchedCountries;
  }, [searchQuery, countries, fuse]);

  useEffect(() => {
    // Don't show dialog while profile is loading
    if (profileLoading) {
      return;
    }

    // Validate profile existence and show dialog if needed
    const validateAndShowDialog = async () => {
      const profileComplete = localStorage.getItem('blockrise_profile_complete');
      const profileId = localStorage.getItem('profileId');
      
      // If profile exists in state and has username, don't show dialog
      if (profile?.id && profile?.username) {
        setOpen(false);
        return;
      }
      
      // If no profile in state, check localStorage and validate
      if (!profile) {
        // If profileId exists in localStorage, validate it exists in database
        if (profileId) {
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('id, username, country')
              .eq('id', profileId)
              .single();
            
            if (error || !profileData || !profileData.username) {
              // Invalid profile - clear localStorage flags
              console.log('[ProfileSetup] Invalid profile in localStorage, clearing...');
              localStorage.removeItem('profileId');
              localStorage.removeItem('blockrise_profile_complete');
              setOpen(true);
            } else {
              // Valid profile exists - don't show dialog
              setOpen(false);
            }
          } catch (error) {
            // Error checking profile - clear flags and show dialog
            console.error('[ProfileSetup] Error validating profile:', error);
            localStorage.removeItem('profileId');
            localStorage.removeItem('blockrise_profile_complete');
            setOpen(true);
          }
        } else {
          // No profileId - check completion flag
          if (profileComplete) {
            // Completion flag exists but no profileId - invalid state, clear it
            localStorage.removeItem('blockrise_profile_complete');
          }
          // Show dialog for new users
          setOpen(true);
        }
      } else if (profile && !profile.username) {
        // Profile exists but has no username - show dialog
        setOpen(true);
      } else {
        // Profile exists with username - don't show dialog
        setOpen(false);
      }
    };

    validateAndShowDialog();
  }, [profile, profileLoading]);

  // Debounced username availability check
  useEffect(() => {
    // Clear previous timers immediately
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (skipButtonTimerRef.current) {
      clearTimeout(skipButtonTimerRef.current);
      skipButtonTimerRef.current = null;
    }

    const normalizedName = sanitizeUsername(name);

    // Reset states if name is empty or too short
    if (!normalizedName || normalizedName.length < 3) {
      setUsernameAvailable(null);
      setIsCheckingUsername(false);
      setUsernameSuggestions([]);
      setShowSkipValidation(false);
      return;
    }

    // Don't check if offline
    if (!isOnline) {
      setUsernameAvailable(null);
      setIsCheckingUsername(false);
      setUsernameSuggestions([]);
      setShowSkipValidation(false);
      return;
    }

    // Start checking state
    setIsCheckingUsername(true);
    setUsernameAvailable(null);
    setUsernameSuggestions([]);
    setShowSkipValidation(false);

    let timeoutId: NodeJS.Timeout | null = null;
    let isMounted = true;

    // Show skip button after 5 seconds
    skipButtonTimerRef.current = setTimeout(() => {
      if (isMounted) {
        setShowSkipValidation(true);
        console.log('[ProfileSetup] Showing skip validation button');
      }
    }, 5000);

    // Set a timeout to prevent infinite loading (10 seconds max)
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.error('[ProfileSetup] Username check timeout');
        setIsCheckingUsername(false);
        setUsernameAvailable(null);
        setShowSkipValidation(true);
        toast.error('Connection timeout. Please try again.');
      }
    }, 10000);

    // Debounce the actual check by 500ms
    debounceTimerRef.current = setTimeout(async () => {
      if (!isMounted) return;

      try {
        const cacheKey = normalizedName.toLowerCase().trim();
        
        // Check cache first (but allow manual refresh by not using cache for new checks)
        const cached = usernameCheckCacheRef.current.get(cacheKey);
        const now = Date.now();
        
        // Only use cache if it's recent and valid
        if (cached && (now - cached.timestamp) < USERNAME_CACHE_DURATION_MS && cached.available !== null && cached.available !== undefined) {
          // Use cached result
          console.log('[ProfileSetup] Using cached result for:', cacheKey, 'Available:', cached.available);
          if (timeoutId) clearTimeout(timeoutId);
          if (skipButtonTimerRef.current) {
            clearTimeout(skipButtonTimerRef.current);
            skipButtonTimerRef.current = null;
          }
          setShowSkipValidation(false);
          setUsernameAvailable(cached.available);
          
          // If username is taken, generate suggestions
          if (!cached.available) {
            await generateUsernameSuggestions(normalizedName);
          } else {
            setUsernameSuggestions([]);
          }
          setIsCheckingUsername(false);
          return;
        } else if (cached) {
          // Cache expired or invalid, remove it
          console.log('[ProfileSetup] Cache expired or invalid, clearing for:', cacheKey);
          usernameCheckCacheRef.current.delete(cacheKey);
        }
        
        // Make API call if not cached or expired
        console.log('[ProfileSetup] Checking username availability for:', normalizedName, 'Cache key:', cacheKey);
        const isUnique = await checkNameUniqueRef.current(normalizedName);
        console.log('[ProfileSetup] Uniqueness result:', isUnique, 'for username:', normalizedName);
        
        if (!isMounted) return;
        
        // Cache the result (only if we got a valid response)
        if (isUnique !== null && isUnique !== undefined) {
          usernameCheckCacheRef.current.set(cacheKey, {
            available: isUnique,
            timestamp: now
          });
        } else {
          console.warn('[ProfileSetup] Invalid uniqueness result, not caching:', isUnique);
        }
        
        if (timeoutId) clearTimeout(timeoutId);
        if (skipButtonTimerRef.current) {
          clearTimeout(skipButtonTimerRef.current);
          skipButtonTimerRef.current = null;
        }
        setShowSkipValidation(false);
        setUsernameAvailable(isUnique);
        
        // If username is taken, generate suggestions
        if (!isUnique) {
          await generateUsernameSuggestions(normalizedName);
        } else {
          setUsernameSuggestions([]);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('[ProfileSetup] Error checking username:', error);
        if (timeoutId) clearTimeout(timeoutId);
        if (skipButtonTimerRef.current) {
          clearTimeout(skipButtonTimerRef.current);
          skipButtonTimerRef.current = null;
        }
        setUsernameAvailable(null);
        setUsernameSuggestions([]);
        setShowSkipValidation(true);
        toast.error('Failed to check username. Please try again.');
      } finally {
        if (isMounted) {
          setIsCheckingUsername(false);
        }
      }
    }, 500);

    // Cleanup
    return () => {
      isMounted = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (skipButtonTimerRef.current) {
        clearTimeout(skipButtonTimerRef.current);
        skipButtonTimerRef.current = null;
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Reset loading state on cleanup to prevent stuck spinner
      setIsCheckingUsername(false);
    };
  }, [name, isOnline, generateUsernameSuggestions]);

  const handleSuggestionClick = (suggestion: string) => {
    const normalizedSuggestion = sanitizeUsername(suggestion);
    setName(normalizedSuggestion);
    setUsernameAvailable(true);
    setUsernameSuggestions([]);
    setShowSkipValidation(false);
    setErrors(prev => ({ ...prev, name: undefined }));
    
    // Update cache for the selected suggestion
    const suggestionLower = normalizedSuggestion.toLowerCase();
    usernameCheckCacheRef.current.set(suggestionLower, {
      available: true,
      timestamp: Date.now()
    });
  };

  const handleSkipValidation = () => {
    console.log('[ProfileSetup] User skipped validation');
    setIsCheckingUsername(false);
    setUsernameAvailable(true); // Assume available to allow proceeding
    setShowSkipValidation(false);
    setUsernameSuggestions([]);
    toast.info('Validation skipped. Proceeding with username.');
  };

  const handleUsernameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Enter/Return key to move to country field
    if (e.key === 'Enter' || e.key === 'Return') {
      e.preventDefault();
      // Small delay to ensure input value is updated
      setTimeout(() => {
        if (countryButtonRef.current) {
          countryButtonRef.current.focus();
          setComboboxOpen(true);
          // Scroll country field into view if keyboard is open
          if (countryButtonRef.current) {
            countryButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
    }
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
      if (validatedData.name !== name) {
        setName(validatedData.name);
      }
      if (validatedData.country !== country) {
        setCountry(validatedData.country);
      }
      
      console.log('[ProfileSetup] Validation passed');

      // Final check on submit (in case of race conditions)
      console.log('[ProfileSetup] Final uniqueness check...');
      
      // CRITICAL: Username must be unique - cannot proceed without it
      if (usernameAvailable === false) {
        setErrors({ name: 'This username is already taken. Please choose a different name.' });
        setIsSubmitting(false);
        toast.error('Username must be unique. Please choose a different username.');
        return;
      }
      
      // CRITICAL: Username must be confirmed as available
      if (usernameAvailable !== true) {
        setErrors({ name: 'Please wait for username validation to complete.' });
        setIsSubmitting(false);
        toast.error('Please wait for username validation to complete.');
        return;
      }

      console.log('[ProfileSetup] Creating profile...');
      const newProfile = await createProfile(validatedData.name, validatedData.country);
      console.log('[ProfileSetup] Profile created successfully');
      
      // Verify profile was saved with valid ID
      if (!newProfile || !newProfile.id) {
        throw new Error('Profile was not saved properly. Please try again.');
      }

      if (newProfile.isOffline) {
        console.warn('[ProfileSetup] Operating in offline profile mode. Skipping Supabase verification.');
        localStorage.setItem('blockrise_profile_complete', 'true');
        setOpen(false);
        toast.success('Profile saved locally. We will sync once Supabase is reachable again.');
        return;
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
      
      // Mark as complete if everything succeeded
      localStorage.setItem('blockrise_profile_complete', 'true');
      localStorage.setItem('profileId', newProfile.id);
      
      // Close dialog
      setOpen(false);
      
      toast.success('Profile created! Welcome to BlockRise! 🎉');
    } catch (error: unknown) {
      console.error('[ProfileSetup] Error during submission:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Saving failed. Check your connection and try again.';
      
      // Handle username conflict specifically
      if (errorMessage === 'USERNAME_TAKEN' || 
          errorMessage.includes('username') || 
          errorMessage.includes('unique') ||
          errorMessage.includes('duplicate')) {
        setErrors({ name: 'This username is already taken. Please choose a different name.' });
        setUsernameAvailable(false);
        toast.error('Username already taken. Please choose a unique username.');
      } else {
        setErrors({ name: errorMessage });
        toast.error('Failed to save profile. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={() => {
        // Prevent closing - modal is mandatory until profile is created
        // User cannot proceed without a unique username
        return;
      }}
      modal={true}
    >
      <DialogContent 
        ref={dialogContentRef}
        className="sm:max-w-md z-50 max-h-[90vh] overflow-y-auto" 
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toast.info('Please complete your profile to continue');
        }}
        onPointerDownOutside={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toast.info('Please complete your profile to continue');
        }}
        onInteractOutside={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toast.info('Please complete your profile to continue');
        }}
      >
        <DialogHeader>
          <DialogTitle>Welcome to BlockRise!</DialogTitle>
          <DialogDescription>
            Create your profile with a unique username to join the leaderboard and start playing
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
              Username <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              Your username must be unique and will be displayed on the leaderboard
            </p>
            <div className="relative">
              <Input
                ref={usernameInputRef}
                id="setup-name"
                type="text"
                inputMode="text"
                enterKeyHint="next"
                autoComplete="username"
                placeholder="Enter your name (min 3 characters)"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors(prev => ({ ...prev, name: undefined }));
                }}
                onKeyDown={handleUsernameKeyDown}
                onFocus={() => {
                  // Scroll into view when focused on mobile
                  setTimeout(() => {
                    if (usernameInputRef.current) {
                      usernameInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }, 300);
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
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-48" />
                  {showSkipValidation && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSkipValidation}
                      className="text-xs h-7 text-muted-foreground hover:text-foreground"
                    >
                      Skip validation →
                    </Button>
                  )}
                </div>
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
            <Popover open={comboboxOpen} onOpenChange={(open) => {
              setComboboxOpen(open);
              // Scroll country field into view when opening popover
              if (open && countryButtonRef.current) {
                setTimeout(() => {
                  countryButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
              }
            }}>
              <PopoverTrigger asChild>
                <Button
                  ref={countryButtonRef}
                  id="setup-country"
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full justify-between"
                  disabled={isSubmitting || countriesLoading}
                  type="button"
                  onFocus={() => {
                    // Scroll into view when focused
                    setTimeout(() => {
                      if (countryButtonRef.current) {
                        countryButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }, 100);
                  }}
                >
                  {country || "Type or select your country"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-full p-0 max-h-[300px] overflow-y-auto" 
                align="start"
                sideOffset={4}
                avoidCollisions={true}
                collisionPadding={8}
              >
                <Command shouldFilter={false}>
                  <CommandInput 
                    ref={countrySearchInputRef}
                    placeholder="Search country..." 
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    inputMode="search"
                    enterKeyHint="search"
                    autoFocus
                  />
                  <CommandList>
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup>
                      {filteredCountries.length > 0 && (
                        <div className="text-xs text-muted-foreground px-2 py-1 border-b">
                          Showing {filteredCountries.length} {filteredCountries.length === 1 ? 'country' : 'countries'}
                        </div>
                      )}
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
              usernameAvailable !== true ||
              name.trim().length < 3
            }
          >
            {isSubmitting ? 'Saving...' : 
             isCheckingUsername ? 'Checking username...' :
             usernameAvailable === false ? 'Username taken - Choose another' :
             usernameAvailable !== true ? 'Validating username...' :
             !isOnline ? 'Offline - Cannot Save' : 
             'Save & Continue'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSetupDialog;
