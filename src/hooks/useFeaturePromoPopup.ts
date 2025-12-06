import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { PopupVariant } from '@/components/FeaturePromoPopup';

const STORAGE_KEY = 'blockrise_feature_promo';
const COMPLETED_KEY = 'blockrise_feature_promo_completed'; // Date-based: don't show again today
const DISMISSED_KEY = 'blockrise_feature_promo_dismissed'; // Time-based: can show again after cooldown
const MIN_TIME_BETWEEN_POPUPS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const MIN_VISITS_BETWEEN_POPUPS = 3; // Show popup every 3 visits minimum
const DISMISSAL_COOLDOWN = 30 * 60 * 1000; // 30 minutes cooldown for "Maybe Later"

interface PopupState {
  lastShownTimestamp: number;
  lastVariant: PopupVariant | null;
  visitCount: number;
  lastVisitTimestamp: number;
}

const getStoredState = (): PopupState => {
  if (typeof localStorage === 'undefined') {
    return {
      lastShownTimestamp: 0,
      lastVariant: null,
      visitCount: 0,
      lastVisitTimestamp: 0,
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to read popup state from localStorage:', error);
  }

  return {
    lastShownTimestamp: 0,
    lastVariant: null,
    visitCount: 0,
    lastVisitTimestamp: 0,
  };
};

const saveState = (state: PopupState) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save popup state to localStorage:', error);
  }
};

const getRandomVariant = (excludeVariant: PopupVariant | null, context: 'home' | 'level'): PopupVariant => {
  const variants: PopupVariant[] = 
    context === 'level' 
      ? ['watch-ad-clear-level', 'watch-ads-coins', 'power-packs-shop']
      : ['watch-ads-coins', 'power-packs-shop', 'leaderboards'];
  
  // Filter out the last shown variant
  const availableVariants = excludeVariant 
    ? variants.filter(v => v !== excludeVariant)
    : variants;
  
  // If all variants were excluded, use all variants
  const finalVariants = availableVariants.length > 0 ? availableVariants : variants;
  
  return finalVariants[Math.floor(Math.random() * finalVariants.length)];
};

// Get today's date string for date-based tracking
const getTodayDateString = (): string => {
  return new Date().toDateString();
};

// Get completed popups (watched ad/completed action) - date-based, don't show again today
const getCompletedToday = (): Set<PopupVariant> => {
  if (typeof localStorage === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(COMPLETED_KEY);
    if (stored) {
      const data = JSON.parse(stored) as { date: string; variants: PopupVariant[] };
      // If stored date is today, return those variants
      if (data.date === getTodayDateString()) {
        return new Set(data.variants);
      }
      // Otherwise, it's from a different day, return empty set
    }
  } catch (error) {
    console.error('Failed to read completed popups from localStorage:', error);
  }
  return new Set();
};

// Mark popup as completed (watched ad/completed action) - don't show again today
const markCompleted = (variant: PopupVariant) => {
  if (typeof localStorage === 'undefined') return;
  try {
    const completed = getCompletedToday();
    completed.add(variant);
    localStorage.setItem(COMPLETED_KEY, JSON.stringify({
      date: getTodayDateString(),
      variants: Array.from(completed)
    }));
  } catch (error) {
    console.error('Failed to save completed popup to localStorage:', error);
  }
};

// Get dismissed popups with timestamps - time-based cooldown
const getDismissedWithCooldown = (): Map<PopupVariant, number> => {
  if (typeof localStorage === 'undefined') return new Map();
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    if (stored) {
      const data = JSON.parse(stored) as { [key: string]: number };
      const map = new Map<PopupVariant, number>();
      const now = Date.now();
      
      // Only include dismissals that are still within cooldown period
      Object.entries(data).forEach(([variant, timestamp]) => {
        const timeSinceDismissal = now - timestamp;
        if (timeSinceDismissal < DISMISSAL_COOLDOWN) {
          map.set(variant as PopupVariant, timestamp);
        }
      });
      
      return map;
    }
  } catch (error) {
    console.error('Failed to read dismissed popups from localStorage:', error);
  }
  return new Map();
};

// Mark popup as dismissed (Maybe Later) - can show again after cooldown
const markDismissed = (variant: PopupVariant) => {
  if (typeof localStorage === 'undefined') return;
  try {
    const dismissed = getDismissedWithCooldown();
    dismissed.set(variant, Date.now());
    
    // Convert Map to object for storage
    const data: { [key: string]: number } = {};
    dismissed.forEach((timestamp, v) => {
      data[v] = timestamp;
    });
    
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save dismissed popup to localStorage:', error);
  }
};

