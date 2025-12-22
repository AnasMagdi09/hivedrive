-- تحديث نظام السلف لدعم الدفعات المرنة

-- إضافة حقل لعدد الأقساط المدفوعة
ALTER TABLE public.employee_advances 
ADD COLUMN IF NOT EXISTS paid_installments INTEGER DEFAULT 0;

-- تحديث السجلات الموجودة
UPDATE public.employee_advances
SET paid_installments = (
    SELECT COUNT(*)
    FROM public.advance_installments
    WHERE advance_id = employee_advances.id
    AND status = 'paid'
)
WHERE paid_installments = 0;

-- إضافة ملاحظات للدفعة
ALTER TABLE public.advance_installments
ADD COLUMN IF NOT EXISTS notes TEXT;

-- عرض ملخص السلف
SELECT 
    ea.id,
    e.name as employee_name,
    ea.amount as total_amount,
    ea.paid_amount,
    ea.remaining_amount,
    ea.installments_count,
    ea.paid_installments,
    ea.status,
    COUNT(ai.id) as total_installment_records,
    COUNT(CASE WHEN ai.status = 'paid' THEN 1 END) as paid_installment_records
FROM public.employee_advances ea
LEFT JOIN public.employees e ON ea.employee_id = e.id
LEFT JOIN public.advance_installments ai ON ea.id = ai.advance_id
GROUP BY ea.id, e.name
ORDER BY ea.created_at DESC;
