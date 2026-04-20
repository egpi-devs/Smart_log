// ──────────────────────────────────────────────
//  Sidebar Component
// ──────────────────────────────────────────────

function renderSidebar(activePage) {
    const user = api.getUser();
    if (!user) return '';
    const roles = user.roles || [];

    const hasRole = (...targets) => targets.some(t => roles.includes(t));
    const roleStartsWith = (...prefixes) => roles.some(r => prefixes.some(p => r.startsWith(p)));

    // ✅ FIXED: define FIRST
    const isProductionOrSuperadmin = roleStartsWith('Production') || hasRole('superadmin');
    const showMM = !isProductionOrSuperadmin;

    const showRaw = roleStartsWith('Data Entry (RM)', 'Analyst (RM)', 'Section Head (RM)') || hasRole('Manager');
    const showPkg = roleStartsWith('Data Entry (PM)', 'Analyst (PM)', 'Section Head (PM)') || hasRole('Manager');
    const showFin = roleStartsWith('Data Entry (FP)', 'Analyst (FP', 'Section Head (FP') || hasRole('Manager');
    const showAudit = hasRole('Manager');
    // const showAudit = hasRole('Manager', 'Production Manager');
    const showProductionAudit = hasRole('superadmin', 'QC Checker', 'Production Manager', 'Production Checker') || roleStartsWith('Production');
    const showUsers = hasRole('Manager', 'Production Manager');
    // Items within the Production section
    const isProductionChecker = hasRole('Production Checker');
    const showProductionProductsItem = showProductionAudit && !isProductionChecker && !hasRole('QC Checker');
    const showProductionHistoryItems  = showProductionAudit && !isProductionChecker;

    // Determine the correct "home" dashboard for this user
    const isProductionOnly = roles.length > 0 &&
        !roles.some(r => r === 'superadmin' || r === 'Manager' || r === 'QC Checker' ||
            ['Data Entry (RM)', 'Data Entry (PM)', 'Data Entry (FP)',
             'Analyst (RM)', 'Analyst (PM)', 'Analyst (FP Micro)', 'Analyst (FP Chemical)',
             'Section Head (RM)', 'Section Head (PM)', 'Section Head (FP Micro)', 'Section Head (FP Chemical)'
            ].includes(r)) &&
        roles.some(r => r.startsWith('Production') || r === 'Production Manager' || r === 'Production Checker');

    const homePage = isProductionOnly ? 'production-dashboard' : 'dashboard';
    const homeActive = activePage === 'dashboard' || activePage === 'production-dashboard';

    return `
    <div class="sidebar-overlay" onclick="App.toggleSidebar(false)"></div>
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <div class="sidebar-logo">PR</div>
            <div class="sidebar-brand">
                SmartLog
                <small>Management Console</small>
            </div>
        </div>

        <nav class="sidebar-nav">

            <!-- Dashboard -->
            <div class="nav-section">
                <div class="nav-item ${homeActive ? 'active' : ''}"
                     onclick="Router.navigate('${homePage}')">
                    <i class="fas fa-chart-pie"></i> Dashboard
                </div>
            </div>

            <!-- Materials (HIDDEN for Production & superadmin) -->
            ${!isProductionOrSuperadmin ? `
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
            ` : ''}

            <!-- System Audit -->
            ${showAudit ? `
            <div class="nav-section">
                <div class="nav-item ${activePage === 'audit' ? 'active' : ''}"
                     onclick="Router.navigate('audit')">
                    <i class="fas fa-clipboard-list"></i> System Audit
                </div>
            </div>
            ` : ''}

            ${showProductionAudit ? `
            <div class="nav-section">
                <div class="nav-section-title">Production</div>

                ${showProductionProductsItem ? `
                <div class="nav-item ${activePage === 'production-products' ? 'active' : ''}"
                     onclick="Router.navigate('production-products')">
                    <i class="fas fa-boxes-stacked"></i> Products
                </div>
                ` : ''}

                <div class="nav-group-header ${['production', 'production-history', 'production-export'].includes(activePage) ? 'expanded' : ''}"
                     onclick="this.classList.toggle('expanded'); this.nextElementSibling.classList.toggle('show')">
                    <span><i class="fas fa-industry"></i>&nbsp; Production</span>
                    <i class="fas fa-chevron-right chevron"></i>
                </div>

                <div class="nav-group-children ${['production', 'production-history', 'production-export'].includes(activePage) ? 'show' : ''}">
                    <div class="nav-item ${activePage === 'production' ? 'active' : ''}"
                         onclick="Router.navigate('production')">
                        <i class="fas fa-edit"></i> Logbooks
                    </div>

                    ${showProductionHistoryItems ? `
                    <div class="nav-item ${activePage === 'production-history' ? 'active' : ''}"
                         onclick="Router.navigate('production-history')">
                        <i class="fas fa-history"></i> Audit Trail
                    </div>

                    <div class="nav-item ${activePage === 'production-export' ? 'active' : ''}"
                         onclick="Router.navigate('production-export')">
                        <i class="fas fa-file-pdf"></i> Reports
                    </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}

            <!-- Material Management -->
            ${showMM ? `
            <div class="nav-section">
                <div class="nav-item ${activePage === 'products' ? 'active' : ''}"
                     onclick="Router.navigate('products')">
                    <i class="fas fa-cubes"></i> Material Management
                </div>
            </div>
            ` : ''}

            <!-- Users -->
            ${showUsers ? `
            <div class="nav-section">
                <div class="nav-item ${activePage === 'users' ? 'active' : ''}"
                     onclick="Router.navigate('users')">
                    <i class="fas fa-users-cog"></i> Users Management
                </div>
            </div>
            ` : ''}

            <!-- Previous Year Reports (HIDDEN for Production & superadmin) -->
            ${!isProductionOrSuperadmin ? `
            <div class="nav-section">
                <div class="nav-section-title">Reports</div>

                <div class="nav-group-header ${activePage.startsWith('yearly') ? 'expanded' : ''}"
                     onclick="this.classList.toggle('expanded'); this.nextElementSibling.classList.toggle('show')">
                    <span><i class="fas fa-calendar-alt"></i>&nbsp; Previous Year</span>
                    <i class="fas fa-chevron-right chevron"></i>
                </div>

                <div class="nav-group-children ${activePage.startsWith('yearly') ? 'show' : ''}">
                    ${showRaw ? `<div class="nav-item ${activePage === 'yearly-raw' ? 'active' : ''}"
                         onclick="Router.navigate('yearly-raw')">
                        <i class="fas fa-file-alt"></i> Raw Yearly Report
                    </div>` : ''}

                    ${showPkg ? `<div class="nav-item ${activePage === 'yearly-packaging' ? 'active' : ''}"
                         onclick="Router.navigate('yearly-packaging')">
                        <i class="fas fa-file-alt"></i> Packaging Yearly Report
                    </div>` : ''}

                    ${showFin ? `<div class="nav-item ${activePage === 'yearly-finished' ? 'active' : ''}"
                         onclick="Router.navigate('yearly-finished')">
                        <i class="fas fa-file-alt"></i> Finished Yearly Report
                    </div>` : ''}
                </div>
            </div>
            ` : ''}

        </nav>

        <!-- Footer -->
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
// ──────────────────────────────────────────────
//  Sidebar Component
// ──────────────────────────────────────────────

// function renderSidebar(activePage) {
//     const user = api.getUser();
//     if (!user) return '';
//     const roles = user.roles || [];

//     const hasRole = (...targets) => targets.some(t => roles.includes(t));
//     const roleStartsWith = (...prefixes) => roles.some(r => prefixes.some(p => r.startsWith(p)));

//     const showRaw = roleStartsWith('Data Entry (RM)', 'Analyst (RM)', 'Section Head (RM)') || hasRole('Manager');
//     const showPkg = roleStartsWith('Data Entry (PM)', 'Analyst (PM)', 'Section Head (PM)') || hasRole('Manager');
//     const showFin = roleStartsWith('Data Entry (FP)', 'Analyst (FP', 'Section Head (FP') || hasRole('Manager');
//     const showAudit = hasRole('Manager');
//     const showProductionAudit = hasRole('Manager', 'superadmin', 'QC Checker') || roleStartsWith('Production');
//     const isProductionOnly = !hasRole('Manager', 'superadmin', 'QC Checker') && roleStartsWith('Production');
//     const showMM = !isProductionOnly; 
//     const showUsers = hasRole('Manager');

//     return `
//     <div class="sidebar-overlay" onclick="App.toggleSidebar(false)"></div>
//     <aside class="sidebar" id="sidebar">
//         <div class="sidebar-header">
//             <div class="sidebar-logo">QC</div>
//             <div class="sidebar-brand">
//                 QC System
//                 <small>Management Console</small>
//             </div>
//         </div>

//         <nav class="sidebar-nav">
//             <div class="nav-section">
//                 <div class="nav-item ${activePage === 'dashboard' ? 'active' : ''}"
//                      onclick="Router.navigate('dashboard')">
//                     <i class="fas fa-chart-pie"></i> Dashboard
//                 </div>
//             </div>

//             <div class="nav-section">
//                 <div class="nav-section-title">Materials</div>

//                 <div class="nav-group-header ${['raw', 'packaging', 'finished'].includes(activePage) ? 'expanded' : ''}"
//                      onclick="this.classList.toggle('expanded'); this.nextElementSibling.classList.toggle('show')">
//                     <span><i class="fas fa-boxes-stacked"></i>&nbsp; Materials</span>
//                     <i class="fas fa-chevron-right chevron"></i>
//                 </div>
//                 <div class="nav-group-children ${['raw', 'packaging', 'finished'].includes(activePage) ? 'show' : ''}">
//                     ${showRaw ? `<div class="nav-item ${activePage === 'raw' ? 'active' : ''}"
//                          onclick="Router.navigate('raw')">
//                         <i class="fas fa-flask"></i> Raw Materials
//                     </div>` : ''}
//                     ${showPkg ? `<div class="nav-item ${activePage === 'packaging' ? 'active' : ''}"
//                          onclick="Router.navigate('packaging')">
//                         <i class="fas fa-box"></i> Packaging Materials
//                     </div>` : ''}
//                     ${showFin ? `<div class="nav-item ${activePage === 'finished' ? 'active' : ''}"
//                          onclick="Router.navigate('finished')">
//                         <i class="fas fa-check-circle"></i> Finished Products
//                     </div>` : ''}
//                 </div>
//             </div>

//             ${showAudit ? `
//             <div class="nav-section">
//                 <div class="nav-item ${activePage === 'audit' ? 'active' : ''}"
//                      onclick="Router.navigate('audit')">
//                     <i class="fas fa-clipboard-list"></i> System Audit
//                 </div>
//             </div>` : ''}

//             ${showProductionAudit ? `
//             <div class="nav-section">
//                 <div class="nav-section-title">Production</div>
                
//                 <div class="nav-item ${activePage === 'production-products' ? 'active' : ''}"
//                      onclick="Router.navigate('production-products')">
//                     <i class="fas fa-boxes-stacked"></i> Products
//                 </div>

//                 <div class="nav-group-header ${['production', 'production-history', 'production-export'].includes(activePage) ? 'expanded' : ''}"
//                      onclick="this.classList.toggle('expanded'); this.nextElementSibling.classList.toggle('show')">
//                     <span><i class="fas fa-industry"></i>&nbsp; Production </span>
//                     <i class="fas fa-chevron-right chevron"></i>
//                 </div>
//                 <div class="nav-group-children ${['production', 'production-history', 'production-export'].includes(activePage) ? 'show' : ''}">
//                     <div class="nav-item ${activePage === 'production' ? 'active' : ''}"
//                          onclick="Router.navigate('production')">
//                         <i class="fas fa-edit"></i> Logbooks
//                     </div>
//                     <div class="nav-item ${activePage === 'production-history' ? 'active' : ''}"
//                          onclick="Router.navigate('production-history')">
//                         <i class="fas fa-history"></i> Audit Trail
//                     </div>
//                     <div class="nav-item ${activePage === 'production-export' ? 'active' : ''}"
//                          onclick="Router.navigate('production-export')">
//                         <i class="fas fa-file-pdf"></i> Reports
//                     </div>
//                 </div>
//             </div>` : ''}

//             ${showMM ? `
//             <div class="nav-section">
//                 <div class="nav-item ${activePage === 'products' ? 'active' : ''}"
//                      onclick="Router.navigate('products')">
//                     <i class="fas fa-cubes"></i> Material Management
//                 </div>
//             </div>` : ''}

//             ${showUsers ? `
//             <div class="nav-section">
//                 <div class="nav-item ${activePage === 'users' ? 'active' : ''}"
//                      onclick="Router.navigate('users')">
//                     <i class="fas fa-users-cog"></i> Users Management
//                 </div>
//             </div>` : ''}

//             <div class="nav-section">
//                 <div class="nav-section-title">Reports</div>
//                 <div class="nav-group-header ${activePage.startsWith('yearly') ? 'expanded' : ''}"
//                      onclick="this.classList.toggle('expanded'); this.nextElementSibling.classList.toggle('show')">
//                     <span><i class="fas fa-calendar-alt"></i>&nbsp; Previous Year</span>
//                     <i class="fas fa-chevron-right chevron"></i>
//                 </div>
//                 <div class="nav-group-children ${activePage.startsWith('yearly') ? 'show' : ''}">
//                     ${showRaw ? `<div class="nav-item ${activePage === 'yearly-raw' ? 'active' : ''}"
//                          onclick="Router.navigate('yearly-raw')">
//                         <i class="fas fa-file-alt"></i> Raw Yearly Report
//                     </div>` : ''}
//                     ${showPkg ? `<div class="nav-item ${activePage === 'yearly-packaging' ? 'active' : ''}"
//                          onclick="Router.navigate('yearly-packaging')">
//                         <i class="fas fa-file-alt"></i> Packaging Yearly Report
//                     </div>` : ''}
//                     ${showFin ? `<div class="nav-item ${activePage === 'yearly-finished' ? 'active' : ''}"
//                          onclick="Router.navigate('yearly-finished')">
//                         <i class="fas fa-file-alt"></i> Finished Yearly Report
//                     </div>` : ''}
//                 </div>
//             </div>
//         </nav>

//         <div class="sidebar-footer">
//             <div class="user-info">
//                 <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
//                 <div>
//                     <div class="user-name">${user.username}</div>
//                     <div class="user-role">${roles[0] || 'User'}</div>
//                 </div>
//             </div>
//             <button class="btn btn-secondary btn-sm" style="width:100%" onclick="App.logout()">
//                 <i class="fas fa-sign-out-alt"></i> Logout
//             </button>
//         </div>
//     </aside>`;
// }
