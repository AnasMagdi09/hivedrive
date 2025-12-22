-- إصلاح وإضافة كميات المخزون

-- أولاً: الحصول على branch_id الأول
DO $$
DECLARE
    first_branch_id UUID;
BEGIN
    -- الحصول على أول branch
    SELECT id INTO first_branch_id FROM public.branches LIMIT 1;
    
    -- إذا لم يوجد branch، إنشاء واحد
    IF first_branch_id IS NULL THEN
        INSERT INTO public.branches (name) VALUES ('الفرع الرئيسي') RETURNING id INTO first_branch_id;
    END IF;
    
    -- إضافة سجلات مخزون للقطع التي ليس لها سجلات
    INSERT INTO public.inventory (part_id, branch_id, quantity, reserved_quantity)
    SELECT 
        p.id,
        first_branch_id,
        10 as quantity,
        0 as reserved_quantity
    FROM public.parts p
    WHERE NOT EXISTS (
        SELECT 1 
        FROM public.inventory i 
        WHERE i.part_id = p.id AND i.branch_id = first_branch_id
    );
    
    -- تحديث الكميات الموجودة إذا كانت صفر
    UPDATE public.inventory
    SET quantity = 10
    WHERE quantity = 0;
    
    RAISE NOTICE 'تم تحديث المخزون بنجاح';
END $$;

-- التحقق من النتيجة
SELECT 
    p.id,
    p.name,
    p.sku,
    i.quantity,
    i.branch_id,
    b.name as branch_name
FROM public.parts p
LEFT JOIN public.inventory i ON i.part_id = p.id
LEFT JOIN public.branches b ON b.id = i.branch_id
ORDER BY p.name;
