-- Migration to fix wallet system and role issues
-- 1. Ensure wallets table exists
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) NOT NULL UNIQUE,
    balance DECIMAL(10,2) DEFAULT 0,
    pending_balance DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS on wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- 3. Policies for wallets
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.wallets;
CREATE POLICY "Users can view their own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallets;
CREATE POLICY "Admins can view all wallets" ON public.wallets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'adm')
        )
    );

-- 4. Fix withdrawal_requests policies (role = 'adm')
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Admins can view all withdrawals" ON public.withdrawal_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'adm')
        )
    );

-- 5. Update process_sale_funds to be more robust
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

-- 6. Ensure affiliations table has correct RLS
ALTER TABLE public.affiliations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create their own affiliations" ON public.affiliations;
CREATE POLICY "Users can create their own affiliations" ON public.affiliations
    FOR INSERT WITH CHECK (auth.uid() = affiliate_id);

DROP POLICY IF EXISTS "Users can view their own affiliations" ON public.affiliations;
CREATE POLICY "Users can view their own affiliations" ON public.affiliations
    FOR SELECT USING (auth.uid() = affiliate_id OR auth.uid() IN (
        SELECT p.id FROM public.profiles p 
        JOIN public.produtos pr ON pr.producer_id = p.id
        WHERE pr.id = product_id
    ));

-- 7. Ensure orders table has correct RLS for updates (needed for Admin)
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
CREATE POLICY "Admins can update all orders" ON public.orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'adm')
        )
    );
