// ──────────────────────────────────────────────
//  Main App Controller
// ──────────────────────────────────────────────

const App = {
    init() {
        Router.init();
        this.render();
    },

    render() {
        const page = Router.getPage();

        // If not logged in, force login
        if (!api.isLoggedIn() && page !== 'login') {
            Router.navigate('login');
            return;
        }
        if (api.isLoggedIn() && page === 'login') {
            Router.navigate('dashboard');
            return;
        }

        const app = document.getElementById('app');

        if (page === 'login') {
            app.innerHTML = LoginPage.render();
            // Auto-focus username
            setTimeout(() => {
                const el = document.getElementById('login-username');
                if (el) el.focus();
            }, 100);
            return;
        }

        // Main layout with sidebar
        const pageTitles = {
            dashboard: 'Dashboard',
            raw: 'Raw Materials',
            packaging: 'Packaging Materials',
            finished: 'Finished Products',
            products: 'Material Management',
            users: 'Users Management',
            audit: 'Audit Trail',
            'yearly-raw': 'Yearly Report — Raw Materials',
            'yearly-packaging': 'Yearly Report — Packaging Materials',
            'yearly-finished': 'Yearly Report — Finished Products',
            export: 'Export Data'
        };

        const title = pageTitles[page] || 'Dashboard';
        let contentHTML = '';
        let afterRender = null;

        switch (page) {
            case 'dashboard':
                contentHTML = DashboardPage.render();
                afterRender = () => DashboardPage.afterRender();
                break;
            case 'raw':
                contentHTML = RawMaterialsPage.render();
                afterRender = () => RawMaterialsPage.afterRender();
                break;
            case 'packaging':
                contentHTML = PackagingMaterialsPage.render();
                afterRender = () => PackagingMaterialsPage.afterRender();
                break;
            case 'finished':
                contentHTML = FinishedProductsPage.render();
                afterRender = () => FinishedProductsPage.afterRender();
                break;
            case 'export':
                contentHTML = ExportPage.render();
                break;
            case 'products':
                contentHTML = ProductManagementPage.render();
                afterRender = () => ProductManagementPage.afterRender();
                break;
            case 'users':
                contentHTML = UserManagementPage.render();
                afterRender = () => UserManagementPage.afterRender();
                break;
            case 'audit':
                contentHTML = AuditTrailPage.render();
                afterRender = () => AuditTrailPage.afterRender();
                break;
            case 'yearly-raw':
                YearlyReportPage.setCategory('raw');
                contentHTML = YearlyReportPage.render();
                afterRender = () => YearlyReportPage.afterRender();
                break;
            case 'yearly-packaging':
                YearlyReportPage.setCategory('packaging');
                contentHTML = YearlyReportPage.render();
                afterRender = () => YearlyReportPage.afterRender();
                break;
            case 'yearly-finished':
                YearlyReportPage.setCategory('finished');
                contentHTML = YearlyReportPage.render();
                afterRender = () => YearlyReportPage.afterRender();
                break;
            default:
                contentHTML = DashboardPage.render();
                afterRender = () => DashboardPage.afterRender();
        }

        app.innerHTML = `
            ${renderSidebar(page)}
            <div class="content-area">
                <div class="topbar">
                    <div class="topbar-left">
                        <button class="menu-toggle" onclick="App.toggleSidebar()">
                            <i class="fas fa-bars"></i>
                        </button>
                        <h1 class="page-title">${title}</h1>
                    </div>
                    <div>
                        <button class="btn btn-secondary btn-sm" onclick="App.logout()"
                                style="display:none" id="topbar-logout">
                            <i class="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="page-content" id="page-content">
                    ${contentHTML}
                </div>
            </div>
        `;

        // Ensure toast container exists
        if (!document.querySelector('.toast-container')) {
            const tc = document.createElement('div');
            tc.className = 'toast-container';
            document.body.appendChild(tc);
        }

        if (afterRender) {
            setTimeout(afterRender, 50);
        }
    },

    renderContent() {
        // Re-render just the content area without full page rebuild
        const page = Router.getPage();
        const contentEl = document.getElementById('page-content');
        if (!contentEl) { this.render(); return; }

        // Save scroll position for the table container (if any) or content area
        const tableScroll = contentEl.querySelector('.table-scroll');
        const savedScroll = tableScroll ? tableScroll.scrollTop : contentEl.scrollTop;

        switch (page) {
            case 'dashboard': contentEl.innerHTML = DashboardPage.render(); break;
            case 'raw': contentEl.innerHTML = RawMaterialsPage.render(); break;
            case 'packaging': contentEl.innerHTML = PackagingMaterialsPage.render(); break;
            case 'finished': contentEl.innerHTML = FinishedProductsPage.render(); break;
            case 'products': contentEl.innerHTML = ProductManagementPage.render(); break;
            case 'users': contentEl.innerHTML = UserManagementPage.render(); break;
            case 'audit': contentEl.innerHTML = AuditTrailPage.render(); break;
            case 'yearly-raw':
            case 'yearly-packaging':
            case 'yearly-finished':
                contentEl.innerHTML = YearlyReportPage.render();
                break;
        }

        // Restore scroll position
        requestAnimationFrame(() => {
            const newTableScroll = contentEl.querySelector('.table-scroll');
            if (newTableScroll) {
                newTableScroll.scrollTop = savedScroll;
            } else {
                contentEl.scrollTop = savedScroll;
            }
        });
    },

    toggleSidebar(forceClose) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        if (!sidebar) return;

        if (forceClose === false || sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            if (overlay) overlay.classList.remove('show');
        } else {
            sidebar.classList.add('open');
            if (overlay) overlay.classList.add('show');
        }
    },

    logout() {
        api.logout();
        // Reset all page states
        RawMaterialsPage.rows = [];
        RawMaterialsPage.selectedIdx = -1;
        PackagingMaterialsPage.rows = [];
        PackagingMaterialsPage.selectedIdx = -1;
        FinishedProductsPage.rows = [];
        FinishedProductsPage.selectedIdx = -1;
        ProductManagementPage.rows = [];
        UserManagementPage.rows = [];
        AuditTrailPage.rows = [];
        YearlyReportPage.rows = [];
        DashboardPage.data = { raw: 0, packaging: 0, finished: 0, users: 0 };

        Router.navigate('login');
    },

    formatDateInput(val) {
        if (!val) return '';
        const s = String(val).trim().slice(0, 10);
        // If the date is DD-MM-YYYY, convert to YYYY-MM-DD for HTML5 date input
        if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
            const p = s.split('-');
            return `${p[2]}-${p[1]}-${p[0]}`;
        }
        return s;
    },

    formatDateTime(val) {
        if (!val) return '';
        const d = new Date(val);
        if (isNaN(d.getTime())) return String(val).replace('T', ' ').substring(0, 19);
        
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const strTime = String(hours).padStart(2, '0') + ':' + minutes + ' ' + ampm;
        
        return `${day}-${month}-${year} <span style="color:#6b7280; font-size:0.9em; margin-left:4px;">${strTime}</span>`;
    },

    toast(message, type = 'info') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle',
                        warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
