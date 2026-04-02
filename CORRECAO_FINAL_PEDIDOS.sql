-- ==========================================
-- CORREÇÃO DEFINITIVA DA TABELA DE PEDIDOS E ESTOQUE
-- ==========================================

-- 1. Adicionar coluna de quantidade se não existir
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- 2. Corrigir tipo da coluna delivery_date para DATE
DO $$ 
BEGIN 
    -- Se a coluna existir e for TEXT, converte para DATE
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_date' AND data_type = 'text') THEN
        ALTER TABLE public.orders ALTER COLUMN delivery_date TYPE DATE USING delivery_date::DATE;
    -- Se a coluna não existir, cria como DATE
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_date') THEN
        ALTER TABLE public.orders ADD COLUMN delivery_date DATE;
    END IF;
END $$;

-- 3. Limpar e recriar políticas de RLS para a tabela orders
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;

-- Política de Inserção: Permite que clientes (logados ou não) criem pedidos
-- O Checkout.tsx garante que o customer_id seja o do usuário logado se houver um
CREATE POLICY "orders_insert_policy" ON public.orders 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL AND customer_id = auth.uid()) OR 
  (auth.uid() IS NULL AND customer_id IS NULL)
);

-- Política de Seleção: Clientes veem seus pedidos, produtores veem suas vendas, afiliados veem suas indicações
CREATE POLICY "orders_select_policy" ON public.orders 
FOR SELECT 
USING (
  customer_id = auth.uid() OR 
  producer_id = auth.uid() OR 
  affiliate_id = auth.uid() OR 
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm')
);

-- Política de Atualização: Apenas produtores e admins podem atualizar o status do pedido
CREATE POLICY "orders_update_policy" ON public.orders 
FOR UPDATE
USING (
  producer_id = auth.uid() OR 
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm')
);

-- 4. Garantir que as funções de estoque ignorem RLS (SECURITY DEFINER)
ALTER FUNCTION public.decrement_product_stock(UUID, INTEGER) SECURITY DEFINER;
ALTER FUNCTION public.increment_product_stock(UUID, INTEGER) SECURITY DEFINER;

-- 5. Recarregar esquema para garantir que as mudanças entrem em vigor
NOTIFY pgrst, 'reload schema';
