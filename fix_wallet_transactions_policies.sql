-- Fix for wallet_transactions policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "wallet_transactions_select_policy" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.wallet_transactions;

-- Create the corrected policy
CREATE POLICY "wallet_transactions_select_policy" ON public.wallet_transactions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.wallets
    WHERE public.wallets.id = wallet_transactions.wallet_id 
    AND (public.wallets.user_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'))
  )
);
