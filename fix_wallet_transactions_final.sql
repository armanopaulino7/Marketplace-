-- CORREÇÃO DEFINITIVA: wallet_transactions
-- Este script remove qualquer política que tente usar 'user_id' na tabela wallet_transactions

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- 1. Remover TODAS as políticas da tabela wallet_transactions para limpar erros
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wallet_transactions') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.wallet_transactions';
    END LOOP;
END $$;

-- 2. Garantir que RLS está ativo
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 3. Criar a política correta de SELECT (usando JOIN com wallets para verificar o dono)
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

-- 4. Garantir que as funções RPC funcionem com privilégios de sistema (SECURITY DEFINER)
-- Isso permite que elas insiram transações sem serem barradas pelo RLS
ALTER FUNCTION public.deduct_wallet_balance(UUID, DECIMAL, TEXT) SECURITY DEFINER;
ALTER FUNCTION public.process_sale_funds(UUID, DECIMAL, TEXT, INTEGER) SECURITY DEFINER;
ALTER FUNCTION public.release_matured_funds(UUID) SECURITY DEFINER;

-- 5. Recarregar esquema
NOTIFY pgrst, 'reload schema';
