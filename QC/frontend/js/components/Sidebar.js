// ──────────────────────────────────────────────
//  Sidebar Component
// ──────────────────────────────────────────────

function renderSidebar(activePage) {
    const user = api.getUser();
    if (!user) return '';
    const roles = user.roles || [];

    const hasRole = (...targets) => targets.some(t => roles.includes(t));
    const roleStartsWith = (...prefixes) => roles.some(r => prefixes.some(p => r.startsWith(p)));

    const showRaw = roleStartsWith('Data Entry (RM)', 'Analyst (RM)', 'Section Head (RM)', 'Analyst (FP Micro)', 'Section Head (FP Micro)') || hasRole('Manager', 'Superuser');
    const showPkg = roleStartsWith('Data Entry (PM)', 'Analyst (PM)', 'Section Head (PM)', 'Analyst (FP Micro)', 'Section Head (FP Micro)') || hasRole('Manager', 'Superuser');
    const showFin = roleStartsWith('Data Entry (FP)', 'Analyst (FP', 'Section Head (FP') || hasRole('Manager', 'Superuser');
    const showAudit = hasRole('Manager', 'Superuser');
    const showMM = true; // all data-entry/analyst roles
    const showUsers = hasRole('Manager', 'Superuser');

    return `
    <div class="sidebar-overlay" onclick="App.toggleSidebar(false)"></div>
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <div class="sidebar-logo">QC</div>
            <div class="sidebar-brand">
                Smart Log
                <small>Management Console</small>
            </div>
        </div>

        <nav class="sidebar-nav">
            <div class="nav-section">
                <div class="nav-item ${activePage === 'dashboard' ? 'active' : ''}"
                     onclick="Router.navigate('dashboard')">
                    <i class="fas fa-chart-pie"></i> Dashboard
                </div>
            </div>

            <div class="nav-section">
                <div class="nav-section-title">Materials</div>

                <div class="nav-group-header ${['raw', 'packaging', 'finished'].includes(activePage) ? 'expanded' : ''}"
                     onclick="this.classList.toggle('expanded'); this.nextElementSibling.classList.toggle('show')">
                    <span><i class="fas fa-boxes-stacked"></i>&nbsp; Materials</span>
                    <i class="fas fa-chevron-right chevron"></i>
                </div>
                <div class="nav-group-children ${['raw', 'packaging', 'finished'].includes(activePage) ? 'show' : ''}">
                    ${showRaw ? `<div class="nav-item ${activePage === 'raw' ? 'active' : ''}"
                         onclick="Router.navigate('raw')">
                        <i class="fas fa-flask"></i> Raw Materials
                    </div>` : ''}
                    ${showPkg ? `<div class="nav-item ${activePage === 'packaging' ? 'active' : ''}"
                         onclick="Router.navigate('packaging')">
                        <i class="fas fa-box"></i> Packaging Materials
                    </div>` : ''}
                    ${showFin ? `<div class="nav-item ${activePage === 'finished' ? 'active' : ''}"
                         onclick="Router.navigate('finished')">
                        <i class="fas fa-check-circle"></i> Finished Products
                    </div>` : ''}
                </div>
            </div>

            ${showAudit ? `
            <div class="nav-section">
                <div class="nav-item ${activePage === 'audit' ? 'active' : ''}"
                     onclick="Router.navigate('audit')">
                    <i class="fas fa-clipboard-list"></i> Audit Trail
                </div>
            </div>` : ''}

            ${showMM ? `
            <div class="nav-section">
                <div class="nav-item ${activePage === 'products' ? 'active' : ''}"
                     onclick="Router.navigate('products')">
                    <i class="fas fa-cubes"></i> Material Management
                </div>
            </div>` : ''}

            ${showUsers ? `
            <div class="nav-section">
                <div class="nav-item ${activePage === 'users' ? 'active' : ''}"
                     onclick="Router.navigate('users')">
                    <i class="fas fa-users-cog"></i> Users Management
                </div>
            </div>` : ''}

            <div class="nav-section">
                <div class="nav-section-title">Reports & Tools</div>
                <div class="nav-item ${activePage === 'export' ? 'active' : ''}"
                     onclick="Router.navigate('export')">
                    <i class="fas fa-file-export"></i>&nbsp; Export Data
                </div>
                ${(showRaw || showPkg || showFin) ? `
                <div class="nav-group-header ${activePage.startsWith('yearly') ? 'expanded' : ''}"
                     onclick="this.classList.toggle('expanded'); this.nextElementSibling.classList.toggle('show')">
                    <span><i class="fas fa-calendar-alt"></i>&nbsp; Previous Years</span>
                    <i class="fas fa-chevron-right chevron"></i>
                </div>
                <div class="nav-group-children ${activePage.startsWith('yearly') ? 'show' : ''}">
                    ${showRaw ? `<div class="nav-item ${activePage === 'yearly-raw' ? 'active' : ''}"
                         onclick="Router.navigate('yearly-raw')">
                        <i class="fas fa-file-alt"></i> Raw Materials
                    </div>` : ''}
                    ${showPkg ? `<div class="nav-item ${activePage === 'yearly-packaging' ? 'active' : ''}"
                         onclick="Router.navigate('yearly-packaging')">
                        <i class="fas fa-file-alt"></i> Packaging Materials
                    </div>` : ''}
                    ${showFin ? `<div class="nav-item ${activePage === 'yearly-finished' ? 'active' : ''}"
                         onclick="Router.navigate('yearly-finished')">
                        <i class="fas fa-file-alt"></i> Finished Products
                    </div>` : ''}
                </div>
                ` : ''}
            </div>
        </nav>

        <div class="sidebar-footer">
            <div class="user-info">
                <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
                <div>
                    <div class="user-name">${user.username}</div>
                    <div class="user-role">${roles[0] || 'User'}</div>
                </div>
            </div>
            <button class="btn btn-secondary btn-sm" style="width:100%" onclick="App.logout()">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        </div>
    </aside>`;
}
