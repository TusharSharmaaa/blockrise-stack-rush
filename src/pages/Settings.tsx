import { Button } from '@/components/ui/button';
import { ArrowLeft, Volume2, VolumeX, Vibrate, Sun, Moon, Bell, Type } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useState, useEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { useNotifications } from '@/hooks/useNotifications';
import { useCurrency } from '@/hooks/useCurrency';
import { useSound } from '@/hooks/useSound';
import { useFontScaling } from '@/hooks/useFontScaling';
import { usePremium } from '@/hooks/usePremium';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { notificationsEnabled, permissionGranted, toggleNotifications, requestPermissions } = useNotifications();
  const { formatPrice } = useCurrency();
  const { settings, toggleSound, toggleMusic, setVolume, playSound } = useSound();
  const { fontScale, setCustomScale } = useFontScaling();
  const { isPremium } = usePremium();
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

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

  return (
    <ScrollArea className="h-full">
      <div className="min-h-full bg-background relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-hero opacity-50 animate-gradient pointer-events-none" />
        
        <div className="container-responsive space-y-4 sm:space-y-6 relative z-10 py-4 sm:py-6 pb-20">
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
          {/* Appearance Settings */}
          <Card variant="glass" className="p-6 space-y-6 shadow-glow">
            <h2 className="text-xl font-semibold mb-4 drop-shadow-[0_0_8px_hsl(var(--primary))]">Appearance</h2>
            
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

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Type className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-medium">Text Size</div>
                  <div className="text-sm text-muted-foreground">
                    Adjust for better readability
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={fontScale === 'small' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setCustomScale('small');
                    toast.success('Text size: Small');
                  }}
                  className="flex-1"
                >
                  <span className="text-xs">A</span>
                </Button>
                <Button
                  variant={fontScale === 'medium' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setCustomScale('medium');
                    toast.success('Text size: Medium');
                  }}
                  className="flex-1"
                >
                  <span className="text-sm">A</span>
                </Button>
                <Button
                  variant={fontScale === 'large' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setCustomScale('large');
                    toast.success('Text size: Large');
                  }}
                  className="flex-1"
                >
                  <span className="text-base">A</span>
                </Button>
                <Button
                  variant={fontScale === 'extra-large' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setCustomScale('extra-large');
                    toast.success('Text size: Extra Large');
                  }}
                  className="flex-1"
                >
                  <span className="text-lg">A</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Audio Settings */}
          <Card variant="glass" className="p-6 space-y-4 shadow-glow">
            <h2 className="text-xl font-semibold mb-4 drop-shadow-[0_0_8px_hsl(var(--primary))]">Audio</h2>
            
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
          </Card>

          {/* Game Info */}
          <Card variant="glass" className="p-6 shadow-glow">
            <h2 className="text-xl font-semibold mb-4 drop-shadow-[0_0_8px_hsl(var(--primary))]">About</h2>
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
          </Card>

          {/* Monetization - Only show if user is not premium */}
          {!isPremium && (
            <Card variant="premium" className="p-6 shadow-glow-lg animate-pulse-glow">
              <h2 className="text-xl font-semibold mb-4 drop-shadow-[0_0_8px_hsl(var(--primary))]">Premium</h2>
              <Button className="w-full gradient-primary" onClick={handleRemoveAds}>
                Remove Ads - $2.99
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                One-time purchase, no subscription
              </p>
            </Card>
          )}

        </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default Settings;
