/**
 * HiveDrive - Suppliers Module
 */

const Suppliers = {
    /**
     * Load suppliers list
     */
    async loadList(options = {}) {
        try {
            const { data, count } = await API.list('suppliers', {
                select: '*',
                orderBy: 'created_at',
                ascending: false,
                ...options
            });
            return { data, count };
        } catch (error) {
            console.error('Load suppliers error:', error);
            UI.toast(t('error'), 'error');
            return { data: [], count: 0 };
        }
    },

    /**
     * Get supplier by ID
     */
    async getById(id) {
        try {
            const { data, error } = await db
                .from('suppliers')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get supplier error:', error);
            return null;
        }
    },

    /**
     * Create supplier
     */
    async create(supplierData) {
        try {
            const result = await API.create('suppliers', supplierData);
            UI.toast(t('success'), 'success');
            return result;
        } catch (error) {
            console.error('Create supplier error:', error);
            UI.toast(error.message || t('error'), 'error');
            return null;
        }
    },

    /**
     * Update supplier
     */
    async update(id, supplierData) {
        try {
            const result = await API.update('suppliers', id, supplierData);
            UI.toast(t('success'), 'success');
            return result;
        } catch (error) {
            console.error('Update supplier error:', error);
            UI.toast(error.message || t('error'), 'error');
            return null;
        }
    },

    /**
     * Delete supplier
     */
    async delete(id) {
        try {
            const confirmed = await UI.confirm(t('confirm_delete'));
            if (!confirmed) return false;

            await API.delete('suppliers', id);
            UI.toast(t('success'), 'success');
            return true;
        } catch (error) {
            console.error('Delete supplier error:', error);
            UI.toast(error.message || t('error'), 'error');
            return false;
        }
    },

    /**
     * Search suppliers
     */
    async search(query) {
        try {
            const { data } = await db
                .from('suppliers')
                .select('id, name, phone')
                .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
                .limit(10);

            return data || [];
        } catch (error) {
            console.error('Search suppliers error:', error);
            return [];
        }
    },

    /**
     * Render suppliers table
     */
    renderTable(suppliers, container) {
        if (!suppliers || suppliers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🚚</div>
                    <h4 class="empty-state-title">${t('no_data')}</h4>
                    <p class="empty-state-text">لا يوجد موردين</p>
                    <a href="form.html" class="btn btn-primary">${t('add')} ${t('suppliers')}</a>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>المورد</th>
                            <th>الهاتف</th>
                            <th>البريد الإلكتروني</th>
                            <th>العنوان</th>
                            <th>الرصيد</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${suppliers.map(s => `
                            <tr>
                                <td>
                                    <div class="flex items-center gap-3">
                                        <div class="avatar sm">${s.name?.charAt(0) || '?'}</div>
                                        <div class="font-medium">${s.name || '-'}</div>
                                    </div>
                                </td>
                                <td>${s.phone || '-'}</td>
                                <td>${s.email || '-'}</td>
                                <td>${s.address || '-'}</td>
                                <td class="${(s.balance || 0) > 0 ? 'text-danger' : 'text-success'} font-semibold">
                                    ${UI.formatCurrency(s.balance || 0)}
                                </td>
                                <td>
                                    <div class="flex gap-2">
                                        <a href="form.html?id=${s.id}" class="btn btn-icon btn-ghost btn-sm">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                            </svg>
                                        </a>
                                        <button class="btn btn-icon btn-ghost btn-sm" onclick="Suppliers.delete('${s.id}').then(r => r && location.reload())">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
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

window.Suppliers = Suppliers;
