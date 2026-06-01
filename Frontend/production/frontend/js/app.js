// ──────────────────────────────────────────────
//  Main App Controller
// ──────────────────────────────────────────────

const App = {
    init() {
        Router.init();
        this.render();
    },

    render() {
        // Pages that do NOT show sidebar/topbar
        const fullPageOnly = ['login', 'welcome'];
        const page = Router.getPage();

        // If not logged in, force login
        if (!api.isLoggedIn() && page !== 'login') {
            Router.navigate('login');
            return;
        }
        if (api.isLoggedIn() && page === 'login') {
            Router.navigate('production-dashboard');
            return;
        }

        // Role-based dashboard redirect guard
        if (api.isLoggedIn()) {
            const _u = api.getUser();
            const _roles = _u?.roles || [];
            const _isProductionOnly = _roles.length > 0 &&
                !_roles.some(r => r === 'superadmin' || r === 'Manager' || r === 'QC Checker' ||
                    ['Data Entry (RM)', 'Data Entry (PM)', 'Data Entry (FP)',
                        'Analyst (RM)', 'Analyst (PM)', 'Analyst (FP Micro)', 'Analyst (FP Chemical)',
                        'Section Head (RM)', 'Section Head (PM)', 'Section Head (FP Micro)', 'Section Head (FP Chemical)'
                    ].includes(r)) &&
                _roles.some(r => r.startsWith('Production') || r === 'Production Manager' || r === 'Production Checker');

            // Production-only users must NOT access QC dashboard
            if (_isProductionOnly && page === 'dashboard') {
                Router.navigate('production-dashboard');
                return;
            }
            // QC users must NOT access production-dashboard directly
            if (!_isProductionOnly && page === 'production-dashboard' && !_roles.includes('superadmin')) {
                Router.navigate('dashboard');
                return;
            }
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
            welcome: 'Welcome',
            dashboard: 'Dashboard',
            'production-dashboard': 'Production Dashboard',
            raw: 'Raw Materials',
            packaging: 'Packaging Materials',
            finished: 'Finished Products',
            products: 'Material Management',
            users: 'Users Management',
            audit: 'System Audit',
            production: 'Production Audit',
            'yearly-raw': 'Yearly Report — Raw Materials',
            'yearly-packaging': 'Yearly Report — Packaging Materials',
            'yearly-finished': 'Yearly Report — Finished Products',
            'production-history': 'Production Log History',
            'production-export': 'Production Log Export',
        };

        const title = pageTitles[page] || 'Dashboard';
        //////////
        // Determine page content
        let contentHTML = '';
        let afterRender = null;

        switch (page) {
            case 'welcome':
                contentHTML = WelcomePage.render();
                afterRender = () => WelcomePage.afterRender?.();
                break;
            case 'login':
                contentHTML = LoginPage.render();
                afterRender = () => LoginPage.afterRender?.();
                break;
            case 'production-dashboard':
                contentHTML = ProductionDashboardPage.render();
                afterRender = () => ProductionDashboardPage.afterRender?.();
                break;
            case 'dashboard':
                contentHTML = DashboardPage.render();
                afterRender = () => DashboardPage.afterRender?.();
                break;
            case 'raw':
                contentHTML = RawMaterialsPage.render();
                afterRender = () => RawMaterialsPage.afterRender?.();
                break;
            case 'packaging':
                contentHTML = PackagingMaterialsPage.render();
                afterRender = () => PackagingMaterialsPage.afterRender?.();
                break;
            case 'finished':
                contentHTML = FinishedProductsPage.render();
                afterRender = () => FinishedProductsPage.afterRender?.();
                break;
            case 'products':
                contentHTML = ProductManagementPage.render();
                afterRender = () => ProductManagementPage.afterRender?.();
                break;
            case 'users':
                contentHTML = UserManagementPage.render();
                afterRender = () => UserManagementPage.afterRender?.();
                break;
            case 'audit':
                contentHTML = AuditTrailPage.render();
                afterRender = () => AuditTrailPage.afterRender?.();
                break;
            case 'production':
                contentHTML = ProductionAuditPage.render();
                afterRender = () => ProductionAuditPage.afterRender?.();
                break;
            case 'production-history':
                contentHTML = ProductionAuditLogHistoryPage.render();
                afterRender = () => ProductionAuditLogHistoryPage.afterRender?.();
                break;
            case 'production-export':
                contentHTML = ProductionExportPage.render();
                afterRender = () => ProductionExportPage.afterRender?.();
                break;
            case 'production-products':
                contentHTML = ProductionProductsPage.render();
                afterRender = () => ProductionProductsPage.afterRender?.();
                break;
            case 'yearly-raw':
                YearlyReportPage.setCategory('raw');
                contentHTML = YearlyReportPage.render();
                afterRender = () => YearlyReportPage.afterRender?.();
                break;
            case 'yearly-packaging':
                YearlyReportPage.setCategory('packaging');
                contentHTML = YearlyReportPage.render();
                afterRender = () => YearlyReportPage.afterRender?.();
                break;
            case 'yearly-finished':
                YearlyReportPage.setCategory('finished');
                contentHTML = YearlyReportPage.render();
                afterRender = () => YearlyReportPage.afterRender?.();
                break;
            default:
                contentHTML = DashboardPage.render();
                afterRender = () => DashboardPage.afterRender?.();
        }

        // Render differently if full-page only
        if (fullPageOnly.includes(page)) {
            app.innerHTML = contentHTML; // no sidebar or topbar
        } else {
            const title = pageTitles[page] || 'Dashboard';
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
        }
        /////////
        // let contentHTML = '';
        // let afterRender = null;

        // switch (page) {
        //     case 'welcome':
        //         contentHTML = WelcomePage.render();
        //         afterRender = () => WelcomePage.afterRender();
        //         break;
        //     case 'dashboard':
        //         contentHTML = DashboardPage.render();
        //         afterRender = () => DashboardPage.afterRender();
        //         break;
        //     case 'raw':
        //         contentHTML = RawMaterialsPage.render();
        //         afterRender = () => RawMaterialsPage.afterRender();
        //         break;
        //     case 'packaging':
        //         contentHTML = PackagingMaterialsPage.render();
        //         afterRender = () => PackagingMaterialsPage.afterRender();
        //         break;
        //     case 'finished':
        //         contentHTML = FinishedProductsPage.render();
        //         afterRender = () => FinishedProductsPage.afterRender();
        //         break;
        //     case 'products':
        //         contentHTML = ProductManagementPage.render();
        //         afterRender = () => ProductManagementPage.afterRender();
        //         break;
        //     case 'users':
        //         contentHTML = UserManagementPage.render();
        //         afterRender = () => UserManagementPage.afterRender();
        //         break;
        //     case 'audit':
        //         contentHTML = AuditTrailPage.render();
        //         afterRender = () => AuditTrailPage.afterRender();
        //         break;
        //     case 'production':
        //         contentHTML = ProductionAuditPage.render();
        //         afterRender = () => ProductionAuditPage.afterRender();
        //         break;
        //     case 'production-history':
        //         contentHTML = ProductionAuditLogHistoryPage.render();
        //         afterRender = () => ProductionAuditLogHistoryPage.afterRender();
        //         break;
        //     case 'production-export':
        //         contentHTML = ProductionExportPage.render();
        //         afterRender = () => ProductionExportPage.afterRender();
        //         break;
        //     case 'production-products':
        //         contentHTML = ProductionProductsPage.render();
        //         afterRender = () => ProductionProductsPage.afterRender();
        //         break;
        //     case 'yearly-raw':
        //         YearlyReportPage.setCategory('raw');
        //         contentHTML = YearlyReportPage.render();
        //         afterRender = () => YearlyReportPage.afterRender();
        //         break;
        //     case 'yearly-packaging':
        //         YearlyReportPage.setCategory('packaging');
        //         contentHTML = YearlyReportPage.render();
        //         afterRender = () => YearlyReportPage.afterRender();
        //         break;
        //     case 'yearly-finished':
        //         YearlyReportPage.setCategory('finished');
        //         contentHTML = YearlyReportPage.render();
        //         afterRender = () => YearlyReportPage.afterRender();
        //         break;
        //     default:
        //         contentHTML = DashboardPage.render();
        //         afterRender = () => DashboardPage.afterRender();
        // }

        // app.innerHTML = `
        //     ${renderSidebar(page)}
        //     <div class="content-area">
        //         <div class="topbar">
        //             <div class="topbar-left">
        //                 <button class="menu-toggle" onclick="App.toggleSidebar()">
        //                     <i class="fas fa-bars"></i>
        //                 </button>
        //                 <h1 class="page-title">${title}</h1>
        //             </div>
        //             <div>
        //                 <button class="btn btn-secondary btn-sm" onclick="App.logout()"
        //                         style="display:none" id="topbar-logout">
        //                     <i class="fas fa-sign-out-alt"></i>
        //                 </button>
        //             </div>
        //         </div>
        //         <div class="page-content" id="page-content">
        //             ${contentHTML}
        //         </div>
        //     </div>
        // `;

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

        switch (page) {
            case 'welcome': contentEl.innerHTML = WelcomePage.render(); break;
            case 'dashboard': contentEl.innerHTML = DashboardPage.render(); break;
            case 'production-dashboard': contentEl.innerHTML = ProductionDashboardPage.render(); break;
            case 'raw': contentEl.innerHTML = RawMaterialsPage.render(); break;
            case 'packaging': contentEl.innerHTML = PackagingMaterialsPage.render(); break;
            case 'finished': contentEl.innerHTML = FinishedProductsPage.render(); break;
            case 'products': contentEl.innerHTML = ProductManagementPage.render(); break;
            case 'users': contentEl.innerHTML = UserManagementPage.render(); break;
            case 'audit': contentEl.innerHTML = AuditTrailPage.render(); break;
            case 'production': contentEl.innerHTML = ProductionAuditPage.render(); break;
            case 'production-history': contentEl.innerHTML = ProductionAuditLogHistoryPage.render(); break;
            case 'production-export': contentEl.innerHTML = ProductionExportPage.render(); break;
            case 'production-products': contentEl.innerHTML = ProductionProductsPage.render(); break;
            case 'yearly-raw':
            case 'yearly-packaging':
            case 'yearly-finished':
                contentEl.innerHTML = YearlyReportPage.render();
                break;
        }
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
        window.location.hash = 'login';
        window.location.reload();
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

        const icons = {
            success: 'fa-check-circle', error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle', info: 'fa-info-circle'
        };

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
