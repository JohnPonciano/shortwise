-- Adicionar novos campos para as features solicitadas

-- Adicionar campos para tags e configurações avançadas
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS password_protected BOOLEAN DEFAULT false;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS ab_test_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS ab_test_weights INTEGER[] DEFAULT '{}';
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS deep_link_ios TEXT;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS deep_link_android TEXT;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS utm_term TEXT;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS qr_code_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_links_tags ON public.links USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_links_expires_at ON public.links (expires_at);
CREATE INDEX IF NOT EXISTS idx_links_click_count ON public.links (click_count);

-- Função para incrementar contador de cliques
CREATE OR REPLACE FUNCTION increment_click_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.links 
    SET click_count = click_count + 1 
    WHERE id = NEW.link_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para incrementar contador automaticamente
DROP TRIGGER IF EXISTS increment_click_count_trigger ON public.clicks;
CREATE TRIGGER increment_click_count_trigger
    AFTER INSERT ON public.clicks
    FOR EACH ROW
    EXECUTE FUNCTION increment_click_count();