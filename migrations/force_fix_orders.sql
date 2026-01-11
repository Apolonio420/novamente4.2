-- FORCE FIX: Run this entire script in the Supabase SQL Editor

-- 1. Add potentially missing columns to 'orders'
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS customer_first_name VARCHAR(255);
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS customer_last_name VARCHAR(255);
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(255);
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2);
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS total DECIMAL(10,2);
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2) DEFAULT 0;

-- 2. Force refresh the API schema cache
NOTIFY pgrst, 'reload schema';
