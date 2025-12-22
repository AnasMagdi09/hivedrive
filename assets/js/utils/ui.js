/**
 * HiveDrive - UI Utilities
 */

const UI = {
    /**
     * Show toast notification
     */
    toast(message, type = 'info', duration = 4000) {
        const container = document.getElementById('toast-container') || this.createToastContainer();

        const icons = {
            success: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
            error: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
            warning: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
            info: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <div class="toast-content">
                <p class="toast-message">${message}</p>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    },

    /**
     * Show loading overlay
     */
    showLoading() {
        let overlay = document.getElementById('loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = '<div class="spinner lg"></div>';
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    },

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.style.display = 'none';
    },

    /**
     * Show modal
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        const backdrop = document.getElementById('modal-backdrop') || this.createModalBackdrop();

        if (modal) {
            backdrop.classList.add('open');
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    },

    /**
     * Hide modal
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        const backdrop = document.getElementById('modal-backdrop');

        if (modal) {
            modal.classList.remove('open');
        }
        if (backdrop) {
            backdrop.classList.remove('open');
        }
        document.body.style.overflow = '';
    },

    createModalBackdrop() {
        const backdrop = document.createElement('div');
        backdrop.id = 'modal-backdrop';
        backdrop.className = 'modal-backdrop';
        backdrop.onclick = () => {
            document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
            backdrop.classList.remove('open');
            document.body.style.overflow = '';
        };
        document.body.appendChild(backdrop);
        return backdrop;
    },

    /**
     * Confirm dialog
     */
    async confirm(message, title = t('confirm')) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal open';
            modal.style.cssText = 'opacity:1;visibility:visible;transform:translate(-50%,-50%) scale(1);';
            modal.innerHTML = `
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="confirm-cancel">${t('cancel')}</button>
                    <button class="btn btn-danger" id="confirm-ok">${t('confirm')}</button>
                </div>
            `;

            const backdrop = this.createModalBackdrop();
            backdrop.classList.add('open');
            document.body.appendChild(modal);

            const cleanup = (result) => {
                modal.remove();
                backdrop.classList.remove('open');
                resolve(result);
            };

            modal.querySelector('#confirm-cancel').onclick = () => cleanup(false);
            modal.querySelector('#confirm-ok').onclick = () => cleanup(true);
        });
    },

    /**
     * Format currency
     */
    formatCurrency(amount) {
        // Always use English numerals
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount) + ' ج.م';
    },

    /**
     * Format date
     */
    formatDate(date, format = 'short') {
        const d = new Date(date);
        const options = format === 'short'
            ? { year: 'numeric', month: 'short', day: 'numeric' }
            : { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };

        // Always use English numerals
        return d.toLocaleDateString('en-GB', options);
    },

    /**
     * Format number
     */
    formatNumber(num) {
        // Always use English numerals
        return new Intl.NumberFormat('en-US').format(num);
    }
};

window.UI = UI;
