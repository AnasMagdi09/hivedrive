/**
 * HiveDrive - Arabic Translations
 */

const ar = {
    // App
    app_name: 'HiveDrive',
    app_description: 'نظام إدارة ورش صيانة المركبات',

    // Auth
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    remember_me: 'تذكرني',
    forgot_password: 'نسيت كلمة المرور؟',
    login_error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',

    // Navigation
    dashboard: 'لوحة التحكم',
    customers: 'العملاء',
    vehicles: 'المركبات',
    quotations: 'المقايسات',
    work_orders: 'أوامر الشغل',
    inventory: 'المخزون',
    parts: 'قطع الغيار',
    suppliers: 'الموردين',
    purchases: 'المشتريات',
    invoices: 'الفواتير',
    payments: 'المدفوعات',
    treasury: 'الخزينة',
    employees: 'الموظفين',
    advances: 'السلف',
    reports: 'التقارير',
    settings: 'الإعدادات',

    // Roles
    role_admin: 'المدير',
    role_manager: 'مدير العمليات',
    role_reception: 'مهندس الاستقبال',
    role_specialist: 'المهندس المختص',
    role_warehouse: 'أمين المخزن',
    role_treasurer: 'أمين الخزينة',
    role_technician: 'الفني',

    // Actions
    add: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    search: 'بحث',
    filter: 'تصفية',
    export: 'تصدير',
    print: 'طباعة',
    view: 'عرض',
    confirm: 'تأكيد',
    back: 'رجوع',
    next: 'التالي',
    previous: 'السابق',

    // Status
    status: 'الحالة',
    status_pending: 'في الانتظار',
    status_in_progress: 'قيد التنفيذ',
    status_completed: 'مكتمل',
    status_cancelled: 'ملغي',
    status_delivered: 'تم التسليم',
    status_paid: 'مدفوعة',
    status_partial: 'مدفوعة جزئياً',
    status_draft: 'مسودة',
    status_approved: 'موافق عليها',
    status_rejected: 'مرفوضة',

    // Customers
    customer: 'العميل',
    customer_name: 'اسم العميل',
    phone: 'رقم الهاتف',
    address: 'العنوان',
    national_id: 'الرقم القومي',
    customer_type: 'نوع العميل',
    individual: 'فرد',
    company: 'شركة',

    // Vehicles
    vehicle: 'المركبة',
    plate_number: 'رقم اللوحة',
    chassis_number: 'رقم الشاسيه',
    brand: 'الماركة',
    model: 'الموديل',
    year: 'سنة الصنع',
    color: 'اللون',
    mileage: 'عداد الكيلومترات',

    // Work Orders
    work_order: 'أمر الشغل',
    order_number: 'رقم الأمر',
    diagnosis: 'التشخيص',
    customer_complaints: 'شكوى العميل',
    assigned_technician: 'الفني المعين',
    estimated_completion: 'تاريخ الانتهاء المتوقع',
    priority: 'الأولوية',
    priority_low: 'منخفضة',
    priority_normal: 'عادية',
    priority_high: 'عالية',
    priority_urgent: 'عاجلة',

    // Quotations
    quotation: 'المقايسة',
    quotation_number: 'رقم المقايسة',
    valid_until: 'صالحة حتى',
    convert_to_work_order: 'تحويل لأمر شغل',

    // Inventory
    part: 'قطعة الغيار',
    sku: 'كود القطعة',
    quantity: 'الكمية',
    min_quantity: 'الحد الأدنى',
    cost_price: 'سعر التكلفة',
    sell_price: 'سعر البيع',
    in_stock: 'متوفر',
    out_of_stock: 'غير متوفر',
    low_stock: 'كمية منخفضة',

    // Financial
    invoice: 'الفاتورة',
    invoice_number: 'رقم الفاتورة',
    subtotal: 'المجموع الفرعي',
    discount: 'الخصم',
    tax: 'الضريبة',
    total: 'الإجمالي',
    paid_amount: 'المبلغ المدفوع',
    remaining: 'المتبقي',
    payment_method: 'طريقة الدفع',
    cash: 'نقدي',
    bank_transfer: 'تحويل بنكي',
    credit_card: 'بطاقة ائتمان',
    deferred: 'آجل',

    // Treasury
    income: 'إيرادات',
    expense: 'مصروفات',
    balance: 'الرصيد',

    // Employees
    employee: 'الموظف',
    salary: 'الراتب',
    advance: 'سلفة',
    bonus: 'مكافأة',
    deduction: 'خصم',

    // Reports
    daily_report: 'التقرير اليومي',
    weekly_report: 'التقرير الأسبوعي',
    monthly_report: 'التقرير الشهري',
    revenue: 'الإيرادات',
    expenses: 'المصروفات',
    profit: 'الأرباح',

    // Time
    today: 'اليوم',
    yesterday: 'أمس',
    this_week: 'هذا الأسبوع',
    this_month: 'هذا الشهر',
    this_year: 'هذا العام',

    // Messages
    success: 'تم بنجاح',
    error: 'حدث خطأ',
    warning: 'تحذير',
    info: 'معلومة',
    confirm_delete: 'هل أنت متأكد من الحذف؟',
    no_data: 'لا توجد بيانات',
    loading: 'جاري التحميل...',

    // Currency
    currency: 'ج.م',
    egp: 'جنيه مصري'
};

window.translations = window.translations || {};
window.translations.ar = ar;
