/**
 * HiveDrive - Vehicles Module
 */

const Vehicles = {
    /**
     * Load vehicles list
     */
    async loadList(options = {}) {
        try {
            const { data, count } = await API.list('vehicles', {
                select: '*, customers(name, phone)',
                orderBy: 'created_at',
                ascending: false,
                ...options
            });
            return { data, count };
        } catch (error) {
            console.error('Load vehicles error:', error);
            UI.toast(t('error'), 'error');
            return { data: [], count: 0 };
        }
    },

    /**
     * Get vehicle by ID
     */
    async getById(id) {
        try {
            const { data, error } = await db
                .from('vehicles')
                .select('*, customers(id, name, phone)')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get vehicle error:', error);
            return null;
        }
    },

    /**
     * Get vehicles by customer
     */
    async getByCustomer(customerId) {
        try {
            const { data, error } = await db
                .from('vehicles')
                .select('*')
                .eq('customer_id', customerId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Get customer vehicles error:', error);
            return [];
        }
    },

    /**
     * Create vehicle
     */
    async create(vehicleData) {
        try {
            const result = await API.create('vehicles', vehicleData);
            UI.toast(t('success'), 'success');
            return result;
        } catch (error) {
            console.error('Create vehicle error:', error);
            UI.toast(error.message || t('error'), 'error');
            return null;
        }
    },

    /**
     * Update vehicle
     */
    async update(id, vehicleData) {
        try {
            const result = await API.update('vehicles', id, vehicleData);
            UI.toast(t('success'), 'success');
            return result;
        } catch (error) {
            console.error('Update vehicle error:', error);
            UI.toast(error.message || t('error'), 'error');
            return null;
        }
    },

    /**
     * Delete vehicle
     */
    async delete(id) {
        try {
            const confirmed = await UI.confirm(t('confirm_delete'));
            if (!confirmed) return false;

            await API.delete('vehicles', id);
            UI.toast(t('success'), 'success');
            return true;
        } catch (error) {
            console.error('Delete vehicle error:', error);
            UI.toast(error.message || t('error'), 'error');
            return false;
        }
    },

    /**
     * Search vehicles by plate number
     */
    async search(query) {
        try {
            const { data } = await db
                .from('vehicles')
                .select('id, plate_number, brand, model, customers(name)')
                .or(`plate_number.ilike.%${query}%,chassis_number.ilike.%${query}%`)
                .limit(10);

            return data || [];
        } catch (error) {
            console.error('Search vehicles error:', error);
            return [];
        }
    },

    /**
     * Render vehicles table
     */
    renderTable(vehicles, container) {
        if (!vehicles || vehicles.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🚗</div>
                    <h4 class="empty-state-title">${t('no_data')}</h4>
                    <p class="empty-state-text">لا توجد مركبات حتى الآن</p>
                    <a href="form.html" class="btn btn-primary">${t('add')} ${t('vehicle')}</a>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>${t('plate_number')}</th>
                            <th>${t('brand')} / ${t('model')}</th>
                            <th>${t('customer')}</th>
                            <th>${t('year')}</th>
                            <th>${t('color')}</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${vehicles.map(v => `
                            <tr>
                                <td>
                                    <span class="badge badge-primary">${v.plate_number || '-'}</span>
                                </td>
                                <td>
                                    <div class="font-medium">${v.brand || '-'}</div>
                                    <div class="text-muted text-sm">${v.model || ''}</div>
                                </td>
                                <td>
                                    <a href="../customers/view.html?id=${v.customers?.id}">${v.customers?.name || '-'}</a>
                                </td>
                                <td>${v.year || '-'}</td>
                                <td>${v.color || '-'}</td>
                                <td>
                                    <div class="flex gap-2">
                                        <a href="history.html?id=${v.id}" class="btn btn-icon btn-ghost btn-sm" title="سجل الصيانة">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                                            </svg>
                                        </a>
                                        <a href="view.html?id=${v.id}" class="btn btn-icon btn-ghost btn-sm" title="عرض">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                            </svg>
                                        </a>
                                        <a href="form.html?id=${v.id}" class="btn btn-icon btn-ghost btn-sm" title="تعديل">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                            </svg>
                                        </a>
                                        <button class="btn btn-icon btn-ghost btn-sm" title="حذف" onclick="Vehicles.delete('${v.id}').then(r => r && location.reload())">
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

window.Vehicles = Vehicles;
