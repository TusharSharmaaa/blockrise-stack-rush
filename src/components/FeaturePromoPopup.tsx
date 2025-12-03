import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Video, ShoppingBag, Trophy, Zap, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdMob } from '@/hooks/useAdMob';
import { useGameProgress } from '@/hooks/useGameProgress';
import { toast } from 'sonner';

export type PopupVariant = 
  | 'watch-ads-coins'
  | 'power-packs-shop'
  | 'leaderboards'
  | 'watch-ad-clear-level';

interface PopupConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  actionText: string;
  actionPath?: string;
  actionHandler?: () => void;
  showAdButton?: boolean;
}

const POPUP_VARIANTS: Record<PopupVariant, PopupConfig> = {
  'watch-ads-coins': {
    title: 'Watch Ads & Earn Coins! 💰',
    description: 'Watch short videos to earn coins and purchase power packs to make your game smoother!',
    icon: <Video className="h-12 w-12 text-primary animate-pulse" />,
    actionText: 'Watch Ad Now',
    showAdButton: true,
  },
  'power-packs-shop': {
    title: 'Get Power Packs from Shop! ⚡',
    description: 'Visit the Shop section and use power packs in game to make your gameplay smooth and easy!',
    icon: <ShoppingBag className="h-12 w-12 text-primary animate-pulse" />,
    actionText: 'Go to Shop',
    actionPath: '/shop',
  },
  'leaderboards': {
    title: 'Check Leaderboards! 🏆',
    description: 'See how you rank globally and compete with players worldwide!',
    icon: <Trophy className="h-12 w-12 text-primary animate-pulse" />,
    actionText: 'View Leaderboard',
    actionPath: '/leaderboard',
  },
  'watch-ad-clear-level': {
    title: 'Watch Ad to Clear Level! 🎯',
    description: 'Stuck on a level? Watch a short ad to clear it and move forward!',
    icon: <Zap className="h-12 w-12 text-primary animate-pulse" />,
    actionText: 'Watch Ad',
    showAdButton: true,
  },
};

interface FeaturePromoPopupProps {
  variant: PopupVariant;
  isOpen: boolean;
  onClose: () => void;
  onAction?: () => void;
}

const FeaturePromoPopup = ({ variant, isOpen, onClose, onAction }: FeaturePromoPopupProps) => {
  const navigate = useNavigate();
  const { showRewardedAd, isRewardedLoading } = useAdMob();
  const { addCoins } = useGameProgress();
  const [isProcessing, setIsProcessing] = useState(false);
  const config = POPUP_VARIANTS[variant];

  const handleAction = async () => {
    if (isProcessing || isRewardedLoading) return;

    setIsProcessing(true);
    try {
      if (config.showAdButton) {
        const adResult = await showRewardedAd();
        if (!adResult.success) {
          toast.error('Ad was not completed. Please try again.');
          setIsProcessing(false);
          return;
        }

        if (variant === 'watch-ads-coins') {
          await addCoins(50);
          toast.success('🎉 You earned 50 coins!');
        } else if (variant === 'watch-ad-clear-level') {
          // This will be handled by the parent component
          if (onAction) {
            await onAction();
          }
          onClose();
          return; // Don't close again or navigate
        }
      } else if (config.actionPath) {
        navigate(config.actionPath);
      }

      if (onAction && variant !== 'watch-ad-clear-level') {
        onAction();
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to handle popup action:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-card border-primary/30 shadow-premium animate-in fade-in-0 zoom-in-95 duration-200">
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="relative">
              {config.icon}
              <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-1 -right-1 animate-bounce" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl font-bold">
            {config.title}
          </DialogTitle>
          <DialogDescription className="text-center text-sm pt-2 text-muted-foreground">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto glass-card border-primary/20 hover:shadow-glow"
            disabled={isProcessing || isRewardedLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          <Button
            onClick={handleAction}
            disabled={isProcessing || isRewardedLoading}
            className="w-full sm:w-auto gradient-primary shadow-glow-lg"
          >
            {isRewardedLoading
              ? 'Loading ad...'
              : isProcessing
              ? 'Processing...'
              : config.actionText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeaturePromoPopup;

