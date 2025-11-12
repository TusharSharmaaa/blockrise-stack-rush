-- Remove city requirement and add unique username constraint
ALTER TABLE public.profiles 
  ALTER COLUMN city DROP NOT NULL,
  ALTER COLUMN city SET DEFAULT '';

-- Add unique constraint on username for uniqueness validation
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique 
  ON public.profiles(LOWER(username));

-- Update RLS policy for username uniqueness check
CREATE POLICY "Anyone can check username availability"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Create countries table for validation
CREATE TABLE IF NOT EXISTS public.countries (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Insert ISO-3166 country list
INSERT INTO public.countries (code, name) VALUES
  ('AF', 'Afghanistan'),
  ('AL', 'Albania'),
  ('DZ', 'Algeria'),
  ('AR', 'Argentina'),
  ('AU', 'Australia'),
  ('AT', 'Austria'),
  ('BD', 'Bangladesh'),
  ('BE', 'Belgium'),
  ('BR', 'Brazil'),
  ('CA', 'Canada'),
  ('CN', 'China'),
  ('CO', 'Colombia'),
  ('EG', 'Egypt'),
  ('FR', 'France'),
  ('DE', 'Germany'),
  ('GR', 'Greece'),
  ('IN', 'India'),
  ('ID', 'Indonesia'),
  ('IR', 'Iran'),
  ('IQ', 'Iraq'),
  ('IE', 'Ireland'),
  ('IL', 'Israel'),
  ('IT', 'Italy'),
  ('JP', 'Japan'),
  ('KE', 'Kenya'),
  ('MY', 'Malaysia'),
  ('MX', 'Mexico'),
  ('NL', 'Netherlands'),
  ('NZ', 'New Zealand'),
  ('NG', 'Nigeria'),
  ('NO', 'Norway'),
  ('PK', 'Pakistan'),
  ('PH', 'Philippines'),
  ('PL', 'Poland'),
  ('PT', 'Portugal'),
  ('RU', 'Russia'),
  ('SA', 'Saudi Arabia'),
  ('SG', 'Singapore'),
  ('ZA', 'South Africa'),
  ('KR', 'South Korea'),
  ('ES', 'Spain'),
  ('SE', 'Sweden'),
  ('CH', 'Switzerland'),
  ('TH', 'Thailand'),
  ('TR', 'Turkey'),
  ('UA', 'Ukraine'),
  ('AE', 'United Arab Emirates'),
  ('GB', 'United Kingdom'),
  ('US', 'United States'),
  ('VN', 'Vietnam')
ON CONFLICT (code) DO NOTHING;

-- Enable RLS on countries table
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Countries are viewable by everyone"
  ON public.countries FOR SELECT
  TO authenticated
  USING (true);