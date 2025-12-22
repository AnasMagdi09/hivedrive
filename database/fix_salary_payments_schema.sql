-- Fix salary_payments table schema for Supabase
-- Run this in Supabase SQL Editor

-- Add missing columns if they don't exist
ALTER TABLE public.salary_payments 
ADD COLUMN IF NOT EXISTS bonuses NUMERIC(10,2) DEFAULT 0;

ALTER TABLE public.salary_payments 
ADD COLUMN IF NOT EXISTS salary_cycle VARCHAR(20) DEFAULT 'monthly';

-- Ensure all permissions are set
GRANT ALL ON public.salary_payments TO authenticated;
GRANT ALL ON public.salary_payments TO anon;

-- Enable RLS
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policy
DROP POLICY IF EXISTS "Allow all for authenticated salary" ON public.salary_payments;
CREATE POLICY "Allow all for authenticated salary" ON public.salary_payments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Force Supabase to reload schema
NOTIFY pgrst, 'reload schema';
