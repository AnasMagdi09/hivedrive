-- إضافة موردين وربطهم بالقطع

-- إضافة موردين إذا لم يكونوا موجودين
INSERT INTO public.suppliers (name, contact_person, phone, email, address)
SELECT 'شركة قطع الغيار المتحدة', 'أحمد محمد', '01234567890', 'info@parts-united.com', 'القاهرة'
WHERE NOT EXISTS (SELECT 1 FROM public.suppliers WHERE name = 'شركة قطع الغيار المتحدة');

INSERT INTO public.suppliers (name, contact_person, phone, email, address)
SELECT 'مؤسسة النور لقطع السيارات', 'محمد علي', '01098765432', 'sales@alnoor.com', 'الجيزة'
WHERE NOT EXISTS (SELECT 1 FROM public.suppliers WHERE name = 'مؤسسة النور لقطع السيارات');

-- الحصول على IDs الموردين
DO $$
DECLARE
    supplier1_id UUID;
    supplier2_id UUID;
BEGIN
    -- الحصول على أول مورد
    SELECT id INTO supplier1_id FROM public.suppliers WHERE name = 'شركة قطع الغيار المتحدة' LIMIT 1;
    -- الحصول على ثاني مورد
    SELECT id INTO supplier2_id FROM public.suppliers WHERE name = 'مؤسسة النور لقطع السيارات' LIMIT 1;
    
    -- تحديث القطع لربطها بالموردين
    UPDATE public.parts
    SET supplier_id = supplier1_id
    WHERE supplier_id IS NULL AND name LIKE '%كاوتش%';
    
    UPDATE public.parts
    SET supplier_id = supplier2_id
    WHERE supplier_id IS NULL AND name LIKE '%تيل%';
    
    -- تحديث باقي القطع بمورد عشوائي
    UPDATE public.parts
    SET supplier_id = supplier1_id
    WHERE supplier_id IS NULL;
    
    RAISE NOTICE 'تم ربط القطع بالموردين بنجاح';
END $$;

-- التحقق من النتيجة
SELECT 
    p.id,
    p.name,
    p.sku,
    s.name as supplier_name,
    s.phone as supplier_phone
FROM public.parts p
LEFT JOIN public.suppliers s ON p.supplier_id = s.id
ORDER BY p.name;
