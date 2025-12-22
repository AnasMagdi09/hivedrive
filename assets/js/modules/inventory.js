/**
 * HiveDrive - Inventory Module
 */

const Inventory = {
    /**
     * Load parts list with inventory
     */
    async loadParts(options = {}) {
        try {
            const user = auth.getUser();
            const branchId = user?.branch_id;
            
            console.log('User:', user);
            console.log('Branch ID:', branchId);

            // Get parts with optional inventory join
            const { data: parts, count } = await API.list('parts', {
                select: '*, suppliers(name)',
                orderBy: 'name',
                ascending: true,
                ...options
            });

            console.log('Parts loaded:', parts);

            // If we have parts, get their inventory for this branch
            if (parts && parts.length > 0 && branchId) {
                const partIds = parts.map(p => p.id);
                const { data: inventoryData } = await db
                    .from('inventory')
                    .select('part_id, quantity, reserved_quantity')
                    .eq('branch_id', branchId)
                    .in('part_id', partIds);

                console.log('Inventory data:', inventoryData);

                // Map inventory to parts
                const inventoryMap = {};
                (inventoryData || []).forEach(inv => {
                    inventoryMap[inv.part_id] = inv;
                });

                parts.forEach(part => {
                    const inv = inventoryMap[part.id] || { quantity: 0, reserved_quantity: 0 };
                    part.inventory = [inv];
                    console.log(`Part ${part.name}: quantity = ${inv.quantity}`);
                });
            } else {
                console.warn('No branch_id found for user or no parts');
                // إذا لم يكن هناك branch_id، نحاول جلب المخزون من أي فرع
                if (parts && parts.length > 0) {
                    const partIds = parts.map(p => p.id);
                    const { data: inventoryData } = await db
                        .from('inventory')
                        .select('part_id, quantity, reserved_quantity, branch_id')
                        .in('part_id', partIds);

                    console.log('Inventory data (all branches):', inventoryData);

                    // Map inventory to parts (use first branch found)
                    const inventoryMap = {};
                    (inventoryData || []).forEach(inv => {
                        if (!inventoryMap[inv.part_id]) {
                            inventoryMap[inv.part_id] = inv;
                        }
                    });

                    parts.forEach(part => {
                        const inv = inventoryMap[part.id] || { quantity: 0, reserved_quantity: 0 };
                        part.inventory = [inv];
                        console.log(`Part ${part.name}: quantity = ${inv.quantity}`);
                    });
                }
            }

            return { data: parts, count };
        } catch (error) {
            console.error('Load parts error:', error);
            return { data: [], count: 0 };
        }
    },

    /**
     * Get part by ID
     */
    async getPartById(id) {
        try {
            const { data, error } = await db
                .from('parts')
                .select('*, suppliers(id, name), inventory(*)')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get part error:', error);
            return null;
        }
    },

    /**
     * Create part with initial quantity
     */
    async createPart(partData, initialQuantity = 0) {
        try {
            const result = await API.create('parts', partData);

            // Create inventory record for current branch with initial quantity
            const user = auth.getUser();
            if (user?.branch_id) {
                await db.from('inventory').insert({
                    branch_id: user.branch_id,
                    part_id: result.id,
                    quantity: initialQuantity
                });
            }

            UI.toast(t('success'), 'success');
            return result;
        } catch (error) {
            console.error('Create part error:', error);
            UI.toast(error.message || t('error'), 'error');
            return null;
        }
    },

    /**
     * Update part
     */
    async updatePart(id, partData) {
        try {
            // Track price changes
            const oldPart = await this.getPartById(id);
            if (oldPart && (oldPart.cost_price !== partData.cost_price || oldPart.sell_price !== partData.sell_price)) {
                await db.from('price_history').insert({
                    part_id: id,
                    old_cost_price: oldPart.cost_price,
                    new_cost_price: partData.cost_price,
                    old_sell_price: oldPart.sell_price,
                    new_sell_price: partData.sell_price,
                    changed_by: auth.getUser()?.id
                });
            }

            const result = await API.update('parts', id, partData);
            UI.toast(t('success'), 'success');
            return result;
        } catch (error) {
            console.error('Update part error:', error);
            UI.toast(error.message || t('error'), 'error');
            return null;
        }
    },

    /**
     * Adjust stock quantity
     */
    async adjustStock(partId, branchId, quantity, type, reference = null) {
        try {
            // Get current inventory
            const { data: inv } = await db
                .from('inventory')
                .select('*')
                .eq('part_id', partId)
                .eq('branch_id', branchId)
                .single();

            const newQuantity = (inv?.quantity || 0) + quantity;

            // Update inventory
            if (inv) {
                await db.from('inventory')
                    .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
                    .eq('id', inv.id);
            } else {
                await db.from('inventory').insert({
                    branch_id: branchId,
                    part_id: partId,
                    quantity: newQuantity
                });
            }

            // Record movement
            const { data: part } = await db.from('parts').select('cost_price').eq('id', partId).single();
            await db.from('stock_movements').insert({
                branch_id: branchId,
                part_id: partId,
                movement_type: type,
                quantity: Math.abs(quantity),
                unit_cost: part?.cost_price,
                reference_type: reference?.type,
                reference_id: reference?.id,
                created_by: auth.getUser()?.id
            });

            return true;
        } catch (error) {
            console.error('Adjust stock error:', error);
            return false;
        }
    },

    /**
     * Issue parts for work order
     */
    async issueForWorkOrder(workOrderId, partId, quantity) {
        const user = auth.getUser();
        const success = await this.adjustStock(
            partId,
            user?.branch_id,
            -quantity,
            'work_order_out',
            { type: 'work_order', id: workOrderId }
        );

        if (success) {
            UI.toast('تم صرف القطعة بنجاح', 'success');
        } else {
            UI.toast('فشل صرف القطعة', 'error');
        }
        return success;
    },

    /**
     * Get low stock parts
     */
    async getLowStock(branchId) {
        try {
            const { data } = await db
                .from('inventory')
                .select('*, parts(name, sku, min_quantity)')
                .eq('branch_id', branchId)
                .lt('quantity', 5); // Simplified

            return data || [];
        } catch (error) {
            console.error('Get low stock error:', error);
            return [];
        }
    },

    /**
     * Search parts
     */
    async searchParts(query) {
        try {
            const { data } = await db
                .from('parts')
                .select('id, sku, name, sell_price')
                .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
                .limit(10);
            return data || [];
        } catch (error) {
            console.error('Search parts error:', error);
            return [];
        }
    },

    /**
     * Render parts table
     */
    renderPartsTable(parts, container) {
        if (!parts || parts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <h4 class="empty-state-title">${t('no_data')}</h4>
                    <a href="form.html" class="btn btn-primary">إضافة قطعة جديدة</a>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>الكود</th>
                            <th>الاسم</th>
                            <th>المورد</th>
                            <th>الكمية</th>
                            <th>سعر التكلفة</th>
                            <th>سعر البيع</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${parts.map(p => {
            const qty = p.inventory?.[0]?.quantity || 0;
            const minQty = p.min_quantity || 5;
            let stockStatus = 'badge-success';
            let stockText = 'متوفر';
            if (qty <= 0) { stockStatus = 'badge-danger'; stockText = 'نفذ'; }
            else if (qty <= minQty) { stockStatus = 'badge-warning'; stockText = 'منخفض'; }

            return `
                                <tr>
                                    <td><span class="badge badge-gray">${p.sku}</span></td>
                                    <td>
                                        <div class="font-medium">${p.name}</div>
                                        <div class="text-sm text-muted">${p.brand || ''} ${p.category || ''}</div>
                                    </td>
                                    <td>${p.suppliers?.name || '-'}</td>
                                    <td class="font-semibold">${qty}</td>
                                    <td>${UI.formatCurrency(p.cost_price)}</td>
                                    <td>${UI.formatCurrency(p.sell_price)}</td>
                                    <td><span class="badge ${stockStatus}">${stockText}</span></td>
                                    <td>
                                        <div class="flex gap-2">
                                            <a href="form.html?id=${p.id}" class="btn btn-icon btn-ghost btn-sm">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                </svg>
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    // Aliases for form.html compatibility
    create: function (data, initialQty = 0) { return this.createPart(data, initialQty); },
    update: function (id, data) { return this.updatePart(id, data); },
    getById: function (id) { return this.getPartById(id); }
};

window.Inventory = Inventory;
