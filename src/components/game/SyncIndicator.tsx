import { Cloud, CloudOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface SyncIndicatorProps {
  profileId?: string;
}

const SyncIndicator = ({ profileId }: SyncIndicatorProps) => {
  const [showSynced, setShowSynced] = useState(false);

  useEffect(() => {
    if (profileId && showSynced) {
      const timer = setTimeout(() => setShowSynced(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [profileId, showSynced]);

  // Trigger animation when data syncs (you can call this from parent)
  useEffect(() => {
    const handleSync = () => setShowSynced(true);
    window.addEventListener('progressSynced', handleSync);
    return () => window.removeEventListener('progressSynced', handleSync);
  }, []);

  if (!profileId) {
    return (
      <Badge variant="outline" className="gap-1 text-[10px] opacity-60">
        <CloudOff className="h-3 w-3" />
        Offline
      </Badge>
    );
  }

  return (
    <Badge 
      variant={showSynced ? "default" : "outline"} 
      className={`gap-1 text-[10px] transition-all ${showSynced ? 'bg-green-500/20 text-green-400 border-green-400/50' : 'opacity-60'}`}
    >
      <Cloud className="h-3 w-3" />
      {showSynced ? 'Synced' : 'Cloud'}
    </Badge>
  );
};

export default SyncIndicator;