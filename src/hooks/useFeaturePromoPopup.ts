import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { PopupVariant } from '@/components/FeaturePromoPopup';

const STORAGE_KEY = 'blockrise_feature_promo';
const MIN_TIME_BETWEEN_POPUPS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const MIN_VISITS_BETWEEN_POPUPS = 3; // Show popup every 3 visits minimum

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

const shouldShowPopup = (state: PopupState, context: 'home' | 'level', fromGameCompletion?: boolean): boolean => {
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
      if (shouldShowPopup(updatedState, context, fromGameCompletion)) {
        const newVariant = getRandomVariant(updatedState.lastVariant, context);
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
  }, []);

  return {
    isOpen,
    variant,
    onClose: handleClose,
  };
};

