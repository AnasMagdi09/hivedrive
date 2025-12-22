-- Employee Advances and Installments System
-- Run this in Supabase SQL Editor

-- Drop existing tables if needed (be careful with data!)
-- DROP TABLE IF EXISTS advance_installments CASCADE;
-- DROP TABLE IF EXISTS employee_advances CASCADE;

-- Create employee_advances table
CREATE TABLE IF NOT EXISTS employee_advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    advance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, paid, completed
    installments_count INTEGER DEFAULT 1,
    installment_amount NUMERIC(12,2),
    paid_amount NUMERIC(12,2) DEFAULT 0,
    remaining_amount NUMERIC(12,2),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create advance_installments table
CREATE TABLE IF NOT EXISTS advance_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advance_id UUID NOT NULL REFERENCES employee_advances(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue
    payment_method VARCHAR(50),
    notes TEXT,
    paid_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE employee_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_installments ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Allow all for authenticated" ON employee_advances;
CREATE POLICY "Allow all for authenticated" ON employee_advances
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated" ON advance_installments;
CREATE POLICY "Allow all for authenticated" ON advance_installments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON employee_advances TO authenticated, anon;
GRANT ALL ON advance_installments TO authenticated, anon;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_advances_employee ON employee_advances(employee_id);
CREATE INDEX IF NOT EXISTS idx_advances_status ON employee_advances(status);
CREATE INDEX IF NOT EXISTS idx_installments_advance ON advance_installments(advance_id);
CREATE INDEX IF NOT EXISTS idx_installments_status ON advance_installments(status);

-- Function to update remaining amount
CREATE OR REPLACE FUNCTION update_advance_remaining()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE employee_advances
    SET 
        paid_amount = COALESCE((
            SELECT SUM(amount)
            FROM advance_installments
            WHERE advance_id = NEW.advance_id AND status = 'paid'
        ), 0),
        remaining_amount = amount - COALESCE((
            SELECT SUM(amount)
            FROM advance_installments
            WHERE advance_id = NEW.advance_id AND status = 'paid'
        ), 0),
        status = CASE
            WHEN amount <= COALESCE((
                SELECT SUM(amount)
                FROM advance_installments
                WHERE advance_id = NEW.advance_id AND status = 'paid'
            ), 0) THEN 'completed'
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = NEW.advance_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_advance_remaining ON advance_installments;
CREATE TRIGGER trigger_update_advance_remaining
    AFTER INSERT OR UPDATE ON advance_installments
    FOR EACH ROW
    EXECUTE FUNCTION update_advance_remaining();

-- Reload schema
SELECT pg_notify('pgrst', 'reload schema');
