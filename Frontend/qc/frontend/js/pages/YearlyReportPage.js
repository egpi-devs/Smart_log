// ──────────────────────────────────────────────
//  Yearly Report Page  (with built-in edit dialog)
// ──────────────────────────────────────────────

const YearlyReportPage = {
    rows: [],
    category: 'raw',
    year: new Date().getFullYear() - 1,
    searchQuery: '',
    offset: 0,
    total: 0,
    searchActive: false,
    selectedQCs: new Set(),

    // ... field definitions ...

    // ── field definitions per category ───────────
    _fields: {
        raw: [
            { key: 'date', label: 'Date & Time', type: 'datetime' },
            { key: 'material', label: 'Material Name', type: 'product-search', category: 'Raw' },
            { key: 'material_code', label: 'Material Code' },
            { key: 'category', label: 'Category', readOnly: true },
            { key: 'batch', label: 'Batch No.' },
            { key: 'qc', label: 'QC No.', readOnly: true },
            { key: 'micro', label: 'Micro', type: 'checkbox' },
            {
                key: 'micro_status', label: 'Micro Status', type: 'select',
                options: ['Pending', 'Accepted', 'Rejected']
            },
            { key: 'chemical', label: 'Chemical', type: 'checkbox' },
            {
                key: 'chemical_status', label: 'Chemical Status', type: 'select',
                options: ['Pending', 'Accepted', 'Rejected']
            },
            { key: 'manufacturer', label: 'Manufacturer' },
            { key: 'supplier', label: 'Supplier' },
            { key: 'manufacture_date', label: 'Manufacture Date', type: 'date' },
            { key: 'expiry_date', label: 'Expiry Date', type: 'date' },
            { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
        ],
        packaging: [
            { key: 'date', label: 'Date & Time', type: 'datetime' },
            { key: 'material', label: 'Material Name', type: 'product-search', category: 'Packaged' },
            { key: 'material_code', label: 'Material Code' },
            { key: 'category', label: 'Category', readOnly: true },
            { key: 'qc', label: 'QC No.', readOnly: true },
            { key: 'micro', label: 'Micro', type: 'checkbox' },
            {
                key: 'micro_status', label: 'Micro Status', type: 'select',
                options: ['Pending', 'Accepted', 'Rejected']
            },
            { key: 'chemical', label: 'Chemical', type: 'checkbox' },
            {
                key: 'chemical_status', label: 'Chemical Status', type: 'select',
                options: ['Pending', 'Accepted', 'Rejected']
            },
            { key: 'manufacturer', label: 'Manufacturer' },
            { key: 'supplier', label: 'Supplier' },
            { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
        ],
        finished: [
            { key: 'date', label: 'Date & Time', type: 'datetime' },
            { key: 'material', label: 'Material Name', type: 'product-search', category: 'Finished' },
            { key: 'material_code', label: 'Material Code' },
            { key: 'category', label: 'Category', readOnly: true },
            { key: 'batch', label: 'Batch No.' },
            { key: 'qc', label: 'QC No.', readOnly: true },
            { key: 'micro', label: 'Micro', type: 'checkbox' },
            {
                key: 'micro_status', label: 'Micro Status', type: 'select',
                options: ['Pending', 'Accepted', 'Rejected']
            },
            { key: 'chemical', label: 'Chemical', type: 'checkbox' },
            {
                key: 'chemical_status', label: 'Chemical Status', type: 'select',
                options: ['Pending', 'Accepted', 'Rejected']
            },
            { key: 'manufacture_date', label: 'Manufacture Date', type: 'date' },
            { key: 'expiry_date', label: 'Expiry Date', type: 'date' },
            { key: 'notes', label: 'Notes', type: 'textarea', fullWidth: true },
        ],
    },

    searchFields: [
        { key: 'material_name', label: 'Material Name' },
        { key: 'qc_number', label: 'QC No.' },
        { key: 'batch_number', label: 'Batch No.' },
    ],

    // ── map DB row → form data object ────────────
    _rowToFormData(row) {
        if (this.category === 'raw') {
            return {
                date: (row['Date'] || '').toString().slice(0, 16),
                material: row['Material Name'] || '',
                material_code: row['Material Code'] || '',
                batch: row['Batch No.'] || '',
                qc: row['QC No.'] || '',
                micro: row['Micro'],
                micro_status: row['MicroStatus'] || 'Pending',
                chemical: row['Chemical'],
                chemical_status: row['ChemicalStatus'] || 'Pending',
                manufacturer: row['Manufacturer'] || '',
                supplier: row['Supplier'] || '',
                manufacture_date: App.formatDateInput(row['Manufacture Date']),
                expiry_date: App.formatDateInput(row['Expiry Date']),
                notes: row['Notes'] || '',
            };
        }
        if (this.category === 'packaging') {
            return {
                date: (row['Date'] || '').toString().slice(0, 16),
                material: row['Material Name'] || '',
                material_code: row['Material Code'] || '',
                qc: row['QC No.'] || '',
                micro: row['Micro'],
                micro_status: row['MicroStatus'] || 'Pending',
                chemical: row['Chemical'],
                chemical_status: row['ChemicalStatus'] || 'Pending',
                manufacturer: row['Manufacturer'] || '',
                supplier: row['Supplier'] || '',
                notes: row['Notes'] || '',
            };
        }
        // finished
        return {
            date: (row['Date'] || '').toString().slice(0, 16),
            material: row['Material Name'] || '',
            material_code: row['Material Code'] || '',
            batch: row['Batch No.'] || '',
            qc: row['QC No.'] || '',
            micro: row['Micro'],
            micro_status: row['MicroStatus'] || 'Pending',
            chemical: row['Chemical'],
            chemical_status: row['ChemicalStatus'] || 'Pending',
            manufacture_date: App.formatDateInput(row['Manufacture Date']),
            expiry_date: App.formatDateInput(row['Expiry Date']),
            notes: row['Notes'] || '',
        };
    },

    // ── column definitions ────────────────────────
    getColumns() {
        if (this.category === 'finished') {
            return [
                { key: 'Date', label: 'Date', render: (val) => App.formatDateTime(val) },
                { key: 'Material Name', label: 'Material' },
                { key: 'Material Code', label: 'Code' },
                { key: 'Batch No.', label: 'Batch' },
                { key: 'QC No.', label: 'QC No.' },
                { key: 'Status', label: 'Status', type: 'status' },
            ];
        }
        return [
            { key: 'Date', label: 'Date', render: (val) => App.formatDateTime(val) },
            { key: 'Material Name', label: 'Material' },
            { key: 'Material Code', label: 'Code' },
            { key: 'QC No.', label: 'QC No.' },
            { key: 'Status', label: 'Status', type: 'status' },
        ];
    },

    // ── render ────────────────────────────────────
    render() {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let y = 2025; y <= currentYear - 1; y++) years.push(y);

        const roles = api.getUser()?.roles || [];
        const canEdit = {
            raw: roles.some(r => ['Section Head (RM)', 'Manager', 'Superuser'].includes(r)),
            packaging: roles.some(r => ['Section Head (PM)', 'Manager', 'Superuser'].includes(r)),
            finished: roles.some(r => ['Section Head (FP Micro)', 'Section Head (FP Chemical)', 'Manager', 'Superuser'].includes(r)),
        }[this.category];

        const canMarkMicro = {
            raw: roles.some(r => ['Section Head (FP Micro)', 'Manager', 'Superuser'].includes(r)),
            packaging: roles.some(r => ['Section Head (FP Micro)', 'Manager', 'Superuser'].includes(r)),
            finished: roles.some(r => ['Section Head (FP Micro)', 'Manager', 'Superuser'].includes(r)),
        }[this.category];

        const canMarkChem = {
            raw: roles.some(r => ['Section Head (RM)', 'Manager', 'Superuser'].includes(r)),
            packaging: roles.some(r => ['Section Head (PM)', 'Manager', 'Superuser'].includes(r)),
            finished: roles.some(r => ['Section Head (FP Chemical)', 'Manager', 'Superuser'].includes(r)),
        }[this.category];

        const selCount = this.selectedQCs.size;
        const selLabel = selCount > 0 ? ` (${selCount})` : '';

        const catLabels = {
            raw: 'Raw Materials',
            packaging: 'Packaging Materials',
            finished: 'Finished Products'
        };

        let html = `
        <div class="year-selector">
            <label style="font-weight:600;color:var(--text-secondary)">Year:</label>
            <select onchange="YearlyReportPage.changeYear(this.value)">
                ${years.map(y => `<option value="${y}" ${y == this.year ? 'selected' : ''}>${y}</option>`).join('')}
            </select>
            <span style="color:var(--text-muted);margin-left:8px">${catLabels[this.category] || ''}</span>
        </div>

        <div class="action-bar">
            ${canEdit ? `<button class="btn btn-primary" onclick="YearlyReportPage.editEntry()">
                <i class="fas fa-edit"></i> Edit
            </button>` : ''}
            
            ${canMarkMicro ? `<button class="btn btn-warning" onclick="YearlyReportPage.markMicro()">
                <i class="fas fa-microscope"></i> Mark Micro Done${selLabel}
            </button>` : ''}

            ${canMarkChem ? `<button class="btn btn-danger" onclick="YearlyReportPage.markChemical()">
                <i class="fas fa-vial"></i> Mark Chemical Done${selLabel}
            </button>` : ''}

            <button class="btn btn-primary" onclick="YearlyReportPage.openSearch()">
                <i class="fas fa-search"></i> Search
            </button>
            <button class="btn btn-secondary" onclick="YearlyReportPage.clearSearch()">
                <i class="fas fa-times"></i> Clear
            </button>
        </div>`;

        html += renderDataTable(this.getColumns(), this.rows, {
            multiSelect: true,
            selectedRows: this.selectedQCs,
            onRowClick: 'YearlyReportPage.toggleRow',
            onSelectAll: 'YearlyReportPage.toggleAll',
            idField: 'QC No.'
        });

        if (this.rows.length > 0 && this.rows.length < this.total) {
            html += `<div class="text-center mt-4">
                <button class="btn btn-secondary" onclick="YearlyReportPage.loadMore()">
                    Load More (${this.rows.length}/${this.total})
                </button>
            </div>`;
        }

        html += '<div id="yearly-dialog"></div>';
        return html;
    },

    async afterRender() {
        if (this.rows.length === 0) await this.loadData();
    },

    setCategory(cat) {
        this.category = cat;
        this.rows = [];
        this.selectedQCs.clear();
        this.offset = 0;
    },

    changeYear(yr) {
        this.year = parseInt(yr);
        this.rows = [];
        this.selectedQCs.clear();
        this.offset = 0;
        this.loadData();
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

    // ── Bulk Mark Micro ──────────────────────────
    markMicro() {
        if (this.selectedQCs.size === 0) { App.toast('Select at least one row', 'warning'); return; }
        const count = this.selectedQCs.size;
        document.getElementById('yearly-dialog').innerHTML = `
        <div class="modal-overlay" onclick="if(event.target===this) YearlyReportPage.closeDialog()">
            <div class="modal" style="max-width:400px">
                <div class="modal-header">
                    <h3 class="modal-title">Bulk Micro Review${count > 1 ? ` — ${count} records` : ''}</h3>
                    <button class="modal-close" onclick="YearlyReportPage.closeDialog()"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="checkbox-group mb-4">
                        <input type="checkbox" id="bulk-rev-micro"> <label for="bulk-rev-micro">Micro Check</label>
                    </div>
                    <div class="form-group">
                        <label>Micro Status</label>
                        <select class="form-input" id="bulk-rev-micro-status">
                            <option>Accepted</option><option>Rejected</option><option>Pending</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="YearlyReportPage.closeDialog()">Cancel</button>
                    <button class="btn btn-warning" onclick="YearlyReportPage.doMarkMicro()">Confirm</button>
                </div>
            </div>
        </div>`;
    },

    async doMarkMicro() {
        const micro = document.getElementById('bulk-rev-micro').checked;
        const micro_status = document.getElementById('bulk-rev-micro-status').value;
        const qcs = [...this.selectedQCs];
        this.closeDialog();

        let errs = 0;
        for (const qc of qcs) {
            try {
                if (this.category === 'raw') await api.markRawMicro(qc, { micro, micro_status });
                else if (this.category === 'packaging') await api.markPmMicro(qc, { micro, micro_status });
                else await api.markMicro(qc, { micro, micro_status });
            } catch (e) { errs++; }
        }
        if (errs) App.toast(`Completed with ${errs} errors`, 'warning');
        else App.toast(`Updated ${qcs.length} record(s)`, 'success');
        this.rows = []; this.selectedQCs.clear();
        await this.loadData();
    },

    // ── Bulk Mark Chemical ───────────────────────
    markChemical() {
        if (this.selectedQCs.size === 0) { App.toast('Select at least one row', 'warning'); return; }
        const count = this.selectedQCs.size;
        document.getElementById('yearly-dialog').innerHTML = `
        <div class="modal-overlay" onclick="if(event.target===this) YearlyReportPage.closeDialog()">
            <div class="modal" style="max-width:400px">
                <div class="modal-header">
                    <h3 class="modal-title">Bulk Chemical Review${count > 1 ? ` — ${count} records` : ''}</h3>
                    <button class="modal-close" onclick="YearlyReportPage.closeDialog()"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="checkbox-group mb-4">
                        <input type="checkbox" id="bulk-rev-chem"> <label for="bulk-rev-chem">Chemical Check</label>
                    </div>
                    <div class="form-group">
                        <label>Chemical Status</label>
                        <select class="form-input" id="bulk-rev-chem-status">
                            <option>Accepted</option><option>Rejected</option><option>Pending</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="YearlyReportPage.closeDialog()">Cancel</button>
                    <button class="btn btn-danger" onclick="YearlyReportPage.doMarkChemical()">Confirm</button>
                </div>
            </div>
        </div>`;
    },

    async doMarkChemical() {
        const chemical = document.getElementById('bulk-rev-chem').checked;
        const chemical_status = document.getElementById('bulk-rev-chem-status').value;
        const qcs = [...this.selectedQCs];
        this.closeDialog();

        let errs = 0;
        for (const qc of qcs) {
            try {
                if (this.category === 'raw') await api.markRawReviewed(qc, { chemical, chemical_status });
                else if (this.category === 'packaging') await api.markPmReviewed(qc, { chemical, chemical_status });
                else await api.markReviewed(qc, { chemical, chemical_status });
            } catch (e) { errs++; }
        }
        if (errs) App.toast(`Completed with ${errs} errors`, 'warning');
        else App.toast(`Updated ${qcs.length} record(s)`, 'success');
        this.rows = []; this.selectedQCs.clear();
        await this.loadData();
    },

    async loadData() {
        try {
            const data = await api.getYearlyReport(this.category, this.year, 0, 30, this.searchQuery);
            this.rows = data.results || [];
            this.total = data.total || 0;
            this.offset = 30;
            App.renderContent();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    async loadMore() {
        try {
            const data = await api.getYearlyReport(this.category, this.year, this.offset, 30, this.searchQuery);
            this.rows = [...this.rows, ...(data.results || [])];
            this.offset += 30;
            App.renderContent();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    openSearch() {
        const el = document.getElementById('yearly-dialog');
        el.innerHTML = renderSearchDialog('Search Report', this.searchFields,
            'YearlyReportPage.doSearch', 'YearlyReportPage.closeDialog');
    },

    async doSearch() {
        const filters = getSearchData(this.searchFields);
        // Combine filters into a single search query for simplicity, or we could update the backend to handle full filters
        // For now, let's take the first non-empty value
        this.searchQuery = filters.material_name || filters.qc_number || filters.batch_number || '';
        this.searchActive = true;
        this.rows = [];
        this.offset = 0;
        this.closeDialog();
        await this.loadData();
    },

    async clearSearch() {
        this.searchQuery = '';
        this.searchActive = false;
        this.rows = [];
        this.offset = 0;
        await this.loadData();
    },

    // ── open edit dialog ──────────────────────────
    editEntry() {
        if (this.selectedQCs.size === 0) {
            App.toast('Please select a row to edit', 'warning');
            return;
        }
        if (this.selectedQCs.size > 1) {
            App.toast('Please select only one row to edit', 'warning');
            return;
        }

        const qc = [...this.selectedQCs][0];
        const row = this.rows.find(r => String(r['QC No.']) === qc);
        if (!row) return;
        const fields = this._fields[this.category];
        const data = this._rowToFormData(row);

        // Apply role-based status disable
        const user = api.getUser();
        const roles = user?.roles || [];
        const headRoles = {
            raw: ['Section Head (RM)', 'Manager', 'Superuser'],
            packaging: ['Section Head (PM)', 'Manager', 'Superuser'],
            finished: ['Manager', 'Superuser'],
        }[this.category] || [];
        fields.forEach(f => {
            if (f.key === 'micro_status' || f.key === 'chemical_status') {
                f.disabled = !roles.some(r => headRoles.includes(r));
            }
        });

        const catLabel = {
            raw: 'Raw Material',
            packaging: 'Packaging Material',
            finished: 'Finished Product'
        }[this.category] || 'Entry';

        const dialogEl = document.getElementById('yearly-dialog');
        if (!dialogEl) {
            App.toast('Page not ready, please try again', 'warning');
            return;
        }

        dialogEl.innerHTML = renderEntryDialog(
            `Edit ${catLabel} — ${row['QC No.']}`,
            fields,
            data,
            'YearlyReportPage.saveEdit',
            'YearlyReportPage.closeDialog'
        );

        // Pre-fill the product search visible input
        const searchEl = document.getElementById('field-material-search');
        if (searchEl) searchEl.value = data.material;
    },

    // ── save edit ─────────────────────────────────
    async saveEdit() {
        if (YearlyReportPage.selectedQCs.size !== 1) return;
        const qc = [...YearlyReportPage.selectedQCs][0];
        const row = YearlyReportPage.rows.find(r => String(r['QC No.']) === qc);
        if (!row) return;
        
        const qcNo = row['QC No.'];
        const fields = YearlyReportPage._fields[YearlyReportPage.category];
        const data = EntryDialog.getFormData(fields);

        try {
            if (YearlyReportPage.category === 'raw') {
                await api.updateRawMaterial(qcNo, data);
            } else if (YearlyReportPage.category === 'packaging') {
                await api.updatePackagingMaterial(qcNo, data);
            } else {
                await api.updateFinishedProduct(qcNo, data);
            }
            App.toast('Entry updated successfully', 'success');
            YearlyReportPage.closeDialog();
            YearlyReportPage.rows = [];
            YearlyReportPage.selectedQCs.clear();
            await YearlyReportPage.loadData();
        } catch (e) {
            App.toast(e.message, 'error');
        }
    },

    closeDialog() {
        const el = document.getElementById('yearly-dialog');
        if (el) el.innerHTML = '';
    }
};
