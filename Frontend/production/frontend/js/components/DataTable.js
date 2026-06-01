// ──────────────────────────────────────────────
//  DataTable Component
// ──────────────────────────────────────────────

function renderDataTable(columns, rows, options = {}) {
    const { onRowClick, selectedRow, idField } = options;
    const clickAttr = onRowClick ? 'style="cursor:pointer"' : '';

    // Desktop table
    let tableHTML = `
    <div class="table-container">
        <div class="table-scroll" id="table-scroll">
            <table class="data-table">
                <thead>
                    <tr>
                        ${columns.map(c => `<th>${c.label}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>`;

    if (rows.length === 0) {
        tableHTML += `<tr><td colspan="${columns.length}" class="text-center" style="padding:40px; color:var(--text-muted)">
            <i class="fas fa-inbox" style="font-size:32px;display:block;margin-bottom:12px;opacity:0.3"></i>
            No data available
        </td></tr>`;
    } else {
        rows.forEach((row, idx) => {
            const isSelected = selectedRow !== undefined && row[idField] === selectedRow;
            tableHTML += `<tr class="${isSelected ? 'selected' : ''}"
                             ${clickAttr}
                             onclick="if(typeof ${onRowClick} === 'function') ${onRowClick}(${idx})">`;
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
                    // Support for custom render functions
                    const renderedHtml = col.render(val, row);
                    const tdStyle = col.style ? `style="${col.style}"` : '';
                    // Don't truncate custom html output
                    tableHTML += `<td ${tdStyle}>${renderedHtml}</td>`;
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

    // Mobile card view
    let cardsHTML = '<div class="card-list">';
    if (rows.length === 0) {
        cardsHTML += `<div class="empty-state"><i class="fas fa-inbox"></i><p>No data available</p></div>`;
    } else {
        rows.forEach((row, idx) => {
            cardsHTML += `<div class="data-card" onclick="if(typeof ${onRowClick} === 'function') ${onRowClick}(${idx})">`;
            cardsHTML += `<div class="card-header">`;

            // Show QC No and status in header
            const qcCol = columns.find(c => c.key && (c.key.includes('QC') || c.key === 'QC No.'));
            const statusCol = columns.find(c => c.type === 'status');
            if (qcCol) cardsHTML += `<strong>${row[qcCol.key] || ''}</strong>`;
            if (statusCol) {
                const sVal = row[statusCol.key] || '';
                cardsHTML += `<span class="status-badge ${sVal.toLowerCase()}">${sVal}</span>`;
            }
            cardsHTML += `</div>`;

            // Show key fields
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
