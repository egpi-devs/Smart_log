// ──────────────────────────────────────────────
//  Production Export Page
// ──────────────────────────────────────────────

const ProductionExportPage = {
    machines: [],
    sections: [],
    selectedSection: '',
    selectedMachine: '',
    logType: 'cleaning',
    dateFrom: '',
    dateTo: '',
    
    render() {
        const sectionOpts = `<option value="">-- Select Section --</option>` + 
            this.sections.map(s => `<option value="${s.Name}" ${this.selectedSection === s.Name ? 'selected' : ''}>${s.Name}</option>`).join('');
            
        const filteredMachines = this.machines.filter(m => m.Section === this.selectedSection);
        const machineOpts = `<option value="">-- Select Machine --</option>` + 
            filteredMachines.map(m => `<option value="${m.Name}" ${this.selectedMachine === m.Name ? 'selected' : ''}>${m.Name}</option>`).join('');

        return `
        <div class="dashboard-card">
            <h3 style="margin-bottom: 20px;">Export Production Logbooks</h3>
            
            <div class="filter-bar" style="display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-end; margin-bottom: 20px;">
                <div style="flex: 1; min-width: 250px;">
                    <label>Production Section:</label>
                    <select class="form-control" id="pe-section" onchange="ProductionExportPage.onSectionChange(this.value)">
                        ${sectionOpts}
                    </select>
                </div>
                
                <div style="flex: 1; min-width: 250px;">
                    <label>Production Machine:</label>
                    <select class="form-control" id="pe-machine" onchange="ProductionExportPage.selectedMachine = this.value">
                        ${machineOpts}
                    </select>
                </div>
                
                <div style="flex: 1; min-width: 250px;">
                    <label>Logbook Type:</label>
                    <select class="form-control" id="pe-logtype" onchange="ProductionExportPage.logType = this.value">
                        <option value="cleaning" ${this.logType==='cleaning'?'selected':''}>Cleaning Logbook</option>
                        <option value="operation" ${this.logType==='operation'?'selected':''}>Operation Logbook</option>
                    </select>
                </div>
                
                <div style="flex: 1; min-width: 150px;">
                    <label>From Date:</label>
                    <input type="date" class="form-control" id="pe-date-from" onchange="ProductionExportPage.dateFrom = this.value" value="${this.dateFrom || ''}">
                </div>
                
                <div style="flex: 1; min-width: 150px;">
                    <label>To Date:</label>
                    <input type="date" class="form-control" id="pe-date-to" onchange="ProductionExportPage.dateTo = this.value" value="${this.dateTo || ''}">
                </div>
                
                <div>
                    <button class="btn btn-primary btn-lg" onclick="ProductionExportPage.generatePDF()">
                        <i class="fas fa-file-pdf"></i> Export PDF
                    </button>
                </div>
            </div>
            
            <p style="color: #6b7280; font-size: 0.9em; margin-top: 15px;">
                <i class="fas fa-info-circle"></i> Extracted PDF documents will be natively paginated with numbering printed at the top-right.
            </p>
        </div>
        `;
    },

    async loadInitialData() {
        try {
            const [mRes, sRes] = await Promise.all([
                api.getProductionMachines(),
                api.getProductionSections()
            ]);
            this.machines = mRes.results || [];
            this.sections = sRes.results || [];
            App.renderContent();
        } catch (err) {
            App.toast(err.message, 'error');
        }
    },

    onSectionChange(val) {
        this.selectedSection = val;
        this.selectedMachine = '';
        App.renderContent();
    },

    async afterRender() {
        if (this.machines.length === 0 && this.sections.length === 0) {
            this.loadInitialData();
        }
    },

    async generatePDF() {
        if (!this.selectedSection || !this.selectedMachine) {
            App.toast("Please select both a Production Section and Machine.", "warning");
            return;
        }

        try {
            // Fetch relevant data from backend
            let rows = [];
            if (this.logType === 'cleaning') {
                const res = await api.getCleaningLogbooks(this.selectedMachine, this.selectedSection, this.dateFrom, this.dateTo);
                rows = res.results || [];
            } else {
                const res = await api.getOperationLogbooks(this.selectedMachine, this.selectedSection, this.dateFrom, this.dateTo);
                rows = res.results || [];
            }

            if (rows.length === 0) {
                App.toast("No records found to export.", "info");
                return;
            }

            // Generate Top-margin paginated PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('landscape');
            
            const logName = this.logType === 'cleaning' ? 'Cleaning Logbook' : 'Operation Logbook';
            const fDate = v => v ? String(v).split('T')[0] : '';
            
            let head = [];
            let body = [];
            
            if (this.logType === 'cleaning') {
                head = [['Date', 'Product', 'Batch No.', 'Batch Size', 'Time Start', 'Time End', 'Due Date', 'Reason', 'Done By', 'Checked By']];
                body = rows.map(r => [
                    fDate(r.Date),
                    r.ProductName || '',
                    r.BatchNo || '',
                    r.BatchSize || '',
                    r.TimeStart || '',
                    r.TimeEnd || '',
                    fDate(r.DueDate),
                    r.CleaningReason || '',
                    r.DoneBy || '',
                    r.CheckedBy || ''
                ]);
            } else {
                head = [['Date', 'Product', 'Batch No.', 'Batch Size', 'Op Start', 'Op End', 'Incident Brief', 'Incident Action', 'Done By', 'Checked By']];
                body = rows.map(r => [
                    fDate(r.Date),
                    r.ProductName || '',
                    r.BatchNo || '',
                    r.BatchSize || '',
                    r.OperationStart ? String(r.OperationStart).substring(0, 5) : '',
                    r.OperationEnd ? String(r.OperationEnd).substring(0, 5) : '',
                    r.IncidentBrief || '',
                    r.IncidentAction || '',
                    r.DoneBy || '',
                    r.CheckedBy || ''
                ]);
            }

            doc.setFontSize(14);
            doc.text(`QC Log Export: ${logName}`, 14, 15);
            doc.setFontSize(10);
            doc.text(`Section: ${this.selectedSection}   |   Machine: ${this.selectedMachine}`, 14, 21);

            // Execute autoTable
            doc.autoTable({
                startY: 25,
                head: head,
                body: body,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [66, 66, 66] },
                margin: { top: 25 },
                didDrawPage: function(data) {
                    doc.setFontSize(9);
                    doc.setTextColor(150);
                    // Native page numbering at top-right
                    doc.text(
                        "Page " + doc.internal.getNumberOfPages(),
                        doc.internal.pageSize.width - 20,
                        15,
                        { align: 'right' }
                    );
                }
            });

            // Format Filename and save
            const safeMachine = this.selectedMachine.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const filename = `export_${safeMachine}_${this.logType}_logs.pdf`;
            doc.save(filename);
            App.toast(`Generated PDF: ${filename}`, 'success');

        } catch (err) {
            console.error(err);
            App.toast("Failed to generate PDF: " + err.message, "error");
        }
    }
};
