import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Country {
  code: string;
  name: string;
}

export const useCountries = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    console.log('[useCountries] Loading countries...');
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('code, name')
        .order('name');

      if (error) throw error;
      
      if (!data || data.length === 0) {
        console.warn('[useCountries] Countries table empty. Using fallback list');
        setCountries([
          { code: 'US', name: 'United States' },
          { code: 'IN', name: 'India' },
          { code: 'GB', name: 'United Kingdom' },
          { code: 'CA', name: 'Canada' },
          { code: 'AU', name: 'Australia' },
          { code: 'DE', name: 'Germany' },
          { code: 'FR', name: 'France' },
          { code: 'BR', name: 'Brazil' },
          { code: 'ZA', name: 'South Africa' },
          { code: 'JP', name: 'Japan' },
          { code: 'CN', name: 'China' },
          { code: 'SG', name: 'Singapore' },
          { code: 'AE', name: 'United Arab Emirates' }
        ]);
        return;
      }
      
      console.log('[useCountries] Loaded countries:', data?.length);
      setCountries(data || []);
    } catch (error) {
      console.error('[useCountries] Error loading countries:', error);
      console.log('[useCountries] Using fallback country list');
      // Fallback to basic list if server fails
      setCountries([
        { code: 'US', name: 'United States' },
        { code: 'IN', name: 'India' },
        { code: 'GB', name: 'United Kingdom' },
        { code: 'CA', name: 'Canada' },
        { code: 'AU', name: 'Australia' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const validateCountry = (country: string): boolean => {
    return countries.some(c => 
      c.name.toLowerCase() === country.toLowerCase() || 
      c.code.toLowerCase() === country.toLowerCase()
    );
  };

  return { countries, isLoading, validateCountry };
};
