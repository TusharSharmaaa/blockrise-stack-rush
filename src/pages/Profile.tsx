import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, User, Globe, Lock, Edit2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { validateProfileData } from '@/utils/validation';

const Profile = () => {
  const navigate = useNavigate();
  const { profile, updateProfile, checkNameUnique, canChangeUsername, recordUsernameChange } = useUserProfile();
  const { progress } = useGameProgress();
  const isOnline = useOnlineStatus();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(profile?.username || '');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const usernameChangeInfo = canChangeUsername(progress.currentLevel);
  
  // Update newUsername when profile changes
  useEffect(() => {
    if (profile?.username && !isEditingUsername) {
      setNewUsername(profile.username);
    }
  }, [profile?.username, isEditingUsername]);

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

        {/* Profile Info */}
        <Card className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">Username</span>
                  {!usernameChangeInfo.canChange && <Lock className="h-3 w-3" />}
                </div>
                {usernameChangeInfo.canChange && !isEditingUsername && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingUsername(true);
                      setNewUsername(profile?.username || '');
                      setUsernameAvailable(null);
                    }}
                    className="h-7 text-xs"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Change
                  </Button>
                )}
              </div>
              
              {!isEditingUsername ? (
                <>
                  <div className="text-lg font-semibold">
                    {profile?.username || 'Not set'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {usernameChangeInfo.reason}
                  </p>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Enter new username"
                      value={newUsername}
                      onChange={async (e) => {
                        const value = e.target.value;
                        setNewUsername(value);
                        setUsernameAvailable(null);
                        
                        if (value.trim().length >= 3 && value !== profile?.username) {
                          setIsCheckingUsername(true);
                          try {
                            const isUnique = await checkNameUnique(value.trim());
                            setUsernameAvailable(isUnique);
                          } catch (error) {
                            setUsernameAvailable(false);
                          } finally {
                            setIsCheckingUsername(false);
                          }
                        } else if (value === profile?.username) {
                          setUsernameAvailable(null);
                        }
                      }}
                      maxLength={30}
                      className={usernameAvailable === true ? "border-green-500" : usernameAvailable === false ? "border-destructive" : ""}
                    />
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
                  
                  {usernameAvailable === true && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Username available!
                    </p>
                  )}
                  
                  {usernameAvailable === false && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Username already taken
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingUsername(false);
                        setNewUsername(profile?.username || '');
                        setUsernameAvailable(null);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (!isOnline) {
                          toast.error('No internet connection. Please check your network and try again.');
                          return;
                        }
                        
                        if (newUsername.trim() === profile?.username) {
                          setIsEditingUsername(false);
                          return;
                        }
                        
                        if (newUsername.trim().length < 3) {
                          toast.error('Username must be at least 3 characters');
                          return;
                        }
                        
                        if (usernameAvailable !== true) {
                          toast.error('Please wait for username validation or choose a different username');
                          return;
                        }
                        
                        setIsSubmitting(true);
                        try {
                          const validatedData = validateProfileData({
                            name: newUsername.trim(),
                            country: profile?.country || '',
                          });
                          
                          await updateProfile({ username: validatedData.name });
                          recordUsernameChange(progress.currentLevel);
                          
                          toast.success(`Username changed! (Change ${usernameChangeInfo.changeNumber}/2 used)`);
                          setIsEditingUsername(false);
                          setUsernameAvailable(null);
                        } catch (error: any) {
                          const errorMessage = error?.message || 'Failed to update username';
                          if (errorMessage.includes('username') || errorMessage.includes('unique')) {
                            toast.error('Username already taken. Please choose a different username.');
                            setUsernameAvailable(false);
                          } else {
                            toast.error(errorMessage);
                          }
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      disabled={isSubmitting || !isOnline || usernameAvailable !== true || newUsername.trim().length < 3}
                      className="flex-1"
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {usernameChangeInfo.reason}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">Country</span>
                <Lock className="h-3 w-3 ml-auto" />
              </div>
              <div className="text-lg font-semibold">
                {profile?.country || 'Not set'}
              </div>
              <p className="text-xs text-muted-foreground">
                Country cannot be changed after creation
              </p>
            </div>
          </div>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Your profile is visible on the global leaderboard</p>
        </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default Profile;
