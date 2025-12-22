-- ============================================
-- إنشاء جدول المستخدمين (users)
-- يجب تشغيل هذا الملف في Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_role enum if not exists
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'admin',
        'manager',
        'reception',
        'technician',
        'warehouse',
        'treasurer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop and recreate users table
DROP TABLE IF EXISTS salary_payments CASCADE;
DROP TABLE IF EXISTS employee_advances CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'technician',
    base_salary DECIMAL(10,2) DEFAULT 0,
    hire_date DATE,
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
DROP POLICY IF EXISTS "auth_all_users" ON users;
CREATE POLICY "auth_all_users" ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Also allow anon access for testing
DROP POLICY IF EXISTS "anon_all_users" ON users;
CREATE POLICY "anon_all_users" ON users FOR ALL TO anon USING (true) WITH CHECK (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- ============================================
-- إعادة إنشاء جدول salary_payments بالهيكل الصحيح
-- ============================================

-- Drop old table if exists with wrong structure
DROP TABLE IF EXISTS salary_payments CASCADE;

-- Create salary_payments table with correct structure
CREATE TABLE salary_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_type VARCHAR(20) NOT NULL DEFAULT 'monthly',
    payment_date DATE NOT NULL,
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "auth_all_salary" ON salary_payments;
CREATE POLICY "auth_all_salary" ON salary_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_salary" ON salary_payments;
CREATE POLICY "anon_all_salary" ON salary_payments FOR ALL TO anon USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_salary_employee ON salary_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_date ON salary_payments(payment_date);

-- ============================================
-- إعادة إنشاء جدول employee_advances
-- ============================================

DROP TABLE IF EXISTS employee_advances CASCADE;

CREATE TABLE employee_advances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    request_date DATE DEFAULT CURRENT_DATE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE employee_advances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all_advances" ON employee_advances;
CREATE POLICY "auth_all_advances" ON employee_advances FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_advances" ON employee_advances;
CREATE POLICY "anon_all_advances" ON employee_advances FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================
-- إنشاء جدول الخزينة إذا لم يكن موجوداً
-- ============================================

DROP TABLE IF EXISTS treasury_transactions CASCADE;
DROP TABLE IF EXISTS treasury CASCADE;

CREATE TABLE treasury (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    current_balance DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE treasury ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all_treasury" ON treasury;
CREATE POLICY "auth_all_treasury" ON treasury FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_treasury" ON treasury;
CREATE POLICY "anon_all_treasury" ON treasury FOR ALL TO anon USING (true) WITH CHECK (true);

-- Insert default treasury
INSERT INTO treasury (current_balance) VALUES (10000);

-- ============================================
-- إنشاء جدول حركات الخزينة
-- ============================================

CREATE TABLE IF NOT EXISTS treasury_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    treasury_id UUID REFERENCES treasury(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL,
    category VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(12,2),
    reference_type VARCHAR(50),
    reference_id UUID,
    description TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE treasury_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all_treasury_trans" ON treasury_transactions;
CREATE POLICY "auth_all_treasury_trans" ON treasury_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_treasury_trans" ON treasury_transactions;
CREATE POLICY "anon_all_treasury_trans" ON treasury_transactions FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================
-- إضافة بيانات تجريبية للموظفين
-- ============================================

-- Add sample employees for testing
INSERT INTO users (full_name, email, phone, role, base_salary, is_active) VALUES
('أحمد محمد', 'ahmed@test.com', '01012345678', 'admin', 15000, true),
('محمد علي', 'mohamed@test.com', '01023456789', 'manager', 12000, true),
('فني 1', 'tech1@test.com', '01034567890', 'technician', 800, true),
('فني 2', 'tech2@test.com', '01045678901', 'technician', 850, true),
('فني 3', 'tech3@test.com', '01056789012', 'technician', 900, true),
('سارة أحمد', 'sara@test.com', '01067890123', 'reception', 6000, true),
('خالد محمود', 'khaled@test.com', '01078901234', 'warehouse', 7000, true),
('ياسر عبدالله', 'yasser@test.com', '01089012345', 'treasurer', 8000, true)
ON CONFLICT (email) DO NOTHING;

SELECT 'تم إنشاء الجداول بنجاح! ✅' as message;
