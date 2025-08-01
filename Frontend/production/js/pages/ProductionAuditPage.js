// ──────────────────────────────────────────────
//  Production Audit Page
// ──────────────────────────────────────────────

const ProductionAuditPage = {

    formatTime(value) {
        if (!value) return '';
        if (value.includes('T')) return value.substring(11, 16);
        return value;
    },

    getDuration(start, end) {
        if (!start || !end) return '';
        const s = new Date(`1970-01-01T${start}:00`);
        const e = new Date(`1970-01-01T${end}:00`);
        const diff = (e - s) / 60000;
        if (diff < 0) return '';
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return `${h}h ${m}m`;
    },

    validateTime(start, end) {
        if (!start || !end) return true;
        return end > start;
    },

    updateCleaningDuration() {
        const start = document.getElementById('cl-start')?.value;
        const end = document.getElementById('cl-end')?.value;

        if (!this.validateTime(start, end)) {
            App.toast('End time must be after start time', 'error');
            document.getElementById('cl-duration').value = '';
            return;
        }

        document.getElementById('cl-duration').value =
            this.getDuration(start, end);
    },

    updateOperationDuration() {
        const start = document.getElementById('op-start')?.value;
        const end = document.getElementById('op-end')?.value;

        if (!this.validateTime(start, end)) {
            App.toast('End time must be after start time', 'error');
            document.getElementById('op-duration').value = '';
            return;
        }

        document.getElementById('op-duration').value =
            this.getDuration(start, end);
    },

    machines: [],
    sections: [],
    products: [],
    users: [],
    cleaningRows: [],
    operationRows: [],

    selectedMachine: '',
    selectedSection: '',

    activeTab: 'cleaning', // 'cleaning' | 'operation'

    // ──────────────────────────────────────────────
    // Modern Confirm Dialog
    // ──────────────────────────────────────────────

    /**
     * showConfirm({ title, message, confirmText, confirmClass, icon, iconBg, iconColor, onConfirm })
     * Replaces all native confirm() calls with a styled modal.
     */
    showConfirm({
        title = 'Are you sure?',
        message = '',
        confirmText = 'Confirm',
        confirmClass = 'btn-danger',
        icon = 'fas fa-exclamation-triangle',
        iconBg = '#FCEBEB',
        iconColor = '#A32D2D',
        onConfirm
    }) {
        if (!document.getElementById('pa-confirm-styles')) {
            const style = document.createElement('style');
            style.id = 'pa-confirm-styles';
            style.textContent = `
                .pa-confirm-host {
                    position: fixed; inset: 0;
                    background: rgba(0,0,0,0.45);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 10000; padding: 16px;
                    opacity: 0; pointer-events: none;
                    transition: opacity 0.18s ease;
                }
                .pa-confirm-host.open { opacity: 1; pointer-events: all; }
                .pa-confirm-host.open .pa-confirm-box {
                    transform: translateY(0) scale(1); opacity: 1;
                }
                .pa-confirm-box {
                    background: var(--bg-primary);
                    border-radius: 14px;
                    border: 1px solid var(--border-color);
                    width: 100%; max-width: 380px;
                    padding: 28px 24px 20px;
                    display: flex; flex-direction: column; align-items: center;
                    text-align: center; gap: 10px;
                    transform: translateY(10px) scale(0.97); opacity: 0;
                    transition: transform 0.22s cubic-bezier(.4,0,.2,1), opacity 0.22s;
                    box-shadow: 0 16px 48px rgba(0,0,0,0.18);
                }
                .pa-confirm-icon {
                    width: 52px; height: 52px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 20px; margin-bottom: 2px;
                }
                .pa-confirm-title {
                    font-size: 16px; font-weight: 600;
                    color: var(--text-primary); margin: 0;
                }
                .pa-confirm-message {
                    font-size: 13px; color: var(--text-secondary);
                    line-height: 1.55; margin: 0;
                }
                .pa-confirm-actions {
                    display: flex; gap: 10px; margin-top: 6px; width: 100%;
                }
                .pa-confirm-actions .btn { flex: 1; justify-content: center; }
            `;
            document.head.appendChild(style);
        }

        document.getElementById('pa-confirm-host')?.remove();

        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div class="pa-confirm-host" id="pa-confirm-host">
                <div class="pa-confirm-box">
                    <div class="pa-confirm-icon" style="background:${iconBg};color:${iconColor}">
                        <i class="${icon}"></i>
                    </div>
                    <p class="pa-confirm-title">${title}</p>
                    ${message ? `<p class="pa-confirm-message">${message}</p>` : ''}
                    <div class="pa-confirm-actions">
                        <button class="btn btn-secondary" id="pa-confirm-cancel">Cancel</button>
                        <button class="btn ${confirmClass}" id="pa-confirm-ok">${confirmText}</button>
                    </div>
                </div>
            </div>`;

        document.body.appendChild(wrapper.firstElementChild);

        const host = document.getElementById('pa-confirm-host');
        const close = () => {
            host.classList.remove('open');
            setTimeout(() => host.remove(), 220);
        };

        document.getElementById('pa-confirm-cancel').addEventListener('click', close);
        document.getElementById('pa-confirm-ok').addEventListener('click', () => {
            close();
            onConfirm();
        });
        host.addEventListener('click', (e) => { if (e.target === host) close(); });

        requestAnimationFrame(() => requestAnimationFrame(() => host.classList.add('open')));
    },

    // ──────────────────────────────────────────────
    // Render
    // ──────────────────────────────────────────────
    render() {
        return `
            <div class="shadow-box mb-4" style="background: linear-gradient(145deg, var(--bg-secondary), var(--bg-tertiary)); border-left: 4px solid var(--primary-color);">
                <div class="row align-center">
                    <div class="col-md-4">
                        <div class="form-group mb-0">
                            <label style="font-weight: 600; color: var(--text-primary); margin-bottom: 8px; display: block;">
                                <i class="fas fa-puzzle-piece" style="color: var(--primary-color); margin-right: 6px;"></i> Production Section
                            </label>
                            <div style="position: relative;">
                                <select class="form-input" id="prod-section-select" onchange="ProductionAuditPage.onSectionChange(this.value)" style="padding-right: 40px; font-weight: 500;">
                                    <option value="">-- Select Section --</option>
                                    ${this.sections.map(s => `<option value="${s.Name}" ${s.Name === this.selectedSection ? 'selected' : ''}>${s.Name}</option>`).join('')}
                                </select>
                                ${!api.getUser()?.roles?.includes('Production Checker') ? `
                                <button onclick="ProductionAuditPage.manageSections()" title="Manage Sections" style="position: absolute; right: 6px; top: 50%; transform: translateY(-50%); background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-secondary); cursor: pointer; padding: 4px 8px; transition: all 0.2s;">
                                    <i class="fas fa-cog"></i>
                                </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-group mb-0">
                            <label style="font-weight: 600; color: var(--text-primary); margin-bottom: 8px; display: block;">
                                <i class="fas fa-industry" style="color: var(--primary-color); margin-right: 6px;"></i> Production Machine
                            </label>
                            <div style="position: relative;">
                                <select class="form-input" id="prod-machine-select" onchange="ProductionAuditPage.onMachineChange(this.value)" style="padding-right: 40px; font-weight: 500;" ${!this.selectedSection ? 'disabled' : ''}>
                                    <option value="">-- Select Machine --</option>
                                    ${this.selectedSection ? this.machines.filter(m => m.Section === this.selectedSection).map(m => `<option value="${m.Name}" ${m.Name === this.selectedMachine ? 'selected' : ''}>${m.Name}</option>`).join('') : '<option value="" disabled>Select a section first</option>'}
                                </select>
                                ${!api.getUser()?.roles?.includes('Production Checker') ? `
                                <button onclick="ProductionAuditPage.manageMachines()" title="Manage Machines" style="position: absolute; right: 6px; top: 50%; transform: translateY(-50%); background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 4px; color: var(--text-secondary); cursor: pointer; padding: 4px 8px; transition: all 0.2s;">
                                    <i class="fas fa-cog"></i>
                                </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4" style="margin-top: 28px;">
                        <button class="btn ${(!this.selectedMachine || !this.selectedSection) ? 'btn-secondary' : 'btn-primary'}" onclick="ProductionAuditPage.loadData()" ${(!this.selectedMachine || !this.selectedSection) ? 'disabled' : ''} style="width: 100%; font-weight: 600; letter-spacing: 0.5px; padding: 10px 16px;">
                            <i class="fas fa-sync-alt" style="margin-right: 6px;"></i> Load Logbooks
                        </button>
                    </div>
                </div>
            </div>

            ${(!this.selectedMachine || !this.selectedSection) ? `
                <div class="shadow-box text-center" style="padding: 60px 40px; color: #6b7280; border: 2px dashed var(--border-color); background: var(--bg-tertiary);">
                    <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: var(--bg-secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <i class="fas fa-industry fa-2x" style="color: var(--primary-color); opacity: 0.7;"></i>
                    </div>
                    <h3 style="color: var(--text-primary); font-weight: 600; margin-bottom: 10px;">Select Machine and Section</h3>
                    <p style="font-size: 15px; max-width: 400px; margin: 0 auto;">Please configure the dropdowns above to access the cleaning and operation logbooks for a specific target.</p>
                </div>
            ` : `
                <div style="display: flex; justify-content: center; margin-bottom: 25px;">
                    <div style="display: inline-flex; background: var(--bg-tertiary); padding: 5px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
                        <div onclick="ProductionAuditPage.setTab('cleaning')" 
                             style="padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; display: flex; align-items: center; gap: 8px; ${this.activeTab === 'cleaning' ? 'background: var(--primary-color); color: white; box-shadow: 0 4px 10px rgba(0,0,0,0.15);' : 'color: var(--text-secondary);'}">
                            <i class="fas fa-broom"></i> Cleaning Logbook
                        </div>
                        <div onclick="ProductionAuditPage.setTab('operation')" 
                             style="padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; display: flex; align-items: center; gap: 8px; ${this.activeTab === 'operation' ? 'background: var(--primary-color); color: white; box-shadow: 0 4px 10px rgba(0,0,0,0.15);' : 'color: var(--text-secondary);'}">
                            <i class="fas fa-clipboard-list"></i> Operation Logbook
                        </div>
                    </div>
                </div>

                <div class="shadow-box mb-4">
                    ${this.activeTab === 'cleaning' ? this.renderCleaningTopActions() : this.renderOperationTopActions()}
                    <div id="production-table-container">
                        ${this.getTableHTML()}
                    </div>
                </div>
            `}
            <div id="production-dialog"></div>
        `;
    },

    closeDialog() {
        const el = document.getElementById('production-dialog');
        if (el) el.innerHTML = '';
    },

    showDialog(title, bodyHtml, submitText, onSubmitFn) {
        let footer = '';
        if (submitText && onSubmitFn) {
            footer = `
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="ProductionAuditPage.closeDialog()">Cancel</button>
                    <button class="btn btn-primary" onclick="${onSubmitFn}()">
                        <i class="fas fa-save"></i> ${submitText}
                    </button>
                </div>
            `;
        } else if (submitText) {
            footer = `
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="ProductionAuditPage.closeDialog()">${submitText}</button>
                </div>
            `;
        }

        const fullHtml = `
        <div class="modal-overlay" onclick="if(event.target===this) ProductionAuditPage.closeDialog()">
            <div class="modal" style="max-width: 800px;">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" onclick="ProductionAuditPage.closeDialog()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${bodyHtml}
                </div>
                ${footer}
            </div>
        </div>`;
        document.getElementById('production-dialog').innerHTML = fullHtml;
    },

    renderCleaningTopActions() {
        const user = api.getUser() || { roles: [] };
        const isProductionChecker = user.roles.includes('Production Checker');
        return `
            <div class="topbar-left mb-3">
                ${!isProductionChecker ? `
                <button class="btn btn-primary" onclick="ProductionAuditPage.openCleaningEntry(true)">
                    <i class="fas fa-plus"></i> New Cleaning Record
                </button>
                ` : ''}
                <button class="btn btn-primary" onclick="ProductionAuditPage.openCleaningEntry(false)" ${this.selectedRowIdx < 0 || this.activeTab !== 'cleaning' ? 'disabled' : ''}>
                    <i class="fas fa-edit"></i> ${isProductionChecker ? 'Check Selected' : 'Edit Selected'}
                </button>
            </div>
        `;
    },

    renderOperationTopActions() {
        const user = api.getUser() || { roles: [] };
        const isProductionChecker = user.roles.includes('Production Checker');
        return `
            <div class="topbar-left mb-3">
                ${!isProductionChecker ? `
                <button class="btn btn-primary" onclick="ProductionAuditPage.openOperationEntry(true)">
                    <i class="fas fa-plus"></i> New Operation Record
                </button>
                ` : ''}
                <button class="btn btn-primary" onclick="ProductionAuditPage.openOperationEntry(false)" ${this.selectedRowIdx < 0 || this.activeTab !== 'operation' ? 'disabled' : ''}>
                    <i class="fas fa-edit"></i> ${isProductionChecker ? 'Check Selected' : 'Edit Selected'}
                </button>
            </div>
        `;
    },

    afterRender() {
        if (this.machines.length === 0 && this.sections.length === 0) {
            this.loadInitialData();
        }
    },

    setTab(tab) {
        this.activeTab = tab;
        this.selectedRowIdx = -1;
        App.renderContent();
    },

    onMachineChange(val) {
        this.selectedMachine = val;
        this.selectedRowIdx = -1;
        if (this.selectedMachine && this.selectedSection) {
            this.loadData();
        } else {
            App.renderContent();
        }
    },

    onSectionChange(val) {
        this.selectedSection = val;
        this.selectedMachine = '';
        this.selectedRowIdx = -1;
        if (this.selectedMachine && this.selectedSection) {
            this.loadData();
        } else {
            App.renderContent();
        }
    },

    async loadInitialData() {
        try {
            const [mRes, sRes, pRes, uRes] = await Promise.all([
                api.getProductionMachines(),
                api.getProductionSections(),
                api.getProductionProducts(''),
                api.getUsers()
            ]);
            this.machines = mRes.results || [];
            this.sections = sRes.results || [];
            this.products = (pRes.results || []).map(p => p.ProductName);
            this.users = uRes.results || [];
            App.renderContent();
        } catch (err) {
            App.toast(err.message, 'error');
        }
    },

    async loadData() {
        if (!this.selectedMachine || !this.selectedSection) return;
        try {
            if (this.activeTab === 'cleaning') {
                const res = await api.getCleaningLogbooks(this.selectedMachine, this.selectedSection);
                this.cleaningRows = res.results || [];
            } else {
                const res = await api.getOperationLogbooks(this.selectedMachine, this.selectedSection);
                this.operationRows = res.results || [];
            }
            App.renderContent();
        } catch (err) {
            App.toast(err.message, 'error');
        }
    },

    getTableHTML() {
        if (!this.selectedMachine || !this.selectedSection) return '';

        if (this.activeTab === 'cleaning') {
            const cols = [
                { key: 'Date', label: 'Date', render: v => v ? String(v).split('T')[0] : '' },
                { key: 'ProductName', label: 'Product Name' },
                { key: 'BatchNo', label: 'Batch No.' },
                { key: 'BatchSize', label: 'Batch Size' },
                { key: 'TimeStart', label: 'Time Start' },
                { key: 'TimeEnd', label: 'Time End' },
                { key: 'DueDate', label: 'Due Date', render: v => v ? String(v).split('T')[0] : '' },
                { key: 'CleaningReason', label: 'Cleaning Reason' },
                { key: 'DoneBy', label: 'Done By' },
                { key: 'CheckedBy', label: 'Checked By' }
            ];
            return renderDataTable(cols, this.cleaningRows, {
                onRowClick: 'ProductionAuditPage.selectRowCleaning',
                selectedRow: this.selectedRowIdx >= 0 ? this.cleaningRows[this.selectedRowIdx]?.ID : null,
                idField: 'ID'
            });
        } else {
            const cols = [
                { key: 'Date', label: 'Date', render: v => v ? String(v).split('T')[0] : '' },
                { key: 'ProductName', label: 'Product Name' },
                { key: 'BatchNo', label: 'Batch No.' },
                { key: 'BatchSize', label: 'Batch Size' },
                { key: 'OperationStart', label: 'Op Start' },
                { key: 'OperationEnd', label: 'Op End' },
                { key: 'IncidentBrief', label: 'Incident Brief' },
                { key: 'IncidentAction', label: 'Incident Action' },
                { key: 'DoneBy', label: 'Done By' },
                { key: 'CheckedBy', label: 'Checked By' }
            ];
            return renderDataTable(cols, this.operationRows, {
                onRowClick: 'ProductionAuditPage.selectRowOperation',
                selectedRow: this.selectedRowIdx >= 0 ? this.operationRows[this.selectedRowIdx]?.ID : null,
                idField: 'ID'
            });
        }
    },

    selectRowCleaning(idx) {
        this.selectedRowIdx = idx;
        App.renderContent();
    },

    selectRowOperation(idx) {
        this.selectedRowIdx = idx;
        App.renderContent();
    },

    // ──────────────────────────────────────────────
    // Manage Machines
    // ──────────────────────────────────────────────
    manageMachines() {
        let html = `
            <div class="form-group mb-3">
                <label>Add New Machine</label>
                <div style="display: flex; gap: 10px;">
                    <input type="text" class="form-input" id="new-machine-name" placeholder="Enter machine name..." style="flex: 1;">
                    <select class="form-input" id="new-machine-section" style="flex: 1;">
                        <option value="">-- Select Section --</option>
                        ${this.sections.map(s => `<option value="${s.Name}">${s.Name}</option>`).join('')}
                    </select>
                    <button class="btn btn-success" onclick="ProductionAuditPage.addMachine()">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
            </div>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid var(--border-color);" />
            <h4 style="margin-bottom: 15px; font-size: 14px; color: var(--text-muted); text-transform: uppercase;">Existing Machines</h4>
            <div style="max-height: 300px; overflow-y: auto; background: var(--bg-tertiary); border-radius: 8px; border: 1px solid var(--border-color);">
                <table class="data-table" style="margin: 0; box-shadow: none;">
                    <thead style="position: sticky; top: 0; z-index: 1;"><tr><th>Machine Name</th><th>Section</th><th style="width:80px; text-align: center;">Action</th></tr></thead>
                    <tbody>
                        ${this.machines.map(m => `
                            <tr>
                                <td><span style="font-weight: 500;">${m.Name}</span></td>
                                <td><span style="color: var(--text-muted);">${m.Section || '-'}</span></td>
                                <td style="text-align: center;"><button class="btn btn-danger btn-sm" onclick="ProductionAuditPage.deleteMachine(${m.ID})" title="Delete"><i class="fas fa-trash"></i></button></td>
                            </tr>
                        `).join('')}
                        ${this.machines.length === 0 ? '<tr><td colspan="3" class="text-center" style="padding: 30px; color: var(--text-muted);">No machines configured</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        `;

        this.showDialog('Manage Production Machines', html, 'Close');

        setTimeout(() => {
            const input = document.getElementById('new-machine-name');
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.addMachine();
                    }
                });
            }
        }, 100);
    },

    async addMachine() {
        const el = document.getElementById('new-machine-name');
        const sel = document.getElementById('new-machine-section');
        const name = el.value.trim();
        const section = sel ? sel.value : '';
        if (!name || !section) {
            App.toast('Name and Section are required', 'warning');
            return;
        }
        try {
            await api.addProductionMachine({ name, section });
            App.toast('Machine added', 'success');
            await this.loadInitialData();
            this.closeDialog();
            this.manageMachines();
        } catch (err) {
            App.toast(err.message, 'error');
        }
    },

    deleteMachine(id) {
        this.showConfirm({
            title: 'Delete this machine?',
            message: 'This machine will be permanently removed and cannot be recovered.',
            confirmText: 'Delete',
            confirmClass: 'btn-danger',
            icon: 'fas fa-trash',
            iconBg: '#FCEBEB',
            iconColor: '#A32D2D',
            onConfirm: async () => {
                try {
                    await api.deleteProductionMachine(id);
                    App.toast('Machine deleted', 'success');
                    if (this.selectedMachine === this.machines.find(m => m.ID === id)?.Name) {
                        this.selectedMachine = '';
                    }
                    await this.loadInitialData();
                    this.closeDialog();
                    this.manageMachines();
                } catch (err) {
                    App.toast(err.message, 'error');
                }
            }
        });
    },

    // ──────────────────────────────────────────────
    // Manage Sections
    // ──────────────────────────────────────────────
    manageSections() {
        let html = `
            <div class="form-group mb-3">
                <label>Add New Section</label>
                <div style="display: flex; gap: 10px;">
                    <input type="text" class="form-input" id="new-section-name" placeholder="Enter section name..." style="flex: 1;">
                    <button class="btn btn-success" onclick="ProductionAuditPage.addSection()">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
            </div>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid var(--border-color);" />
            <h4 style="margin-bottom: 15px; font-size: 14px; color: var(--text-muted); text-transform: uppercase;">Existing Sections</h4>
            <div style="max-height: 300px; overflow-y: auto; background: var(--bg-tertiary); border-radius: 8px; border: 1px solid var(--border-color);">
                <table class="data-table" style="margin: 0; box-shadow: none;">
                    <thead style="position: sticky; top: 0; z-index: 1;"><tr><th>Section Name</th><th style="width:80px; text-align: center;">Action</th></tr></thead>
                    <tbody>
                        ${this.sections.map(s => `
                            <tr>
                                <td><span style="font-weight: 500;">${s.Name}</span></td>
                                <td style="text-align: center;"><button class="btn btn-danger btn-sm" onclick="ProductionAuditPage.deleteSection(${s.ID})" title="Delete"><i class="fas fa-trash"></i></button></td>
                            </tr>
                        `).join('')}
                        ${this.sections.length === 0 ? '<tr><td colspan="2" class="text-center" style="padding: 30px; color: var(--text-muted);">No sections configured</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        `;

        this.showDialog('Manage Production Sections', html, 'Close');

        setTimeout(() => {
            const input = document.getElementById('new-section-name');
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.addSection();
                    }
                });
            }
        }, 100);
    },

    async addSection() {
        const el = document.getElementById('new-section-name');
        const name = el.value.trim();
        if (!name) return;
        try {
            await api.addProductionSection({ name });
            App.toast('Section added', 'success');
            await this.loadInitialData();
            this.closeDialog();
            this.manageSections();
        } catch (err) {
            App.toast(err.message, 'error');
        }
    },

    deleteSection(id) {
        this.showConfirm({
            title: 'Delete this section?',
            message: 'This section will be permanently removed and cannot be recovered.',
            confirmText: 'Delete',
            confirmClass: 'btn-danger',
            icon: 'fas fa-trash',
            iconBg: '#FCEBEB',
            iconColor: '#A32D2D',
            onConfirm: async () => {
                try {
                    await api.deleteProductionSection(id);
                    App.toast('Section deleted', 'success');
                    if (this.selectedSection === this.sections.find(s => s.ID === id)?.Name) {
                        this.selectedSection = '';
                    }
                    await this.loadInitialData();
                    this.closeDialog();
                    this.manageSections();
                } catch (err) {
                    App.toast(err.message, 'error');
                }
            }
        });
    },

    // ──────────────────────────────────────────────
    // Cleaning Logbook Entry
    // ──────────────────────────────────────────────
    async openCleaningEntry(isNew) {
        this.isNew = isNew;
        let d = {};
        if (!isNew) {
            if (this.selectedRowIdx < 0) {
                App.toast('Please select a cleaning record to edit.', 'warning');
                return;
            }
            d = this.cleaningRows[this.selectedRowIdx];
        } else {
            try {
                const sTime = await api.getServerTime();
                d = { Date: sTime.datetime };
            } catch (e) { d = {}; }
        }

        const currentProduct = d.ProductName || '';
        const isProductInList = currentProduct ? this.products.includes(currentProduct) : true;

        const currentUser = api.getUser() || { roles: [], username: 'System' };
        const isSuperadmin = currentUser.roles.includes('superadmin');
        const isProductionChecker = currentUser.roles.includes('Production Checker');
        const isChecker = currentUser.roles.includes('QC Checker') || isProductionChecker;
        const isReadonly = isProductionChecker;

        let doneByValue = d.DoneBy || '';
        if (!isProductionChecker && (isNew || (!isSuperadmin && currentUser.username))) doneByValue = currentUser.username;

        let checkedByValue = d.CheckedBy || '';
        if (isChecker) checkedByValue = currentUser.username;

        const ts = d.Date && !isNaN(new Date(d.Date)) ? new Date(new Date(d.Date).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 10) : '';
        const dueDate = d.DueDate && !isNaN(new Date(d.DueDate)) ? new Date(new Date(d.DueDate).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 10) : '';

        let dateInputHtml = '';
        if (isSuperadmin) {
            const todayStr = new Date().toISOString().slice(0, 10);
            dateInputHtml = `<input type="date" class="form-control" id="cl-date" value="${ts || ''}" max="${todayStr}">`;
        } else {
            dateInputHtml = `<input type="date" class="form-control" id="cl-date" value="${ts || ''}" disabled style="opacity: 0.6; background-color: var(--bg-secondary);">`;
        }

        const productionUsers = this.users.filter(u => u.Role && u.Role.includes('Production'));
        const nonSuperUsers = this.users.filter(u => u.Role !== 'superadmin');

        let doneByHtml = '';
        if (isSuperadmin) {
            doneByHtml = `
                <select class="form-control" id="cl-done">
                    <option value="">-- Select User --</option>
                    ${productionUsers.map(u => `<option value="${u.Username}" ${u.Username === doneByValue ? 'selected' : ''}>${u.Username}</option>`).join('')}
                </select>
            `;
        } else {
            doneByHtml = `<input type="text" class="form-control" id="cl-done" value="${doneByValue}" disabled style="opacity: 0.8; background-color: var(--bg-secondary);">`;
        }

        let checkedByHtml = '';
        if (isSuperadmin) {
            checkedByHtml = `
                <select class="form-control" id="cl-checked">
                    <option value="">-- Select User --</option>
                    ${nonSuperUsers.map(u => `<option value="${u.Username}" ${u.Username === checkedByValue ? 'selected' : ''}>${u.Username}</option>`).join('')}
                </select>
            `;
        } else if (isProductionChecker) {
            checkedByHtml = `<input type="text" class="form-control" id="cl-checked" value="${checkedByValue}" placeholder="Your name as checker">`;
        } else {
            checkedByHtml = `<input type="text" class="form-control" id="cl-checked" value="${checkedByValue}" disabled style="opacity: 0.8; background-color: var(--bg-secondary);">`;
        }

        const html = `
            <div class="row">
                <div class="col-md-6 form-group">
                    <label>Date</label>
                    ${dateInputHtml}
                </div>
                <div class="col-md-6 form-group">
                    <label>Product Name</label>
                    <select class="form-control" id="cl-product" ${isReadonly ? 'disabled' : ''}>
                        <option value="">-- Select Product --</option>
                        ${!isProductInList ? `<option value="${currentProduct.replace(/"/g, '&quot;')}" selected>${currentProduct} (Not in list)</option>` : ''}
                        ${this.products.map(p => `
                            <option value="${p.replace(/"/g, '&quot;')}" ${p === currentProduct ? 'selected' : ''}>${p}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="col-md-6 form-group">
                    <label>Batch No.</label>
                    <input type="text" class="form-control" id="cl-batch" value="${d.BatchNo || ''}" ${isReadonly ? 'disabled' : ''}>
                </div>
                <div class="col-md-6 form-group">
                    <label>Batch Size</label>
                    <input type="text" class="form-control" id="cl-batchsize" value="${d.BatchSize || ''}" ${isReadonly ? 'disabled' : ''}>
                </div>
               <div class="col-md-6 form-group">
    <label>Time Start</label>
    <input type="time" class="form-control" id="cl-start"
        value="${this.formatTime(d.TimeStart)}"
        step="60"
        onchange="ProductionAuditPage.updateCleaningDuration()"
        ${isReadonly ? 'disabled' : ''}>
</div>

<div class="col-md-6 form-group">
    <label>Time End</label>
    <input type="time" class="form-control" id="cl-end"
        value="${this.formatTime(d.TimeEnd)}"
        step="60"
        onchange="ProductionAuditPage.updateCleaningDuration()"
        ${isReadonly ? 'disabled' : ''}>
</div>

<div class="col-md-6 form-group">
    <label>Duration</label>
    <input type="text" class="form-control" id="cl-duration" readonly>
</div>
                <div class="col-md-6 form-group">
                    <label>Cleaning Reason</label>
                    <input type="text" class="form-control" id="cl-reason" value="${d.CleaningReason || ''}" ${isReadonly ? 'disabled' : ''}>
                </div>
                <div class="col-md-6 form-group">
                    <label>Due Date</label>
                    <input type="date" class="form-control" id="cl-due" value="${dueDate}" ${isReadonly ? 'disabled' : ''}>
                </div>
                <div class="col-md-6 form-group">
                    <label>Done By</label>
                    ${doneByHtml}
                </div>
                <div class="col-md-6 form-group">
                    <label>Checked By</label>
                    ${checkedByHtml}
                </div>
            </div>
            ${(!isNew && isSuperadmin) ? `
                <div class="mt-4" style="border-top: 1px solid var(--border-color); padding-top: 15px; text-align: right;">
                    <button type="button" class="btn btn-danger" onclick="ProductionAuditPage.deleteCleaningRecord(${d.ID})">
                        <i class="fas fa-trash"></i> Delete Record
                    </button>
                </div>
            ` : ''}
        `;

        this.showDialog(
            isNew ? 'New Cleaning Record' : 'Edit Cleaning Record',
            html,
            isNew ? 'Submit Record' : 'Save Changes',
            'ProductionAuditPage.submitCleaningEntry'
        );
    },

    async submitCleaningEntry() {
        const currentUser = api.getUser() || { roles: [], username: 'System' };
        const isSuperadmin = currentUser.roles.includes('superadmin');

        let finalDate = '';
        if (isSuperadmin) {
            finalDate = document.getElementById('cl-date').value;
        } else {
            try {
                const sTime = await api.getServerTime();
                finalDate = sTime.datetime.slice(0, 10);
            } catch (e) { finalDate = new Date().toISOString().slice(0, 10); }
        }

        const start = document.getElementById('cl-start').value;
        const end = document.getElementById('cl-end').value;

        if (!this.validateTime(start, end)) {
            App.toast('End time must be after start time', 'error');
            return;
        }
        const payload = {
            machine: this.selectedMachine,
            section: this.selectedSection,
            date: finalDate,
            product_name: document.getElementById('cl-product').value,
            batch_no: document.getElementById('cl-batch').value,
            batch_size: document.getElementById('cl-batchsize').value,
            time_start: document.getElementById('cl-start').value,
            time_end: document.getElementById('cl-end').value,
            due_date: document.getElementById('cl-due') ? document.getElementById('cl-due').value : null,
            cleaning_reason: document.getElementById('cl-reason').value,
            done_by: document.getElementById('cl-done').value,
            checked_by: document.getElementById('cl-checked').value,
        };

        try {
            if (this.isNew) {
                await api.addCleaningLogbook(payload);
                App.toast('Cleaning record added successfully', 'success');
            } else {
                const id = this.cleaningRows[this.selectedRowIdx].ID;
                await api.updateCleaningLogbook(id, payload);
                App.toast('Cleaning record updated successfully', 'success');
            }
            this.closeDialog();
            this.loadData();
        } catch (err) {
            App.toast(err.message, 'error');
        }
    },

    deleteCleaningRecord(id) {
        this.showConfirm({
            title: 'Delete this record?',
            message: 'This cleaning record will be permanently removed and cannot be recovered.',
            confirmText: 'Delete',
            confirmClass: 'btn-danger',
            icon: 'fas fa-trash',
            iconBg: '#FCEBEB',
            iconColor: '#A32D2D',
            onConfirm: async () => {
                try {
                    await api.deleteCleaningLogbook(id);
                    App.toast('Record deleted', 'success');
                    this.closeDialog();
                    this.loadData();
                } catch (err) {
                    App.toast(err.message, 'error');
                }
            }
        });
    },

    // ──────────────────────────────────────────────
    // Operation Logbook Entry
    // ──────────────────────────────────────────────
    async openOperationEntry(isNew) {
        this.isNew = isNew;
        let d = {};
        if (!isNew) {
            if (this.selectedRowIdx < 0) {
                App.toast('Please select an operation record to edit.', 'warning');
                return;
            }
            d = this.operationRows[this.selectedRowIdx];
        } else {
            try {
                const sTime = await api.getServerTime();
                d = { Date: sTime.datetime };
            } catch (e) { d = {}; }
        }

        const currentProduct = d.ProductName || '';
        const isProductInList = currentProduct ? this.products.includes(currentProduct) : true;

        const currentUser = api.getUser() || { roles: [], username: 'System' };
        const isSuperadmin = currentUser.roles.includes('superadmin');
        const isProductionChecker = currentUser.roles.includes('Production Checker');
        const isChecker = currentUser.roles.includes('QC Checker') || isProductionChecker;
        const isReadonly = isProductionChecker;

        let doneByValue = d.DoneBy || '';
        if (!isProductionChecker && (isNew || (!isSuperadmin && currentUser.username))) doneByValue = currentUser.username;

        let checkedByValue = d.CheckedBy || '';
        if (isChecker) checkedByValue = currentUser.username;

        let dateInputHtml = '';
        const ts = d.Date && !isNaN(new Date(d.Date)) ? new Date(new Date(d.Date).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 10) : '';
        if (isSuperadmin) {
            const todayStr = new Date().toISOString().slice(0, 10);
            dateInputHtml = `<input type="date" class="form-control" id="op-date" value="${ts || ''}" max="${todayStr}">`;
        } else {
            dateInputHtml = `<input type="date" class="form-control" id="op-date" value="${ts || ''}" disabled style="opacity: 0.6; background-color: var(--bg-secondary);">`;
        }

        const productionUsers = this.users.filter(u => u.Role && u.Role.includes('Production'));
        const nonSuperUsers = this.users.filter(u => u.Role !== 'superadmin');

        let doneByHtml = '';
        if (isSuperadmin) {
            doneByHtml = `
                <select class="form-control" id="op-done">
                    <option value="">-- Select User --</option>
                    ${productionUsers.map(u => `<option value="${u.Username}" ${u.Username === doneByValue ? 'selected' : ''}>${u.Username}</option>`).join('')}
                </select>
            `;
        } else {
            doneByHtml = `<input type="text" class="form-control" id="op-done" value="${doneByValue}" disabled style="opacity: 0.8; background-color: var(--bg-secondary);">`;
        }

        let checkedByHtml = '';
        if (isSuperadmin) {
            checkedByHtml = `
                <select class="form-control" id="op-checked">
                    <option value="">-- Select User --</option>
                    ${nonSuperUsers.map(u => `<option value="${u.Username}" ${u.Username === checkedByValue ? 'selected' : ''}>${u.Username}</option>`).join('')}
                </select>
            `;
        } else if (isProductionChecker) {
            checkedByHtml = `<input type="text" class="form-control" id="op-checked" value="${checkedByValue}" placeholder="Your name as checker">`;
        } else {
            checkedByHtml = `<input type="text" class="form-control" id="op-checked" value="${checkedByValue}" disabled style="opacity: 0.8; background-color: var(--bg-secondary);">`;
        }

        const html = `
            <div class="row">
                <div class="col-md-6 form-group">
                    <label>Date</label>
                    ${dateInputHtml}
                </div>
                <div class="col-md-6 form-group">
                    <label>Product Name</label>
                    <select class="form-control" id="op-product" ${isReadonly ? 'disabled' : ''}>
                        <option value="">-- Select Product --</option>
                        ${!isProductInList ? `<option value="${currentProduct.replace(/"/g, '&quot;')}" selected>${currentProduct} (Not in list)</option>` : ''}
                        ${this.products.map(p => `
                            <option value="${p.replace(/"/g, '&quot;')}" ${p === currentProduct ? 'selected' : ''}>${p}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="col-md-6 form-group">
                    <label>Batch No.</label>
                    <input type="text" class="form-control" id="op-batch" value="${d.BatchNo || ''}" ${isReadonly ? 'disabled' : ''}>
                </div>
                <div class="col-md-6 form-group">
                    <label>Batch Size</label>
                    <input type="text" class="form-control" id="op-batchsize" value="${d.BatchSize || ''}" ${isReadonly ? 'disabled' : ''}>
                </div>
               <div class="col-md-6 form-group">
    <label>Operation Start</label>
    <input type="time" class="form-control" id="op-start"
        value="${this.formatTime(d.OperationStart)}"
        step="60"
        onchange="ProductionAuditPage.updateOperationDuration()"
        ${isReadonly ? 'disabled' : ''}>
</div>

<div class="col-md-6 form-group">
    <label>Operation End</label>
    <input type="time" class="form-control" id="op-end"
        value="${this.formatTime(d.OperationEnd)}"
        step="60"
        onchange="ProductionAuditPage.updateOperationDuration()"
        ${isReadonly ? 'disabled' : ''}>
</div>

                <div class="col-md-6 form-group">
                    <label>Incident Brief</label>
                    <input type="text" class="form-control" id="op-brief" value="${d.IncidentBrief || ''}" ${isReadonly ? 'disabled' : ''}>
                </div>
                <div class="col-md-6 form-group">
                    <label>Incident Action</label>
                    <input type="text" class="form-control" id="op-action" value="${d.IncidentAction || ''}" ${isReadonly ? 'disabled' : ''}>
                </div>
                <div class="col-md-6 form-group">
                    <label>Done By</label>
                    ${doneByHtml}
                </div>
                <div class="col-md-6 form-group">
                    <label>Checked By</label>
                    ${checkedByHtml}
                </div>
            </div>
            ${(!isNew && isSuperadmin) ? `
                <div class="mt-4" style="border-top: 1px solid var(--border-color); padding-top: 15px; text-align: right;">
                    <button type="button" class="btn btn-danger" onclick="ProductionAuditPage.deleteOperationRecord(${d.ID})">
                        <i class="fas fa-trash"></i> Delete Record
                    </button>
                </div>
            ` : ''}
        `;

        this.showDialog(
            isNew ? 'New Operation Record' : 'Edit Operation Record',
            html,
            isNew ? 'Submit Record' : 'Save Changes',
            'ProductionAuditPage.submitOperationEntry'
        );
    },

    async submitOperationEntry() {
        const currentUser = api.getUser() || { roles: [], username: 'System' };
        const isSuperadmin = currentUser.roles.includes('superadmin');

        let finalDate = '';
        if (isSuperadmin) {
            finalDate = document.getElementById('op-date').value;
        } else {
            try {
                const sTime = await api.getServerTime();
                finalDate = sTime.datetime.slice(0, 10);
            } catch (e) { finalDate = new Date().toISOString().slice(0, 10); }
        }

        const start = document.getElementById('op-start').value;
        const end = document.getElementById('op-end').value;

        if (!this.validateTime(start, end)) {
            App.toast('End time must be after start time', 'error');
            return;
        }
        const payload = {
            machine: this.selectedMachine,
            section: this.selectedSection,
            date: finalDate,
            product_name: document.getElementById('op-product').value,
            batch_no: document.getElementById('op-batch').value,
            batch_size: document.getElementById('op-batchsize').value,
            operation_start: document.getElementById('op-start').value,
            operation_end: document.getElementById('op-end').value,
            incident_brief: document.getElementById('op-brief').value,
            incident_action: document.getElementById('op-action').value,
            done_by: document.getElementById('op-done').value,
            checked_by: document.getElementById('op-checked').value,
        };

        try {
            if (this.isNew) {
                await api.addOperationLogbook(payload);
                App.toast('Operation record added successfully', 'success');
            } else {
                const id = this.operationRows[this.selectedRowIdx].ID;
                await api.updateOperationLogbook(id, payload);
                App.toast('Operation record updated successfully', 'success');
            }
            this.closeDialog();
            this.loadData();
        } catch (err) {
            App.toast(err.message, 'error');
        }
    },

    deleteOperationRecord(id) {
        this.showConfirm({
            title: 'Delete this record?',
            message: 'This operation record will be permanently removed and cannot be recovered.',
            confirmText: 'Delete',
            confirmClass: 'btn-danger',
            icon: 'fas fa-trash',
            iconBg: '#FCEBEB',
            iconColor: '#A32D2D',
            onConfirm: async () => {
                try {
                    await api.deleteOperationLogbook(id);
                    App.toast('Record deleted', 'success');
                    this.closeDialog();
                    this.loadData();
                } catch (err) {
                    App.toast(err.message, 'error');
                }
            }
        });
    }
};