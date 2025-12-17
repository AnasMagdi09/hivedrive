-- ============================================
-- HiveDrive Database Schema
-- نظام إدارة ورش صيانة المركبات
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. BRANCHES (الفروع)
-- ============================================
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. USER ROLES ENUM
-- ============================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'admin',
        'manager',
        'reception',
        'specialist',
        'warehouse',
        'treasurer',
        'technician'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 3. USERS (المستخدمين)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    full_name_en VARCHAR(100),
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'technician',
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    base_salary DECIMAL(10,2) DEFAULT 0,
    hire_date DATE,
    is_active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_branch ON users(branch_id);

-- ============================================
-- 4. CUSTOMERS (العملاء)
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    phone2 VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    national_id VARCHAR(20),
    customer_type VARCHAR(20) DEFAULT 'individual',
    company_name VARCHAR(100),
    tax_number VARCHAR(50),
    notes TEXT,
    total_spent DECIMAL(12,2) DEFAULT 0,
    visit_count INT DEFAULT 0,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_branch ON customers(branch_id);

-- ============================================
-- 5. VEHICLES (المركبات)
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    plate_number VARCHAR(20) NOT NULL,
    chassis_number VARCHAR(50),
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50),
    year INT,
    color VARCHAR(30),
    engine_type VARCHAR(50),
    transmission VARCHAR(20),
    fuel_type VARCHAR(20),
    mileage INT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plate_number)
);

CREATE INDEX IF NOT EXISTS idx_vehicles_customer ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_chassis ON vehicles(chassis_number);

-- ============================================
-- 6. SUPPLIERS (الموردين)
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    phone2 VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    tax_number VARCHAR(50),
    payment_terms VARCHAR(100),
    balance DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. PARTS (قطع الغيار)
-- ============================================
CREATE TABLE IF NOT EXISTS parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(50),
    name VARCHAR(150) NOT NULL,
    name_en VARCHAR(150),
    category VARCHAR(50),
    brand VARCHAR(50),
    unit VARCHAR(20) DEFAULT 'piece',
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    sell_price DECIMAL(10,2) NOT NULL,
    min_quantity INT DEFAULT 5,
    location VARCHAR(50),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parts_sku ON parts(sku);
CREATE INDEX IF NOT EXISTS idx_parts_category ON parts(category);
CREATE INDEX IF NOT EXISTS idx_parts_supplier ON parts(supplier_id);

