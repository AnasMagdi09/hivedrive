-- Create quotations table in public schema for Supabase
-- Run this in Supabase SQL Editor

DROP TABLE IF EXISTS public.quotations CASCADE;
CREATE TABLE public.quotations (
    id SERIAL PRIMARY KEY,
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    vehicle_id UUID,
    vehicle_info TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    total_amount NUMERIC(12,2) DEFAULT 0,
    discount NUMERIC(12,2) DEFAULT 0,
    tax NUMERIC(12,2) DEFAULT 0,
    final_amount NUMERIC(12,2) DEFAULT 0,
    notes TEXT,
    valid_until DATE,
    created_by_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.quotations;
CREATE POLICY "Allow all for authenticated" ON public.quotations
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.quotations TO authenticated;
GRANT ALL ON public.quotations TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.quotations_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.quotations_id_seq TO anon;

-- Reload schema
SELECT pg_notify('pgrst', 'reload schema');
