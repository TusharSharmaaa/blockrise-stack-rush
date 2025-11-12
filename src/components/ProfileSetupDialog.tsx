import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Globe } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useCountries } from '@/hooks/useCountries';
import { toast } from 'sonner';
import { validateProfileData } from '@/utils/validation';

const ProfileSetupDialog = () => {
  const { profile, createProfile, checkNameUnique } = useUserProfile();
  const { countries, isLoading: countriesLoading } = useCountries();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; country?: string }>({});

  useEffect(() => {
    // Show dialog if profile doesn't exist
    if (!profile) {
      setOpen(true);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrors({});
    
    try {
      // Validate and sanitize inputs
      const validatedData = validateProfileData({
        name,
        country,
      });

      // Check name uniqueness
      const isUnique = await checkNameUnique(validatedData.name);
      if (!isUnique) {
        setErrors({ name: 'Name already taken — please choose a different name.' });
        setIsSubmitting(false);
        return;
      }

      await createProfile(validatedData.name, validatedData.country);
      
      // Store locally to prevent re-prompting
      localStorage.setItem('blockrise_profile_complete', 'true');
      
      toast.success('Profile created! Welcome to BlockRise! 🎉');
      setOpen(false);
    } catch (error: any) {
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
            <Select
              value={country}
              onValueChange={(value) => {
                setCountry(value);
                setErrors(prev => ({ ...prev, country: undefined }));
              }}
              disabled={isSubmitting || countriesLoading}
            >
              <SelectTrigger id="setup-country">
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {countries.map((c) => (
                  <SelectItem key={c.code} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && (
              <p className="text-sm text-destructive">{errors.country}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full gradient-primary"
            disabled={isSubmitting || countriesLoading || !name || !country}
          >
            {isSubmitting ? 'Saving...' : 'Save & Continue'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSetupDialog;
