// ──────────────────────────────────────────────
//  Dashboard Page
// ──────────────────────────────────────────────

const DashboardPage = {
    data: { raw: 0, packaging: 0, finished: 0, users: 0 },

    render() {
        return `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon blue"><i class="fas fa-flask"></i></div>
                <div class="stat-info">
                    <div class="stat-value" id="stat-raw">—</div>
                    <div class="stat-label">Raw Materials</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><i class="fas fa-box"></i></div>
                <div class="stat-info">
                    <div class="stat-value" id="stat-pkg">—</div>
                    <div class="stat-label">Packaging Materials</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple"><i class="fas fa-check-circle"></i></div>
                <div class="stat-info">
                    <div class="stat-value" id="stat-fin">—</div>
                    <div class="stat-label">Finished Products</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange"><i class="fas fa-users"></i></div>
                <div class="stat-info">
                    <div class="stat-value" id="stat-users">—</div>
                    <div class="stat-label">Total Users</div>
                </div>
            </div>
        </div>

        <div class="table-container" style="padding:24px">
            <h3 style="margin-bottom:16px;color:var(--text-primary)">
                <i class="fas fa-wave-square" style="color:var(--primary)"></i>&nbsp; Welcome Back
            </h3>
            <p style="color:var(--text-secondary);line-height:1.7">
                Use the sidebar navigation to manage your quality control data.
                This system supports <strong>Raw Materials</strong>, <strong>Packaging Materials</strong>,
                and <strong>Finished Products</strong> with full CRUD operations,
                search capabilities, and audit trail tracking.
            </p>
        </div>`;
    },

    async afterRender() {
        try {
            const [raw, pkg, fin] = await Promise.allSettled([
                api.getRawMaterials(0, 1),
                api.getPackagingMaterials(0, 1),
                api.getFinishedProducts(0, 1),
            ]);

            if (raw.status === 'fulfilled') {
                document.getElementById('stat-raw').textContent = raw.value.total || 0;
            }
            if (pkg.status === 'fulfilled') {
                document.getElementById('stat-pkg').textContent = pkg.value.total || 0;
            }
            if (fin.status === 'fulfilled') {
                document.getElementById('stat-fin').textContent = fin.value.total || 0;
            }

            try {
                const users = await api.getUsers();
                document.getElementById('stat-users').textContent = (users.results || []).length;
            } catch(e) {
                document.getElementById('stat-users').textContent = '—';
            }
        } catch (e) {
            console.error('Dashboard load error:', e);
        }
    }
};
