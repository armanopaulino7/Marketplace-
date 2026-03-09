-- Adicionar colunas para afiliados na tabela de pedidos
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0;

-- Função para incrementar o saldo da carteira com segurança
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(user_id_param UUID, amount_param DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.wallets
  SET balance = balance + amount_param,
      updated_at = now()
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
