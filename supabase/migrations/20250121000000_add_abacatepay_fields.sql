-- Adicionar campos do AbacatePay para integração de pagamentos
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS abacatepay_customer_id TEXT,
ADD COLUMN IF NOT EXISTS abacatepay_subscription_id TEXT;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_abacatepay_customer ON public.profiles(abacatepay_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_abacatepay_subscription ON public.profiles(abacatepay_subscription_id);

-- Adicionar comentários explicativos
COMMENT ON COLUMN public.profiles.abacatepay_customer_id IS 'ID do cliente no AbacatePay para gerenciamento de assinaturas';
COMMENT ON COLUMN public.profiles.abacatepay_subscription_id IS 'ID da assinatura no AbacatePay para controle de pagamentos'; 