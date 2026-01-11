-- Create partner_applications table
CREATE TABLE IF NOT EXISTS public.partner_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    brand_name TEXT,
    instagram_handle TEXT,
    website_url TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- Allow public inserts
DROP POLICY IF EXISTS "Allow public inserts for partner applications" ON public.partner_applications;
CREATE POLICY "Allow public inserts for partner applications" ON public.partner_applications
    FOR INSERT WITH CHECK (true);

-- Allow admins to view (assuming service_role or similar)
DROP POLICY IF EXISTS "Allow service role to view applications" ON public.partner_applications;
CREATE POLICY "Allow service role to view applications" ON public.partner_applications
    FOR SELECT USING (true);
