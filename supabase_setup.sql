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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  pickup_address TEXT,
  phone1 TEXT,
  phone2 TEXT,
  imagens TEXT[] DEFAULT '{}',
  variations JSONB DEFAULT '{"tamanho": [], "peso": [], "cor": []}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  bank_name TEXT,
  account_number TEXT,
  account_holder TEXT,
  iban TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
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
DROP POLICY IF EXISTS "Users can view relevant orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can place orders" ON public.orders;

CREATE POLICY "orders_select_policy" ON public.orders FOR SELECT 
USING (customer_id = auth.uid() OR producer_id = auth.uid() OR affiliate_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'));

CREATE POLICY "orders_insert_policy" ON public.orders FOR INSERT 
WITH CHECK (customer_id = auth.uid());

-- 5. WITHDRAWALS POLICIES
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Users can request withdrawals" ON public.withdrawals;

CREATE POLICY "withdrawals_select_policy" ON public.withdrawals FOR SELECT 
USING (user_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'));

CREATE POLICY "withdrawals_insert_policy" ON public.withdrawals FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- 6. DELIVERY FEES POLICIES
DROP POLICY IF EXISTS "Delivery fees are viewable by everyone" ON public.delivery_fees;
DROP POLICY IF EXISTS "Admins can manage delivery fees" ON public.delivery_fees;

CREATE POLICY "delivery_fees_select_policy" ON public.delivery_fees FOR SELECT USING (true);
CREATE POLICY "delivery_fees_admin_policy" ON public.delivery_fees FOR ALL 
USING ((auth.jwt() -> 'user_metadata' ->> 'role' = 'adm'));
