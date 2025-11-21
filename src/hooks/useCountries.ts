import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { STATIC_COUNTRIES } from '@/data/countries';

export interface Country {
  code: string;
  name: string;
}

export const useCountries = () => {
  const [countries, setCountries] = useState<Country[]>(STATIC_COUNTRIES);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.warn('[useCountries] Supabase ENV vars missing. Using bundled static list of countries');
      setCountries(STATIC_COUNTRIES);
      setIsLoading(false);
      return;
    }

    loadCountries();
  }, []);

  const fallbackToStaticList = (reason: string) => {
    console.warn(`[useCountries] ${reason}. Using static list of ${STATIC_COUNTRIES.length} countries`);
    setCountries(STATIC_COUNTRIES);
  };

  const loadCountries = async () => {
    console.log('[useCountries] Loading countries...');
    try {
      // Simplified query - fetch all countries (Supabase default limit is 1000, we have ~249)
      const { data, error } = await supabase
        .from('countries')
        .select('code, name')
        .order('name', { ascending: true });

      if (error) {
        console.error('[useCountries] Query error:', error);
        console.error('[useCountries] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error, null, 2)
        });
        throw error;
      }
      
      console.log('[useCountries] Query completed:', {
        dataCount: data?.length || 0,
        hasData: !!data && data.length > 0,
        firstFew: data?.slice(0, 3).map(c => c.name) || []
      });
      
      if (!data || data.length === 0) {
        fallbackToStaticList('⚠️ Countries table empty or query returned no data');
        console.warn('[useCountries] This might indicate an RLS policy issue or empty table');
        return;
      }

      if (data.length < STATIC_COUNTRIES.length * 0.8) {
        fallbackToStaticList(`⚠️ Only received ${data.length} countries from Supabase`);
        return;
      }
      
      console.log('[useCountries] ✅ Successfully loaded countries:', {
        count: data.length,
        firstFew: data.slice(0, 5).map(c => c.name),
        lastFew: data.slice(-5).map(c => c.name)
      });
      
      setCountries(data);
    } catch (error: any) {
      console.error('[useCountries] Error loading countries:', error);
      console.error('[useCountries] Full error object:', JSON.stringify(error, null, 2));
      
      // Log specific error information
      if (error?.message) {
        console.error('[useCountries] Error message:', error.message);
      }
      if (error?.code) {
        console.error('[useCountries] Error code:', error.code);
      }
      if (error?.details) {
        console.error('[useCountries] Error details:', error.details);
      }
      if (error?.hint) {
        console.error('[useCountries] Error hint:', error.hint);
      }
      
      fallbackToStaticList('Supabase request failed');
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
