-- تنظيف الموظفين المكررين
-- هذا السكريبت يحذف الموظفين المكررين ويبقي على أقدم سجل لكل موظف

-- أولاً: عرض الموظفين المكررين
SELECT name, COUNT(*) as count, array_agg(id ORDER BY id) as ids
FROM public.employees
GROUP BY name
HAVING COUNT(*) > 1;

-- ثانياً: حذف السجلات المكررة (يبقي على أقل id لكل اسم)
DELETE FROM public.employees
WHERE id NOT IN (
    SELECT MIN(id)
    FROM public.employees
    GROUP BY name
);

-- التحقق من النتيجة
SELECT id, name, status, created_at
FROM public.employees
ORDER BY name;
