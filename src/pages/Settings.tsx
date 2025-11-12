import { Button } from '@/components/ui/button';
import { ArrowLeft, Volume2, VolumeX, Vibrate } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';

const Settings = () => {
  const navigate = useNavigate();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

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
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Audio Settings */}
          <div className="bg-card rounded-lg p-6 space-y-4 card-elevated">
            <h2 className="text-xl font-semibold mb-4">Audio</h2>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                <div>
                  <div className="font-medium">Sound Effects</div>
                  <div className="text-sm text-muted-foreground">Game sounds and effects</div>
                </div>
              </div>
              <Switch
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {musicEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                <div>
                  <div className="font-medium">Music</div>
                  <div className="text-sm text-muted-foreground">Background music</div>
                </div>
              </div>
              <Switch
                checked={musicEnabled}
                onCheckedChange={setMusicEnabled}
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
            <p className="text-xs text-muted-foreground text-center mt-2">
              One-time purchase, no subscription
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
