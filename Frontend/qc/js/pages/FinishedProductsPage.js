// ──────────────────────────────────────────────
//  Finished Products Page
// ──────────────────────────────────────────────

const FinishedProductsPage = {
    rows: [],
    selectedQCs: new Set(),   // QC numbers of selected rows
    editData: null,
    searchActive: false,
    offset: 0,
    total: 0,

    columns: [
        { key: 'Date', label: 'Date', render: (val) => App.formatDateTime(val) },
        { key: 'Material Name', label: 'Material Name' },
        { key: 'Material Code', label: 'Code' },
        { key: 'Batch No.', label: 'Batch No.' },
        { key: 'QC No.', label: 'QC No.' },
        { key: 'Micro', label: 'Micro', type: 'checkbox' },
        { key: 'MicroStatus', label: 'Micro Status', type: 'status' },
        { key: 'Chemical', label: 'Chemical', type: 'checkbox' },
        { key: 'ChemicalStatus', label: 'Chem Status', type: 'status' },
        { key: 'Manufacture Date', label: 'Mfg Date' },
        { key: 'Expiry Date', label: 'Exp Date' },
        { key: 'Status', label: 'Status', type: 'status' },
        { key: 'Notes', label: 'Notes' },
        { key: 'Created By', label: 'Created By' },
        { key: 'Reviewed', label: 'Reviewed', type: 'checkbox' },
        { key: 'Reviewed By', label: 'Reviewed By' },
        { key: 'Reviewed Date', label: 'Review Date' },
    ],

    entryFields: [
        { key: 'date', label: 'Date & Time', type: 'datetime', default: '' },
        { key: 'material', label: 'Material Name', type: 'product-search', category: 'Finished' },
        { key: 'material_code', label: 'Material Code' },
        { key: 'batch', label: 'Batch No.' },
        { key: 'qc', label: 'QC No.', readOnly: true },
        { key: 'micro', label: 'Micro', type: 'checkbox' },
        { key: 'micro_status', label: 'Micro Status', type: 'select', options: ['Pending', 'Accepted', 'Rejected'] },
        { key: 'chemical', label: 'Chemical', type: 'checkbox' },
        { key: 'chemical_status', label: 'Chemical Status', type: 'select', options: ['Pending', 'Accepted', 'Rejected'] },
        { key: 'manufacture_date', label: 'Manufacture Date', type: 'date' },
        { key: 'expiry_date', label: 'Expiry Date', type: 'date' },
        { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
    ],

    // ── Role helpers ────────────────────────────
    _getRoles() {
        return api.getUser()?.roles || [];
    },

    _can(roles, ...allowed) {
        return roles.some(r => allowed.includes(r));
    },

    // ── Selection helpers ───────────────────────
    toggleRow(idx) {
        const row = this.rows[idx];
        if (!row) return;
        const qc = String(row['QC No.']);
        if (this.selectedQCs.has(qc)) {
            this.selectedQCs.delete(qc);
        } else {
            this.selectedQCs.add(qc);
        }
        App.renderContent();
    },

    toggleAll(checked) {
        if (checked) {
            this.rows.forEach(r => this.selectedQCs.add(String(r['QC No.'])));
        } else {
            this.selectedQCs.clear();
        }
        App.renderContent();
    },

    // ── Render ──────────────────────────────────
    render() {
        const roles = this._getRoles();

        const canAdd    = this._can(roles, 'Data Entry (FP)', 'Analyst (FP Chemical)', 'Analyst (FP Micro)', 'Section Head (FP Micro)', 'Manager', 'Superuser');
        const canEdit   = this._can(roles, 'Section Head (FP Micro)', 'Manager', 'Superuser');
        const canMarkMicro = this._can(roles, 'Section Head (FP Micro)', 'Manager', 'Superuser');
        const canMarkChem  = this._can(roles, 'Section Head (FP Chemical)', 'Manager', 'Superuser');

        const selCount = this.selectedQCs.size;
        const selLabel = selCount > 0 ? ` (${selCount})` : '';

        let html = `<div class="action-bar">`;

        if (canAdd) {
            html += `<button class="btn btn-success" onclick="FinishedProductsPage.showAddDialog()">
                <i class="fas fa-plus"></i> Add
            </button>`;
        }
        if (canEdit) {
            html += `<button class="btn btn-primary" onclick="FinishedProductsPage.showEditDialog()">
                <i class="fas fa-edit"></i> Edit
            </button>`;
        }

        if (canMarkMicro) {
            html += `<button class="btn btn-warning" onclick="FinishedProductsPage.markMicro()">
                <i class="fas fa-microscope"></i> Mark Micro Done${selLabel}
            </button>`;
        }

        if (canMarkChem) {
            html += `<button class="btn btn-danger" onclick="FinishedProductsPage.markReviewed()">
                <i class="fas fa-vial"></i> Mark Chemical Done${selLabel}
            </button>`;
        }

        html += `<button class="btn btn-primary" onclick="FinishedProductsPage.openSearch()">
                <i class="fas fa-search"></i> Search
            </button>
            <button class="btn btn-secondary" onclick="FinishedProductsPage.clearSearch()">
                <i class="fas fa-times"></i> Clear
            </button>
        </div>`;

        html += renderDataTable(this.columns, this.rows, {
            multiSelect: true,
            selectedRows: this.selectedQCs,
            idField: 'QC No.',
            onRowClick: 'FinishedProductsPage.toggleRow',
            onSelectAll: 'FinishedProductsPage.toggleAll'
        });

        if (this.rows.length > 0 && this.rows.length < this.total) {
            html += `<div class="text-center mt-4">
                <button class="btn btn-secondary" onclick="FinishedProductsPage.loadMore()">
                    Load More (${this.rows.length}/${this.total})
                </button>
            </div>`;
        }

        html += '<div id="fin-dialog"></div>';
        return html;
    },

    async afterRender() {
        if (this.rows.length === 0 && !this.searchActive) await this.loadData();
    },

    async loadData() {
        try {
            const data = await api.getFinishedProducts(0, 30);
            this.rows = data.results || [];
            this.total = data.total || 0;
            this.offset = 30;
            App.renderContent();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    async loadMore() {
        try {
            const data = await api.getFinishedProducts(this.offset, 30);
            this.rows = [...this.rows, ...(data.results || [])];
            this.offset += 30;
            App.renderContent();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    // ── Add / Edit dialogs ──────────────────────
    async showAddDialog() {
        try {
            const [qcData, timeData] = await Promise.all([
                api.generateFinishedQC(),
                api.getServerTime()
            ]);
            const data = { date: timeData.datetime, qc: qcData.qc_number, micro_status: 'Pending', chemical_status: 'Pending' };
            this.editData = null;

            // Check roles to properly disable domains
            const roles = this._getRoles();
            const isManagerOrSuper = roles.some(r => r === 'Superuser' || r === 'Manager');
            const isMicroHead = roles.includes('Section Head (FP Micro)');
            const isHeadChemFP = roles.includes('Section Head (FP Chemical)');
            
            const canEditMicro = isManagerOrSuper || isMicroHead;
            const canEditChem = isManagerOrSuper || isHeadChemFP;

            // Clone fields and disable if appropriate
            const fields = this.entryFields.map(f => {
                if (!canEditMicro && ['micro', 'micro_status'].includes(f.key)) {
                    return { ...f, disabled: true };
                }
                if (!canEditChem && ['chemical', 'chemical_status'].includes(f.key)) {
                    return { ...f, disabled: true };
                }
                return f;
            });

            document.getElementById('fin-dialog').innerHTML = renderEntryDialog(
                'Add Finished Product', fields, data,
                'FinishedProductsPage.saveEntry', 'FinishedProductsPage.closeDialog');
        } catch (e) { App.toast(e.message, 'error'); }
    },

    showEditDialog() {
        if (this.selectedQCs.size === 0) { App.toast('Select a row to edit', 'warning'); return; }
        if (this.selectedQCs.size > 1) { App.toast('Select only one row to edit', 'warning'); return; }

        const qc = [...this.selectedQCs][0];
        const row = this.rows.find(r => String(r['QC No.']) === qc);
        if (!row) return;

        const data = {
            date: row['Date']?.slice(0, 16) || '', material: row['Material Name'] || '',
            material_code: row['Material Code'] || '',
            batch: row['Batch No.'] || '', qc: row['QC No.'] || '',
            micro: row['Micro'], micro_status: row['MicroStatus'] || 'Pending',
            chemical: row['Chemical'], chemical_status: row['ChemicalStatus'] || 'Pending',
            manufacture_date: App.formatDateInput(row['Manufacture Date']),
            expiry_date: App.formatDateInput(row['Expiry Date']),
            notes: row['Notes'] || '',
        };
        this.editData = row;

        const roles = this._getRoles();
        const isManagerOrSuper = roles.some(r => r === 'Manager' || r === 'Superuser');
        const isMicroHead = roles.includes('Section Head (FP Micro)');
        const isHeadChemFP = roles.includes('Section Head (FP Chemical)');

        const canEditMicro = isManagerOrSuper || isMicroHead;
        const canEditChem = isManagerOrSuper || isHeadChemFP;

        const fields = this.entryFields.map(f => {
            if (!canEditMicro && ['micro', 'micro_status'].includes(f.key)) return { ...f, disabled: true };
            if (!canEditChem && ['chemical', 'chemical_status'].includes(f.key)) return { ...f, disabled: true };
            return f;
        });

        document.getElementById('fin-dialog').innerHTML = renderEntryDialog(
            'Edit Finished Product', fields, data,
            'FinishedProductsPage.saveEntry', 'FinishedProductsPage.closeDialog');
    },

    async saveEntry() {
        const data = EntryDialog.getFormData(this.entryFields);
        try {
            if (this.editData) {
                await api.updateFinishedProduct(this.editData['QC No.'], data);
                App.toast('Updated successfully', 'success');
            } else {
                await api.addFinishedProduct(data);
                App.toast('Added successfully', 'success');
            }
            this.closeDialog();
            this.rows = []; this.selectedQCs.clear();
            await this.loadData();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    // ── Micro Review ────────────────────────────
    markMicro() {
        if (this.selectedQCs.size === 0) { App.toast('Select at least one row', 'warning'); return; }

        const count = this.selectedQCs.size;
        document.getElementById('fin-dialog').innerHTML = `
        <div class="modal-overlay" onclick="if(event.target===this) FinishedProductsPage.closeDialog()">
            <div class="modal" style="max-width:400px">
                <div class="modal-header">
                    <h3 class="modal-title">Micro Review${count > 1 ? ` — ${count} records` : ''}</h3>
                    <button class="modal-close" onclick="FinishedProductsPage.closeDialog()"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="checkbox-group mb-4">
                        <input type="checkbox" id="review-micro"> <label for="review-micro">Micro Check</label>
                    </div>
                    <div class="form-group">
                        <label>Micro Status</label>
                        <select class="form-input" id="review-micro-status">
                            <option>Pending</option><option>Accepted</option><option>Rejected</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="FinishedProductsPage.closeDialog()">Cancel</button>
                    <button class="btn btn-warning" onclick="FinishedProductsPage.doMarkMicro()">
                        <i class="fas fa-check"></i> Confirm
                    </button>
                </div>
            </div>
        </div>`;
    },

    async doMarkMicro() {
        const micro = document.getElementById('review-micro').checked;
        const micro_status = document.getElementById('review-micro-status').value;
        const qcs = [...this.selectedQCs];

        this.closeDialog();
        let errors = 0;
        for (const qcNo of qcs) {
            try {
                await api.markMicro(qcNo, { micro, micro_status });
            } catch (e) { errors++; }
        }

        if (errors === 0) {
            App.toast(`Micro review applied to ${qcs.length} record(s)`, 'success');
        } else {
            App.toast(`Done with ${errors} error(s)`, 'warning');
        }
        this.rows = []; this.selectedQCs.clear();
        await this.loadData();
    },

    // ── Chemical Review ──────────────────────────
    markReviewed() {
        if (this.selectedQCs.size === 0) { App.toast('Select at least one row', 'warning'); return; }

        const count = this.selectedQCs.size;
        document.getElementById('fin-dialog').innerHTML = `
        <div class="modal-overlay" onclick="if(event.target===this) FinishedProductsPage.closeDialog()">
            <div class="modal" style="max-width:400px">
                <div class="modal-header">
                    <h3 class="modal-title">Chemical Review${count > 1 ? ` — ${count} records` : ''}</h3>
                    <button class="modal-close" onclick="FinishedProductsPage.closeDialog()"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="checkbox-group mb-4">
                        <input type="checkbox" id="review-chemical"> <label for="review-chemical">Chemical Check</label>
                    </div>
                    <div class="form-group">
                        <label>Chemical Status</label>
                        <select class="form-input" id="review-status">
                            <option>Pending</option><option>Accepted</option><option>Rejected</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="FinishedProductsPage.closeDialog()">Cancel</button>
                    <button class="btn btn-accent" onclick="FinishedProductsPage.doMarkReviewed()">
                        <i class="fas fa-check"></i> Confirm
                    </button>
                </div>
            </div>
        </div>`;
    },

    async doMarkReviewed() {
        const chemical = document.getElementById('review-chemical').checked;
        const chemical_status = document.getElementById('review-status').value;
        const qcs = [...this.selectedQCs];

        this.closeDialog();
        let errors = 0;
        for (const qcNo of qcs) {
            try {
                await api.markReviewed(qcNo, { chemical, chemical_status });
            } catch (e) { errors++; }
        }

        if (errors === 0) {
            App.toast(`Chemical review applied to ${qcs.length} record(s)`, 'success');
        } else {
            App.toast(`Done with ${errors} error(s)`, 'warning');
        }
        this.rows = []; this.selectedQCs.clear();
        await this.loadData();
    },

    closeDialog() { document.getElementById('fin-dialog').innerHTML = ''; },

    // ── Search ───────────────────────────────────
    openSearch() {
        const fields = [
            { key: 'material_name', label: 'Material Name' },
            { key: 'batch_number', label: 'Batch No.' },
            { key: 'qc_number', label: 'QC No.' },
            { key: 'material_code', label: 'Material Code' },
            { key: 'status', label: 'Status' },
        ];
        document.getElementById('fin-dialog').innerHTML = renderSearchDialog(
            'Search Finished Products', fields,
            'FinishedProductsPage.doSearch', 'FinishedProductsPage.closeDialog');
    },

    async doSearch() {
        const filters = getSearchData([
            { key: 'material_name' }, { key: 'batch_number' }, { key: 'qc_number' },
            { key: 'material_code' }, { key: 'status' }
        ]);
        try {
            const data = await api.searchFinishedProducts(filters);
            this.rows = data.results || [];
            this.total = this.rows.length;
            this.searchActive = true;
            this.selectedQCs.clear();
            this.closeDialog();
            App.renderContent();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    async clearSearch() {
        this.searchActive = false; this.rows = []; this.selectedQCs.clear();
        await this.loadData();
    }
};
