-- SUPABASE SQL SCRIPT FOR MARKETPLACE
-- Run this in the SQL Editor of your Supabase project

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'cliente' CHECK (role IN ('adm', 'produtor', 'afiliado', 'cliente')),
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  phone2 TEXT,
  balance DECIMAL(12,2) DEFAULT 0.00,
  iban_platform TEXT,
  paypay_platform TEXT,
  express_platform TEXT,
  unitel_platform TEXT,
  afri_platform TEXT,
  iban_private TEXT,
  bank_name_private TEXT,
  holder_name_private TEXT,
  platform_bank_details JSONB DEFAULT '{}',
  private_bank_details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- 1.1 FUNCTION TO CHECK IF USER IS ADMIN (Uses JWT metadata to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check role from JWT metadata first (fastest, no recursion)
  IF (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm') THEN
    RETURN TRUE;
  END IF;

  -- Fallback to table check but only if not already checking profiles
  -- To be safe and avoid recursion, we'll just rely on the JWT or a very specific check
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.2 TRIGGER TO CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, phone, phone2, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'cliente'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'phone2',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create a wallet for the new user
  INSERT INTO public.wallets (user_id, balance, pending_balance)
  VALUES (NEW.id, 0, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. PRODUTOS TABLE
CREATE TABLE IF NOT EXISTS public.produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  quantity INTEGER DEFAULT 0,
  category TEXT,
  subcategory TEXT,
  brand TEXT,
  model TEXT,
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  pickup_address TEXT,
  phone1 TEXT,
  phone2 TEXT,
  imagens TEXT[] DEFAULT '{}',
  variations JSONB DEFAULT '{"tamanho": [], "peso": [], "cor": []}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  condition TEXT DEFAULT 'Novo' CHECK (condition IN ('Novo', 'Usado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AFFILIATIONS TABLE
CREATE TABLE IF NOT EXISTS public.affiliations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE,
  affiliate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, affiliate_id)
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.profiles(id),
  producer_id UUID REFERENCES public.profiles(id),
  affiliate_id UUID REFERENCES public.profiles(id),
  product_id UUID REFERENCES public.produtos(id),
  amount DECIMAL(12,2) NOT NULL,
  commission_amount DECIMAL(12,2) DEFAULT 0.00,
  delivery_fee DECIMAL(12,2) DEFAULT 0.00,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'completed', 'cancelled')),
  customer_name TEXT,
  customer_phone TEXT,
  delivery_address TEXT,
  neighborhood TEXT,
  payment_method TEXT,
  payment_proof TEXT,
  delivery_date TEXT,
  producer_commission DECIMAL(12,2) DEFAULT 0.00,
  platform_fee DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. WITHDRAWAL REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    method TEXT NOT NULL, -- 'IBAN', 'PayPay', 'Multicaixa Express', 'Unitel Money', 'AfriMoney'
    details JSONB NOT NULL, -- Armazena IBAN, número de telefone, etc.
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- WALLET SYSTEM TABLES
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) NOT NULL UNIQUE,
    balance DECIMAL(12,2) DEFAULT 0,
    pending_balance DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES public.wallets(id) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    type TEXT NOT NULL, -- 'sale', 'withdrawal', 'release', 'commission'
    status TEXT DEFAULT 'pending', -- 'pending', 'completed'
    description TEXT,
    release_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. DELIVERY FEES TABLE
CREATE TABLE IF NOT EXISTS public.delivery_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  neighborhood TEXT UNIQUE NOT NULL,
  fee DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_fees ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
-- Drop all possible previous policy names to ensure a clean state
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'));

-- 2. PRODUTOS POLICIES
DROP POLICY IF EXISTS "Approved products are viewable by everyone" ON public.produtos;
DROP POLICY IF EXISTS "Producers can insert own products" ON public.produtos;
DROP POLICY IF EXISTS "Producers can update own products" ON public.produtos;

CREATE POLICY "produtos_select_policy" ON public.produtos FOR SELECT 
USING (status = 'approved' OR auth.uid() = producer_id OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'));

CREATE POLICY "produtos_insert_policy" ON public.produtos FOR INSERT 
WITH CHECK (auth.uid() = producer_id);

CREATE POLICY "produtos_update_policy" ON public.produtos FOR UPDATE 
USING (auth.uid() = producer_id OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'));

-- 3. AFFILIATIONS POLICIES
DROP POLICY IF EXISTS "Users can view own affiliations" ON public.affiliations;
DROP POLICY IF EXISTS "Affiliates can request affiliation" ON public.affiliations;

CREATE POLICY "affiliations_select_policy" ON public.affiliations FOR SELECT 
USING (affiliate_id = auth.uid() OR (SELECT producer_id FROM public.produtos WHERE id = product_id) = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'));

CREATE POLICY "affiliations_insert_policy" ON public.affiliations FOR INSERT 
WITH CHECK (affiliate_id = auth.uid());

-- 4. ORDERS POLICIES
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;

CREATE POLICY "orders_select_policy" ON public.orders FOR SELECT 
USING (
  customer_id = auth.uid() OR 
  producer_id = auth.uid() OR 
  affiliate_id = auth.uid() OR 
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm')
);

-- Allow anyone to place an order (including guests)
-- If logged in, customer_id must match auth.uid()
-- If guest, customer_id must be null
CREATE POLICY "orders_insert_policy" ON public.orders FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL AND customer_id = auth.uid()) OR 
  (auth.uid() IS NULL AND customer_id IS NULL)
);

CREATE POLICY "orders_update_policy" ON public.orders FOR UPDATE
USING (
  producer_id = auth.uid() OR 
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm')
);

-- 5. WITHDRAWALS POLICIES
DROP POLICY IF EXISTS "withdrawals_select_policy" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "withdrawals_insert_policy" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "withdrawals_update_policy" ON public.withdrawal_requests;

CREATE POLICY "withdrawals_select_policy" ON public.withdrawal_requests FOR SELECT 
USING (user_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'));

CREATE POLICY "withdrawals_insert_policy" ON public.withdrawal_requests FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "withdrawals_update_policy" ON public.withdrawal_requests FOR UPDATE
USING ((auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'));

-- WALLET POLICIES
DROP POLICY IF EXISTS "wallets_select_policy" ON public.wallets;
CREATE POLICY "wallets_select_policy" ON public.wallets FOR SELECT 
USING (user_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'));

DROP POLICY IF EXISTS "wallet_transactions_select_policy" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_select_policy" ON public.wallet_transactions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.wallets
    WHERE id = wallet_transactions.wallet_id AND (user_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'))
  )
);

-- 6. DELIVERY FEES POLICIES
DROP POLICY IF EXISTS "Delivery fees are viewable by everyone" ON public.delivery_fees;
DROP POLICY IF EXISTS "Admins can manage delivery fees" ON public.delivery_fees;

CREATE POLICY "delivery_fees_select_policy" ON public.delivery_fees FOR SELECT USING (true);
CREATE POLICY "delivery_fees_admin_policy" ON public.delivery_fees FOR ALL 
USING ((auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'));

-- 7. RPC FUNCTIONS
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
