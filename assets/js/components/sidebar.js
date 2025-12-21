/**
 * HiveDrive - Shared Sidebar Component
 * Uses the same structure as dashboard.html
 */

const Sidebar = {
    // Navigation items (same as dashboard)
    navItems: {
        admin: [
            {
                section: 'main', title: 'القائمة الرئيسية', items: [
                    { icon: 'dashboard', label: 'dashboard', href: 'dashboard.html' },
                ]
            },
            {
                section: 'operations', title: 'العمليات', items: [
                    { icon: 'customers', label: 'customers', href: 'pages/customers/list.html' },
                    { icon: 'vehicles', label: 'vehicles', href: 'pages/vehicles/list.html' },
                    { icon: 'quotations', label: 'quotations', href: 'pages/quotations/list.html' },
                    { icon: 'workorders', label: 'work_orders', href: 'pages/workorders/list.html' },
                ]
            },
            {
                section: 'inventory', title: 'المخزون', items: [
                    { icon: 'parts', label: 'parts', href: 'pages/inventory/list.html' },
                    { icon: 'suppliers', label: 'suppliers', href: 'pages/suppliers/list.html' },
                    { icon: 'purchases', label: 'purchases', href: 'pages/purchases/list.html' },
                ]
            },
            {
                section: 'finance', title: 'المالية', items: [
                    { icon: 'invoices', label: 'invoices', href: 'pages/invoices/list.html' },
                    { icon: 'treasury', label: 'treasury', href: 'pages/treasury/index.html' },
                    { icon: 'employees', label: 'employees', href: 'pages/employees/list.html' },
                ]
            },
            {
                section: 'reports', title: 'التقارير', items: [
                    { icon: 'reports', label: 'reports', href: 'pages/reports/index.html' },
                    { icon: 'settings', label: 'settings', href: 'pages/settings/index.html' },
                ]
            },
        ]
    },

    icons: {
        dashboard: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
        customers: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        vehicles: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.6-.4-1-1-1h-.8l-1.2-4.4c-.2-.7-.8-1.1-1.5-1.1H6.5c-.7 0-1.3.5-1.5 1.1L3.8 12H3c-.6 0-1 .4-1 1v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>',
        quotations: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
        workorders: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
        parts: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
        suppliers: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
        purchases: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
        invoices: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
        treasury: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
        employees: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
        reports: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
        settings: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
    },

    /**
     * Get base path based on current page location
     */
    getBasePath() {
        const path = window.location.pathname;
        if (path.includes('/pages/')) {
            return '../../';
        }
        return '';
    },

    /**
     * Check if a nav item is active
     */
    isActive(href) {
        const currentPath = window.location.pathname;
        return currentPath.includes(href) || currentPath.endsWith(href);
    },

    /**
     * Render the complete sidebar
     */
    render(user = null) {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;

        const basePath = this.getBasePath();
        const role = user?.role || 'admin';
        const items = this.navItems[role] || this.navItems.admin;

        const userName = user?.full_name || 'مستخدم';
        const userInitial = userName.charAt(0);
        const userRole = user?.role ? (typeof t === 'function' ? t('role_' + user.role) : user.role) : 'مدير';

        // Build full sidebar HTML (same structure as dashboard.html)
        sidebar.innerHTML = `
            <div class="sidebar-header">
                <div class="logo">
                    <div class="logo-icon">🔧</div>
                    <span class="logo-text">HiveDrive</span>
                </div>
                <button class="sidebar-toggle" id="sidebarToggle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
            </div>

            <nav class="sidebar-nav" id="sidebarNav">
                ${items.map(section => `
                    <div class="nav-section">
                        <div class="nav-section-title">${section.title}</div>
                        ${section.items.map(item => {
            const href = basePath + item.href;
            const active = this.isActive(item.href);
            const label = typeof t === 'function' ? t(item.label) : item.label;
            return `
                                <a href="${href}" class="nav-item ${active ? 'active' : ''}">
                                    <span class="nav-item-icon">${this.icons[item.icon] || ''}</span>
                                    <span class="nav-item-text" data-i18n="${item.label}">${label}</span>
                                </a>
                            `;
        }).join('')}
                    </div>
                `).join('')}
            </nav>

            <div class="sidebar-user">
                <div class="user-info">
                    <div class="user-avatar">${userInitial}</div>
                    <div class="user-details">
                        <div class="user-name">${userName}</div>
                        <div class="user-role">${userRole}</div>
                    </div>
                </div>
            </div>
        `;

        this.initEvents();
    },

    /**
     * Initialize sidebar events (toggle, mobile menu)
     */
    initEvents() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        const header = document.getElementById('header');

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                if (mainContent) mainContent.classList.toggle('sidebar-collapsed');
                if (header) header.classList.toggle('sidebar-collapsed');
            });
        }

        // Mobile menu button
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }

        // Close sidebar on mobile when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 &&
                !e.target.closest('.sidebar') &&
                !e.target.closest('#mobileMenuBtn')) {
                sidebar.classList.remove('open');
            }
        });
    }
};

window.Sidebar = Sidebar;
