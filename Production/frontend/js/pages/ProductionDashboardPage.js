// ──────────────────────────────────────────────
//  Production Dashboard Page
// ──────────────────────────────────────────────

const ProductionDashboardPage = {

    render() {
        const user = api.getUser();
        const roles = user?.roles || [];
        const hasRole = (...t) => t.some(r => roles.includes(r));
        const roleStartsWith = (...p) => roles.some(r => p.some(px => r.startsWith(px)));

        const isSuperAdmin  = hasRole('superadmin');
        const isManager     = hasRole('Production Manager') || isSuperAdmin;
        const isChecker     = hasRole('Production Checker');
        const showProducts  = !isChecker && (isManager || roleStartsWith('Production'));
        const showHistory   = !isChecker && (isManager || roleStartsWith('Production'));
        const showExport    = showHistory;
        const showUsers     = isManager;

        return `
        <div class="prod-dash-header">
            <div>
                <h2 class="prod-dash-title">
                    <i class="fas fa-industry"></i> Production Dashboard
                </h2>
                <p class="prod-dash-subtitle">Overview of your production system</p>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="Router.navigate('welcome')">
                <i class="fas fa-th-large"></i> Switch System
            </button>
        </div>

        <!-- Stats -->
        <div class="stats-grid" style="margin-bottom:28px">
            <div class="stat-card">
                <div class="stat-icon" style="background:rgba(67,233,123,0.12);color:#43e97b">
                    <i class="fas fa-boxes-stacked"></i>
                </div>
                <div class="stat-info">
                    <div class="stat-value" id="pstat-products">—</div>
                    <div class="stat-label">Production Products</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:rgba(56,249,215,0.12);color:#38f9d7">
                    <i class="fas fa-users-cog"></i>
                </div>
                <div class="stat-info">
                    <div class="stat-value" id="pstat-users">—</div>
                    <div class="stat-label">Production Users</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background:rgba(79,172,254,0.12);color:#4facfe">
                    <i class="fas fa-edit"></i>
                </div>
                <div class="stat-info">
                    <div class="stat-value" id="pstat-logbooks">—</div>
                    <div class="stat-label">Logbook Entries</div>
                </div>
            </div>
        </div>

        <!-- Quick Access Cards -->
        <div class="prod-dash-section-title">Quick Access</div>
        <div class="prod-quick-grid">

            <div class="prod-quick-card" onclick="Router.navigate('production')">
                <div class="prod-quick-icon" style="background:rgba(79,172,254,0.15);color:#4facfe">
                    <i class="fas fa-book-open"></i>
                </div>
                <div class="prod-quick-info">
                    <div class="prod-quick-name">Logbooks</div>
                    <div class="prod-quick-desc">View &amp; manage cleaning and operation logs</div>
                </div>
                <i class="fas fa-chevron-right prod-quick-arrow"></i>
            </div>

            ${showProducts ? `
            <div class="prod-quick-card" onclick="Router.navigate('production-products')">
                <div class="prod-quick-icon" style="background:rgba(67,233,123,0.15);color:#43e97b">
                    <i class="fas fa-boxes-stacked"></i>
                </div>
                <div class="prod-quick-info">
                    <div class="prod-quick-name">Products</div>
                    <div class="prod-quick-desc">Manage the production product catalogue</div>
                </div>
                <i class="fas fa-chevron-right prod-quick-arrow"></i>
            </div>` : ''}

            ${showHistory ? `
            <div class="prod-quick-card" onclick="Router.navigate('production-history')">
                <div class="prod-quick-icon" style="background:rgba(155,89,182,0.15);color:#a855f7">
                    <i class="fas fa-history"></i>
                </div>
                <div class="prod-quick-info">
                    <div class="prod-quick-name">Audit Trail</div>
                    <div class="prod-quick-desc">Review the complete production audit history</div>
                </div>
                <i class="fas fa-chevron-right prod-quick-arrow"></i>
            </div>` : ''}

            ${showExport ? `
            <div class="prod-quick-card" onclick="Router.navigate('production-export')">
                <div class="prod-quick-icon" style="background:rgba(243,156,18,0.15);color:#f59e0b">
                    <i class="fas fa-file-pdf"></i>
                </div>
                <div class="prod-quick-info">
                    <div class="prod-quick-name">Reports</div>
                    <div class="prod-quick-desc">Export and download production reports</div>
                </div>
                <i class="fas fa-chevron-right prod-quick-arrow"></i>
            </div>` : ''}

            ${showUsers ? `
            <div class="prod-quick-card" onclick="Router.navigate('users')">
                <div class="prod-quick-icon" style="background:rgba(52,152,219,0.15);color:#3498db">
                    <i class="fas fa-users-cog"></i>
                </div>
                <div class="prod-quick-info">
                    <div class="prod-quick-name">Users Management</div>
                    <div class="prod-quick-desc">Add, remove or manage system users</div>
                </div>
                <i class="fas fa-chevron-right prod-quick-arrow"></i>
            </div>` : ''}

        </div>`;
    },

    async afterRender() {
        try {
            // Load production products count
            const products = await api.getProductionProducts('');
            const pEl = document.getElementById('pstat-products');
            if (pEl) pEl.textContent = (products.results || products).length ?? '—';
        } catch (e) {
            const pEl = document.getElementById('pstat-products');
            if (pEl) pEl.textContent = '—';
        }

        try {
            // Load users and filter to production-only
            const users = await api.getUsers();
            const all = users.results || [];
            const productionUsers = all.filter(u => {
                const roles = u.Roles || u.roles || u.Role || '';
                const rolesStr = Array.isArray(roles) ? roles.join(',') : String(roles);
                return rolesStr.includes('Production') || rolesStr.includes('production');
            });
            const uEl = document.getElementById('pstat-users');
            if (uEl) uEl.textContent = productionUsers.length;
        } catch (e) {
            const uEl = document.getElementById('pstat-users');
            if (uEl) uEl.textContent = '—';
        }

        try {
            // Count logbook entries (cleaning + operation)
            const [cleaning, operation] = await Promise.allSettled([
                api.getCleaningLogbooks(),
                api.getOperationLogbooks()
            ]);
            let total = 0;
            if (cleaning.status === 'fulfilled') {
                const r = cleaning.value;
                total += (r.results || r).length ?? 0;
            }
            if (operation.status === 'fulfilled') {
                const r = operation.value;
                total += (r.results || r).length ?? 0;
            }
            const lEl = document.getElementById('pstat-logbooks');
            if (lEl) lEl.textContent = total;
        } catch (e) {
            const lEl = document.getElementById('pstat-logbooks');
            if (lEl) lEl.textContent = '—';
        }
    }
};
