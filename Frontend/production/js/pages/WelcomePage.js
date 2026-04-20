const WelcomePage = {

    render() {
        const user = api.getUser();
        if (!user) return '<div>Unauthorized</div>';

        const roles = user.roles || [];

        const hasRole = (...targets) => targets.some(t => roles.includes(t));
        const roleStartsWith = (...prefixes) => roles.some(r => prefixes.some(p => r.startsWith(p)));

        // Determine which departments are accessible
        const isSuperAdmin = hasRole('superadmin');
        const canAccessProduction = isSuperAdmin || roleStartsWith('Production') || hasRole('Production Manager', 'Production Checker');
        const canAccessQC = hasRole('Manager') || roleStartsWith('Data Entry', 'Analyst', 'Section Head') || hasRole('QC Checker');
        // const canAccessQC = isSuperAdmin || hasRole('Manager') || roleStartsWith('Data Entry', 'Analyst', 'Section Head') || hasRole('QC Checker');

        const qcCard = canAccessQC
            ? `<div class="system-card qc" onclick="Router.navigate('dashboard')" title="Enter QC System">
                    <div class="card-badge enabled"><i class="fas fa-check-circle"></i> Access Granted</div>
                    <i class="fas fa-vial"></i>
                    <h2>QC System</h2>
                    <p>Quality Control &amp; Materials</p>
               </div>`
            : `<div class="system-card qc disabled" title="You do not have access to this system">
                    <div class="card-badge locked"><i class="fas fa-lock"></i> No Access</div>
                    <i class="fas fa-vial"></i>
                    <h2>QC System</h2>
                    <p>Quality Control &amp; Materials</p>
               </div>`;

        const productionCard = canAccessProduction
            ? `<div class="system-card production" onclick="Router.navigate('production-dashboard')" title="Enter Production System">
                    <div class="card-badge enabled"><i class="fas fa-check-circle"></i> Access Granted</div>
                    <i class="fas fa-industry"></i>
                    <h2>Production System</h2>
                    <p>Logbooks &amp; Manufacturing</p>
               </div>`
            : `<div class="system-card production disabled" title="You do not have access to this system">
                    <div class="card-badge locked"><i class="fas fa-lock"></i> No Access</div>
                    <i class="fas fa-industry"></i>
                    <h2>Production System</h2>
                    <p>Logbooks &amp; Manufacturing</p>
               </div>`;

        return `
        <div class="welcome-container">
            <h1>Welcome, ${user.username} 👋</h1>
            <p class="welcome-subtitle">Select your department system</p>
            <div class="cards-container">
                ${qcCard}
                ${productionCard}
            </div>
            <p class="welcome-role-hint"><i class="fas fa-id-badge"></i> Logged in as: <strong>${roles[0] || 'User'}</strong></p>
        </div>
        `;
    }
};