import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, User, MapPin, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useGameProgress } from '@/hooks/useGameProgress';
import { toast } from 'sonner';

const Profile = () => {
  const navigate = useNavigate();
  const { profile, createProfile, updateProfile } = useUserProfile();
  const { progress } = useGameProgress();
  const [username, setUsername] = useState(profile?.username || '');
  const [city, setCity] = useState(profile?.city || '');
  const [country, setCountry] = useState(profile?.country || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const result = profile 
      ? await updateProfile({ username, city, country })
      : await createProfile(username, city, country);

    if (result.success) {
      toast.success(profile ? 'Profile updated!' : 'Profile created!');
      navigate('/leaderboard');
    } else {
      toast.error(result.error || 'Failed to save profile');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto p-6 space-y-6">
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
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Username (visible to all)
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter unique username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                required
              />
              <p className="text-xs text-muted-foreground">
                This will be shown on the leaderboard
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                City
              </Label>
              <Input
                id="city"
                type="text"
                placeholder="Your city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                maxLength={30}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Country
              </Label>
              <Input
                id="country"
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
              {isSubmitting ? 'Saving...' : profile ? 'Update Profile' : 'Create Profile'}
            </Button>
          </form>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Your profile will be visible on the global leaderboard</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
