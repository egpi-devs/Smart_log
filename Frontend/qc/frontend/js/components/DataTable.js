// ──────────────────────────────────────────────
//  DataTable Component
// ──────────────────────────────────────────────

function renderDataTable(columns, rows, options = {}) {
    const { onRowClick, selectedRow, selectedRows, idField, multiSelect, onSelectAll } = options;

    // ── Multi-select helpers ────────────────────
    const isMulti = !!multiSelect;
    // selectedRows is a Set of IDs (strings)
    const selSet = selectedRows instanceof Set ? selectedRows : new Set();
    const allSelected = rows.length > 0 && rows.every(r => selSet.has(String(r[idField])));

    // ── Desktop table ───────────────────────────
    let tableHTML = `
    <div class="table-container">
        <div class="table-scroll" id="table-scroll">
            <table class="data-table">
                <thead>
                    <tr>`;

    if (isMulti) {
        tableHTML += `<th style="width:40px;text-align:center">
            <input type="checkbox" class="table-check"
                   id="select-all-chk"
                   ${allSelected ? 'checked' : ''}
                   onchange="if(typeof ${onSelectAll} === 'function') ${onSelectAll}(this.checked)"
                   onclick="event.stopPropagation()">
        </th>`;
    }

    tableHTML += columns.map(c => `<th>${c.label}</th>`).join('');
    tableHTML += `</tr>
                </thead>
                <tbody>`;

    if (rows.length === 0) {
        const spanLen = isMulti ? columns.length + 1 : columns.length;
        tableHTML += `<tr><td colspan="${spanLen}" class="text-center" style="padding:40px; color:var(--text-muted)">
            <i class="fas fa-inbox" style="font-size:32px;display:block;margin-bottom:12px;opacity:0.3"></i>
            No data available
        </td></tr>`;
    } else {
        rows.forEach((row, idx) => {
            let isSelected;
            if (isMulti) {
                isSelected = selSet.has(String(row[idField]));
            } else {
                isSelected = selectedRow !== undefined && row[idField] === selectedRow;
            }

            tableHTML += `<tr class="${isSelected ? 'selected' : ''}"
                             style="cursor:pointer"
                             onclick="if(typeof ${onRowClick} === 'function') ${onRowClick}(${idx})">`;

            if (isMulti) {
                tableHTML += `<td class="text-center" onclick="event.stopPropagation(); if(typeof ${onRowClick} === 'function') ${onRowClick}(${idx})">
                    <input type="checkbox" class="table-check" ${isSelected ? 'checked' : ''} readonly>
                </td>`;
            }

            columns.forEach(col => {
                const val = row[col.key];
                if (col.type === 'checkbox') {
                    tableHTML += `<td class="text-center">
                        <input type="checkbox" class="table-check" ${val ? 'checked' : ''} disabled>
                    </td>`;
                } else if (col.type === 'status') {
                    const statusClass = String(val||'').toLowerCase();
                    tableHTML += `<td>
                        <span class="status-badge ${statusClass}">
                            <span class="status-dot"></span>${val || 'N/A'}
                        </span>
                    </td>`;
                } else if (col.render && typeof col.render === 'function') {
                    const renderedHtml = col.render(val, row);
                    tableHTML += `<td>${renderedHtml}</td>`;
                } else {
                    let display = val != null ? String(val) : '';
                    if (display.length > 50) display = display.substring(0, 50) + '…';
                    tableHTML += `<td title="${(val||'').toString().replace(/"/g,'&quot;')}">${display}</td>`;
                }
            });
            tableHTML += '</tr>';
        });
    }

    tableHTML += `</tbody></table></div></div>`;

    // ── Mobile card view ────────────────────────
    let cardsHTML = '<div class="card-list">';
    if (rows.length === 0) {
        cardsHTML += `<div class="empty-state"><i class="fas fa-inbox"></i><p>No data available</p></div>`;
    } else {
        rows.forEach((row, idx) => {
            const isSelected = isMulti
                ? selSet.has(String(row[idField]))
                : (selectedRow !== undefined && row[idField] === selectedRow);

            cardsHTML += `<div class="data-card ${isSelected ? 'selected' : ''}" onclick="if(typeof ${onRowClick} === 'function') ${onRowClick}(${idx})">`;
            cardsHTML += `<div class="card-header">`;

            const qcCol = columns.find(c => c.key && (c.key.includes('QC') || c.key === 'QC No.'));
            const statusCol = columns.find(c => c.type === 'status');
            if (qcCol) cardsHTML += `<strong>${row[qcCol.key] || ''}</strong>`;
            if (statusCol) {
                const sVal = row[statusCol.key] || '';
                cardsHTML += `<span class="status-badge ${sVal.toLowerCase()}">${sVal}</span>`;
            }
            if (isMulti) {
                cardsHTML += `<input type="checkbox" class="table-check" style="margin-left:auto" ${isSelected ? 'checked' : ''} readonly onclick="event.stopPropagation()">`;
            }
            cardsHTML += `</div>`;

            const shownKeys = new Set(qcCol ? [qcCol.key] : []);
            if (statusCol) shownKeys.add(statusCol.key);

            columns.forEach(col => {
                if (shownKeys.has(col.key)) return;
                if (col.type === 'checkbox') return;

                let displayHTML = '';
                if (col.render && typeof col.render === 'function') {
                    displayHTML = col.render(row[col.key], row);
                    if (!displayHTML) return;
                } else {
                    const v = row[col.key];
                    if (v == null || v === '') return;
                    displayHTML = String(v);
                }

                cardsHTML += `<div class="card-field">
                    <span class="card-label">${col.label}</span>
                    <span class="card-value">${displayHTML}</span>
                </div>`;
            });

            cardsHTML += `</div>`;
        });
    }
    cardsHTML += '</div>';

    return tableHTML + cardsHTML;
}
