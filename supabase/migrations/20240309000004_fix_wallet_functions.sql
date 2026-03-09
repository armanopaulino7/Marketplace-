-- Fix process_sale_funds to handle immediate release
CREATE OR REPLACE FUNCTION public.process_sale_funds(
    user_id_param UUID, 
    amount_param DECIMAL, 
    description_param TEXT,
    days_to_release INTEGER DEFAULT 7
)
RETURNS VOID AS $$
DECLARE
    v_wallet_id UUID;
BEGIN
    -- Obter ou criar carteira
    SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = user_id_param;
    
    IF v_wallet_id IS NULL THEN
        IF days_to_release = 0 THEN
            INSERT INTO public.wallets (user_id, balance, pending_balance)
            VALUES (user_id_param, amount_param, 0)
            RETURNING id INTO v_wallet_id;
        ELSE
            INSERT INTO public.wallets (user_id, balance, pending_balance)
            VALUES (user_id_param, 0, amount_param)
            RETURNING id INTO v_wallet_id;
        END IF;
    ELSE
        IF days_to_release = 0 THEN
            UPDATE public.wallets
            SET balance = balance + amount_param,
                updated_at = now()
            WHERE id = v_wallet_id;
        ELSE
            UPDATE public.wallets
            SET pending_balance = pending_balance + amount_param,
                updated_at = now()
            WHERE id = v_wallet_id;
        END IF;
    END IF;

    -- Registrar transação
    INSERT INTO public.wallet_transactions (wallet_id, amount, type, status, description, release_at)
    VALUES (
        v_wallet_id, 
        amount_param, 
        'sale', 
        CASE WHEN days_to_release = 0 THEN 'completed' ELSE 'pending' END, 
        description_param, 
        now() + (days_to_release || ' days')::interval
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
