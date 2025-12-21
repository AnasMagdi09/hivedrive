-- Run this in Supabase SQL Editor to fix the duplicate key issue

-- Drop the unique constraint
ALTER TABLE salary_payments 
DROP CONSTRAINT IF EXISTS salary_payments_employee_id_payment_type_week_start_month_y_key;

-- Also try this name format
ALTER TABLE salary_payments 
DROP CONSTRAINT IF EXISTS salary_payments_employee_id_payment_type_week_start_month_year_key;

-- List all constraints to verify
SELECT conname FROM pg_constraint WHERE conrelid = 'salary_payments'::regclass;
