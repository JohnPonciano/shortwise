-- Add custom domain field to profiles table for Pro users
ALTER TABLE public.profiles 
ADD COLUMN custom_domain text;

-- Add index for custom domain lookups
CREATE INDEX idx_profiles_custom_domain ON public.profiles(custom_domain) WHERE custom_domain IS NOT NULL;

-- Add comment explaining the feature
COMMENT ON COLUMN public.profiles.custom_domain IS 'Custom domain for Pro users to brand their short links (e.g., links.mycompany.com)';