// ──────────────────────────────────────────────
//  Search Dialog Component
// ──────────────────────────────────────────────

function renderSearchDialog(title, searchFields, onSearch, onClose) {
    let html = `
    <div class="modal-overlay" onclick="if(event.target===this) { ${onClose}(); }">
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title"><i class="fas fa-search"></i>&nbsp; ${title}</h3>
                <button class="modal-close" onclick="${onClose}()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-row">`;

    searchFields.forEach(field => {
        html += `<div class="form-group">
            <label>${field.label}</label>`;

        if (field.type === 'date') {
            html += `<input type="date" class="form-input" id="search-${field.key}">`;
        } else {
            html += `<input type="text" class="form-input" id="search-${field.key}"
                        placeholder="${field.placeholder || `Search ${field.label.toLowerCase()}...`}">`;
        }

        html += `</div>`;
    });

    html += `</div></div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="${onClose}()">Cancel</button>
                <button class="btn btn-primary" onclick="${onSearch}()">
                    <i class="fas fa-search"></i> Search
                </button>
            </div>
        </div>
    </div>`;

    return html;
}

function getSearchData(searchFields) {
    const data = {};
    searchFields.forEach(field => {
        const el = document.getElementById(`search-${field.key}`);
        if (el && el.value.trim()) {
            data[field.key] = el.value.trim();
        }
    });
    return data;
}
