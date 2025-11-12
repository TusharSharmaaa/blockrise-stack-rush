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
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      return;
    }

    // Don't check if offline
    if (!isOnline) {
      setUsernameAvailable(null);
      setIsCheckingUsername(false);
      return;
    }

    // Start checking state
    setIsCheckingUsername(true);
    setUsernameAvailable(null);

    // Debounce the actual check by 500ms
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const isUnique = await checkNameUnique(name.trim());
        setUsernameAvailable(isUnique);
      } catch (error) {
        console.error('Error checking username:', error);
        setUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [name, checkNameUnique, isOnline]);

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
            {!errors.name && name.length >= 3 && !isCheckingUsername && usernameAvailable === false && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Username already taken
              </p>
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
