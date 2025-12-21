-- Add base_salary column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS base_salary DECIMAL(10,2) DEFAULT 0;

-- Create salary_payments table if not exists
CREATE TABLE IF NOT EXISTS salary_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_type VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'weekly' or 'monthly'
    payment_date DATE NOT NULL,
    week_number INT, -- For weekly payments (1-5)
    week_start DATE, -- Start date of the week for weekly payments
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, payment_type, week_start, month, year)
);

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
