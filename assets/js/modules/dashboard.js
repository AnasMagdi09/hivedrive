/**
 * HiveDrive - Dashboard Module
 */

const Dashboard = {
    /**
     * Initialize dashboard
     */
    async init() {
        await this.loadStats();
        await this.loadRecentWorkOrders();
    },

    /**
     * Load dashboard statistics
     */
    async loadStats() {
        try {
            // Customers count
            const { count: customersCount } = await db
                .from('customers')
                .select('*', { count: 'exact', head: true });

            // Active work orders
            const { count: activeWO } = await db
                .from('work_orders')
                .select('*', { count: 'exact', head: true })
                .in('status', ['pending', 'in_progress']);

            // Today's revenue
            const today = new Date().toISOString().split('T')[0];
            const { data: todayPayments } = await db
                .from('payments')
                .select('amount')
                .gte('payment_date', today);

            const todayRevenue = (todayPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

            // Low stock items
            const { count: lowStock } = await db
                .from('inventory')
                .select('*, parts(min_quantity)', { count: 'exact', head: true })
                .lt('quantity', 5); // Simplified, ideally compare with min_quantity

            // Update UI
            this.updateStat('statCustomers', customersCount || 0);
            this.updateStat('statWorkOrders', activeWO || 0);
            this.updateStat('statRevenue', UI.formatCurrency(todayRevenue));
            this.updateStat('statLowStock', lowStock || 0);

        } catch (error) {
            console.error('Load stats error:', error);
        }
    },

    /**
     * Update stat value in UI
     */
    updateStat(id, value) {
        const el = document.getElementById(id);
        if (el) {
            if (typeof value === 'number') {
                el.textContent = UI.formatNumber(value);
            } else {
                el.textContent = value;
            }
        }
    },

    /**
     * Load recent work orders
     */
    async loadRecentWorkOrders() {
        try {
            const { data: workOrders, error } = await db
                .from('work_orders')
                .select(`
                    id,
                    order_number,
                    status,
                    priority,
                    created_at,
                    customers(name),
                    vehicles(plate_number, brand, model)
                `)
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;

            const container = document.getElementById('recentWorkOrders');

            if (!workOrders || workOrders.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <h4 class="empty-state-title" data-i18n="no_data">${t('no_data')}</h4>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div class="table-container" style="border:none;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>${t('order_number')}</th>
                                <th>${t('customer')}</th>
                                <th>${t('vehicle')}</th>
                                <th>${t('status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${workOrders.map(wo => `
                                <tr>
                                    <td><a href="pages/workorders/view.html?id=${wo.id}">${wo.order_number}</a></td>
                                    <td>${wo.customers?.name || '-'}</td>
                                    <td>${wo.vehicles?.brand || ''} ${wo.vehicles?.model || ''}</td>
                                    <td><span class="status-badge status-${wo.status}">${t('status_' + wo.status)}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

        } catch (error) {
            console.error('Load work orders error:', error);
        }
    },

    /**
     * Get status badge class
     */
    getStatusClass(status) {
        const statusMap = {
            pending: 'pending',
            in_progress: 'active',
            completed: 'completed',
            delivered: 'completed',
            cancelled: 'cancelled'
        };
        return statusMap[status] || 'pending';
    }
};

window.Dashboard = Dashboard;
