// ──────────────────────────────────────────────
//  Production Products Page
// ──────────────────────────────────────────────

const ProductionProductsPage = {
    rows: [],
    selectedIdx: -1,

    columns: [
        { key: 'ProductName', label: 'Product Name' },
        { key: 'ProductCode', label: 'Code' },
    ],

    render() {
        let html = `
        <div class="filter-bar">
            <label>Search:</label>
            <input type="text" class="form-input" id="pp-search" placeholder="Search product name or code..."
                   onkeydown="if(event.key==='Enter') ProductionProductsPage.search()">
            <button class="btn btn-primary btn-sm" onclick="ProductionProductsPage.search()">
                <i class="fas fa-search"></i> Search
            </button>
        </div>

        <div class="action-bar">
            <button class="btn btn-success" onclick="ProductionProductsPage.showAddDialog()">
                <i class="fas fa-plus"></i> Add Product
            </button>
            <button class="btn btn-primary" onclick="ProductionProductsPage.showEditDialog()">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-danger" onclick="ProductionProductsPage.deleteProduct()">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>`;

        html += renderDataTable(this.columns, this.rows, {
            onRowClick: 'ProductionProductsPage.selectRow',
            selectedRow: this.selectedIdx >= 0 ? this.rows[this.selectedIdx]?.ID : null,
            idField: 'ID'
        });

        html += '<div id="pp-dialog"></div>';
        return html;
    },

    async afterRender() {
        if (this.rows.length === 0) await this.loadData();
    },

    async loadData() {
        try {
            const data = await api.getProductionProducts('');
            this.rows = data.results || [];
            App.renderContent();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    async search() {
        const q = document.getElementById('pp-search')?.value || '';
        try {
            const data = await api.getProductionProducts(q);
            this.rows = data.results || [];
            this.selectedIdx = -1;
            App.renderContent();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    selectRow(idx) { this.selectedIdx = idx; App.renderContent(); },

    // ──────────────────────────────────────────────
    // Styled Confirm Dialog (reusing ProductionAuditPage's method)
    // ──────────────────────────────────────────────
    
    showConfirm({ title, message, confirmText, confirmClass, icon, iconBg, iconColor, onConfirm }) {
        // Use the same styled confirm from ProductionAuditPage
        ProductionAuditPage.showConfirm({
            title: title,
            message: message,
            confirmText: confirmText,
            confirmClass: confirmClass,
            icon: icon,
            iconBg: iconBg,
            iconColor: iconColor,
            onConfirm: onConfirm
        });
    },

    showAddDialog() {
        const fields = [
            { key: 'ProductName', label: 'Product Name', required: true },
            { key: 'ProductCode', label: 'Product Code' },
        ];
        document.getElementById('pp-dialog').innerHTML = renderEntryDialog(
            'Add Product', fields, {},
            'ProductionProductsPage.saveProduct', 'ProductionProductsPage.closeDialog');
    },

    showEditDialog() {
        if (this.selectedIdx < 0) { App.toast('Select a row', 'warning'); return; }
        const row = this.rows[this.selectedIdx];
        const fields = [
            { key: 'ProductName', label: 'Product Name', required: true },
            { key: 'ProductCode', label: 'Product Code' },
        ];
        document.getElementById('pp-dialog').innerHTML = renderEntryDialog(
            'Edit Product', fields, { ProductName: row.ProductName, ProductCode: row.ProductCode || '' },
            'ProductionProductsPage.updateProduct', 'ProductionProductsPage.closeDialog');
    },

    async saveProduct() {
        const data = EntryDialog.getFormData([
            { key: 'ProductName' }, { key: 'ProductCode' }
        ]);
        if (!data.ProductName) { App.toast('Product Name is required', 'warning'); return; }
        
        try {
            await api.addProductionProduct(data);
            App.toast('Product added', 'success');
            this.closeDialog(); 
            this.rows = []; 
            await this.loadData();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    async updateProduct() {
        const row = this.rows[this.selectedIdx];
        const data = EntryDialog.getFormData([
            { key: 'ProductName' }, { key: 'ProductCode' }
        ]);
        if (!data.ProductName) { App.toast('Product Name is required', 'warning'); return; }
        
        try {
            await api.updateProductionProduct(row.ID, data);
            App.toast('Product updated', 'success');
            this.closeDialog(); 
            this.rows = []; 
            this.selectedIdx = -1; 
            await this.loadData();
        } catch (e) { App.toast(e.message, 'error'); }
    },

    async deleteProduct() {
        if (this.selectedIdx < 0) { 
            App.toast('Select a row', 'warning'); 
            return; 
        }
        
        const row = this.rows[this.selectedIdx];
        
        // Use styled confirm dialog instead of native confirm
        this.showConfirm({
            title: 'Delete Product',
            message: `Are you sure you want to delete "${row.ProductName}"? This action cannot be undone.`,
            confirmText: 'Delete',
            confirmClass: 'btn-danger',
            icon: 'fas fa-trash',
            iconBg: '#FCEBEB',
            iconColor: '#A32D2D',
            onConfirm: async () => {
                try {
                    await api.deleteProductionProduct(row.ID);
                    App.toast('Product deleted', 'success');
                    this.rows = []; 
                    this.selectedIdx = -1; 
                    await this.loadData();
                } catch (e) { 
                    App.toast(e.message, 'error'); 
                }
            }
        });
    },

    closeDialog() { document.getElementById('pp-dialog').innerHTML = ''; }
};