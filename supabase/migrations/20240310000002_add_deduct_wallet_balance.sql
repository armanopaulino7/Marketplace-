-- Migration to add deduct_wallet_balance function
CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(
    user_id_param UUID, 
    amount_param DECIMAL, 
    description_param TEXT
)
RETURNS VOID AS $$
DECLARE
    v_wallet_id UUID;
BEGIN
    -- Obter carteira
    SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = user_id_param;
    
    IF v_wallet_id IS NULL THEN
        RAISE EXCEPTION 'Carteira não encontrada para o usuário %', user_id_param;
    END IF;

    -- Verificar saldo
    IF (SELECT balance FROM public.wallets WHERE id = v_wallet_id) < amount_param THEN
        RAISE EXCEPTION 'Saldo insuficiente';
    END IF;

    -- Deduzir saldo
    UPDATE public.wallets
    SET balance = balance - amount_param,
        updated_at = now()
    WHERE id = v_wallet_id;

    -- Registrar transação
    INSERT INTO public.wallet_transactions (wallet_id, amount, type, status, description, release_at)
    VALUES (
        v_wallet_id, 
        -amount_param, 
        'withdrawal', 
        'completed', 
        description_param, 
        now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
