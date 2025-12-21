/**
 * HiveDrive - Purchases Module
 */

const Purchases = {
    /**
     * Load purchases list
     */
    async loadList(options = {}) {
        try {
            const { data, count } = await API.list('purchase_orders', {
                select: '*, suppliers(name)',
                orderBy: 'created_at',
                ascending: false,
                ...options
            });
            return { data, count };
        } catch (error) {
            console.error('Load purchases error:', error);
            UI.toast(t('error'), 'error');
            return { data: [], count: 0 };
        }
    },

    /**
     * Get purchase by ID
     */
    async getById(id) {
        try {
            const { data, error } = await db
                .from('purchase_orders')
                .select('*, suppliers(name), purchase_order_items(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get purchase error:', error);
            return null;
        }
    },

    /**
     * Create purchase order
     */
    async create(purchaseData, items) {
        try {
            const user = auth.getUser();

            const { data: purchase, error } = await db
                .from('purchase_orders')
                .insert({
                    ...purchaseData,
                    branch_id: user?.branch_id,
                    created_by: user?.id,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) throw error;

            if (items && items.length > 0) {
                const itemsWithId = items.map(item => ({
                    purchase_order_id: purchase.id,
                    part_id: item.part_id,
                    quantity_ordered: item.quantity,
                    unit_price: item.unit_price,
                    total: item.quantity * item.unit_price
                }));
                await db.from('purchase_order_items').insert(itemsWithId);
            }

            UI.toast(t('success'), 'success');
            return purchase;
        } catch (error) {
            console.error('Create purchase error:', error);
            UI.toast(error.message || t('error'), 'error');
            return null;
        }
    },

    /**
     * Update status and update inventory when received
     */
    async updateStatus(id, status) {
        try {
            const updateData = { status };
            if (status === 'received') {
                updateData.received_date = new Date().toISOString();

                // Update inventory quantities
                await this.updateInventoryFromPurchase(id);
            }

            await db.from('purchase_orders').update(updateData).eq('id', id);
            UI.toast(t('success'), 'success');
            return true;
        } catch (error) {
            console.error('Update status error:', error);
            UI.toast(error.message || t('error'), 'error');
            return false;
        }
    },

    /**
     * Update inventory quantities from purchase order items
     */
    async updateInventoryFromPurchase(purchaseOrderId) {
        try {
            // Get purchase order with items
            const { data: items } = await db
                .from('purchase_order_items')
                .select('part_id, quantity_ordered')
                .eq('purchase_order_id', purchaseOrderId);

            if (!items || items.length === 0) return;

            const { data: purchaseOrder } = await db
                .from('purchase_orders')
                .select('branch_id')
                .eq('id', purchaseOrderId)
                .single();

            const branchId = purchaseOrder?.branch_id || auth.getUser()?.branch_id;

            // Update each item's inventory
            for (const item of items) {
                // Get current inventory
                const { data: inventory } = await db
                    .from('inventory')
                    .select('id, quantity')
                    .eq('part_id', item.part_id)
                    .eq('branch_id', branchId)
                    .maybeSingle();

                if (inventory) {
                    // Update existing
                    await db.from('inventory')
                        .update({ quantity: inventory.quantity + item.quantity_ordered })
                        .eq('id', inventory.id);
                } else {
                    // Create new inventory record
                    await db.from('inventory').insert({
                        branch_id: branchId,
                        part_id: item.part_id,
                        quantity: item.quantity_ordered
                    });
                }

                // Log stock movement
                await db.from('stock_movements').insert({
                    branch_id: branchId,
                    part_id: item.part_id,
                    movement_type: 'purchase_in',
                    quantity: item.quantity_ordered,
                    reference_type: 'purchase_order',
                    reference_id: purchaseOrderId,
                    created_by: auth.getUser()?.id
                });
            }
        } catch (error) {
            console.error('Update inventory from purchase error:', error);
        }
    },

    /**
     * Get status badge
     */
    getStatusBadge(status) {
        const classes = {
            pending: 'badge-warning',
            approved: 'badge-primary',
            ordered: 'badge-info',
            received: 'badge-success',
            cancelled: 'badge-danger'
        };
        const labels = {
            pending: 'في الانتظار',
            approved: 'تمت الموافقة',
            ordered: 'تم الطلب',
            received: 'تم الاستلام',
            cancelled: 'ملغي'
        };
        return `<span class="badge ${classes[status] || 'badge-gray'}">${labels[status] || status}</span>`;
    },

    /**
     * Render purchases table
     */
    renderTable(purchases, container) {
        if (!purchases || purchases.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <h4 class="empty-state-title">${t('no_data')}</h4>
                    <p class="empty-state-text">لا توجد أوامر شراء</p>
                    <a href="form.html" class="btn btn-primary">إنشاء أمر شراء</a>
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
                            <th>المورد</th>
                            <th>التاريخ</th>
                            <th>الإجمالي</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${purchases.map(p => `
                            <tr>
                                <td><a href="view.html?id=${p.id}">${p.order_number || '-'}</a></td>
                                <td>${p.suppliers?.name || '-'}</td>
                                <td>${UI.formatDate(p.created_at)}</td>
                                <td class="font-semibold">${UI.formatCurrency(p.total || 0)}</td>
                                <td>${this.getStatusBadge(p.status)}</td>
                                <td>
                                    <div class="flex gap-2">
                                        <a href="view.html?id=${p.id}" class="btn btn-icon btn-ghost btn-sm">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
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

window.Purchases = Purchases;
