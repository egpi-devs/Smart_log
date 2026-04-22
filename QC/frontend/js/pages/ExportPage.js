/**
 * ExportPage.js
 * Handles data export to Excel or PDF with various filters and category selection.
 */
// # ExportPage  page here
const ExportPage = {
    category: 'raw',
    yearMode: 'specific', // 'specific' or 'range'
    format: 'excel',      // 'excel' or 'pdf'
    exporting: false,

    render() {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let y = 2025; y <= currentYear; y++) years.push(y);

        const html = `
        <div class="export-container card-panel">
            <h2 class="mb-6"><i class="fas fa-file-export mr-2"></i> Export Data</h2>

            <div class="form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">

                <!-- Category -->
                <div class="form-group">
                    <label>Material Category</label>
                    <select class="form-input" id="exp-category" onchange="ExportPage.updateCategory(this.value)">
                        <option value="raw"       ${this.category === 'raw'       ? 'selected' : ''}>Raw Materials</option>
                        <option value="packaging"  ${this.category === 'packaging' ? 'selected' : ''}>Packaging Materials</option>
                        <option value="finished"   ${this.category === 'finished'  ? 'selected' : ''}>Finished Products</option>
                    </select>
                </div>

                <!-- Export Format -->
                <div class="form-group">
                    <label>Export Format</label>
                    <div style="display:flex; gap:12px; margin-top:8px;">
                        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
                            <input type="radio" name="exp-format" value="excel"
                                   ${this.format === 'excel' ? 'checked' : ''}
                                   onchange="ExportPage.format='excel'">
                            <i class="fas fa-file-excel" style="color:#1d6f42;"></i> Excel (.xlsx)
                        </label>
                        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
                            <input type="radio" name="exp-format" value="pdf"
                                   ${this.format === 'pdf' ? 'checked' : ''}
                                   onchange="ExportPage.format='pdf'">
                            <i class="fas fa-file-pdf" style="color:#c0392b;"></i> PDF
                        </label>
                    </div>
                </div>

                <!-- Year Mode -->
                <div class="form-group">
                    <label>Year Mode</label>
                    <select class="form-input" id="exp-year-mode" onchange="ExportPage.updateYearMode(this.value)">
                        <option value="specific" ${this.yearMode === 'specific' ? 'selected' : ''}>Specific Year Only</option>
                        <option value="range"    ${this.yearMode === 'range'    ? 'selected' : ''}>Year Range (Multiple Years)</option>
                    </select>
                </div>

                <!-- Specific Year -->
                <div class="form-group" id="group-specific-year" style="display: ${this.yearMode === 'specific' ? 'block' : 'none'}">
                    <label>Year</label>
                    <select class="form-input" id="exp-year">
                        ${years.map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('')}
                    </select>
                </div>

                <!-- Year Range -->
                <div class="form-group" id="group-year-range" style="display: ${this.yearMode === 'range' ? 'grid' : 'none'}; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label>From Year</label>
                        <select class="form-input" id="exp-year-from">
                            ${years.map(y => `<option value="${y}" ${y === 2025 ? 'selected' : ''}>${y}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label>To Year</label>
                        <select class="form-input" id="exp-year-to">
                            ${years.map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <!-- Date Range -->
                <div class="form-group">
                    <label>Date From</label>
                    <input type="date" class="form-input" id="exp-date-from">
                </div>
                <div class="form-group">
                    <label>Date To</label>
                    <input type="date" class="form-input" id="exp-date-to">
                </div>

                <!-- Status Filters -->
                <div class="form-group">
                    <label>Final Status</label>
                    <select class="form-input" id="exp-status">
                        <option value="">All</option>
                        <option>Accepted</option><option>Rejected</option><option>Pending</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Micro Status</label>
                    <select class="form-input" id="exp-micro-status">
                        <option value="">All</option>
                        <option>Accepted</option><option>Rejected</option><option>Pending</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Chemical Status</label>
                    <select class="form-input" id="exp-chemical-status">
                        <option value="">All</option>
                        <option>Accepted</option><option>Rejected</option><option>Pending</option>
                    </select>
                </div>

                <!-- Text Filters -->
                <div class="form-group">
                    <label>Material Name</label>
                    <input type="text" class="form-input" id="exp-material" placeholder="Search material name...">
                </div>
                <div class="form-group">
                    <label>QC Number</label>
                    <input type="text" class="form-input" id="exp-qc" placeholder="Search QC No...">
                </div>
                <div class="form-group" style="display: ${this.category !== 'packaging' ? 'block' : 'none'}">
                    <label>Batch Number</label>
                    <input type="text" class="form-input" id="exp-batch" placeholder="Search Batch No...">
                </div>
                <div class="form-group">
                    <label>Material Code</label>
                    <input type="text" class="form-input" id="exp-code" placeholder="Search Material Code...">
                </div>
                <div class="form-group" style="display: ${this.category !== 'finished' ? 'block' : 'none'}">
                    <label>Manufacturer</label>
                    <input type="text" class="form-input" id="exp-manufacturer" placeholder="Search Manufacturer...">
                </div>
                <div class="form-group" style="display: ${this.category !== 'finished' ? 'block' : 'none'}">
                    <label>Supplier</label>
                    <input type="text" class="form-input" id="exp-supplier" placeholder="Search Supplier...">
                </div>

            </div>

            <div class="mt-8 pt-6 border-t" style="text-align: right;">
                <button class="btn btn-primary btn-lg" id="btn-do-export" onclick="ExportPage.handleExport()" ${this.exporting ? 'disabled' : ''}>
                    <i class="fas fa-${this.format === 'pdf' ? 'file-pdf' : 'file-excel'} mr-2"></i>
                    ${this.exporting ? 'Generating...' : (this.format === 'pdf' ? 'Export to PDF' : 'Export to Excel')}
                </button>
            </div>
        </div>`;

        return html;
    },

    updateCategory(val) {
        this.category = val;
        App.renderContent();
    },

    updateYearMode(val) {
        this.yearMode = val;
        document.getElementById('group-specific-year').style.display = val === 'specific' ? 'block' : 'none';
        document.getElementById('group-year-range').style.display = val === 'range' ? 'grid' : 'none';
    },

    _buildFilters() {
        // Read the current radio selection (may have changed without re-render)
        const fmtEl = document.querySelector('input[name="exp-format"]:checked');
        if (fmtEl) this.format = fmtEl.value;

        return {
            category:       document.getElementById('exp-category').value,
            year_mode:      document.getElementById('exp-year-mode').value,
            year:           document.getElementById('exp-year').value,
            year_from:      document.getElementById('exp-year-from').value,
            year_to:        document.getElementById('exp-year-to').value,
            from_date:      document.getElementById('exp-date-from').value,
            to_date:        document.getElementById('exp-date-to').value,
            status:         document.getElementById('exp-status').value,
            micro_status:   document.getElementById('exp-micro-status').value,
            chemical_status:document.getElementById('exp-chemical-status').value,
            material_name:  document.getElementById('exp-material').value,
            qc_number:      document.getElementById('exp-qc').value,
            batch_number:   document.getElementById('exp-batch')?.value || '',
            material_code:  document.getElementById('exp-code').value,
            manufacturer:   document.getElementById('exp-manufacturer')?.value || '',
            supplier:       document.getElementById('exp-supplier')?.value || ''
        };
    },

    async handleExport() {
        if (this.exporting) return;

        const filters = this._buildFilters();
        this.exporting = true;
        App.renderContent();

        try {
            if (this.format === 'pdf') {
                await this._exportPDF(filters);
            } else {
                await this._exportExcel(filters);
            }
            App.toast('Export successful!', 'success');
        } catch (e) {
            App.toast('Export failed: ' + e.message, 'error');
        } finally {
            this.exporting = false;
            App.renderContent();
        }
    },

    async _exportExcel(filters) {
        const blob = await api.exportData({ ...filters, format: 'excel' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `QC_Export_${filters.category}_${new Date().toISOString().slice(0,10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    },

    async _exportPDF(filters) {
        // Fetch rows as JSON
        const result = await api.exportDataJson({ ...filters, format: 'json' });
        const { rows, columns } = result;

        if (!rows || rows.length === 0) {
            throw new Error('No data found for the selected filters.');
        }

        const catLabel = { raw: 'Raw Materials', packaging: 'Packaging Materials', finished: 'Finished Products' }[filters.category] || filters.category;
        const dateStr = new Date().toLocaleString();

        // Build table HTML
        const thead = `<tr>${columns.map(([, label]) => `<th>${label}</th>`).join('')}</tr>`;
        const tbody = rows.map(row =>
            `<tr>${columns.map(([key]) => `<td>${row[key] ?? ''}</td>`).join('')}</tr>`
        ).join('');

        const html = `<!DOCTYPE html>
<html dir="auto" lang="ar">
<head>
<meta charset="UTF-8">
<title>QC Export — ${catLabel}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Cairo', Arial, sans-serif; font-size: 9px; color: #111; padding: 12mm; }
  h1 { font-size: 14px; margin-bottom: 3px; }
  .meta { font-size: 9px; color: #555; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1a6bb5; color: #fff; padding: 5px 4px; font-weight: 700; font-size: 8px; text-align: center; }
  td { border: 1px solid #d0d0d0; padding: 4px; text-align: center; vertical-align: middle; }
  tr:nth-child(even) td { background: #f0f6ff; }
  @page { size: A4 landscape; margin: 10mm; }
  @media print { button { display: none; } }
</style>
</head>
<body>
  <h1>QC Report — ${catLabel}</h1>
  <div class="meta">Generated: ${dateStr} &nbsp;|&nbsp; Records: ${rows.length}</div>
  <table>
    <thead>${thead}</thead>
    <tbody>${tbody}</tbody>
  </table>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  <\/script>
</body>
</html>`;

        const win = window.open('', '_blank');
        if (!win) {
            throw new Error('Popup blocked. Please allow popups for this site and try again.');
        }
        win.document.open();
        win.document.write(html);
        win.document.close();
    }
};