-- ============================================
-- 8. INVENTORY (مخزون الفروع)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) DEFAULT 0,
    reserved_quantity DECIMAL(10,2) DEFAULT 0,
    last_restock_date TIMESTAMPTZ,
    last_stock_check TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(branch_id, part_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_branch ON inventory(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_part ON inventory(part_id);

-- ============================================
-- 9. QUOTATION STATUS ENUM
-- ============================================
DO $$ BEGIN
    CREATE TYPE quotation_status AS ENUM (
        'draft',
        'pending',
        'approved',
        'rejected',
        'converted',
        'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 10. QUOTATIONS (المقايسات)
-- ============================================
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    status quotation_status DEFAULT 'draft',
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 14,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    valid_until DATE,
    notes TEXT,
    internal_notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotations_customer ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_branch ON quotations(branch_id);

-- ============================================
-- 11. ITEM TYPE ENUM
-- ============================================
DO $$ BEGIN
    CREATE TYPE item_type AS ENUM ('service', 'part');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 12. QUOTATION ITEMS (بنود المقايسة)
-- ============================================
CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    item_type item_type NOT NULL,
    part_id UUID REFERENCES parts(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    description_en VARCHAR(255),
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation ON quotation_items(quotation_id);

-- ============================================
-- 13. WORK ORDER STATUS ENUM
-- ============================================
DO $$ BEGIN
    CREATE TYPE work_order_status AS ENUM (
        'pending',
        'in_progress',
        'on_hold',
        'completed',
        'delivered',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE priority_level AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 14. WORK ORDERS (أوامر الشغل)
-- ============================================
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    status work_order_status DEFAULT 'pending',
    priority priority_level DEFAULT 'normal',
    mileage_in INT,
    mileage_out INT,
    fuel_level VARCHAR(20),
    customer_complaints TEXT,
    diagnosis TEXT,
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 14,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    estimated_completion DATE,
    actual_completion TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    notes TEXT,
    internal_notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    delivered_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_orders_customer ON work_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_vehicle ON work_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_branch ON work_orders(branch_id);

-- ============================================
-- 15. WORK ORDER ITEMS (بنود أمر الشغل)
-- ============================================
CREATE TABLE IF NOT EXISTS work_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    item_type item_type NOT NULL,
    part_id UUID REFERENCES parts(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    description_en VARCHAR(255),
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_order_items_wo ON work_order_items(work_order_id);

-- ============================================
-- 16. WORK ORDER TECHNICIANS (فنيين أمر الشغل)
-- ============================================
CREATE TABLE IF NOT EXISTS work_order_technicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(work_order_id, technician_id)
);

CREATE INDEX IF NOT EXISTS idx_wot_work_order ON work_order_technicians(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wot_technician ON work_order_technicians(technician_id);

-- ============================================
-- 17. WORK LOGS (سجل العمل)
-- ============================================
CREATE TABLE IF NOT EXISTS work_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_minutes INT,
    task_description TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_logs_wo ON work_logs(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_tech ON work_logs(technician_id);

-- ============================================
-- 18. MODIFICATION REQUESTS (طلبات التعديل)
-- ============================================
DO $$ BEGIN
    CREATE TYPE modification_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS modification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    additional_cost DECIMAL(10,2) DEFAULT 0,
    status modification_status DEFAULT 'pending',
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mod_requests_wo ON modification_requests(work_order_id);

-- ============================================
-- 19. MAINTENANCE HISTORY (تاريخ الصيانة)
-- ============================================
CREATE TABLE IF NOT EXISTS maintenance_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
    service_date DATE NOT NULL,
    mileage_at_service INT,
    description TEXT NOT NULL,
    total_cost DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance_history(vehicle_id);

-- ============================================
-- 20. STOCK MOVEMENT TYPE ENUM
-- ============================================
DO $$ BEGIN
    CREATE TYPE movement_type AS ENUM (
        'purchase_in',
        'work_order_out',
        'adjustment_in',
        'adjustment_out',
        'transfer_in',
        'transfer_out',
        'return_in'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 21. STOCK MOVEMENTS (حركة المخزون)
-- ============================================
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    movement_type movement_type NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2),
    reference_type VARCHAR(50),
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_branch ON stock_movements(branch_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_part ON stock_movements(part_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);

-- ============================================
-- 22. PRICE HISTORY (تاريخ الأسعار)
-- ============================================
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    old_cost_price DECIMAL(10,2),
    new_cost_price DECIMAL(10,2),
    old_sell_price DECIMAL(10,2),
    new_sell_price DECIMAL(10,2),
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    change_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_part ON price_history(part_id);

-- ============================================
-- 23. PURCHASE ORDER STATUS ENUM
-- ============================================
DO $$ BEGIN
    CREATE TYPE purchase_status AS ENUM (
        'draft',
        'pending',
        'approved',
        'ordered',
        'partial',
        'received',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 24. PURCHASE ORDERS (أوامر الشراء)
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number VARCHAR(20) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    status purchase_status DEFAULT 'draft',
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    expected_date DATE,
    received_date TIMESTAMPTZ,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_branch ON purchase_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);

-- ============================================
-- 25. PURCHASE ORDER ITEMS (بنود أمر الشراء)
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE RESTRICT,
    quantity_ordered DECIMAL(10,2) NOT NULL,
    quantity_received DECIMAL(10,2) DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_poi_po ON purchase_order_items(purchase_order_id);

-- ============================================
-- 26. INVOICE STATUS ENUM
-- ============================================
DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM (
        'draft',
        'issued',
        'partial',
        'paid',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 27. INVOICES (الفواتير)
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(20) UNIQUE NOT NULL,
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    status invoice_status DEFAULT 'draft',
    subtotal DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    remaining_amount DECIMAL(12,2) NOT NULL,
    due_date DATE,
    notes TEXT,
    issued_by UUID REFERENCES users(id) ON DELETE SET NULL,
    issued_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_wo ON invoices(work_order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_branch ON invoices(branch_id);

-- ============================================
-- 28. PAYMENT METHOD ENUM
-- ============================================
DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM (
        'cash',
        'bank_transfer',
        'credit_card',
        'deferred'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 29. PAYMENTS (المدفوعات)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_number VARCHAR(20) UNIQUE NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method NOT NULL,
    payment_date DATE NOT NULL,
    reference_number VARCHAR(50),
    notes TEXT,
    received_by UUID REFERENCES users(id) ON DELETE SET NULL,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_branch ON payments(branch_id);

-- ============================================
-- 30. SUPPLIER PAYMENTS (مدفوعات الموردين)
-- ============================================
CREATE TABLE IF NOT EXISTS supplier_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_number VARCHAR(20) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method NOT NULL,
    payment_date DATE NOT NULL,
    reference_number VARCHAR(50),
    notes TEXT,
    paid_by UUID REFERENCES users(id) ON DELETE SET NULL,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier ON supplier_payments(supplier_id);

-- ============================================
-- 31. TREASURY (خزينة الفروع)
-- ============================================
CREATE TABLE IF NOT EXISTS treasury (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE UNIQUE,
    current_balance DECIMAL(12,2) DEFAULT 0,
    last_reconciliation DATE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 32. TRANSACTION TYPE ENUM
-- ============================================
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('income', 'expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 33. TREASURY TRANSACTIONS (حركات الخزينة)
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

CREATE INDEX IF NOT EXISTS idx_treasury_trans_treasury ON treasury_transactions(treasury_id);
CREATE INDEX IF NOT EXISTS idx_treasury_trans_type ON treasury_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_treasury_trans_date ON treasury_transactions(transaction_date);

-- ============================================
-- 34. EXPENSES (المصروفات)
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    expense_date DATE NOT NULL,
    receipt_number VARCHAR(50),
    receipt_image TEXT,
    paid_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_branch ON expenses(branch_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);

-- ============================================
-- 35. PAYROLL STATUS ENUM
-- ============================================
DO $$ BEGIN
    CREATE TYPE payroll_status AS ENUM ('pending', 'approved', 'paid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 36. PAYROLL (الرواتب)
-- ============================================
CREATE TABLE IF NOT EXISTS payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    base_salary DECIMAL(10,2) NOT NULL,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    overtime_amount DECIMAL(10,2) DEFAULT 0,
    bonuses DECIMAL(10,2) DEFAULT 0,
    deductions DECIMAL(10,2) DEFAULT 0,
    advance_deduction DECIMAL(10,2) DEFAULT 0,
    net_salary DECIMAL(10,2) NOT NULL,
    status payroll_status DEFAULT 'pending',
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    paid_by UUID REFERENCES users(id) ON DELETE SET NULL,
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_payroll_user ON payroll(user_id);
CREATE INDEX IF NOT EXISTS idx_payroll_month ON payroll(month);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(status);

-- ============================================
-- 37. ADVANCE STATUS ENUM
-- ============================================
DO $$ BEGIN
    CREATE TYPE advance_status AS ENUM ('pending', 'approved', 'paid', 'repaying', 'repaid', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 38. ADVANCES (السلف)
-- ============================================
CREATE TABLE IF NOT EXISTS advances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    remaining_amount DECIMAL(10,2) NOT NULL,
    monthly_deduction DECIMAL(10,2),
    reason TEXT,
    status advance_status DEFAULT 'pending',
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    paid_by UUID REFERENCES users(id) ON DELETE SET NULL,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advances_user ON advances(user_id);
CREATE INDEX IF NOT EXISTS idx_advances_status ON advances(status);

-- ============================================
-- 39. SETTINGS (الإعدادات)
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    key VARCHAR(50) NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(branch_id, key)
);

-- ============================================
-- 40. ACTIVITY LOGS (سجل النشاط)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_logs(created_at);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE modification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Allow authenticated users to read branches
CREATE POLICY "Users can view branches"
ON branches FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to read their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow admins and managers to view all users
CREATE POLICY "Admins view all users"
ON users FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'manager')
    )
);

-- Allow users with proper roles to view customers
CREATE POLICY "Staff can view customers"
ON customers FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'manager', 'reception', 'specialist', 'treasurer')
    )
);

-- Allow staff to insert customers
CREATE POLICY "Staff can insert customers"
ON customers FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'manager', 'reception')
    )
);

-- Technicians can only see their assigned work orders
CREATE POLICY "Technicians see assigned work orders"
ON work_orders FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM work_order_technicians wot
        WHERE wot.work_order_id = work_orders.id
        AND wot.technician_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'manager', 'reception', 'specialist')
    )
);

-- Warehouse keepers manage inventory
CREATE POLICY "Warehouse manages inventory"
ON inventory FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'manager', 'warehouse')
    )
);

