// ──────────────────────────────────────────────
//  User Management Page
// ──────────────────────────────────────────────

const UserManagementPage = {
    rows: [],
    selectedIdx: -1,

    ALL_ROLES: [
        'Data Entry (RM)', 'Data Entry (PM)', 'Data Entry (FP)',
        'Analyst (RM)', 'Analyst (PM)', 'Analyst (FP Micro)', 'Analyst (FP Chemical)',
        'Section Head (RM)', 'Section Head (PM)', 'Section Head (FP Micro)', 'Section Head (FP Chemical)',
        'Production (Operator)', 'Production (Data Entry)', 'Production (Supervisor)', 'Production Checker',
        'Manager', 'Production Manager', 'superadmin', 'QC Checker'
    ],

    getAvailableRoles() {
        const user = api.getUser();
        const role = user?.roles?.[0] || '';
        if (role === 'Production Manager') {
            return this.ALL_ROLES.filter(r => r.toLowerCase().includes('production'));
        }
        return this.ALL_ROLES;
    },

    columns: [
        { key: 'Username', label: 'Username' },
        { key: 'Role', label: 'Primary Role' },
    ],

    render() {
        let html = `
        <div class="action-bar">
            <button class="btn btn-success" onclick="UserManagementPage.showAddDialog()">
                <i class="fas fa-user-plus"></i> Add User
            </button>
            <button class="btn btn-danger" onclick="UserManagementPage.deleteUser()">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>`;

        html += renderDataTable(this.columns, this.rows, {
            onRowClick: 'UserManagementPage.selectRow',
            selectedRow: this.selectedIdx >= 0 ? this.rows[this.selectedIdx]?.ID : null,
            idField: 'ID'
        });

        html += '<div id="user-dialog"></div>';
        return html;
    },

    async afterRender() {
        if (this.rows.length === 0) await this.loadData();
    },

    async loadData() {
        try {
            const data = await api.getUsers();
            this.rows = data.results || [];
            App.renderContent();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    selectRow(idx) { this.selectedIdx = idx; App.renderContent(); },

    showAddDialog() {
        document.getElementById('user-dialog').innerHTML = `
        <div class="modal-overlay" onclick="if(event.target===this) UserManagementPage.closeDialog()">
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">Register New User</h3>
                    <button class="modal-close" onclick="UserManagementPage.closeDialog()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" class="form-input" id="new-username" placeholder="Enter username">
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" class="form-input" id="new-password" placeholder="Enter password">
                    </div>
                    <div class="form-group">
                        <label>Select Roles (click to toggle)</label>
                        <ul class="role-list" id="role-list">
                            ${this.getAvailableRoles().map(r =>
                                `<li onclick="this.classList.toggle('selected')" data-role="${r}">
                                    <i class="far fa-square"></i> ${r}
                                </li>`
                            ).join('')}
                        </ul>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="UserManagementPage.closeDialog()">Cancel</button>
                    <button class="btn btn-success" onclick="UserManagementPage.saveUser()">
                        <i class="fas fa-user-plus"></i> Register
                    </button>
                </div>
            </div>
        </div>`;
    },

    async saveUser() {
        const username = document.getElementById('new-username')?.value?.trim();
        const password = document.getElementById('new-password')?.value?.trim();
        const selectedItems = document.querySelectorAll('#role-list li.selected');
        const roles = Array.from(selectedItems).map(li => li.dataset.role);

        if (!username || !password) { App.toast('Username and password required', 'warning'); return; }
        if (roles.length === 0) { App.toast('Select at least one role', 'warning'); return; }

        try {
            await api.addUser({ username, password, roles });
            App.toast('User registered', 'success');
            this.closeDialog(); this.rows = []; await this.loadData();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    async deleteUser() {
        if (this.selectedIdx < 0) { App.toast('Select a user', 'warning'); return; }
        const row = this.rows[this.selectedIdx];
        if (!confirm(`Delete user "${row.Username}"?`)) return;
        try {
            await api.deleteUser(row.ID);
            App.toast('User deleted', 'success');
            this.rows = []; this.selectedIdx = -1; await this.loadData();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    closeDialog() { document.getElementById('user-dialog').innerHTML = ''; }
};
