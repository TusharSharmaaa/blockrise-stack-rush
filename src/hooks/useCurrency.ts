import { useState, useEffect } from 'react';

export interface PriceInfo {
  currency: string;
  symbol: string;
  price: number;
  formatted: string;
}

const PRICE_MAP = {
  INR: { symbol: '₹', removeAds: 99, coinPack100: 49, coinPack500: 199, coinPack1000: 349, premium: 299 },
  USD: { symbol: '$', removeAds: 2.99, coinPack100: 0.99, coinPack500: 3.99, coinPack1000: 6.99, premium: 4.99 },
  EUR: { symbol: '€', removeAds: 2.49, coinPack100: 0.89, coinPack500: 3.49, coinPack1000: 5.99, premium: 4.49 },
  GBP: { symbol: '£', removeAds: 1.99, coinPack100: 0.79, coinPack500: 2.99, coinPack1000: 4.99, premium: 3.99 },
};

export type PriceKey = 'removeAds' | 'coinPack100' | 'coinPack500' | 'coinPack1000' | 'premium';

export const useCurrency = () => {
  const [currency, setCurrency] = useState<keyof typeof PRICE_MAP>('USD');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    detectCurrency();
  }, []);

  const detectCurrency = async () => {
    try {
      // Try to detect from browser locale first
      const locale = navigator.language || 'en-US';
      
      // Simple detection based on locale
      if (locale.includes('IN') || locale.includes('in')) {
        setCurrency('INR');
      } else if (locale.includes('GB') || locale.includes('gb')) {
        setCurrency('GBP');
      } else if (locale.includes('EU') || locale.includes('DE') || locale.includes('FR') || locale.includes('IT') || locale.includes('ES')) {
        setCurrency('EUR');
      } else {
        setCurrency('USD');
      }
    } catch (error) {
      console.error('Failed to detect currency:', error);
      setCurrency('USD');
    } finally {
      setIsLoading(false);
    }
  };

  const getPrice = (priceKey: PriceKey): PriceInfo => {
    const prices = PRICE_MAP[currency];
    const price = prices[priceKey];
    return {
      currency,
      symbol: prices.symbol,
      price,
      formatted: `${prices.symbol}${price}`
    };
  };

  const formatPrice = (priceKey: PriceKey): string => {
    return getPrice(priceKey).formatted;
  };

  return {
    currency,
    isLoading,
    getPrice,
    formatPrice
  };
};
