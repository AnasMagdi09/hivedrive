-- Add base_salary column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS base_salary DECIMAL(10,2) DEFAULT 0;

-- Drop old table if exists and recreate
DROP TABLE IF EXISTS salary_payments CASCADE;

-- Create salary_payments table
CREATE TABLE salary_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_type VARCHAR(20) NOT NULL DEFAULT 'monthly',
    payment_date DATE NOT NULL,
    week_number INT,
    week_start DATE,
    month INT NOT NULL,
    year INT NOT NULL,
    base_salary DECIMAL(10,2) NOT NULL,
    bonus DECIMAL(10,2) DEFAULT 0,
    bonus_reason TEXT,
    deductions DECIMAL(10,2) DEFAULT 0,
    deduction_reason TEXT,
    advances_deducted DECIMAL(10,2) DEFAULT 0,
    net_salary DECIMAL(10,2) NOT NULL,
    notes TEXT,
    paid_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups (not unique constraint)
CREATE INDEX idx_salary_payments_lookup ON salary_payments(employee_id, payment_type, year, month);
CREATE INDEX idx_salary_payments_week ON salary_payments(employee_id, week_start) WHERE week_start IS NOT NULL;

-- Create employee_advances table if not exists
CREATE TABLE IF NOT EXISTS employee_advances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    advance_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_advances ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "auth_all" ON salary_payments;
DROP POLICY IF EXISTS "auth_all" ON employee_advances;
CREATE POLICY "auth_all" ON salary_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON employee_advances FOR ALL TO authenticated USING (true) WITH CHECK (true);
