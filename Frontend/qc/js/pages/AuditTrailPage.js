// ──────────────────────────────────────────────
//  Audit Trail Page (Unified)
// ──────────────────────────────────────────────

const AuditTrailPage = {
    rows: [],
    total: 0,
    offset: 0,
    limit: 50,
    filters: {
        user: '',
        entity_type: '',
        action: '',
        search: '',
        date_from: '',
        date_to: ''
    },

    columns: [
        { 
            key: 'Timestamp', 
            label: 'Date/Time', 
            render: (val, row) => {
                if (!row.Timestamp) return '';
                // Try parsing the timestamp; fallback to raw if invalid
                const d = new Date(row.Timestamp);
                if (isNaN(d.getTime())) return String(row.Timestamp).replace('T', ' ').substring(0, 19);
                
                // Format: DD-MM-YYYY hh:mm A
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                
                let hours = d.getHours();
                const minutes = String(d.getMinutes()).padStart(2, '0');
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12; // the hour '0' should be '12'
                const strTime = String(hours).padStart(2, '0') + ':' + minutes + ' ' + ampm;
                
                return `${day}-${month}-${year} <span style="color:#6b7280; font-size:0.9em; margin-left:4px;">${strTime}</span>`;
            } 
        },
        { key: 'Username', label: 'User' },
        { key: 'ActionType', label: 'Action' },
        { key: 'EntityType', label: 'Type' },
        { key: 'EntityID', label: 'Reference ID' },
        { key: 'Details', label: 'Details', render: (val, row) => AuditTrailPage.renderDetails(row) },
    ],

    render() {
        let html = `
        <div class="filter-bar" style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
            <div style="flex: 1; min-width: 150px;">
                <label>User:</label>
                <input type="text" class="form-input" id="audit-user" placeholder="Any user..." value="${this.filters.user}">
            </div>
            <div style="flex: 1; min-width: 150px;">
                <label>Type:</label>
                <select class="form-input" id="audit-entity">
                    <option value="">All Types</option>
                    <option value="Raw Material" ${this.filters.entity_type==='Raw Material'?'selected':''}>Raw Material</option>
                    <option value="Packaging Material" ${this.filters.entity_type==='Packaging Material'?'selected':''}>Packaging Material</option>
                    <option value="Finished Product" ${this.filters.entity_type==='Finished Product'?'selected':''}>Finished Product</option>
                    <option value="Product Master" ${this.filters.entity_type==='Product Master'?'selected':''}>Product Master</option>
                    <option value="User" ${this.filters.entity_type==='User'?'selected':''}>User</option>
                </select>
            </div>
            <div style="flex: 1; min-width: 150px;">
                <label>Action:</label>
                <select class="form-input" id="audit-action">
                    <option value="">All Actions</option>
                    <option value="Creation" ${this.filters.action==='Creation'?'selected':''}>Creation</option>
                    <option value="Edit" ${this.filters.action==='Edit'?'selected':''}>Edit</option>
                    <option value="Deletion" ${this.filters.action==='Deletion'?'selected':''}>Deletion</option>
                </select>
            </div>
            <div style="flex: 1; min-width: 150px;">
                <label>QC / Content Search:</label>
                <input type="text" class="form-input" id="audit-search" placeholder="Search ID or details..." value="${this.filters.search}">
            </div>
            <div style="flex: 1; min-width: 150px;">
                <label>From Date:</label>
                <input type="date" class="form-input" id="audit-date-from" value="${this.filters.date_from}">
            </div>
            <div style="display: flex; align-items: flex-end; gap: 10px;">
                <button class="btn btn-primary" onclick="AuditTrailPage.applyFilters()">
                    <i class="fas fa-search"></i> Search Logs
                </button>
            </div>
        </div>
        
        <div class="table-container">`;

        html += renderDataTable(this.columns, this.rows, {});
        
        html += `</div>
        <div class="pagination" style="margin-top: 20px; text-align: right;">
             <button class="btn btn-sm" onclick="AuditTrailPage.prevPage()" ${this.offset === 0 ? 'disabled' : ''}>Previous</button>
             <span style="margin: 0 10px;">Showing ${this.offset + 1} - ${Math.min(this.offset + this.limit, this.total)} of ${this.total}</span>
             <button class="btn btn-sm" onclick="AuditTrailPage.nextPage()" ${this.offset + this.limit >= this.total ? 'disabled' : ''}>Next</button>
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
        // General fallback for Creation/Deletion
        return row.Details || '';
    },

    async afterRender() {
        const roles = api.getUser()?.roles || [];
        if (!roles.some(r => ['Manager', 'Superuser'].includes(r))) {
            App.toast('Access denied', 'error');
            Router.navigate('dashboard');
            return;
        }
        if (this.rows.length === 0 && this.total === 0) await this.loadData();
    },

    applyFilters() {
        this.filters.user = document.getElementById('audit-user').value.trim();
        this.filters.entity_type = document.getElementById('audit-entity').value;
        this.filters.action = document.getElementById('audit-action').value;
        this.filters.search = document.getElementById('audit-search').value.trim();
        this.filters.date_from = document.getElementById('audit-date-from').value;
        // reset pagination
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
            const data = await api.getAuditTrail(params);
            this.rows = data.results || [];
            this.total = data.total || 0;
            App.renderContent();
        } catch (e) { 
            App.toast(e.message, 'error'); 
        }
    }
};
