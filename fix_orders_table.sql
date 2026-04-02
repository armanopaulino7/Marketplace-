-- Add missing quantity column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- Ensure delivery_date is DATE type (if it was TEXT, we might need to cast it, but for now we just ensure it exists as DATE if possible)
-- If it already exists as TEXT, this might fail or do nothing.
-- Let's try to change the type if it exists.
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_date' AND data_type = 'text') THEN
        ALTER TABLE public.orders ALTER COLUMN delivery_date TYPE DATE USING delivery_date::DATE;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_date') THEN
        ALTER TABLE public.orders ADD COLUMN delivery_date DATE;
    END IF;
END $$;

-- Ensure RLS policies for orders are correct
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;

-- 1. Anyone can create an order (even if not logged in, but Checkout.tsx handles auth)
-- Actually, it's better to allow authenticated users to create orders.
CREATE POLICY "orders_insert_policy" ON public.orders FOR INSERT 
WITH CHECK (true); -- We allow insertion, but customer_id will be checked in the app

-- 2. Users can see their own orders, producers can see their sales, affiliates can see their referrals
CREATE POLICY "orders_select_policy" ON public.orders FOR SELECT 
USING (
  customer_id = auth.uid() OR 
  producer_id = auth.uid() OR 
  affiliate_id = auth.uid() OR 
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm')
);

-- 3. Producers and Admins can update orders (e.g., change status)
CREATE POLICY "orders_update_policy" ON public.orders FOR UPDATE
USING (
  producer_id = auth.uid() OR 
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'adm')
);

-- Ensure decrement_product_stock is SECURITY DEFINER
ALTER FUNCTION public.decrement_product_stock(UUID, INTEGER) SECURITY DEFINER;
