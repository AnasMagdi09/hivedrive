-- Add permissions column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';

-- Update existing users with default permissions based on role
UPDATE users SET permissions = ARRAY[
    'customers_view', 'customers_create', 'customers_edit',
    'quotations_view', 'quotations_create',
    'workorders_view', 'workorders_create', 'workorders_edit',
    'invoices_view', 'invoices_create',
    'payments_receive',
    'inventory_view', 'inventory_manage',
    'treasury_view', 'treasury_manage',
    'reports_view',
    'employees_view', 'employees_manage',
    'settings_manage'
] WHERE role = 'admin';

UPDATE users SET permissions = ARRAY[
    'customers_view', 'customers_create', 'customers_edit',
    'quotations_view', 'quotations_create',
    'workorders_view', 'workorders_create', 'workorders_edit',
    'invoices_view', 'invoices_create',
    'payments_receive',
    'inventory_view', 'inventory_manage',
    'treasury_view',
    'reports_view',
    'employees_view'
] WHERE role = 'manager';

UPDATE users SET permissions = ARRAY[
    'customers_view', 'customers_create', 'customers_edit',
    'quotations_view', 'quotations_create',
    'workorders_view', 'workorders_create'
] WHERE role = 'reception';

UPDATE users SET permissions = ARRAY[
    'workorders_view', 'workorders_edit',
    'inventory_view'
] WHERE role = 'technician';

UPDATE users SET permissions = ARRAY[
    'inventory_view', 'inventory_manage'
] WHERE role = 'warehouse';

UPDATE users SET permissions = ARRAY[
    'invoices_view',
    'payments_receive',
    'treasury_view', 'treasury_manage',
    'reports_view'
] WHERE role = 'treasurer';
