-- Tabela de taxas de entrega por bairro
CREATE TABLE IF NOT EXISTS public.delivery_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    neighborhood TEXT NOT NULL UNIQUE,
    fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar coluna de taxa de entrega na tabela de pedidos
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- Habilitar RLS
ALTER TABLE public.delivery_fees ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Qualquer um pode ver as taxas de entrega" ON public.delivery_fees
    FOR SELECT USING (true);

CREATE POLICY "Apenas admins podem gerenciar taxas de entrega" ON public.delivery_fees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
