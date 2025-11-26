import { RefreshCw, Star } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNativeAd } from '@/hooks/useNativeAd';
import { cn } from '@/lib/utils';

interface NativeAdCardProps {
  className?: string;
  footer?: ReactNode;
}

export const NativeAdCard = ({ className, footer }: NativeAdCardProps) => {
  const { ad, isLoading, isPlaceholder, isSupported, error, refresh, handleClick } = useNativeAd();
  
  // Debug logging
  useEffect(() => {
    console.log('[NativeAdCard] State:', {
      hasAd: !!ad,
      adId: ad?.adId,
      isLoading,
      isPlaceholder,
      isSupported,
      callToAction: ad?.callToAction,
      buttonDisabled: !ad || isLoading || (!isSupported && !isPlaceholder)
    });
  }, [ad, isLoading, isPlaceholder, isSupported]);

  const renderMedia = () => {
    if (isLoading && !ad) {
      return <Skeleton className="h-32 w-full rounded-xl" />;
    }

    if (!ad?.imageUrls?.length) return null;

    return (
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-background/80 to-background p-0.5">
        <img
          src={ad.imageUrls[0]}
          alt={ad.headline || 'Sponsored content'}
          className="h-32 w-full rounded-[0.7rem] object-cover"
          width={400}
          height={128}
          style={{
            objectFit: 'cover',
            imageRendering: '-webkit-optimize-contrast',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
          }}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            // Fallback if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
        {!isSupported && (
          <div className="absolute bottom-2 right-2 rounded-full bg-background/80 px-3 py-1 text-[11px] font-medium text-muted-foreground">
            Preview
          </div>
        )}
      </div>
    );
  };

  const renderIcon = () => {
    if (!ad?.iconUrl) return null;
    return (
      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl border border-border/40 bg-secondary/40 shadow-inner">
        <img 
          src={ad.iconUrl} 
          alt={ad.advertiser || 'Ad Icon'} 
          className="h-full w-full object-cover" 
          width={48}
          height={48}
          style={{
            objectFit: 'cover',
            imageRendering: '-webkit-optimize-contrast',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
          }}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            // Fallback if icon fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
    );
  };

  const showRetry = !!error && !isLoading;

  return (
    <div
      className={cn(
        'rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-accent/5 p-5 shadow-lg backdrop-blur',
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {renderIcon()}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Badge variant="outline" className="border-primary/30 text-primary">
              {ad?.extraLabel || 'Sponsored'}
            </Badge>
            {isPlaceholder && <span className="text-[10px] text-muted-foreground/70">Preview Data</span>}
          </div>

          <p className="text-lg font-semibold leading-tight text-foreground">
            {ad?.headline || 'Loading personalized offer...'}
          </p>
          {ad?.advertiser && <p className="text-xs text-muted-foreground">{ad.advertiser}</p>}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {renderMedia()}
        {ad?.body && <p className="text-sm leading-relaxed text-muted-foreground">{ad.body}</p>}

        <div className="flex flex-wrap items-center gap-3">
          {ad?.starRating && (
            <div className="flex items-center gap-1 rounded-full bg-background/80 px-3 py-1 text-sm font-semibold text-primary">
              <Star className="h-4 w-4 fill-current" />
              {ad.starRating.toFixed(1)}
            </div>
          )}
          {ad?.store && <Badge variant="secondary">On {ad.store}</Badge>}
          {ad?.price && <Badge variant="secondary">{ad.price}</Badge>}
          {!isSupported && (
            <span className="text-xs text-muted-foreground">
              Real ad shows on native build. This is a themed preview.
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button 
            className="flex-1 gradient-primary shadow-glow-lg" 
            disabled={!ad || isLoading || (!isSupported && !isPlaceholder)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (ad?.adId && isSupported) {
                handleClick();
              } else if (isPlaceholder) {
                console.log('[NativeAdCard] Placeholder ad clicked - no action on web');
              } else {
                console.warn('[NativeAdCard] Cannot click: adId=', ad?.adId, 'isSupported=', isSupported);
              }
            }}
          >
            {ad?.callToAction || 'Discover More'}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={refresh}
            disabled={isLoading}
            aria-label="Refresh ad"
            className="shrink-0"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>

        {showRetry && (
          <p className="text-xs text-destructive/80">
            {error} — <button onClick={refresh} className="underline">Try again</button>
          </p>
        )}
      </div>

      {footer && (
        <div className="mt-5 border-t border-border/40 pt-4">
          {footer}
        </div>
      )}
    </div>
  );
};

