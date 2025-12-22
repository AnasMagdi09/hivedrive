/**
 * HiveDrive - Quotations Module
 */

const Quotations = {
    /**
     * Load quotations list
     */
    async loadList(options = {}) {
        try {
            const { data, error } = await db
                .from('quotations')
                .select(`*, customers(id, name, phone), vehicles(id, brand, model, plate_number)`)
                .order('created_at', { ascending: false })
                .limit(options.limit || 20);
            
            if (error) throw error;
            return { data: data || [], count: data?.length || 0 };
        } catch (error) {
            console.error('Load quotations error:', error);
            return { data: [], count: 0 };
        }
    },

    /**
     * Get quotation with items
     */
    async getById(id) {
        try {
            const { data: quotation, error } = await db
                .from('quotations')
                .select(`*, customers(id, name, phone), vehicles(id, plate_number, brand, model),
                         quotation_items(*)`)
                .eq('id', id)
                .single();

            if (error) throw error;
            return quotation;
        } catch (error) {
            console.error('Get quotation error:', error);
            return null;
        }
    },

    /**
     * Create quotation
     */
    async create(quotationData, items) {
        try {
            const user = auth.getUser();

            // Create quotation
            const { data: quotation, error } = await db
                .from('quotations')
                .insert({
                    ...quotationData,
                    branch_id: user?.branch_id,
                    created_by: user?.id
                })
                .select()
                .single();

            if (error) throw error;

            // Add items
            if (items && items.length > 0) {
                const itemsWithId = items.map((item, index) => ({
                    ...item,
                    quotation_id: quotation.id,
                    sort_order: index
                }));

                await db.from('quotation_items').insert(itemsWithId);
            }

            // Recalculate totals
            await this.recalculateTotals(quotation.id);

            UI.toast(t('success'), 'success');
            return quotation;
        } catch (error) {
            console.error('Create quotation error:', error);
            UI.toast(error.message || t('error'), 'error');
            return null;
        }
    },

    /**
     * Update quotation
     */
    async update(id, quotationData, items) {
        try {
            await db.from('quotations').update(quotationData).eq('id', id);

            // Replace items
            await db.from('quotation_items').delete().eq('quotation_id', id);

            if (items && items.length > 0) {
                const itemsWithId = items.map((item, index) => ({
                    ...item,
                    quotation_id: id,
                    sort_order: index
                }));
                await db.from('quotation_items').insert(itemsWithId);
            }

            await this.recalculateTotals(id);

            UI.toast(t('success'), 'success');
            return true;
        } catch (error) {
            console.error('Update quotation error:', error);
            UI.toast(error.message || t('error'), 'error');
            return false;
        }
    },

    /**
     * Recalculate quotation totals
     */
    async recalculateTotals(id) {
        const { data: items } = await db.from('quotation_items').select('*').eq('quotation_id', id);
        const { data: quotation } = await db.from('quotations').select('discount_percent, tax_percent').eq('id', id).single();

        const subtotal = (items || []).reduce((sum, item) => sum + (item.total || 0), 0);
        const discountAmount = subtotal * ((quotation?.discount_percent || 0) / 100);
        const afterDiscount = subtotal - discountAmount;
        const taxAmount = afterDiscount * ((quotation?.tax_percent || 14) / 100);
        const total = afterDiscount + taxAmount;

        await db.from('quotations').update({
            subtotal,
            discount_amount: discountAmount,
            tax_amount: taxAmount,
            total
        }).eq('id', id);
    },

    /**
     * Convert to work order
     */
    async convertToWorkOrder(quotationId) {
        try {
            const quotation = await this.getById(quotationId);
            if (!quotation) throw new Error('المقايسة غير موجودة');
            if (quotation.status !== 'approved') throw new Error('المقايسة يجب أن تكون موافق عليها أولاً');

            const user = auth.getUser();

            // Create work order
            const { data: workOrder, error } = await db
                .from('work_orders')
                .insert({
                    quotation_id: quotationId,
                    customer_id: quotation.customer_id,
                    vehicle_id: quotation.vehicle_id,
                    branch_id: quotation.branch_id,
                    status: 'pending',
                    subtotal: quotation.subtotal,
                    discount_percent: quotation.discount_percent,
                    discount_amount: quotation.discount_amount,
                    tax_percent: quotation.tax_percent,
                    tax_amount: quotation.tax_amount,
                    total: quotation.total,
                    created_by: user?.id
                })
                .select()
                .single();

            if (error) throw error;

            // Copy items
            const woItems = quotation.quotation_items.map(item => ({
                work_order_id: workOrder.id,
                item_type: item.item_type,
                part_id: item.part_id,
                description: item.description,
                description_en: item.description_en,
                quantity: item.quantity,
                unit_price: item.unit_price,
                discount_percent: item.discount_percent,
                total: item.total,
                sort_order: item.sort_order
            }));

            await db.from('work_order_items').insert(woItems);

            // Update quotation status
            await db.from('quotations').update({ status: 'converted' }).eq('id', quotationId);

            UI.toast('تم تحويل المقايسة لأمر شغل بنجاح', 'success');
            return workOrder;
        } catch (error) {
            console.error('Convert to WO error:', error);
            UI.toast(error.message || t('error'), 'error');
            return null;
        }
    },

    /**
     * Update status
     */
    async updateStatus(id, status) {
        try {
            const updateData = { status };
            if (status === 'approved') {
                updateData.approved_by = auth.getUser()?.id;
                updateData.approved_at = new Date().toISOString();
            }

            await db.from('quotations').update(updateData).eq('id', id);
            UI.toast(t('success'), 'success');
            return true;
        } catch (error) {
            console.error('Update status error:', error);
            UI.toast(error.message || t('error'), 'error');
            return false;
        }
    },

    /**
     * Delete quotation
     */
    async delete(id) {
        try {
            const confirmed = await UI.confirm(t('confirm_delete'));
            if (!confirmed) return false;

            await API.delete('quotations', id);
            UI.toast(t('success'), 'success');
            return true;
        } catch (error) {
            console.error('Delete quotation error:', error);
            UI.toast(error.message || t('error'), 'error');
            return false;
        }
    },

    /**
     * Get status badge HTML
     */
    getStatusBadge(status) {
        const statusClasses = {
            draft: 'badge-gray',
            pending: 'badge-warning',
            approved: 'badge-success',
            rejected: 'badge-danger',
            converted: 'badge-primary',
            expired: 'badge-gray'
        };
        return `<span class="badge ${statusClasses[status] || 'badge-gray'}">${t('status_' + status) || status}</span>`;
    },

    /**
     * Render quotations table
     */
    renderTable(quotations, container) {
        console.log('Rendering quotations:', quotations);
        
        if (!quotations || quotations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📄</div>
                    <h4 class="empty-state-title">${t('no_data')}</h4>
                    <a href="form.html" class="btn btn-primary">إنشاء مقايسة جديدة</a>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>رقم المقايسة</th>
                            <th>${t('customer')}</th>
                            <th>${t('vehicle')}</th>
                            <th>${t('total')}</th>
                            <th>${t('status')}</th>
                            <th>التاريخ</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${quotations.map(q => {
                            console.log('Quotation item:', q.id, q);
                            return `
                            <tr>
                                <td><a href="view.html?id=${q.id}">${q.quote_number || q.quotation_number || '-'}</a></td>
                                <td>${q.customer_name || q.customers?.name || '-'}</td>
                                <td>${q.vehicle_info || (q.vehicles?.brand ? q.vehicles.brand + ' ' + (q.vehicles.plate_number || '') : '-')}</td>
                                <td class="font-semibold">${UI.formatCurrency(q.total_amount || q.total || 0)}</td>
                                <td>${this.getStatusBadge(q.status)}</td>
                                <td class="text-sm text-muted">${UI.formatDate(q.created_at)}</td>
                                <td>
                                    <div class="flex gap-2">
                                        <a href="view.html?id=${q.id}" class="btn btn-icon btn-ghost btn-sm" title="عرض">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                            </svg>
                                        </a>
                                        ${q.status === 'draft' || q.status === 'pending' ? `
                                            <a href="form.html?id=${q.id}" class="btn btn-icon btn-ghost btn-sm" title="تعديل">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                </svg>
                                            </a>
                                        ` : ''}
                                    </div>
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
};

window.Quotations = Quotations;
