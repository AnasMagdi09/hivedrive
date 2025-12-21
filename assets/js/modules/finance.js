/**
 * HiveDrive - Finance Module (Invoices & Payments)
 */

const Finance = {
    // ============ INVOICES ============

    /**
     * Load invoices list
     */
    async loadInvoices(options = {}) {
        try {
            const { data, count } = await API.list('invoices', {
                select: '*, customers(name), work_orders(order_number)',
                orderBy: 'created_at',
                ascending: false,
                ...options
            });
            return { data, count };
        } catch (error) {
            console.error('Load invoices error:', error);
            return { data: [], count: 0 };
        }
    },

    /**
     * Get invoice with payments
     */
    async getInvoiceById(id) {
        try {
            const { data, error } = await db
                .from('invoices')
                .select('*, customers(id, name, phone), work_orders(order_number), payments(*)')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get invoice error:', error);
            return null;
        }
    },

    /**
     * Add payment to invoice
     */
    async addPayment(invoiceId, paymentData) {
        try {
            const user = auth.getUser();

            const { data: payment, error } = await db
                .from('payments')
                .insert({
                    ...paymentData,
                    invoice_id: invoiceId,
                    branch_id: user?.branch_id,
                    received_by: user?.id,
                    payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0]
                })
                .select()
                .single();

            if (error) throw error;

            // Update invoice status
            await API.updateInvoicePaymentStatus(invoiceId);

            // Add treasury transaction
            const invoice = await this.getInvoiceById(invoiceId);
            await this.addTreasuryTransaction({
                category: 'invoice_payment',
                amount: paymentData.amount,
                description: `دفعة فاتورة ${invoice.invoice_number}`,
                reference_type: 'payment',
                reference_id: payment.id
            }, 'income');

            UI.toast('تم تسجيل الدفعة بنجاح', 'success');
            return payment;
        } catch (error) {
            console.error('Add payment error:', error);
            UI.toast(error.message || t('error'), 'error');
            return null;
        }
    },

    /**
     * Get invoice status badge
     */
    getInvoiceStatusBadge(status) {
        const classes = {
            draft: 'badge-gray',
            issued: 'badge-warning',
            partial: 'badge-primary',
            paid: 'badge-success',
            cancelled: 'badge-danger'
        };
        const labels = {
            draft: 'مسودة',
            issued: 'صادرة',
            partial: 'مدفوعة جزئياً',
            paid: 'مدفوعة',
            cancelled: 'ملغية'
        };
        return `<span class="badge ${classes[status] || 'badge-gray'}">${labels[status] || status}</span>`;
    },

    // ============ TREASURY ============

    /**
     * Get treasury balance for branch
     */
    async getTreasuryBalance(branchId) {
        try {
            if (!branchId) return 0;
            const { data } = await db
                .from('treasury')
                .select('*')
                .eq('branch_id', branchId)
                .maybeSingle();
            return data?.current_balance || 0;
        } catch (error) {
            console.error('Get treasury error:', error);
            return 0;
        }
    },

    /**
     * Add treasury transaction
     */
    async addTreasuryTransaction(transactionData, type) {
        try {
            const user = auth.getUser();
            const branchId = user?.branch_id;

            // Get or create treasury
            let { data: treasury } = await db
                .from('treasury')
                .select('*')
                .eq('branch_id', branchId)
                .maybeSingle();

            if (!treasury) {
                const { data: newTreasury } = await db
                    .from('treasury')
                    .insert({ branch_id: branchId, current_balance: 0 })
                    .select()
                    .single();
                treasury = newTreasury;
            }

            // Calculate new balance
            const amount = type === 'income' ? transactionData.amount : -transactionData.amount;
            const newBalance = (treasury.current_balance || 0) + amount;

            // Insert transaction
            await db.from('treasury_transactions').insert({
                treasury_id: treasury.id,
                transaction_type: type,
                category: transactionData.category,
                amount: Math.abs(transactionData.amount),
                balance_after: newBalance,
                reference_type: transactionData.reference_type,
                reference_id: transactionData.reference_id,
                description: transactionData.description,
                transaction_date: new Date().toISOString().split('T')[0],
                created_by: user?.id
            });

            // Update treasury balance
            await db.from('treasury')
                .update({ current_balance: newBalance, updated_at: new Date().toISOString() })
                .eq('id', treasury.id);

            return true;
        } catch (error) {
            console.error('Add treasury transaction error:', error);
            return false;
        }
    },

    /**
     * Get today's summary
     */
    async getTodaySummary(branchId) {
        try {
            const today = new Date().toISOString().split('T')[0];

            const { data: transactions } = await db
                .from('treasury_transactions')
                .select('transaction_type, amount')
                .eq('transaction_date', today);

            let income = 0, expense = 0;
            (transactions || []).forEach(t => {
                if (t.transaction_type === 'income') income += t.amount;
                else expense += t.amount;
            });

            return { income, expense, net: income - expense };
        } catch (error) {
            console.error('Get today summary error:', error);
            return { income: 0, expense: 0, net: 0 };
        }
    },

    /**
     * Add expense
     */
    async addExpense(expenseData) {
        try {
            const user = auth.getUser();

            const { data: expense, error } = await db
                .from('expenses')
                .insert({
                    ...expenseData,
                    branch_id: user?.branch_id,
                    paid_by: user?.id,
                    expense_date: expenseData.expense_date || new Date().toISOString().split('T')[0]
                })
                .select()
                .single();

            if (error) throw error;

            // Add treasury transaction
            await this.addTreasuryTransaction({
                category: expenseData.category,
                amount: expenseData.amount,
                description: expenseData.description,
                reference_type: 'expense',
                reference_id: expense.id
            }, 'expense');

            UI.toast('تم تسجيل المصروف بنجاح', 'success');
            return expense;
        } catch (error) {
            console.error('Add expense error:', error);
            UI.toast(error.message || t('error'), 'error');
            return null;
        }
    },

    /**
     * Render invoices table
     */
    renderInvoicesTable(invoices, container) {
        if (!invoices || invoices.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🧾</div>
                    <h4 class="empty-state-title">${t('no_data')}</h4>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>رقم الفاتورة</th>
                            <th>${t('customer')}</th>
                            <th>أمر الشغل</th>
                            <th>${t('total')}</th>
                            <th>المدفوع</th>
                            <th>المتبقي</th>
                            <th>${t('status')}</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoices.map(inv => `
                            <tr>
                                <td><a href="view.html?id=${inv.id}">${inv.invoice_number}</a></td>
                                <td>${inv.customers?.name || '-'}</td>
                                <td>${inv.work_orders?.order_number || '-'}</td>
                                <td class="font-semibold">${UI.formatCurrency(inv.total)}</td>
                                <td class="text-success">${UI.formatCurrency(inv.paid_amount || 0)}</td>
                                <td class="text-danger">${UI.formatCurrency(inv.remaining_amount || 0)}</td>
                                <td>${this.getInvoiceStatusBadge(inv.status)}</td>
                                <td>
                                    <div class="flex gap-2">
                                        <a href="view.html?id=${inv.id}" class="btn btn-icon btn-ghost btn-sm">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                            </svg>
                                        </a>
                                        ${inv.status !== 'paid' && inv.status !== 'cancelled' ? `
                                            <button class="btn btn-icon btn-ghost btn-sm" onclick="showPaymentModal('${inv.id}')">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                                                    <line x1="1" y1="10" x2="23" y2="10"/>
                                                </svg>
                                            </button>
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

window.Finance = Finance;
