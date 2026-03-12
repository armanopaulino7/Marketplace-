-- SUPABASE SQL SCRIPT FOR MARKETPLACE
-- Run this in the SQL Editor of your Supabase project

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'customer' CHECK (role IN ('admin', 'producer', 'affiliate', 'customer')),
  full_name TEXT,
  avatar_url TEXT,
  balance DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Profiles: Users can read all profiles (needed for joins), but only update their own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Produtos: Everyone can read approved products. Producers can manage their own.
CREATE POLICY "Approved products are viewable by everyone" ON public.produtos FOR SELECT USING (status = 'approved' OR auth.uid() = producer_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Producers can insert own products" ON public.produtos FOR INSERT WITH CHECK (auth.uid() = producer_id);
CREATE POLICY "Producers can update own products" ON public.produtos FOR UPDATE USING (auth.uid() = producer_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Affiliations: Users can see their own affiliations.
CREATE POLICY "Users can view own affiliations" ON public.affiliations FOR SELECT USING (affiliate_id = auth.uid() OR (SELECT producer_id FROM public.produtos WHERE id = product_id) = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Affiliates can request affiliation" ON public.affiliations FOR INSERT WITH CHECK (affiliate_id = auth.uid());

-- Orders: Customers see their orders, Producers see their sales, Affiliates see their referrals.
CREATE POLICY "Users can view relevant orders" ON public.orders FOR SELECT USING (customer_id = auth.uid() OR producer_id = auth.uid() OR affiliate_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Customers can place orders" ON public.orders FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Withdrawals: Users see their own. Admins see all.
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals FOR SELECT USING (user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Users can request withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (user_id = auth.uid());

-- Delivery Fees: Everyone can read. Admins can manage.
CREATE POLICY "Delivery fees are viewable by everyone" ON public.delivery_fees FOR SELECT USING (true);
CREATE POLICY "Admins can manage delivery fees" ON public.delivery_fees FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- TRIGGER FOR NEW USER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, 'customer', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
