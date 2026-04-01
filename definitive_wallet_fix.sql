-- DEFINITIVE WALLET FIX
-- This script forcefully removes any problematic policies and ensures the wallet system is stable.

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- 1. REMOVE ALL POLICIES ON wallet_transactions TO CLEAR ANY STALE REFERENCES
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wallet_transactions') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.wallet_transactions';
    END LOOP;
END $$;

-- 2. RE-ENABLE RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 3. CREATE THE CORRECT SELECT POLICY (Joining with wallets to get user_id)
CREATE POLICY "wallet_transactions_select_policy" ON public.wallet_transactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.wallets
    WHERE public.wallets.id = wallet_transactions.wallet_id 
    AND (
      public.wallets.user_id = auth.uid() 
      OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm')
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'adm')
    )
  )
);

-- 4. ENSURE RPC FUNCTIONS ARE SECURITY DEFINER
ALTER FUNCTION public.deduct_wallet_balance(UUID, DECIMAL, TEXT) SECURITY DEFINER;
ALTER FUNCTION public.process_sale_funds(UUID, DECIMAL, TEXT, INTEGER) SECURITY DEFINER;
ALTER FUNCTION public.release_matured_funds(UUID) SECURITY DEFINER;

-- 5. FIX FOR ADMIN WALLET (Ensure it exists for the fee processing)
-- Using a dedicated system user ID or the current admin's ID
INSERT INTO public.wallets (user_id, balance, pending_balance)
SELECT id, 0, 0
FROM public.profiles
WHERE role = 'adm'
ON CONFLICT (user_id) DO NOTHING;

-- 6. RELOAD SCHEMA
NOTIFY pgrst, 'reload schema';
