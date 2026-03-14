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

-- Profiles: Users can read all profiles, but only manage their own
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Separate policy for admins to update profiles (avoids recursion in the main policy)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (
  (SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'adm')
);

-- Produtos: Everyone can read approved products. Producers can manage their own.
DROP POLICY IF EXISTS "Approved products are viewable by everyone" ON public.produtos;
CREATE POLICY "Approved products are viewable by everyone" ON public.produtos FOR SELECT USING (status = 'approved' OR auth.uid() = producer_id OR is_admin());

DROP POLICY IF EXISTS "Producers can insert own products" ON public.produtos;
CREATE POLICY "Producers can insert own products" ON public.produtos FOR INSERT WITH CHECK (auth.uid() = producer_id);

DROP POLICY IF EXISTS "Producers can update own products" ON public.produtos;
CREATE POLICY "Producers can update own products" ON public.produtos FOR UPDATE USING (auth.uid() = producer_id OR is_admin());

-- Affiliations: Users can see their own affiliations.
DROP POLICY IF EXISTS "Users can view own affiliations" ON public.affiliations;
CREATE POLICY "Users can view own affiliations" ON public.affiliations FOR SELECT USING (affiliate_id = auth.uid() OR (SELECT producer_id FROM public.produtos WHERE id = product_id) = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Affiliates can request affiliation" ON public.affiliations;
CREATE POLICY "Affiliates can request affiliation" ON public.affiliations FOR INSERT WITH CHECK (affiliate_id = auth.uid());

-- Orders: Customers see their orders, Producers see their sales, Affiliates see their referrals.
DROP POLICY IF EXISTS "Users can view relevant orders" ON public.orders;
CREATE POLICY "Users can view relevant orders" ON public.orders FOR SELECT USING (customer_id = auth.uid() OR producer_id = auth.uid() OR affiliate_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Customers can place orders" ON public.orders;
CREATE POLICY "Customers can place orders" ON public.orders FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Withdrawals: Users see their own. Admins see all.
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals FOR SELECT USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can request withdrawals" ON public.withdrawals;
CREATE POLICY "Users can request withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (user_id = auth.uid());

-- Delivery Fees: Everyone can read. Admins can manage.
DROP POLICY IF EXISTS "Delivery fees are viewable by everyone" ON public.delivery_fees;
CREATE POLICY "Delivery fees are viewable by everyone" ON public.delivery_fees FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage delivery fees" ON public.delivery_fees;
CREATE POLICY "Admins can manage delivery fees" ON public.delivery_fees FOR ALL USING (is_admin());
