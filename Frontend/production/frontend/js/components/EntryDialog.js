// ──────────────────────────────────────────────
//  Entry Dialog Component (Add/Edit forms)
// ──────────────────────────────────────────────

function renderEntryDialog(title, fields, data = {}, onSave, onClose) {
    let html = `
    <div class="modal-overlay" onclick="if(event.target===this) { ${onClose}(); }">
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                <button class="modal-close" onclick="${onClose}()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-row">`;

    fields.forEach(field => {
        // Use ?? so that empty strings in data are respected (not replaced by fallback)
        const val = (data[field.key] != null && data[field.key] !== undefined)
            ? data[field.key]
            : (field.default != null ? field.default : '');
        const fullClass = field.fullWidth ? ' full-width' : '';
        const readOnly = field.readOnly ? 'readonly' : '';
        const disabled = field.disabled ? 'disabled' : '';

        html += `<div class="form-group${fullClass}">`;
        html += `<label>${field.label}</label>`;

        if (field.type === 'checkbox') {
            html += `<div class="checkbox-group">
                <input type="checkbox" id="field-${field.key}" ${val ? 'checked' : ''} ${disabled}>
                <label for="field-${field.key}">${field.label}</label>
            </div>`;
        } else if (field.type === 'select') {
            html += `<select class="form-input" id="field-${field.key}" ${disabled}>
                ${(field.options || []).map(o =>
                    `<option value="${o}" ${o === val ? 'selected' : ''}>${o}</option>`
                ).join('')}
            </select>`;
        } else if (field.type === 'textarea') {
            html += `<textarea class="form-input" id="field-${field.key}" ${readOnly}>${val}</textarea>`;
        } else if (field.type === 'product-search') {
            html += `<input type="text" class="form-input" id="field-${field.key}-search"
                        value="${val}" placeholder="Search products..." oninput="EntryDialog.searchProducts(this.value, '${field.category || ''}')">
                     <div class="product-search-list" id="product-search-results"></div>
                     <input type="hidden" id="field-${field.key}" value="${val}">`;
        } else {
            const inputType = field.type === 'date' ? 'date' : field.type === 'datetime' ? 'datetime-local' : 'text';
            html += `<input type="${inputType}" class="form-input" id="field-${field.key}"
                        value="${val}" placeholder="${field.placeholder || ''}" ${readOnly} ${disabled}>`;
        }

        html += `</div>`;
    });

    html += `</div></div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="${onClose}()">Cancel</button>
                <button class="btn btn-primary" onclick="${onSave}()">
                    <i class="fas fa-save"></i> Save
                </button>
            </div>
        </div>
    </div>`;

    return html;
}

// Entry dialog helpers
const EntryDialog = {
    async searchProducts(query, category) {
        try {
            const data = await api.getProductNames(category, query);
            const container = document.getElementById('product-search-results');
            if (!container) return;

            container.innerHTML = (data.results || []).map(p =>
                `<div class="product-search-item" onclick="EntryDialog.selectProduct('${p.ProductName}', '${p.ProductCategory}')">
                    ${p.ProductName} <small style="color:var(--text-muted)">(${p.ProductCategory})</small>
                </div>`
            ).join('');
        } catch (e) {
            console.error('Product search failed:', e);
        }
    },

    selectProduct(name, category) {
        const nameInput = document.getElementById('field-material');
        const catLabel = document.getElementById('field-category');
        if (nameInput) nameInput.value = name;
        if (catLabel) catLabel.value = category;

        const searchInput = document.getElementById('field-material-search');
        if (searchInput) searchInput.value = name;

        const results = document.getElementById('product-search-results');
        if (results) results.innerHTML = '';
    },

    getFormData(fields) {
        const data = {};
        fields.forEach(field => {
            const el = document.getElementById(`field-${field.key}`);
            if (!el) return;

            if (field.type === 'checkbox') {
                data[field.key] = el.checked;
            } else {
                data[field.key] = el.value;
            }
        });
        return data;
    }
};
