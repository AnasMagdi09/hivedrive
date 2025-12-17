/**
 * HiveDrive - API Utilities
 */

const API = {
    /**
     * Generate a unique number with prefix
     */
    async generateNumber(table, prefix, field = 'created_at') {
        const today = new Date().toISOString().split('T')[0];
        const { count } = await db
            .from(table)
            .select('*', { count: 'exact', head: true })
            .gte(field, today);

        const num = String((count || 0) + 1).padStart(4, '0');
        const dateStr = today.replace(/-/g, '');
        return `${prefix}-${dateStr}-${num}`;
    },

    /**
     * CRUD operations wrapper
     */
    async create(table, data) {
        const { data: result, error } = await db.from(table).insert(data).select().single();
        if (error) throw error;
        return result;
    },

    async read(table, id) {
        const { data, error } = await db.from(table).select('*').eq('id', id).single();
        if (error) throw error;
        return data;
    },

    async update(table, id, data) {
        const { data: result, error } = await db.from(table).update(data).eq('id', id).select().single();
        if (error) throw error;
        return result;
    },

    async delete(table, id) {
        const { error } = await db.from(table).delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    async list(table, options = {}) {
        let query = db.from(table).select(options.select || '*', options.count ? { count: 'exact' } : {});

        if (options.filters) {
            Object.entries(options.filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    query = query.eq(key, value);
                }
            });
        }

        if (options.search && options.searchFields) {
            const searchConditions = options.searchFields.map(f => `${f}.ilike.%${options.search}%`).join(',');
            query = query.or(searchConditions);
        }

        if (options.orderBy) {
            query = query.order(options.orderBy, { ascending: options.ascending ?? false });
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        if (options.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        }

        const { data, error, count } = await query;
        if (error) throw error;
        return { data, count };
    },

    /**
     * Calculate totals for quotation/work order
     */
    calculateTotals(items, discountPercent = 0, taxPercent = 14) {
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        const discountAmount = subtotal * (discountPercent / 100);
        const afterDiscount = subtotal - discountAmount;
        const taxAmount = afterDiscount * (taxPercent / 100);
        const total = afterDiscount + taxAmount;

        return {
            subtotal,
            discount_percent: discountPercent,
            discount_amount: discountAmount,
            tax_percent: taxPercent,
            tax_amount: taxAmount,
            total
        };
    },

    /**
     * Update invoice payment status
     */
    async updateInvoicePaymentStatus(invoiceId) {
        // Get invoice and payments
        const { data: invoice } = await db.from('invoices').select('total').eq('id', invoiceId).single();
        const { data: payments } = await db.from('payments').select('amount').eq('invoice_id', invoiceId);

        const paidAmount = (payments || []).reduce((sum, p) => sum + p.amount, 0);
        const remaining = invoice.total - paidAmount;

        let status = 'issued';
        if (paidAmount >= invoice.total) {
            status = 'paid';
        } else if (paidAmount > 0) {
            status = 'partial';
        }

        await db.from('invoices').update({
            paid_amount: paidAmount,
            remaining_amount: remaining,
            status
        }).eq('id', invoiceId);
    },

    /**
     * Update customer statistics
     */
    async updateCustomerStats(customerId) {
        const { count: visitCount } = await db
            .from('work_orders')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', customerId);

        const { data: invoices } = await db
            .from('invoices')
            .select('paid_amount')
            .eq('customer_id', customerId);

        const totalSpent = (invoices || []).reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);

        await db.from('customers').update({
            visit_count: visitCount || 0,
            total_spent: totalSpent
        }).eq('id', customerId);
    }
};

window.API = API;
