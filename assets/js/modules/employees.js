/**
 * HiveDrive - Employees Module
 */

const Employees = {
    /**
     * Load employees list
     */
    async loadList(options = {}) {
        try {
            const { data, count } = await API.list('users', {
                select: '*',
                orderBy: 'created_at',
                ascending: false,
                ...options
            });
            return { data, count };
        } catch (error) {
            console.error('Load employees error:', error);
            UI.toast(t('error'), 'error');
            return { data: [], count: 0 };
        }
    },

    /**
     * Get employee by ID
     */
    async getById(id) {
        try {
            const { data, error } = await db
                .from('users')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get employee error:', error);
            return null;
        }
    },

    /**
     * Create employee
     */
    async create(employeeData) {
        try {
            const result = await API.create('users', employeeData);
            UI.toast(t('success'), 'success');
            return result;
        } catch (error) {
            console.error('Create employee error:', error);
            UI.toast(error.message || t('error'), 'error');
            return null;
        }
    },

    /**
     * Update employee
     */
    async update(id, employeeData) {
        try {
            const result = await API.update('users', id, employeeData);
            UI.toast(t('success'), 'success');
            return result;
        } catch (error) {
            console.error('Update employee error:', error);
            UI.toast(error.message || t('error'), 'error');
            return null;
        }
    },

    /**
     * Get role badge
     */
    getRoleBadge(role) {
        const colors = {
            admin: 'badge-danger',
            manager: 'badge-warning',
            reception: 'badge-primary',
            specialist: 'badge-secondary',
            warehouse: 'badge-success',
            treasurer: 'badge-info',
            technician: 'badge-gray'
        };
        const labels = {
            admin: 'المدير',
            manager: 'مدير العمليات',
            reception: 'مهندس الاستقبال',
            specialist: 'المهندس المختص',
            warehouse: 'أمين المخزن',
            treasurer: 'أمين الخزينة',
            technician: 'فني'
        };
        return `<span class="badge ${colors[role] || 'badge-gray'}">${labels[role] || role}</span>`;
    },

    /**
     * Render employees table
     */
    renderTable(employees, container) {
        if (!employees || employees.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <h4 class="empty-state-title">${t('no_data')}</h4>
                    <p class="empty-state-text">لا يوجد موظفين</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>الموظف</th>
                            <th>البريد الإلكتروني</th>
                            <th>الدور</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${employees.map(emp => `
                            <tr>
                                <td>
                                    <div class="flex items-center gap-3">
                                        <div class="avatar sm">${emp.full_name?.charAt(0) || '?'}</div>
                                        <div>
                                            <div class="font-medium">${emp.full_name || '-'}</div>
                                            <div class="text-muted text-sm">${emp.phone || ''}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>${emp.email || '-'}</td>
                                <td>${this.getRoleBadge(emp.role)}</td>
                                <td>
                                    <span class="badge ${emp.is_active ? 'badge-success' : 'badge-danger'}">
                                        ${emp.is_active ? 'نشط' : 'غير نشط'}
                                    </span>
                                </td>
                                <td>
                                    <div class="flex gap-2">
                                        <a href="form.html?id=${emp.id}" class="btn btn-icon btn-ghost btn-sm">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                            </svg>
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
};

window.Employees = Employees;
