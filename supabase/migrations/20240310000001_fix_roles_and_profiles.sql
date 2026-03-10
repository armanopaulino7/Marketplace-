-- Fix role-based policies to use 'adm' instead of 'admin'
-- And allow users to update their own profiles

-- For delivery_fees
DROP POLICY IF EXISTS "Apenas admins podem gerenciar taxas de entrega" ON public.delivery_fees;
CREATE POLICY "Apenas admins podem gerenciar taxas de entrega" ON public.delivery_fees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'adm'
        )
    );

-- For withdrawal_requests
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Admins can view all withdrawals" ON public.withdrawal_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'adm'
        )
    );

-- Ensure profiles table has RLS and correct policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Fix storage policies to ensure owner is set correctly on insert
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Allow public access to read images (already exists but ensuring)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'images');

-- Allow users to delete their own images
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
CREATE POLICY "Users can delete their own images" ON storage.objects FOR DELETE 
USING (bucket_id = 'images' AND auth.uid() = owner);
