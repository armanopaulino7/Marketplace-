-- Fix for wallet_transactions RLS and RPC functions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallet_transactions_select_policy" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "wallet_transactions_insert_policy" ON public.wallet_transactions;

CREATE POLICY "wallet_transactions_select_policy" ON public.wallet_transactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.wallets 
    WHERE public.wallets.id = wallet_transactions.wallet_id 
    AND (public.wallets.user_id = auth.uid() OR public.is_admin())
  )
);

CREATE POLICY "wallet_transactions_insert_policy" ON public.wallet_transactions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.wallets 
    WHERE public.wallets.id = wallet_transactions.wallet_id 
    AND (public.wallets.user_id = auth.uid() OR public.is_admin())
  )
);

ALTER FUNCTION public.deduct_wallet_balance(UUID, DECIMAL, TEXT) SECURITY DEFINER;
ALTER FUNCTION public.process_sale_funds(UUID, DECIMAL, TEXT, INTEGER) SECURITY DEFINER;
ALTER FUNCTION public.release_matured_funds(UUID) SECURITY DEFINER;