-- Treasury access for treasurer
CREATE POLICY "Treasurer manages treasury"
ON treasury FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'treasurer')
    )
);

-- ============================================
-- FUNCTIONS FOR AUTO-GENERATING NUMBERS
-- ============================================

-- Function to generate quotation number
CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.quotation_number := 'QT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
        LPAD((SELECT COUNT(*) + 1 FROM quotations WHERE DATE(created_at) = CURRENT_DATE)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_quotation_number
BEFORE INSERT ON quotations
FOR EACH ROW
WHEN (NEW.quotation_number IS NULL)
EXECUTE FUNCTION generate_quotation_number();

-- Function to generate work order number
CREATE OR REPLACE FUNCTION generate_work_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'WO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
        LPAD((SELECT COUNT(*) + 1 FROM work_orders WHERE DATE(created_at) = CURRENT_DATE)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_work_order_number
BEFORE INSERT ON work_orders
FOR EACH ROW
WHEN (NEW.order_number IS NULL)
EXECUTE FUNCTION generate_work_order_number();

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
        LPAD((SELECT COUNT(*) + 1 FROM invoices WHERE DATE(created_at) = CURRENT_DATE)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_number
BEFORE INSERT ON invoices
FOR EACH ROW
WHEN (NEW.invoice_number IS NULL)
EXECUTE FUNCTION generate_invoice_number();

-- Function to generate payment number
CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.payment_number := 'PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
        LPAD((SELECT COUNT(*) + 1 FROM payments WHERE DATE(created_at) = CURRENT_DATE)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_payment_number
BEFORE INSERT ON payments
FOR EACH ROW
WHEN (NEW.payment_number IS NULL)
EXECUTE FUNCTION generate_payment_number();

-- Function to generate PO number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.po_number := 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
        LPAD((SELECT COUNT(*) + 1 FROM purchase_orders WHERE DATE(created_at) = CURRENT_DATE)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_po_number
BEFORE INSERT ON purchase_orders
FOR EACH ROW
WHEN (NEW.po_number IS NULL)
EXECUTE FUNCTION generate_po_number();

-- ============================================
-- FUNCTION TO UPDATE TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON parts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_advances_updated_at BEFORE UPDATE ON advances FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert default branch
INSERT INTO branches (name, name_en, address, phone, is_active)
VALUES ('الفرع الرئيسي', 'Main Branch', 'القاهرة، مصر', '+201000000000', true)
ON CONFLICT DO NOTHING;

-- Insert default settings
INSERT INTO settings (branch_id, key, value) VALUES
(NULL, 'company_name', 'HiveDrive'),
(NULL, 'company_name_en', 'HiveDrive'),
(NULL, 'currency', 'EGP'),
(NULL, 'tax_rate', '14'),
(NULL, 'language', 'ar')
ON CONFLICT DO NOTHING;
