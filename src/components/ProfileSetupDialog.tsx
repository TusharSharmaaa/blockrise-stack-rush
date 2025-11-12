import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Globe, Check, ChevronsUpDown, WifiOff } from 'lucide-react';
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

      // Check name uniqueness
      console.log('[ProfileSetup] Checking name uniqueness...');
      const isUnique = await checkNameUnique(validatedData.name);
      console.log('[ProfileSetup] Uniqueness check result:', isUnique);
      
      if (!isUnique) {
        setErrors({ name: 'Name already taken — please choose a different name.' });
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
      setErrors({ name: errorMessage });
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
            <Input
              id="setup-name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors(prev => ({ ...prev, name: undefined }));
              }}
              maxLength={30}
              required
              disabled={isSubmitting}
            />
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
            disabled={isSubmitting || countriesLoading || !name || !country || !isOnline}
          >
            {isSubmitting ? 'Saving...' : isOnline ? 'Save & Continue' : 'Offline - Cannot Save'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSetupDialog;
