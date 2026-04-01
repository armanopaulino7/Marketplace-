-- 1. Fix for wallet_transactions policies
DROP POLICY IF EXISTS "wallet_transactions_select_policy" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.wallet_transactions;

CREATE POLICY "wallet_transactions_select_policy" ON public.wallet_transactions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.wallets
    WHERE public.wallets.id = wallet_transactions.wallet_id 
    AND (public.wallets.user_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'))
  )
);

-- 2. Fix for produtos visibility (Marketplace)
DROP POLICY IF EXISTS "produtos_select_policy" ON public.produtos;
DROP POLICY IF EXISTS "Approved products are viewable by everyone" ON public.produtos;

CREATE POLICY "produtos_select_policy" ON public.produtos FOR SELECT 
USING (
  status = 'approved' 
  OR (auth.uid() IS NOT NULL AND auth.uid() = producer_id)
  OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm')
);

-- 3. Ensure profiles are readable by everyone (needed for marketplace joins)
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT 
USING (true);
