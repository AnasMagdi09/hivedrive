-- Create treasury tables in public schema for Supabase
-- Run this in Supabase SQL Editor

-- Treasury accounts table
DROP TABLE IF EXISTS public.treasury_accounts CASCADE;
CREATE TABLE public.treasury_accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) DEFAULT 'cash',
    current_balance NUMERIC(12,2) DEFAULT 0,
    opening_balance NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    branch_id INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Treasury transactions table
DROP TABLE IF EXISTS public.treasury_transactions CASCADE;
CREATE TABLE public.treasury_transactions (
    id SERIAL PRIMARY KEY,
    treasury_account_id INTEGER REFERENCES public.treasury_accounts(id),
    transaction_type VARCHAR(20) NOT NULL, -- 'income' or 'expense'
    category VARCHAR(100),
    amount NUMERIC(12,2) NOT NULL,
    balance_after NUMERIC(12,2),
    reference_type VARCHAR(50),
    reference_id INTEGER,
    description TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.treasury_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.treasury_accounts;
CREATE POLICY "Allow all for authenticated" ON public.treasury_accounts
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.treasury_transactions;
CREATE POLICY "Allow all for authenticated" ON public.treasury_transactions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.treasury_accounts TO authenticated;
GRANT ALL ON public.treasury_accounts TO anon;
GRANT ALL ON public.treasury_transactions TO authenticated;
GRANT ALL ON public.treasury_transactions TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.treasury_accounts_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.treasury_accounts_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.treasury_transactions_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.treasury_transactions_id_seq TO anon;

-- Insert default treasury account
INSERT INTO public.treasury_accounts (name, account_type, current_balance, opening_balance, status)
VALUES ('الخزينة الرئيسية', 'cash', 0, 0, 'active')
ON CONFLICT DO NOTHING;

-- Reload schema
SELECT pg_notify('pgrst', 'reload schema');