const shouldShowPopup = (
  state: PopupState, 
  context: 'home' | 'level', 
  fromGameCompletion?: boolean,
  completedToday?: Set<PopupVariant>,
  dismissedWithCooldown?: Map<PopupVariant, number>
): boolean => {
  const now = Date.now();
  
  // If coming from game completion, show popup more readily (but still respect frequency)
  if (fromGameCompletion) {
    const timeSinceLastPopup = now - state.lastShownTimestamp;
    // Show if at least 30 minutes have passed since last popup
    if (timeSinceLastPopup >= 30 * 60 * 1000) {
      return true;
    }
  }
  
  // Check time-based frequency
  const timeSinceLastPopup = now - state.lastShownTimestamp;
  if (timeSinceLastPopup < MIN_TIME_BETWEEN_POPUPS) {
    return false;
  }
  
  // Check visit-based frequency
  const timeSinceLastVisit = now - state.lastVisitTimestamp;
  // If last visit was more than 1 hour ago, reset visit count
  const visitCount = timeSinceLastVisit > 60 * 60 * 1000 ? 0 : state.visitCount;
  
  if (visitCount < MIN_VISITS_BETWEEN_POPUPS) {
    return false;
  }
  
  // Check if all available variants for this context have been completed today or dismissed
  const availableVariants: PopupVariant[] = 
    context === 'level' 
      ? ['watch-ad-clear-level', 'watch-ads-coins', 'power-packs-shop']
      : ['watch-ads-coins', 'power-packs-shop', 'leaderboards'];
  
  // Filter out variants that are completed today (watched ad) or dismissed (within cooldown)
  const showableVariants = availableVariants.filter(v => {
    // Don't show if completed today (watched ad)
    if (completedToday && completedToday.has(v)) {
      return false;
    }
    // Don't show if dismissed within cooldown period
    if (dismissedWithCooldown && dismissedWithCooldown.has(v)) {
      return false;
    }
    return true;
  });
  
  // If all variants are completed or dismissed, don't show
  if (showableVariants.length === 0) {
    return false;
  }
  
  return true;
};

export const useFeaturePromoPopup = (context: 'home' | 'level', fromGameCompletion?: boolean) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [variant, setVariant] = useState<PopupVariant>('watch-ads-coins');

  // Update visit count and check if popup should be shown
  useEffect(() => {
    const currentState = getStoredState();
    const now = Date.now();
    const timeSinceLastVisit = now - currentState.lastVisitTimestamp;
    const completedToday = getCompletedToday();
    const dismissedWithCooldown = getDismissedWithCooldown();
    
    // Reset visit count if more than 1 hour has passed
    const newVisitCount = timeSinceLastVisit > 60 * 60 * 1000 
      ? 1 
      : currentState.visitCount + 1;
    
    const updatedState = {
      ...currentState,
      visitCount: newVisitCount,
      lastVisitTimestamp: now,
    };
    
    saveState(updatedState);

    // Check if popup should be shown after a small delay
    const timer = setTimeout(() => {
      if (shouldShowPopup(updatedState, context, fromGameCompletion, completedToday, dismissedWithCooldown)) {
        // Get available variants for this context
        const availableVariants: PopupVariant[] = 
          context === 'level' 
            ? ['watch-ad-clear-level', 'watch-ads-coins', 'power-packs-shop']
            : ['watch-ads-coins', 'power-packs-shop', 'leaderboards'];
        
        // Filter out variants that are completed today or dismissed (within cooldown)
        const showableVariants = availableVariants.filter(v => {
          // Don't show if completed today (watched ad)
          if (completedToday.has(v)) {
            return false;
          }
          // Don't show if dismissed within cooldown period
          if (dismissedWithCooldown.has(v)) {
            return false;
          }
          return true;
        });
        
        // If all variants are completed or dismissed, don't show
        if (showableVariants.length === 0) {
          return;
        }
        
        // Pick a random variant from showable ones
        const newVariant = showableVariants.length > 0
          ? showableVariants[Math.floor(Math.random() * showableVariants.length)]
          : getRandomVariant(updatedState.lastVariant, context);
        
        setVariant(newVariant);
        setIsOpen(true);
        
        const finalState = {
          ...updatedState,
          lastShownTimestamp: now,
          lastVariant: newVariant,
          visitCount: 0, // Reset visit count after showing popup
        };
        
        saveState(finalState);
      }
    }, 800); // Delay to ensure smooth transition
    
    return () => clearTimeout(timer);
  }, [location.pathname, context, fromGameCompletion]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Mark this variant as dismissed (Maybe Later) - can show again after cooldown
    markDismissed(variant);
  }, [variant]);

  const handleActionCompleted = useCallback(() => {
    setIsOpen(false);
    // Mark this variant as completed (watched ad) - don't show again today
    markCompleted(variant);
  }, [variant]);

  return {
    isOpen,
    variant,
    onClose: handleClose,
    onActionCompleted: handleActionCompleted,
  };
};

