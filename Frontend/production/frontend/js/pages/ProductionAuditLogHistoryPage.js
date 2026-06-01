// ──────────────────────────────────────────────
//  Production Audit Log History Page
// ──────────────────────────────────────────────

const ProductionAuditLogHistoryPage = {
    rows: [],
    products: [],
    total: 0,
    offset: 0,
    limit: 50,
    filters: {
        user: '',
        entity_type: '',
        action: '',
        search: '',
        date_from: '',
        date_to: '',
        product_name: '',
        batch_no: ''
    },

    columns: [
        { 
            key: 'Timestamp', 
            label: 'Date', 
            render: (val, row) => {
                if (!row.Timestamp) return '';
                const d = new Date(row.Timestamp);
                if (isNaN(d.getTime())) return String(row.Timestamp).split('T')[0];
                
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                
                return `${day}-${month}-${year}`;
            } 
        },
        { key: 'Username', label: 'User' },
        { key: 'ActionType', label: 'Action' },
        { key: 'EntityType', label: 'Type' },
        { 
            key: 'ProductName', 
            label: 'Product Name', 
            render: (val, row) => {
                if (row.Details && row.Details.includes('Product:')) {
                    const match = row.Details.match(/Product:\s*(.*?)(?:\s*\||$)/);
                    if (match && match[1].trim()) return match[1].trim();
                }
                if (row.NewValues) {
                    try {
                        const newObj = JSON.parse(row.NewValues);
                        if (newObj.ProductName) return newObj.ProductName;
                    } catch (e) {}
                }
                if (row.OldValues) {
                    try {
                        const oldObj = JSON.parse(row.OldValues);
                        if (oldObj.ProductName) return oldObj.ProductName;
                    } catch (e) {}
                }
                return '-';
            }
        },
        { 
            key: 'Details', 
            label: 'Details', 
            style: 'white-space: normal; word-break: break-word; min-width: 250px;',
            render: (val, row) => ProductionAuditLogHistoryPage.renderDetails(row) 
        },
    ],

    render() {
        let html = `
        <div class="filter-bar" style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
            <div style="flex: 1; min-width: 150px;">
                <label>User:</label>
                <input type="text" class="form-input" id="prod-audit-user" placeholder="Any user..." value="${this.filters.user}">
            </div>
            <div style="flex: 1; min-width: 150px;">
                <label>Logbook Type:</label>
                <select class="form-input" id="prod-audit-entity">
                    <option value="">All Production Logs</option>
                    <option value="Cleaning Logbook" ${this.filters.entity_type==='Cleaning Logbook'?'selected':''}>Cleaning Logbook</option>
                    <option value="Operation Logbook" ${this.filters.entity_type==='Operation Logbook'?'selected':''}>Operation Logbook</option>
                </select>
            </div>
            <div style="flex: 1; min-width: 150px;">
                <label>Action:</label>
                <select class="form-input" id="prod-audit-action">
                    <option value="">All Actions</option>
                    <option value="Creation" ${this.filters.action==='Creation'?'selected':''}>Creation</option>
                    <option value="Edit" ${this.filters.action==='Edit'?'selected':''}>Edit</option>
                </select>
            </div>
            <div style="flex: 1; min-width: 150px;">
                <label>Machine / Search:</label>
                <input type="text" class="form-input" id="prod-audit-search" placeholder="Search reference..." value="${this.filters.search}">
            </div>
            <div style="flex: 1; min-width: 150px;">
                <label>Product Name:</label>
                <select class="form-input" id="prod-audit-product">
                    <option value="">All Products</option>
                    ${this.products.map(p => `<option value="${p.replace(/"/g, '&quot;')}" ${this.filters.product_name === p ? 'selected' : ''}>${p}</option>`).join('')}
                </select>
            </div>
            <div style="flex: 1; min-width: 150px;">
                <label>Batch No:</label>
                <input type="text" class="form-input" id="prod-audit-batch" placeholder="Any batch..." value="${this.filters.batch_no}">
            </div>
            <div style="flex: 1; min-width: 150px;">
                <label>From Date:</label>
                <input type="date" class="form-input" id="prod-audit-date-from" value="${this.filters.date_from}">
            </div>
            <div style="flex: 1; min-width: 150px;">
                <label>To Date:</label>
                <input type="date" class="form-input" id="prod-audit-date-to" value="${this.filters.date_to}">
            </div>
            <div style="display: flex; align-items: flex-end; gap: 10px;">
                <button class="btn btn-primary" onclick="ProductionAuditLogHistoryPage.applyFilters()">
                    <i class="fas fa-search"></i> Search Logs
                </button>
            </div>
        </div>
        
        <div class="table-container">`;

        html += renderDataTable(this.columns, this.rows, {});
        
        html += `</div>
        <div class="pagination" style="margin-top: 20px; text-align: right;">
             <button class="btn btn-sm" onclick="ProductionAuditLogHistoryPage.prevPage()" ${this.offset === 0 ? 'disabled' : ''}>Previous</button>
             <span style="margin: 0 10px;">Showing ${this.offset + 1} - ${Math.min(this.offset + this.limit, this.total)} of ${this.total}</span>
             <button class="btn btn-sm" onclick="ProductionAuditLogHistoryPage.nextPage()" ${this.offset + this.limit >= this.total ? 'disabled' : ''}>Next</button>
        </div>`;
            
        return html;
    },

    // ── Rich Diff Renderer ─────────────────────────
    renderDetails(row) {
        if (row.ActionType === 'Edit' && row.OldValues && row.NewValues) {
            try {
                const oldObj = JSON.parse(row.OldValues);
                const newObj = JSON.parse(row.NewValues);
                let diffHtml = '<div style="font-size: 0.9em;">';
                
                for (let key in newObj) {
                    if (key === 'Date' || key === 'DueDate' || key === 'due_date') continue;
                    const oldVal = oldObj[key] !== undefined && oldObj[key] !== null ? String(oldObj[key]) : '(empty)';
                    const newVal = newObj[key] !== undefined && newObj[key] !== null ? String(newObj[key]) : '(empty)';
                    if (oldVal !== newVal) {
                        diffHtml += `<div><strong style="color: #4a5568;">${key}:</strong> 
                                     <span style="color: #dc2626; text-decoration: line-through;">${oldVal}</span> ➔ 
                                     <span style="color: #16a34a; font-weight: 500;">${newVal}</span></div>`;
                    }
                }
                diffHtml += '</div>';
                if (row.Details) diffHtml += `<div style="margin-top: 5px; color: #6b7280; font-size: 0.85em;"><i>${row.Details}</i></div>`;
                return diffHtml;
            } catch (e) {
                console.error("Failed to parse JSON for audit log.", e);
                return row.Details || 'Invalid Edit Data';
            }
        }
        return row.Details || '';
    },

    async afterRender() {
        let shouldRender = false;
        if (this.products.length === 0) {
            try {
                const res = await api.getProductionProducts('');
                this.products = (res.results || []).map(p => p.ProductName);
                shouldRender = true;
            } catch (e) {
                console.error("Failed to load products: ", e);
            }
        }
        
        if (this.rows.length === 0 && this.total === 0) {
            await this.loadData();
        } else if (shouldRender) {
            App.renderContent();
        }
    },

    applyFilters() {
        this.filters.user = document.getElementById('prod-audit-user').value.trim();
        this.filters.entity_type = document.getElementById('prod-audit-entity').value;
        this.filters.action = document.getElementById('prod-audit-action').value;
        this.filters.search = document.getElementById('prod-audit-search').value.trim();
        this.filters.date_from = document.getElementById('prod-audit-date-from').value;
        this.filters.date_to = document.getElementById('prod-audit-date-to') ? document.getElementById('prod-audit-date-to').value : '';
        this.filters.product_name = document.getElementById('prod-audit-product') ? document.getElementById('prod-audit-product').value.trim() : '';
        this.filters.batch_no = document.getElementById('prod-audit-batch') ? document.getElementById('prod-audit-batch').value.trim() : '';
        this.offset = 0;
        this.rows = [];
        this.loadData();
    },

    prevPage() {
        if (this.offset >= this.limit) {
            this.offset -= this.limit;
            this.loadData();
        }
    },

    nextPage() {
        if (this.offset + this.limit < this.total) {
            this.offset += this.limit;
            this.loadData();
        }
    },

    async loadData() {
        try {
            const params = {
                ...this.filters,
                offset: this.offset,
                limit: this.limit
            };
            const data = await api.getProductionAuditTrail(params);
            this.rows = data.results || [];
            this.total = data.total || 0;
            App.renderContent();
        } catch (e) { 
            App.toast(e.message, 'error'); 
        }
    }
};
