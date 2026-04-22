// ──────────────────────────────────────────────
//  Product Management Page
// ──────────────────────────────────────────────
// ProductManagementPage
const ProductManagementPage = {
    rows: [],
    selectedIdx: -1,
    category: '',

    columns: [
        { key: 'ProductName', label: 'Product Name' },
        { key: 'ProductCategory', label: 'Category' },
    ],

    render() {
        const user = api.getUser();
        const roles = user?.roles || [];

        // Determine available categories
        let categories = ['Raw', 'Packaged', 'Finished'];
        const catMap = { 'Raw': 'RM', 'Packaged': 'PM', 'Finished': 'FP' };

        let html = `
        <div class="filter-bar">
            <label>Category:</label>
            <select class="form-input" id="pm-category" onchange="ProductManagementPage.filterByCategory(this.value)"
                    style="max-width:180px">
                <option value="">All</option>
                ${categories.map(c => `<option value="${c}" ${c === this.category ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
            <label>Search:</label>
            <input type="text" class="form-input" id="pm-search" placeholder="Search product name..."
                   onkeydown="if(event.key==='Enter') ProductManagementPage.search()">
            <button class="btn btn-primary btn-sm" onclick="ProductManagementPage.search()">
                <i class="fas fa-search"></i> Search
            </button>
        </div>

        <div class="action-bar">
            <button class="btn btn-success" onclick="ProductManagementPage.showAddDialog()">
                <i class="fas fa-plus"></i> Add Product
            </button>
            <button class="btn btn-primary" onclick="ProductManagementPage.showEditDialog()">
                <i class="fas fa-edit"></i> Edit
            </button>
        </div>`;

        html += renderDataTable(this.columns, this.rows, {
            onRowClick: 'ProductManagementPage.selectRow',
            selectedRow: this.selectedIdx >= 0 ? this.rows[this.selectedIdx]?.ProductName : null,
            idField: 'ProductName'
        });

        html += '<div id="pm-dialog"></div>';
        return html;
    },

    async afterRender() {
        if (this.rows.length === 0) await this.loadData();
    },

    async loadData() {
        try {
            const data = await api.getProducts('', 'ProductName', this.category);
            this.rows = data.results || [];
            App.renderContent();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    async search() {
        const q = document.getElementById('pm-search')?.value || '';
        try {
            const data = await api.getProducts(q, 'ProductName', this.category);
            this.rows = data.results || [];
            App.renderContent();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    filterByCategory(cat) {
        this.category = cat;
        this.rows = [];
        this.selectedIdx = -1;
        this.loadData();
    },

    selectRow(idx) { this.selectedIdx = idx; App.renderContent(); },

    showAddDialog() {
        const fields = [
            { key: 'name', label: 'Product Name' },
            { key: 'category', label: 'Category', type: 'select', options: ['Raw', 'Packaged', 'Finished'] },
        ];
        document.getElementById('pm-dialog').innerHTML = renderEntryDialog(
            'Add Product', fields, { category: this.category || 'Raw' },
            'ProductManagementPage.saveProduct', 'ProductManagementPage.closeDialog');
    },

    showEditDialog() {
        if (this.selectedIdx < 0) { App.toast('Select a row', 'warning'); return; }
        const row = this.rows[this.selectedIdx];
        const fields = [
            { key: 'name', label: 'Product Name' },
            { key: 'category', label: 'Category', type: 'select', options: ['Raw', 'Packaged', 'Finished'] },
        ];
        document.getElementById('pm-dialog').innerHTML = renderEntryDialog(
            'Edit Product', fields, { name: row.ProductName, category: row.ProductCategory },
            'ProductManagementPage.updateProduct', 'ProductManagementPage.closeDialog');
    },

    async saveProduct() {
        const name = document.getElementById('field-name')?.value || '';
        const category = document.getElementById('field-category')?.value || '';
        try {
            await api.addProduct({ name, category });
            App.toast('Product added', 'success');
            this.closeDialog(); this.rows = []; await this.loadData();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    async updateProduct() {
        const row = this.rows[this.selectedIdx];
        const name = document.getElementById('field-name')?.value || '';
        const category = document.getElementById('field-category')?.value || '';
        try {
            await api.updateProduct(row.ProductID, { name, category });
            App.toast('Product updated', 'success');
            this.closeDialog(); this.rows = []; this.selectedIdx = -1; await this.loadData();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    closeDialog() { document.getElementById('pm-dialog').innerHTML = ''; }
};
