-- Atualização do sistema de carteira
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS pending_balance DECIMAL(10,2) DEFAULT 0;

-- Tabela de solicitações de saque
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    method TEXT NOT NULL, -- 'IBAN', 'PayPay', 'Multicaixa Express', 'Unitel Money', 'AfriMoney'
    details JSONB NOT NULL, -- Armazena IBAN, número de telefone, etc.
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de transações de carteira para controle de liberação
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES public.wallets(id) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL, -- 'sale', 'withdrawal', 'release', 'commission'
    status TEXT DEFAULT 'pending', -- 'pending', 'completed'
    description TEXT,
    release_at TIMESTAMPTZ, -- Data em que o saldo pendente se torna disponível
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para solicitações de saque
CREATE POLICY "Users can view their own withdrawals" ON public.withdrawal_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own withdrawals" ON public.withdrawal_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawals" ON public.withdrawal_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para transações
CREATE POLICY "Users can view their own transactions" ON public.wallet_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.wallets
            WHERE id = wallet_transactions.wallet_id AND user_id = auth.uid()
        )
    );

-- Função para processar venda e adicionar ao saldo pendente
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
        INSERT INTO public.wallets (user_id, balance, pending_balance)
        VALUES (user_id_param, 0, amount_param)
        RETURNING id INTO v_wallet_id;
    ELSE
        UPDATE public.wallets
        SET pending_balance = pending_balance + amount_param,
            updated_at = now()
        WHERE id = v_wallet_id;
    END IF;

    -- Registrar transação pendente
    INSERT INTO public.wallet_transactions (wallet_id, amount, type, status, description, release_at)
    VALUES (v_wallet_id, amount_param, 'sale', 'pending', description_param, now() + (days_to_release || ' days')::interval);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para liberar saldos maturados
CREATE OR REPLACE FUNCTION public.release_matured_funds(user_id_param UUID)
RETURNS DECIMAL AS $$
DECLARE
    v_wallet_id UUID;
    v_total_released DECIMAL := 0;
BEGIN
    SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = user_id_param;
    
    IF v_wallet_id IS NULL THEN
        RETURN 0;
    END IF;

    -- Somar transações pendentes que já passaram da data de liberação
    SELECT COALESCE(SUM(amount), 0) INTO v_total_released
    FROM public.wallet_transactions
    WHERE wallet_id = v_wallet_id 
      AND status = 'pending' 
      AND release_at <= now();

    IF v_total_released > 0 THEN
        -- Atualizar carteira
        UPDATE public.wallets
        SET balance = balance + v_total_released,
            pending_balance = pending_balance - v_total_released,
            updated_at = now()
        WHERE id = v_wallet_id;

        -- Marcar transações como completadas
        UPDATE public.wallet_transactions
        SET status = 'completed'
        WHERE wallet_id = v_wallet_id 
          AND status = 'pending' 
          AND release_at <= now();
    END IF;

    RETURN v_total_released;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
