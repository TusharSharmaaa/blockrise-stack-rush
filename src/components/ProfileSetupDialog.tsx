import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, MapPin, Globe } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';

const ProfileSetupDialog = () => {
  const { profile, createProfile } = useUserProfile();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Show dialog if profile doesn't exist
    if (!profile) {
      setOpen(true);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !city.trim() || !country.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await createProfile(username, city, country);
      toast.success('Profile created! Welcome to BlockRise! 🎉');
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to BlockRise!</DialogTitle>
          <DialogDescription>
            Set up your profile to appear on the global leaderboard
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="setup-username" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Username
            </Label>
            <Input
              id="setup-username"
              type="text"
              placeholder="Enter unique username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              required
            />
            <p className="text-xs text-muted-foreground">
              Visible on leaderboard
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="setup-city" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              City
            </Label>
            <Input
              id="setup-city"
              type="text"
              placeholder="Your city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              maxLength={30}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="setup-country" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Country
            </Label>
            <Input
              id="setup-country"
              type="text"
              placeholder="Your country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              maxLength={30}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full gradient-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Profile'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSetupDialog;
