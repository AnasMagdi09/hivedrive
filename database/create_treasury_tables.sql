-- ============================================
-- HiveDrive Treasury & Payments Tables
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. PAYMENT METHOD ENUM
-- ============================================
DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'credit_card', 'deferred');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. PAYMENTS (المدفوعات)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_number VARCHAR(20) UNIQUE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method NOT NULL DEFAULT 'cash',
    payment_date DATE NOT NULL,
    reference_number VARCHAR(50),
    notes TEXT,
    received_by UUID REFERENCES users(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES branches(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment number trigger
CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_number IS NULL THEN
        NEW.payment_number := 'PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
            LPAD((SELECT COUNT(*) + 1 FROM payments WHERE DATE(created_at) = CURRENT_DATE)::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_payment_number ON payments;
CREATE TRIGGER set_payment_number BEFORE INSERT ON payments FOR EACH ROW EXECUTE FUNCTION generate_payment_number();

-- ============================================
-- 3. TREASURY (الخزينة)
-- ============================================
CREATE TABLE IF NOT EXISTS treasury (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE UNIQUE,
    current_balance DECIMAL(12,2) DEFAULT 0,
    last_reconciliation DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TRANSACTION TYPE ENUM
-- ============================================
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('income', 'expense');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 5. TREASURY TRANSACTIONS (حركات الخزينة)
-- ============================================
CREATE TABLE IF NOT EXISTS treasury_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    treasury_id UUID NOT NULL REFERENCES treasury(id) ON DELETE CASCADE,
    transaction_type transaction_type NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    description TEXT,
    transaction_date DATE NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. EXPENSES (المصروفات)
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    expense_date DATE NOT NULL,
    receipt_number VARCHAR(50),
    paid_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON treasury FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON treasury_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- Initialize treasury for default branch
-- ============================================
INSERT INTO treasury (branch_id, current_balance)
SELECT id, 0 FROM branches WHERE name = 'الفرع الرئيسي'
ON CONFLICT (branch_id) DO NOTHING;

-- ============================================
-- DONE!
-- ============================================
