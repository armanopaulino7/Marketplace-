-- ==================================================================================
-- SUPABASE FINAL FIX - RESOLVE TUDO DE UMA VEZ
-- ==================================================================================
-- Este script limpa todas as políticas existentes e recria as corretas.
-- Também garante que as funções críticas funcionem sem restrições de RLS.
-- ==================================================================================

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES PARA EVITAR CONFLITOS
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('profiles', 'produtos', 'wallets', 'wallet_transactions', 'withdrawal_requests', 'orders', 'affiliations', 'delivery_fees')) 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 2. GARANTIR QUE RLS ESTÁ ATIVADO
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_fees ENABLE ROW LEVEL SECURITY;

-- 3. FUNÇÃO AUXILIAR DE ADMIN (CORRIGIDA)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm') OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'adm')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. POLÍTICAS PARA PROFILES (Público para o Marketplace)
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- 5. POLÍTICAS PARA PRODUTOS (Visível para todos se aprovado)
CREATE POLICY "produtos_select_policy" ON public.produtos FOR SELECT 
USING (
  status = 'approved' 
  OR (auth.uid() IS NOT NULL AND auth.uid() = producer_id) 
  OR public.is_admin()
);
CREATE POLICY "produtos_insert_policy" ON public.produtos FOR INSERT WITH CHECK (auth.uid() = producer_id OR public.is_admin());
CREATE POLICY "produtos_update_policy" ON public.produtos FOR UPDATE USING (auth.uid() = producer_id OR public.is_admin());
CREATE POLICY "produtos_delete_policy" ON public.produtos FOR DELETE USING (auth.uid() = producer_id OR public.is_admin());

-- 6. POLÍTICAS PARA WALLETS (Segurança total)
CREATE POLICY "wallets_select_policy" ON public.wallets FOR SELECT 
USING (user_id = auth.uid() OR public.is_admin());

-- 7. POLÍTICAS PARA TRANSAÇÕES (CORRIGIDO: Não usa user_id na tabela wallet_transactions)
CREATE POLICY "wallet_transactions_select_policy" ON public.wallet_transactions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.wallets 
    WHERE public.wallets.id = wallet_transactions.wallet_id 
    AND (public.wallets.user_id = auth.uid() OR public.is_admin())
  )
);

-- 8. POLÍTICAS PARA SAQUES (WITHDRAWAL REQUESTS)
CREATE POLICY "withdrawals_select_policy" ON public.withdrawal_requests FOR SELECT 
USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "withdrawals_insert_policy" ON public.withdrawal_requests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "withdrawals_update_policy" ON public.withdrawal_requests FOR UPDATE USING (public.is_admin());

-- 9. POLÍTICAS PARA PEDIDOS (ORDERS)
CREATE POLICY "orders_select_policy" ON public.orders FOR SELECT 
USING (customer_id = auth.uid() OR producer_id = auth.uid() OR public.is_admin());
CREATE POLICY "orders_insert_policy" ON public.orders FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "orders_update_policy" ON public.orders FOR UPDATE USING (producer_id = auth.uid() OR public.is_admin());

-- 10. POLÍTICAS PARA AFILIAÇÕES
CREATE POLICY "affiliations_select_policy" ON public.affiliations FOR SELECT 
USING (affiliate_id = auth.uid() OR producer_id = auth.uid() OR public.is_admin());
CREATE POLICY "affiliations_insert_policy" ON public.affiliations FOR INSERT WITH CHECK (affiliate_id = auth.uid());
CREATE POLICY "affiliations_delete_policy" ON public.affiliations FOR DELETE USING (affiliate_id = auth.uid() OR public.is_admin());

-- 11. TAXAS DE ENTREGA
CREATE POLICY "delivery_fees_select_policy" ON public.delivery_fees FOR SELECT USING (true);
CREATE POLICY "delivery_fees_admin_policy" ON public.delivery_fees FOR ALL USING (public.is_admin());

-- 12. GARANTIR QUE FUNÇÕES RPC SÃO SECURITY DEFINER (Ignoram RLS)
ALTER FUNCTION public.deduct_wallet_balance(UUID, DECIMAL, TEXT) SECURITY DEFINER;
ALTER FUNCTION public.process_sale_funds(UUID, DECIMAL, TEXT, INTEGER) SECURITY DEFINER;
ALTER FUNCTION public.release_matured_funds() SECURITY DEFINER;

-- 13. CORREÇÃO: CRIAR CARTEIRAS FALTANTES PARA USUÁRIOS EXISTENTES
INSERT INTO public.wallets (user_id, balance, pending_balance)
SELECT id, 0, 0
FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.wallets)
ON CONFLICT (user_id) DO NOTHING;

-- 14. GARANTIR QUE O ADMIN TEM O PAPEL CORRETO NA TABELA PROFILES
-- Substitua pelo seu email se necessário, mas aqui usamos o email do contexto
UPDATE public.profiles SET role = 'adm' WHERE email = 'armanopaulino7@gmail.com';

-- 15. OPCIONAL: APROVAR TODOS OS PRODUTOS PENDENTES (Para teste imediato)
-- Descomente a linha abaixo se quiser aprovar tudo de uma vez para ver no marketplace
-- UPDATE public.produtos SET status = 'approved' WHERE status = 'pending';

-- 16. LIMPAR QUALQUER CACHE DE PERMISSÕES (Opcional, mas ajuda)
NOTIFY pgrst, 'reload schema';
