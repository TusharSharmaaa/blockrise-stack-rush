import { Button } from '@/components/ui/button';
import { ArrowLeft, Volume2, VolumeX, Vibrate, Sun, Moon, Bell, Shield, Mail, Lock, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { useNotifications } from '@/hooks/useNotifications';
import { useCurrency } from '@/hooks/useCurrency';
import { useSound } from '@/hooks/useSound';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { notificationsEnabled, permissionGranted, toggleNotifications, requestPermissions } = useNotifications();
  const { formatPrice } = useCurrency();
  const { settings, toggleSound, toggleMusic, setVolume, playSound } = useSound();
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  
  // Account upgrade state
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [upgradeEmail, setUpgradeEmail] = useState('');
  const [upgradePassword, setUpgradePassword] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    checkAnonymousStatus();
  }, []);

  const checkAnonymousStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAnonymous(user?.is_anonymous ?? false);
  };

  useEffect(() => {
    if (!permissionGranted && notificationsEnabled) {
      requestPermissions();
    }
  }, []);

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled && !permissionGranted) {
      const granted = await requestPermissions();
      if (!granted) {
        toast.error('Notification permission denied');
        return;
      }
    }
    await toggleNotifications(enabled);
    toast.success(enabled ? 'Notifications enabled' : 'Notifications disabled');
  };

  const handleRemoveAds = () => {
    toast.info('Opening payment...');
  };

  const handleUpgradeAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpgrading(true);

    try {
      // Validate inputs
      emailSchema.parse(upgradeEmail);
      passwordSchema.parse(upgradePassword);

      // Update the anonymous user with email and password
      const { data, error } = await supabase.auth.updateUser({
        email: upgradeEmail,
        password: upgradePassword,
      });

      if (error) throw error;

      toast.success('Account upgraded! 🎉', {
        description: 'Your anonymous account is now permanent.',
      });
      
      setIsAnonymous(false);
      setUpgradeEmail('');
      setUpgradePassword('');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || 'Failed to upgrade account');
      }
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Signed out successfully');
      navigate('/auth');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out');
    }
  };

  return (
    <ScrollArea className="h-screen">
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-md mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Account Upgrade for Anonymous Users */}
          {isAnonymous && (
            <div className="bg-card rounded-lg p-6 space-y-4 card-elevated border-2 border-primary/50">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Upgrade Your Account</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                You're using a temporary account. Upgrade to a permanent account to secure your progress and access it from any device.
              </p>
              
              <form onSubmit={handleUpgradeAccount} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="upgrade-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="upgrade-email"
                    type="email"
                    placeholder="your@email.com"
                    value={upgradeEmail}
                    onChange={(e) => setUpgradeEmail(e.target.value)}
                    required
                    disabled={isUpgrading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="upgrade-password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <Input
                    id="upgrade-password"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={upgradePassword}
                    onChange={(e) => setUpgradePassword(e.target.value)}
                    required
                    disabled={isUpgrading}
                    minLength={6}
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full gradient-primary"
                  disabled={isUpgrading}
                >
                  {isUpgrading ? 'Upgrading...' : 'Upgrade to Permanent Account'}
                </Button>
              </form>
            </div>
          )}

          {/* Appearance Settings */}
          <div className="bg-card rounded-lg p-6 space-y-4 card-elevated">
            <h2 className="text-xl font-semibold mb-4">Appearance</h2>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <div>
                  <div className="font-medium">Theme</div>
                  <div className="text-sm text-muted-foreground">
                    {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                  </div>
                </div>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
          </div>

          {/* Audio Settings */}
          <div className="bg-card rounded-lg p-6 space-y-4 card-elevated">
            <h2 className="text-xl font-semibold mb-4">Audio</h2>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                <div>
                  <div className="font-medium">Sound Effects</div>
                  <div className="text-sm text-muted-foreground">Game sounds and effects</div>
                </div>
              </div>
              <Switch
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => {
                  toggleSound(checked);
                  if (checked) playSound('coin');
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.musicEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                <div>
                  <div className="font-medium">Music</div>
                  <div className="text-sm text-muted-foreground">Background music</div>
                </div>
              </div>
              <Switch
                checked={settings.musicEnabled}
                onCheckedChange={toggleMusic}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">Volume</div>
                <span className="text-sm text-muted-foreground">{Math.round(settings.volume * 100)}%</span>
              </div>
              <Slider
                value={[settings.volume * 100]}
                onValueChange={(value) => setVolume(value[0] / 100)}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Vibrate className="h-5 w-5" />
                <div>
                  <div className="font-medium">Vibration</div>
                  <div className="text-sm text-muted-foreground">Haptic feedback</div>
                </div>
              </div>
              <Switch
                checked={vibrationEnabled}
                onCheckedChange={setVibrationEnabled}
              />
            </div>
          </div>

          {/* Game Info */}
          <div className="bg-card rounded-lg p-6 card-elevated">
            <h2 className="text-xl font-semibold mb-4">About</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Version</span>
                <span className="text-foreground">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>Build</span>
                <span className="text-foreground">Production</span>
              </div>
            </div>
          </div>

          {/* Monetization */}
          <div className="bg-card rounded-lg p-6 card-elevated">
            <h2 className="text-xl font-semibold mb-4">Premium</h2>
            <Button className="w-full gradient-primary">
              Remove Ads - $2.99
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              One-time purchase, no subscription
            </p>
          </div>

          {/* Sign Out for Permanent Accounts */}
          {!isAnonymous && (
            <div className="bg-card rounded-lg p-6 card-elevated">
              <h2 className="text-xl font-semibold mb-4">Account</h2>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleSignOut}
              >
                <LogIn className="h-4 w-4 mr-2 rotate-180" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default Settings;
