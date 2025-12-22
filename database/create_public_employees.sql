-- Create employees table in public schema for Supabase access
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'employee',
    email VARCHAR(255),
    phone VARCHAR(50),
    base_salary NUMERIC(10,2) DEFAULT 0,
    salary_cycle VARCHAR(20) DEFAULT 'monthly', -- 'weekly' or 'monthly'
    status VARCHAR(20) DEFAULT 'active',
    branch_id INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees(role);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.employees;
CREATE POLICY "Allow all for authenticated" ON public.employees
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert sample employees if table is empty
INSERT INTO public.employees (name, role, base_salary, salary_cycle, status)
SELECT 'أحمد محمد', 'technician', 3000, 'weekly', 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.employees LIMIT 1);

INSERT INTO public.employees (name, role, base_salary, salary_cycle, status)
SELECT 'محمد علي', 'technician', 2800, 'weekly', 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.employees WHERE name = 'محمد علي');

INSERT INTO public.employees (name, role, base_salary, salary_cycle, status)
SELECT 'سارة أحمد', 'reception', 5000, 'monthly', 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.employees WHERE name = 'سارة أحمد');

INSERT INTO public.employees (name, role, base_salary, salary_cycle, status)
SELECT 'خالد حسن', 'warehouse', 4500, 'monthly', 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.employees WHERE name = 'خالد حسن');

-- Update salary_payments to use correct columns
ALTER TABLE public.salary_payments 
ADD COLUMN IF NOT EXISTS salary_cycle VARCHAR(20) DEFAULT 'monthly';

-- Grant permissions
GRANT ALL ON public.employees TO authenticated;
GRANT ALL ON public.employees TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.employees_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.employees_id_seq TO anon;

-- Also grant on salary_payments
GRANT ALL ON public.salary_payments TO authenticated;
GRANT ALL ON public.salary_payments TO anon;

-- Also grant on employee_advances
GRANT ALL ON public.employee_advances TO authenticated;
GRANT ALL ON public.employee_advances TO anon;

-- Enable RLS and create policies for employee_advances
ALTER TABLE public.employee_advances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated advances" ON public.employee_advances;
CREATE POLICY "Allow all for authenticated advances" ON public.employee_advances
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable RLS and create policies for salary_payments
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated salary" ON public.salary_payments;
CREATE POLICY "Allow all for authenticated salary" ON public.salary_payments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Refresh Supabase schema cache
NOTIFY pgrst, 'reload schema';
