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
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('code, name')
        .order('name');

      if (error) throw error;
      
      setCountries(data || []);
    } catch (error) {
      console.error('Error loading countries:', error);
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
