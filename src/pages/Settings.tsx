import { Button } from '@/components/ui/button';
import { ArrowLeft, Vibrate, Sun, Moon, Type } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { useNotifications } from '@/hooks/useNotifications';
import { useFontScaling } from '@/hooks/useFontScaling';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { notificationsEnabled, permissionGranted, toggleNotifications, requestPermissions } = useNotifications();
  const { fontScale, setCustomScale } = useFontScaling();
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  useEffect(() => {
    if (!permissionGranted && notificationsEnabled) {
      requestPermissions();
    }
  }, []);

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

          {/* Gameplay & Feedback */}
          <Card variant="glass" className="p-6 space-y-4 shadow-glow">
            <h2 className="text-xl font-semibold mb-4 drop-shadow-[0_0_8px_hsl(var(--primary))]">Gameplay & Feedback</h2>
            <div className="p-4 rounded-md bg-muted/20 border border-muted/40 text-sm text-muted-foreground">
              Sound effects and music are disabled in this build. Enable vibration below to keep haptic feedback during play.
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

        </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default Settings;
