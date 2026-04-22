// ──────────────────────────────────────────────
//  Packaging Materials Page
// ──────────────────────────────────────────────
// PackagingMaterialsPage
const PackagingMaterialsPage = {
    rows: [],
    selectedQCs: new Set(),
    editData: null,
    searchActive: false,
    offset: 0,
    total: 0,

    columns: [
        { key: 'Date', label: 'Date', render: (val) => App.formatDateTime(val) },
        { key: 'Material Name', label: 'Material Name' },
        { key: 'Material Code', label: 'Code' },
        { key: 'QC No.', label: 'QC No.' },
        { key: 'Micro', label: 'Micro', type: 'checkbox' },
        { key: 'MicroStatus', label: 'Micro Status', type: 'status' },
        { key: 'Chemical', label: 'Chemical', type: 'checkbox' },
        { key: 'ChemicalStatus', label: 'Chem Status', type: 'status' },
        { key: 'Manufacturer', label: 'Manufacturer' },
        { key: 'Supplier', label: 'Supplier' },
        { key: 'Status', label: 'Status', type: 'status' },
        { key: 'Notes', label: 'Notes' },
        { key: 'Created By', label: 'Created By' },
        { key: 'Edited By', label: 'Edited By' },
        { key: 'Edited Date', label: 'Edited Date' },
    ],

    entryFields: [
        { key: 'date', label: 'Date & Time', type: 'datetime', default: '' },
        { key: 'material', label: 'Material Name', type: 'product-search', category: 'Packaged' },
        { key: 'material_code', label: 'Material Code' },
        { key: 'qc', label: 'QC No.', readOnly: true },
        { key: 'micro', label: 'Micro', type: 'checkbox' },
        { key: 'micro_status', label: 'Micro Status', type: 'select', options: ['Pending', 'Accepted', 'Rejected'] },
        { key: 'chemical', label: 'Chemical', type: 'checkbox' },
        { key: 'chemical_status', label: 'Chemical Status', type: 'select', options: ['Pending', 'Accepted', 'Rejected'] },
        { key: 'manufacturer', label: 'Manufacturer' },
        { key: 'supplier', label: 'Supplier' },
        { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
    ],

    searchFields: [
        { key: 'material_name', label: 'Material Name' },
        { key: 'qc_number', label: 'QC No.' },
        { key: 'material_code', label: 'Material Code' },
        { key: 'manufacturer', label: 'Manufacturer' },
        { key: 'supplier', label: 'Supplier' },
        { key: 'status', label: 'Status' },
    ],

    render() {
        const user = api.getUser();
        const roles = user?.roles || [];

        const canAdd    = roles.some(r => ['Data Entry (PM)', 'Analyst (PM)', 'Analyst (FP Micro)', 'Section Head (PM)', 'Section Head (FP Micro)', 'Manager', 'Superuser'].includes(r));
        const canEdit   = roles.some(r => ['Section Head (PM)', 'Section Head (FP Micro)', 'Manager', 'Superuser'].includes(r));
        const canMarkMicro = roles.some(r => ['Section Head (FP Micro)', 'Manager', 'Superuser'].includes(r));
        const canMarkChem  = roles.some(r => ['Section Head (PM)', 'Manager', 'Superuser'].includes(r));
        
        const selLabel = this.selectedQCs.size > 0 ? ` (${this.selectedQCs.size})` : '';

        let html = `<div class="action-bar">`;
        
        if (canAdd) {
            html += `<button class="btn btn-success" onclick="PackagingMaterialsPage.showAddDialog()">
                <i class="fas fa-plus"></i> Add
            </button>`;
        }
        if (canEdit) {
            html += `<button class="btn btn-primary" onclick="PackagingMaterialsPage.showEditDialog()">
                <i class="fas fa-edit"></i> Edit
            </button>`;
        }

        if (canMarkMicro) {
            html += `<button class="btn btn-warning" onclick="PackagingMaterialsPage.markMicro()">
                <i class="fas fa-microscope"></i> Mark Micro Done${selLabel}
            </button>`;
        }
        if (canMarkChem) {
            html += `<button class="btn btn-danger" onclick="PackagingMaterialsPage.markReviewed()">
                <i class="fas fa-vial"></i> Mark Chemical Done${selLabel}
            </button>`;
        }

        html += `
            <button class="btn btn-primary" onclick="PackagingMaterialsPage.openSearch()">
                <i class="fas fa-search"></i> Search
            </button>
            <button class="btn btn-secondary" onclick="PackagingMaterialsPage.clearSearch()">
                <i class="fas fa-times"></i> Clear
            </button>
        </div>`;

        html += renderDataTable(this.columns, this.rows, {
            multiSelect: true,
            selectedRows: this.selectedQCs,
            onRowClick: 'PackagingMaterialsPage.toggleRow',
            onSelectAll: 'PackagingMaterialsPage.toggleAll',
            idField: 'QC No.'
        });

        if (this.rows.length > 0 && this.rows.length < this.total) {
            html += `<div class="text-center mt-4">
                <button class="btn btn-secondary" onclick="PackagingMaterialsPage.loadMore()">
                    Load More (${this.rows.length}/${this.total})
                </button>
            </div>`;
        }

        html += '<div id="pkg-dialog"></div>';
        return html;
    },

    async afterRender() {
        if (this.rows.length === 0 && !this.searchActive) await this.loadData();
    },

    async loadData() {
        try {
            const data = await api.getPackagingMaterials(0, 30);
            this.rows = data.results || [];
            this.total = data.total || 0;
            this.offset = 30;
            App.renderContent();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    async loadMore() {
        try {
            const data = await api.getPackagingMaterials(this.offset, 30);
            this.rows = [...this.rows, ...(data.results || [])];
            this.offset += 30;
            App.renderContent();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    toggleRow(idx) {
        const qc = String(this.rows[idx]['QC No.']);
        if (this.selectedQCs.has(qc)) this.selectedQCs.delete(qc);
        else this.selectedQCs.add(qc);
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

    async showAddDialog() {
        try {
            const [qcData, timeData] = await Promise.all([
                api.generatePackagingQC(),
                api.getServerTime()
            ]);
            const data = { date: timeData.datetime, qc: qcData.qc_number, status: 'Pending' };
            this.editData = null;

            // Check roles to properly disable domains
            const roles = api.getUser()?.roles || [];
            const isManagerOrSuper = roles.some(r => r === 'Superuser' || r === 'Manager');
            const isMicroHead = roles.includes('Section Head (FP Micro)');
            const isHeadPM = roles.includes('Section Head (PM)');
            
            const canEditMicro = isManagerOrSuper || isMicroHead;
            const canEditChem = isManagerOrSuper || isHeadPM;

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

            document.getElementById('pkg-dialog').innerHTML = renderEntryDialog(
                'Add Packaging Material', fields, data,
                'PackagingMaterialsPage.saveEntry', 'PackagingMaterialsPage.closeDialog');
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
            qc: row['QC No.'] || '',
            micro: row['Micro'], micro_status: row['MicroStatus'] || 'Pending',
            chemical: row['Chemical'], chemical_status: row['ChemicalStatus'] || 'Pending',
            manufacturer: row['Manufacturer'] || '', supplier: row['Supplier'] || '',
            status: row['Status'] || 'Pending', notes: row['Notes'] || '',
        };
        this.editData = row;

        const roles = api.getUser()?.roles || [];
        const isManagerOrSuper = roles.some(r => r === 'Superuser' || r === 'Manager');
        const isMicroHead = roles.includes('Section Head (FP Micro)');
        const isHeadPM = roles.includes('Section Head (PM)');

        const canEditMicro = isManagerOrSuper || isMicroHead;
        const canEditChem = isManagerOrSuper || isHeadPM;

        const fields = this.entryFields.map(f => {
            if (!canEditMicro && ['micro', 'micro_status'].includes(f.key)) {
                return { ...f, disabled: true };
            }
            if (!canEditChem && ['chemical', 'chemical_status'].includes(f.key)) {
                return { ...f, disabled: true };
            }
            return f;
        });

        document.getElementById('pkg-dialog').innerHTML = renderEntryDialog(
            'Edit Packaging Material', fields, data,
            'PackagingMaterialsPage.saveEntry', 'PackagingMaterialsPage.closeDialog');
    },

    // ── Quick Mark Done ─────────────────────────
    markMicro() {
        if (this.selectedQCs.size === 0) { App.toast('Select at least one row', 'warning'); return; }
        const count = this.selectedQCs.size;
        document.getElementById('pkg-dialog').innerHTML = `
        <div class="modal-overlay" onclick="if(event.target===this) PackagingMaterialsPage.closeDialog()">
            <div class="modal" style="max-width:400px">
                <div class="modal-header">
                    <h3 class="modal-title">Micro Review${count > 1 ? ` — ${count} records` : ''}</h3>
                    <button class="modal-close" onclick="PackagingMaterialsPage.closeDialog()"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="checkbox-group mb-4">
                        <input type="checkbox" id="rev-micro-pkg"> <label for="rev-micro-pkg">Micro Check</label>
                    </div>
                    <div class="form-group">
                        <label>Micro Status</label>
                        <select class="form-input" id="rev-micro-status-pkg">
                            <option>Accepted</option><option>Rejected</option><option>Pending</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="PackagingMaterialsPage.closeDialog()">Cancel</button>
                    <button class="btn btn-warning" onclick="PackagingMaterialsPage.doMarkMicro()">Confirm</button>
                </div>
            </div>
        </div>`;
    },

    async doMarkMicro() {
        const micro = document.getElementById('rev-micro-pkg').checked;
        const micro_status = document.getElementById('rev-micro-status-pkg').value;
        const qcs = [...this.selectedQCs];
        this.closeDialog();

        let errs = 0;
        for (const qc of qcs) {
            try { await api.markPmMicro(qc, { micro, micro_status }); }
            catch (e) { errs++; }
        }
        if (errs) App.toast(`Completed with ${errs} errors`, 'warning');
        else App.toast(`Updated ${qcs.length} record(s)`, 'success');
        this.rows = []; this.selectedQCs.clear();
        await this.loadData();
    },

    markReviewed() {
        if (this.selectedQCs.size === 0) { App.toast('Select at least one row', 'warning'); return; }
        const count = this.selectedQCs.size;
        document.getElementById('pkg-dialog').innerHTML = `
        <div class="modal-overlay" onclick="if(event.target===this) PackagingMaterialsPage.closeDialog()">
            <div class="modal" style="max-width:400px">
                <div class="modal-header">
                    <h3 class="modal-title">Chemical Review${count > 1 ? ` — ${count} records` : ''}</h3>
                    <button class="modal-close" onclick="PackagingMaterialsPage.closeDialog()"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="checkbox-group mb-4">
                        <input type="checkbox" id="rev-chem-pkg"> <label for="rev-chem-pkg">Chemical Check</label>
                    </div>
                    <div class="form-group">
                        <label>Chemical Status</label>
                        <select class="form-input" id="rev-chem-status-pkg">
                            <option>Accepted</option><option>Rejected</option><option>Pending</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="PackagingMaterialsPage.closeDialog()">Cancel</button>
                    <button class="btn btn-danger" onclick="PackagingMaterialsPage.doMarkReviewed()">Confirm</button>
                </div>
            </div>
        </div>`;
    },

    async doMarkReviewed() {
        const chemical = document.getElementById('rev-chem-pkg').checked;
        const chemical_status = document.getElementById('rev-chem-status-pkg').value;
        const qcs = [...this.selectedQCs];
        this.closeDialog();

        let errs = 0;
        for (const qc of qcs) {
            try { await api.markPmReviewed(qc, { chemical, chemical_status }); }
            catch (e) { errs++; }
        }
        if (errs) App.toast(`Completed with ${errs} errors`, 'warning');
        else App.toast(`Updated ${qcs.length} record(s)`, 'success');
        this.rows = []; this.selectedQCs.clear();
        await this.loadData();
    },

    async saveEntry() {
        const data = EntryDialog.getFormData(this.entryFields);
        try {
            if (this.editData) {
                await api.updatePackagingMaterial(this.editData['QC No.'], data);
                App.toast('Updated successfully', 'success');
            } else {
                await api.addPackagingMaterial(data);
                App.toast('Added successfully', 'success');
            }
            this.closeDialog();
            this.rows = []; this.selectedQCs.clear();
            await this.loadData();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    closeDialog() { document.getElementById('pkg-dialog').innerHTML = ''; },

    openSearch() {
        document.getElementById('pkg-dialog').innerHTML = renderSearchDialog(
            'Search Packaging Materials', this.searchFields,
            'PackagingMaterialsPage.doSearch', 'PackagingMaterialsPage.closeDialog');
    },

    async doSearch() {
        const filters = getSearchData(this.searchFields);
        try {
            const data = await api.searchPackagingMaterials(filters);
            this.rows = data.results || [];
            this.total = this.rows.length;
            this.searchActive = true;
            this.closeDialog();
            App.renderContent();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    async clearSearch() {
        this.searchActive = false; this.rows = []; this.selectedIdx = -1;
        await this.loadData();
    }
};
