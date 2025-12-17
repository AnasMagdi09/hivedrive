/**
 * HiveDrive - Work Orders Module
 */

const WorkOrders = {
    /**
     * Load work orders list
     */
    async loadList(options = {}) {
        try {
            const { data, count } = await API.list('work_orders', {
                select: `*, customers(name), vehicles(plate_number, brand, model)`,
                orderBy: 'created_at',
                ascending: false,
                ...options
            });
            return { data, count };
        } catch (error) {
            console.error('Load work orders error:', error);
            return { data: [], count: 0 };
        }
    },

    /**
     * Get work order with items and technicians
     */
    async getById(id) {
        try {
            const { data, error } = await db
                .from('work_orders')
                .select(`*, 
                    customers(id, name, phone),
                    vehicles(id, plate_number, brand, model, mileage),
                    work_order_items(*),
                    work_order_technicians(*, technician:users(id, full_name))`)
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get work order error:', error);
            return null;
        }
    },

    /**
     * Create work order
     */
    async create(woData, items) {
        try {
            const user = auth.getUser();

            const { data: workOrder, error } = await db
                .from('work_orders')
                .insert({
                    ...woData,
                    branch_id: user?.branch_id,
                    created_by: user?.id
                })
                .select()
                .single();

            if (error) throw error;

            if (items && items.length > 0) {
                const itemsWithId = items.map((item, index) => ({
                    ...item,
                    work_order_id: workOrder.id,
                    sort_order: index
                }));
                await db.from('work_order_items').insert(itemsWithId);
            }

            await this.recalculateTotals(workOrder.id);

            UI.toast(t('success'), 'success');
            return workOrder;
        } catch (error) {
            console.error('Create work order error:', error);
            UI.toast(error.message || t('error'), 'error');
            return null;
        }
    },

    /**
     * Update work order
     */
    async update(id, woData, items) {
        try {
            await db.from('work_orders').update(woData).eq('id', id);

            if (items) {
                await db.from('work_order_items').delete().eq('work_order_id', id);
                if (items.length > 0) {
                    const itemsWithId = items.map((item, index) => ({
                        ...item,
                        work_order_id: id,
                        sort_order: index
                    }));
                    await db.from('work_order_items').insert(itemsWithId);
                }
            }

            await this.recalculateTotals(id);

            UI.toast(t('success'), 'success');
            return true;
        } catch (error) {
            console.error('Update work order error:', error);
            UI.toast(error.message || t('error'), 'error');
            return false;
        }
    },

    /**
     * Recalculate totals
     */
    async recalculateTotals(id) {
        const { data: items } = await db.from('work_order_items').select('*').eq('work_order_id', id);
        const { data: wo } = await db.from('work_orders').select('discount_percent, tax_percent').eq('id', id).single();

        const subtotal = (items || []).reduce((sum, item) => sum + (item.total || 0), 0);
        const discountAmount = subtotal * ((wo?.discount_percent || 0) / 100);
        const afterDiscount = subtotal - discountAmount;
        const taxAmount = afterDiscount * ((wo?.tax_percent || 14) / 100);
        const total = afterDiscount + taxAmount;

        await db.from('work_orders').update({ subtotal, discount_amount: discountAmount, tax_amount: taxAmount, total }).eq('id', id);
    },

    /**
     * Update status
     */
    async updateStatus(id, status, additionalData = {}) {
        try {
            const updateData = { status, ...additionalData };

            if (status === 'completed') {
                updateData.actual_completion = new Date().toISOString();
            } else if (status === 'delivered') {
                updateData.delivered_at = new Date().toISOString();
                updateData.delivered_by = auth.getUser()?.id;
            }

            await db.from('work_orders').update(updateData).eq('id', id);
            UI.toast(t('success'), 'success');
            return true;
        } catch (error) {
            console.error('Update status error:', error);
            UI.toast(error.message || t('error'), 'error');
            return false;
        }
    },

    /**
     * Assign technician
     */
    async assignTechnician(workOrderId, technicianId, isPrimary = false) {
        try {
            await db.from('work_order_technicians').insert({
                work_order_id: workOrderId,
                technician_id: technicianId,
                is_primary: isPrimary,
                assigned_by: auth.getUser()?.id
            });
            UI.toast('تم تعيين الفني بنجاح', 'success');
            return true;
        } catch (error) {
            console.error('Assign technician error:', error);
            UI.toast(error.message || t('error'), 'error');
            return false;
        }
    },

    /**
     * Remove technician
     */
    async removeTechnician(workOrderId, technicianId) {
        try {
            await db.from('work_order_technicians')
                .delete()
                .eq('work_order_id', workOrderId)
                .eq('technician_id', technicianId);
            UI.toast(t('success'), 'success');
            return true;
        } catch (error) {
            console.error('Remove technician error:', error);
            return false;
        }
    },

    /**
     * Create invoice from work order
     */
    async createInvoice(workOrderId) {
        try {
            const wo = await this.getById(workOrderId);
            if (!wo) throw new Error('أمر الشغل غير موجود');
            if (wo.status !== 'completed' && wo.status !== 'delivered') {
                throw new Error('أمر الشغل يجب أن يكون مكتمل أولاً');
            }

            const { data: invoice, error } = await db
                .from('invoices')
                .insert({
                    work_order_id: workOrderId,
                    customer_id: wo.customer_id,
                    branch_id: wo.branch_id,
                    status: 'issued',
                    subtotal: wo.subtotal,
                    discount_amount: wo.discount_amount,
                    tax_amount: wo.tax_amount,
                    total: wo.total,
                    remaining_amount: wo.total,
                    issued_by: auth.getUser()?.id,
                    issued_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            UI.toast('تم إصدار الفاتورة بنجاح', 'success');
            return invoice;
        } catch (error) {
            console.error('Create invoice error:', error);
            UI.toast(error.message || t('error'), 'error');
            return null;
        }
    },

    /**
     * Get status badge
     */
    getStatusBadge(status) {
        const statusClasses = {
            pending: 'status-pending',
            in_progress: 'status-active',
            on_hold: 'status-pending',
            completed: 'status-completed',
            delivered: 'status-completed',
            cancelled: 'status-cancelled'
        };
        return `<span class="status-badge ${statusClasses[status] || 'status-pending'}">${t('status_' + status) || status}</span>`;
    },

    /**
     * Get priority badge
     */
    getPriorityBadge(priority) {
        const colors = { low: 'badge-gray', normal: 'badge-primary', high: 'badge-warning', urgent: 'badge-danger' };
        return `<span class="badge ${colors[priority] || 'badge-gray'}">${t('priority_' + priority) || priority}</span>`;
    },

    /**
     * Render table
     */
    renderTable(workOrders, container) {
        if (!workOrders || workOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔧</div>
                    <h4 class="empty-state-title">${t('no_data')}</h4>
                    <a href="form.html" class="btn btn-primary">إنشاء أمر شغل جديد</a>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>رقم الأمر</th>
                            <th>${t('customer')}</th>
                            <th>${t('vehicle')}</th>
                            <th>${t('status')}</th>
                            <th>${t('priority')}</th>
                            <th>${t('total')}</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${workOrders.map(wo => `
                            <tr>
                                <td><a href="view.html?id=${wo.id}">${wo.order_number}</a></td>
                                <td>${wo.customers?.name || '-'}</td>
                                <td>${wo.vehicles?.brand || ''} ${wo.vehicles?.plate_number || ''}</td>
                                <td>${this.getStatusBadge(wo.status)}</td>
                                <td>${this.getPriorityBadge(wo.priority)}</td>
                                <td class="font-semibold">${UI.formatCurrency(wo.total || 0)}</td>
                                <td>
                                    <div class="flex gap-2">
                                        <a href="view.html?id=${wo.id}" class="btn btn-icon btn-ghost btn-sm">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                            </svg>
                                        </a>
                                        ${wo.status === 'pending' ? `
                                            <a href="form.html?id=${wo.id}" class="btn btn-icon btn-ghost btn-sm">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                </svg>
                                            </a>
                                        ` : ''}
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

window.WorkOrders = WorkOrders;
