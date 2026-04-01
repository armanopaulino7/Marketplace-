-- ==========================================
-- MEGA FIX: MARKETPLACE E SAQUES (RESOLUÇÃO ÚNICA)
-- ==========================================

-- 1. LIMPAR TODAS AS POLÍTICAS EXISTENTES
-- Isso remove qualquer política antiga ou errada que esteja causando o erro "column user_id does not exist"
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'produtos', 'wallets', 'wallet_transactions', 'withdrawal_requests', 'orders', 'affiliations', 'delivery_fees')
    ) 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 2. RE-ATIVAR RLS EM TODAS AS TABELAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_fees ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE PERFIS (Público para todos verem nomes de vendedores)
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE USING (auth.uid() = id OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'));

-- 4. POLÍTICAS DE PRODUTOS (Aprovados visíveis para todos, inclusive visitantes)
CREATE POLICY "produtos_select_policy" ON public.produtos FOR SELECT 
USING (
  status = 'approved' 
  OR (auth.uid() IS NOT NULL AND auth.uid() = producer_id) 
  OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm')
);

CREATE POLICY "produtos_insert_policy" ON public.produtos FOR INSERT WITH CHECK (auth.uid() = producer_id);
CREATE POLICY "produtos_update_policy" ON public.produtos FOR UPDATE USING (auth.uid() = producer_id OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'));

-- 5. POLÍTICAS DE CARTEIRA (Apenas dono ou admin)
CREATE POLICY "wallets_select_policy" ON public.wallets FOR SELECT 
USING (user_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'));

-- 6. POLÍTICAS DE TRANSAÇÕES (CORRIGIDO: Não usa user_id diretamente na tabela)
CREATE POLICY "wallet_transactions_select_policy" ON public.wallet_transactions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.wallets
    WHERE public.wallets.id = wallet_transactions.wallet_id 
    AND (public.wallets.user_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'))
  )
);

-- 7. POLÍTICAS DE SAQUES (Apenas dono ou admin)
CREATE POLICY "withdrawals_select_policy" ON public.withdrawal_requests FOR SELECT 
USING (user_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'));

CREATE POLICY "withdrawals_insert_policy" ON public.withdrawal_requests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "withdrawals_update_policy" ON public.withdrawal_requests FOR UPDATE USING ((auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'));

-- 8. POLÍTICAS DE PEDIDOS
CREATE POLICY "orders_select_policy" ON public.orders FOR SELECT 
USING (customer_id = auth.uid() OR producer_id = auth.uid() OR affiliate_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'));

CREATE POLICY "orders_insert_policy" ON public.orders FOR INSERT WITH CHECK (
  (auth.uid() IS NOT NULL AND customer_id = auth.uid()) OR 
  (auth.uid() IS NULL AND customer_id IS NULL)
);

CREATE POLICY "orders_update_policy" ON public.orders FOR UPDATE USING (producer_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'));

-- 9. POLÍTICAS DE AFILIAÇÕES
CREATE POLICY "affiliations_select_policy" ON public.affiliations FOR SELECT 
USING (affiliate_id = auth.uid() OR (SELECT producer_id FROM public.produtos WHERE id = product_id) = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'));

CREATE POLICY "affiliations_insert_policy" ON public.affiliations FOR INSERT WITH CHECK (affiliate_id = auth.uid());
CREATE POLICY "affiliations_delete_policy" ON public.affiliations FOR DELETE USING (affiliate_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'));

-- 10. POLÍTICAS DE TAXAS DE ENTREGA
CREATE POLICY "delivery_fees_select_policy" ON public.delivery_fees FOR SELECT USING (true);
CREATE POLICY "delivery_fees_admin_policy" ON public.delivery_fees FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'));

-- 11. GARANTIR QUE AS FUNÇÕES RPC TÊM PERMISSÃO DE BYPASS RLS (SECURITY DEFINER)
ALTER FUNCTION public.process_sale_funds(UUID, DECIMAL, TEXT, INTEGER) SECURITY DEFINER;
ALTER FUNCTION public.deduct_wallet_balance(UUID, DECIMAL, TEXT) SECURITY DEFINER;
ALTER FUNCTION public.release_matured_funds(UUID) SECURITY DEFINER;
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;
ALTER FUNCTION public.is_admin() SECURITY DEFINER;
