-- Sync all existing salary payments to treasury transactions
-- Run this in Supabase SQL Editor

-- First, ensure we have a treasury account
INSERT INTO public.treasury_accounts (name, account_type, current_balance, opening_balance, status)
VALUES ('الخزينة الرئيسية', 'cash', 0, 0, 'active')
ON CONFLICT DO NOTHING;

-- Get the treasury account ID
DO $$
DECLARE
    treasury_id INTEGER;
    total_salaries NUMERIC := 0;
BEGIN
    -- Get treasury account
    SELECT id INTO treasury_id FROM public.treasury_accounts WHERE status = 'active' LIMIT 1;
    
    -- Insert all salary payments as treasury transactions (if not already exists)
    INSERT INTO public.treasury_transactions (
        treasury_account_id,
        transaction_type,
        category,
        amount,
        balance_after,
        reference_type,
        reference_id,
        description,
        transaction_date,
        created_at
    )
    SELECT 
        treasury_id,
        'expense',
        'مرتبات',
        sp.net_salary,
        0, -- Will be updated later
        'salary',
        sp.id,
        'مرتب موظف - ' || COALESCE(e.name, 'موظف #' || sp.employee_id),
        sp.payment_date,
        sp.created_at
    FROM public.salary_payments sp
    LEFT JOIN public.employees e ON e.id = sp.employee_id
    WHERE NOT EXISTS (
        SELECT 1 FROM public.treasury_transactions tt 
        WHERE tt.reference_type = 'salary' AND tt.reference_id = sp.id
    )
    ORDER BY sp.payment_date, sp.created_at;
    
    -- Calculate total salaries
    SELECT COALESCE(SUM(net_salary), 0) INTO total_salaries 
    FROM public.salary_payments;
    
    -- Update treasury balance (deduct all salaries)
    UPDATE public.treasury_accounts 
    SET current_balance = opening_balance - total_salaries
    WHERE id = treasury_id;
    
    -- Update balance_after for all transactions in chronological order
    UPDATE public.treasury_transactions tt
    SET balance_after = (
        SELECT 
            (SELECT opening_balance FROM public.treasury_accounts WHERE id = treasury_id) + 
            COALESCE(SUM(
                CASE 
                    WHEN t2.transaction_type = 'income' THEN t2.amount
                    WHEN t2.transaction_type = 'expense' THEN -t2.amount
                    ELSE 0
                END
            ), 0)
        FROM public.treasury_transactions t2
        WHERE t2.treasury_account_id = tt.treasury_account_id
        AND (t2.transaction_date < tt.transaction_date 
             OR (t2.transaction_date = tt.transaction_date AND t2.created_at <= tt.created_at))
    )
    WHERE tt.treasury_account_id = treasury_id;
    
    RAISE NOTICE 'Synced % salary payments to treasury', (SELECT COUNT(*) FROM public.salary_payments);
END $$;

-- Reload schema
SELECT pg_notify('pgrst', 'reload schema');
