import { useState, useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export const NetworkStatusIndicator = () => {
  const isOnline = useOnlineStatus();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Always show when offline
    if (!isOnline) {
      setIsVisible(true);
      return;
    }

    // Show when coming back online
    setIsVisible(true);

    // Hide after 3 seconds when online
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isOnline]);

  if (!isVisible && isOnline) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed z-50 flex items-center gap-2 rounded-full text-xs font-medium shadow-lg transition-all duration-300",
        isOnline
          ? "bottom-4 right-4 px-2 py-1.5 bg-background/80 backdrop-blur-sm border border-border text-muted-foreground animate-fade-in"
          : "top-4 right-4 px-3 py-2 bg-destructive/90 text-destructive-foreground animate-pulse",
        !isVisible && "animate-fade-out"
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3 text-green-500" />
          <span className="text-[10px]">Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
};
