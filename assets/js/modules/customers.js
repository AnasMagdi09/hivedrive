/**
 * HiveDrive - Customers Module
 */

const Customers = {
    /**
     * Load customers list
     */
    async loadList(options = {}) {
        try {
            const { data, count } = await API.list('customers', {
                select: '*, branches(name)',
                orderBy: 'created_at',
                ascending: false,
                ...options
            });
            return { data, count };
        } catch (error) {
            console.error('Load customers error:', error);
            UI.toast(t('error'), 'error');
            return { data: [], count: 0 };
        }
    },

    /**
     * Get customer by ID
     */
    async getById(id) {
        try {
            const { data, error } = await db
                .from('customers')
                .select('*, branches(name), vehicles(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get customer error:', error);
            return null;
        }
    },

    /**
     * Create customer
     */
    async create(customerData) {
        try {
            const user = auth.getUser();
            const data = {
                ...customerData,
                branch_id: user?.branch_id,
                created_by: user?.id
            };

            const result = await API.create('customers', data);
            UI.toast(t('success'), 'success');
            return result;
        } catch (error) {
            console.error('Create customer error:', error);
            UI.toast(error.message || t('error'), 'error');
            return null;
        }
    },

    /**
     * Update customer
     */
    async update(id, customerData) {
        try {
            const result = await API.update('customers', id, customerData);
            UI.toast(t('success'), 'success');
            return result;
        } catch (error) {
            console.error('Update customer error:', error);
            UI.toast(error.message || t('error'), 'error');
            return null;
        }
    },

    /**
     * Delete customer
     */
    async delete(id) {
        try {
            const confirmed = await UI.confirm(t('confirm_delete'));
            if (!confirmed) return false;

            await API.delete('customers', id);
            UI.toast(t('success'), 'success');
            return true;
        } catch (error) {
            console.error('Delete customer error:', error);
            UI.toast(error.message || t('error'), 'error');
            return false;
        }
    },

    /**
     * Search customers
     */
    async search(query) {
        try {
            const { data } = await db
                .from('customers')
                .select('id, name, phone')
                .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
                .limit(10);

            return data || [];
        } catch (error) {
            console.error('Search customers error:', error);
            return [];
        }
    },

    /**
     * Render customers table
     */
    renderTable(customers, container) {
        if (!customers || customers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <h4 class="empty-state-title">${t('no_data')}</h4>
                    <p class="empty-state-text">لا يوجد عملاء حتى الآن</p>
                    <a href="form.html" class="btn btn-primary">${t('add')} ${t('customer')}</a>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>${t('customer_name')}</th>
                            <th>${t('phone')}</th>
                            <th>${t('customer_type')}</th>
                            <th>الزيارات</th>
                            <th>إجمالي الإنفاق</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${customers.map(c => `
                            <tr>
                                <td>
                                    <div class="flex items-center gap-3">
                                        <div class="avatar sm">${c.name?.charAt(0) || '?'}</div>
                                        <div>
                                            <div class="font-medium">${c.name || '-'}</div>
                                            <div class="text-muted text-sm">${c.email || ''}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>${c.phone || '-'}</td>
                                <td>
                                    <span class="badge badge-${c.customer_type === 'company' ? 'primary' : 'gray'}">
                                        ${t(c.customer_type || 'individual')}
                                    </span>
                                </td>
                                <td>${UI.formatNumber(c.visit_count || 0)}</td>
                                <td>${UI.formatCurrency(c.total_spent || 0)}</td>
                                <td>
                                    <div class="flex gap-2">
                                        <a href="view.html?id=${c.id}" class="btn btn-icon btn-ghost btn-sm" data-tooltip="${t('view')}">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                <circle cx="12" cy="12" r="3"/>
                                            </svg>
                                        </a>
                                        <a href="form.html?id=${c.id}" class="btn btn-icon btn-ghost btn-sm" data-tooltip="${t('edit')}">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                            </svg>
                                        </a>
                                        <button class="btn btn-icon btn-ghost btn-sm" data-tooltip="${t('delete')}" onclick="Customers.delete('${c.id}').then(r => r && location.reload())">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <polyline points="3 6 5 6 21 6"/>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                            </svg>
                                        </button>
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

window.Customers = Customers;
