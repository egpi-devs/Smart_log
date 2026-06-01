// ──────────────────────────────────────────────
//  Production Log Books Page
// ──────────────────────────────────────────────

const ProductionLogBooksPage = {
    machines: [],
    sections: [],
    cleaningEntries: [],
    operationEntries: [],
    selectedMachine: null,
    selectedSection: null,
    currentView: 'select', // select, cleaning, operation, machines, sections
    
    async loadMachines() {
        try {
            const data = await api.request('/production/machines/');
            this.machines = data;
        } catch (error) {
            console.error('Error loading machines:', error);
            App.toast('Failed to load machines', 'error');
        }
    },

    async loadSections() {
        try {
            const data = await api.request('/production/sections/');
            this.sections = data;
        } catch (error) {
            console.error('Error loading sections:', error);
            App.toast('Failed to load sections', 'error');
        }
    },

    async loadCleaningEntries() {
        try {
            const data = await api.request('/production/cleaning-logs/');
            this.cleaningEntries = data;
        } catch (error) {
            console.error('Error loading cleaning entries:', error);
        }
    },

    async loadOperationEntries() {
        try {
            const data = await api.request('/production/operation-logs/');
            this.operationEntries = data;
        } catch (error) {
            console.error('Error loading operation entries:', error);
        }
    },

    render() {
        this.loadMachines();
        this.loadSections();
        
        return `
            <div class="production-logbooks">
                <div class="production-tabs">
                    <button class="tab-btn ${this.currentView === 'select' ? 'active' : ''}" 
                            onclick="ProductionLogBooksPage.switchView('select')">
                        <i class="fas fa-check-circle"></i> Select
                    </button>
                    <button class="tab-btn ${this.currentView === 'cleaning' ? 'active' : ''}" 
                            onclick="ProductionLogBooksPage.switchView('cleaning')">
                        <i class="fas fa-broom"></i> Cleaning Log
                    </button>
                    <button class="tab-btn ${this.currentView === 'operation' ? 'active' : ''}" 
                            onclick="ProductionLogBooksPage.switchView('operation')">
                        <i class="fas fa-play-circle"></i> Operation Log
                    </button>
                    <button class="tab-btn ${this.currentView === 'machines' ? 'active' : ''}" 
                            onclick="ProductionLogBooksPage.switchView('machines')">
                        <i class="fas fa-cog"></i> Machines
                    </button>
                    <button class="tab-btn ${this.currentView === 'sections' ? 'active' : ''}" 
                            onclick="ProductionLogBooksPage.switchView('sections')">
                        <i class="fas fa-layer-group"></i> Sections
                    </button>
                </div>

                <div class="production-content">
                    ${this.renderCurrentView()}
                </div>
            </div>
        `;
    },

    renderCurrentView() {
        switch(this.currentView) {
            case 'select':
                return this.renderSelectView();
            case 'cleaning':
                return this.renderCleaningView();
            case 'operation':
                return this.renderOperationView();
            case 'machines':
                return this.renderMachinesView();
            case 'sections':
                return this.renderSectionsView();
            default:
                return this.renderSelectView();
        }
    },

    renderSelectView() {
        return `
            <div class="log-book-container">
                <h2 class="log-book-title">Select Machine & Section</h2>
                <div class="form-row">
                    <div class="form-group">
                        <label>Machine</label>
                        <select class="form-input" id="select-machine">
                            <option value="">-- Select Machine --</option>
                            ${this.machines.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Section</label>
                        <select class="form-input" id="select-section">
                            <option value="">-- Select Section --</option>
                            ${this.sections.map(s => `<option value="${s.id}">${s.name} (${s.type})</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="ProductionLogBooksPage.startODIT()">
                        <i class="fas fa-play"></i> Start ODIT
                    </button>
                </div>
            </div>
        `;
    },

    renderCleaningView() {
        this.loadCleaningEntries();
        
        const columns = [
            { key: 'by', label: 'By' },
            { key: 'date', label: 'Date' },
            { key: 'product_name', label: 'Product' },
            { key: 'batch_no', label: 'Batch No.' },
            { key: 'batch_size', label: 'Batch Size' },
            { key: 'time_start', label: 'Start' },
            { key: 'time_end', label: 'End' },
            { key: 'due_date', label: 'Due Date' },
            { key: 'cleaning_reason', label: 'Reason' },
            { key: 'done_by', label: 'Done By' },
            { key: 'checked_by', label: 'Checked By' }
        ];

        return `
            <div class="log-book-container cleaning">
                <h2>Cleaning Equipment Log</h2>
                <div class="selected-info">
                    Machine: ${this.selectedMachine?.name || 'Not selected'} | 
                    Section: ${this.selectedSection?.name || 'Not selected'}
                </div>
                
                <button class="btn btn-primary" onclick="ProductionLogBooksPage.showAddCleaningEntry()">
                    <i class="fas fa-plus"></i> Add Entry
                </button>

                ${renderDataTable(columns, this.cleaningEntries, {
                    onRowClick: 'ProductionLogBooksPage.editCleaningEntry'
                })}
            </div>
        `;
    },

    renderOperationView() {
        this.loadOperationEntries();
        
        const columns = [
            { key: 'date', label: 'Date' },
            { key: 'product_name', label: 'Product' },
            { key: 'batch_no', label: 'Batch No.' },
            { key: 'batch_size', label: 'Batch Size' },
            { key: 'operation_start', label: 'Start' },
            { key: 'operation_end', label: 'End' },
            { key: 'incident_brief', label: 'Incident' },
            { key: 'incident_action', label: 'Action' },
            { key: 'done_by', label: 'Done By' },
            { key: 'checked_by', label: 'Checked By' }
        ];

        return `
            <div class="log-book-container operation">
                <h2>Operation Equipment Log</h2>
                <div class="selected-info">
                    Machine: ${this.selectedMachine?.name || 'Not selected'} | 
                    Section: ${this.selectedSection?.name || 'Not selected'}
                </div>
                
                <button class="btn btn-primary" onclick="ProductionLogBooksPage.showAddOperationEntry()">
                    <i class="fas fa-plus"></i> Add Entry
                </button>

                ${renderDataTable(columns, this.operationEntries, {
                    onRowClick: 'ProductionLogBooksPage.editOperationEntry'
                })}
            </div>
        `;
    },

    renderMachinesView() {
        const columns = [
            { key: 'name', label: 'Machine Name' }
        ];

        return `
            <div class="log-book-container">
                <h2>Production Machines</h2>
                
                <button class="btn btn-primary" onclick="ProductionLogBooksPage.showAddMachine()">
                    <i class="fas fa-plus"></i> Add Machine
                </button>

                ${renderDataTable(columns, this.machines, {
                    onRowClick: 'ProductionLogBooksPage.editMachine'
                })}
            </div>
        `;
    },

    renderSectionsView() {
        const columns = [
            { key: 'name', label: 'Section Name' },
            { key: 'type', label: 'Type' }
        ];

        return `
            <div class="log-book-container">
                <h2>Production Sections</h2>
                
                <button class="btn btn-primary" onclick="ProductionLogBooksPage.showAddSection()">
                    <i class="fas fa-plus"></i> Add Section
                </button>

                ${renderDataTable(columns, this.sections, {
                    onRowClick: 'ProductionLogBooksPage.editSection'
                })}
            </div>
        `;
    },

    switchView(view) {
        this.currentView = view;
        App.renderContent();
    },

    startODIT() {
        const machineId = document.getElementById('select-machine')?.value;
        const sectionId = document.getElementById('select-section')?.value;
        
        if (!machineId) {
            App.toast('Please select a machine', 'warning');
            return;
        }
        if (!sectionId) {
            App.toast('Please select a section', 'warning');
            return;
        }

        this.selectedMachine = this.machines.find(m => m.id == machineId);
        this.selectedSection = this.sections.find(s => s.id == sectionId);
        
        App.toast(`Selected: ${this.selectedMachine.name} / ${this.selectedSection.name}`, 'success');
        this.switchView('cleaning');
    },

    // Machine methods
    showAddMachine() {
        const fields = [
            { key: 'name', label: 'Machine Name', type: 'text' }
        ];

        const modalId = 'add-machine-modal';
        const modal = renderEntryDialog('Add Machine', fields, {}, 
            'ProductionLogBooksPage.saveMachine()',
            'ProductionLogBooksPage.closeModal'
        );
        
        document.body.insertAdjacentHTML('beforeend', modal);
    },

    async saveMachine() {
        const name = document.getElementById('field-name')?.value;
        
        if (!name) {
            App.toast('Machine name is required', 'warning');
            return;
        }

        try {
            await api.request('/production/machines/', {
                method: 'POST',
                body: JSON.stringify({ name })
            });
            
            App.toast('Machine added successfully', 'success');
            this.closeModal();
            this.loadMachines();
            App.renderContent();
        } catch (error) {
            App.toast('Failed to add machine', 'error');
        }
    },

    editMachine(index) {
        const machine = this.machines[index];
        
        const fields = [
            { key: 'name', label: 'Machine Name', type: 'text' }
        ];

        const modal = renderEntryDialog('Edit Machine', fields, machine,
            `ProductionLogBooksPage.updateMachine(${machine.id})`,
            'ProductionLogBooksPage.closeModal'
        );
        
        document.body.insertAdjacentHTML('beforeend', modal);
    },

    async updateMachine(id) {
        const name = document.getElementById('field-name')?.value;
        
        try {
            await api.request(`/production/machines/${id}/`, {
                method: 'PUT',
                body: JSON.stringify({ name })
            });
            
            App.toast('Machine updated successfully', 'success');
            this.closeModal();
            this.loadMachines();
            App.renderContent();
        } catch (error) {
            App.toast('Failed to update machine', 'error');
        }
    },

    // Section methods
    showAddSection() {
        const fields = [
            { key: 'name', label: 'Section Name', type: 'text' },
            { key: 'type', label: 'Type', type: 'select', options: ['Solid', 'Semi-Solid', 'Liquid'] }
        ];

        const modal = renderEntryDialog('Add Section', fields, {},
            'ProductionLogBooksPage.saveSection()',
            'ProductionLogBooksPage.closeModal'
        );
        
        document.body.insertAdjacentHTML('beforeend', modal);
    },

    async saveSection() {
        const name = document.getElementById('field-name')?.value;
        const type = document.getElementById('field-type')?.value;
        
        if (!name) {
            App.toast('Section name is required', 'warning');
            return;
        }

        try {
            await api.request('/production/sections/', {
                method: 'POST',
                body: JSON.stringify({ name, type })
            });
            
            App.toast('Section added successfully', 'success');
            this.closeModal();
            this.loadSections();
            App.renderContent();
        } catch (error) {
            App.toast('Failed to add section', 'error');
        }
    },

    editSection(index) {
        const section = this.sections[index];
        
        const fields = [
            { key: 'name', label: 'Section Name', type: 'text' },
            { key: 'type', label: 'Type', type: 'select', options: ['Solid', 'Semi-Solid', 'Liquid'] }
        ];

        const modal = renderEntryDialog('Edit Section', fields, section,
            `ProductionLogBooksPage.updateSection(${section.id})`,
            'ProductionLogBooksPage.closeModal'
        );
        
        document.body.insertAdjacentHTML('beforeend', modal);
    },

    async updateSection(id) {
        const name = document.getElementById('field-name')?.value;
        const type = document.getElementById('field-type')?.value;
        
        try {
            await api.request(`/production/sections/${id}/`, {
                method: 'PUT',
                body: JSON.stringify({ name, type })
            });
            
            App.toast('Section updated successfully', 'success');
            this.closeModal();
            this.loadSections();
            App.renderContent();
        } catch (error) {
            App.toast('Failed to update section', 'error');
        }
    },

    // Cleaning Entry methods
    showAddCleaningEntry() {
        if (!this.selectedMachine || !this.selectedSection) {
            App.toast('Please select machine and section first', 'warning');
            this.switchView('select');
            return;
        }

        const fields = [
            { key: 'by', label: 'By', type: 'text' },
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'productName', label: 'Product Name', type: 'text' },
            { key: 'batchNo', label: 'Batch No.', type: 'text' },
            { key: 'batchSize', label: 'Batch Size', type: 'text' },
            { key: 'timeStart', label: 'Start Time', type: 'time' },
            { key: 'timeEnd', label: 'End Time', type: 'time' },
            { key: 'dueDate', label: 'Due Date', type: 'date' },
            { key: 'cleaningReason', label: 'Cleaning Reason', type: 'text' },
            { key: 'doneBy', label: 'Done By', type: 'text' },
            { key: 'checkedBy', label: 'Checked By', type: 'text' }
        ];

        const modal = renderEntryDialog('Add Cleaning Entry', fields, {},
            'ProductionLogBooksPage.saveCleaningEntry()',
            'ProductionLogBooksPage.closeModal'
        );
        
        document.body.insertAdjacentHTML('beforeend', modal);
    },

    async saveCleaningEntry() {
        const formData = EntryDialog.getFormData([
            { key: 'by' }, { key: 'date' }, { key: 'productName' }, 
            { key: 'batchNo' }, { key: 'batchSize' }, { key: 'timeStart' },
            { key: 'timeEnd' }, { key: 'dueDate' }, { key: 'cleaningReason' },
            { key: 'doneBy' }, { key: 'checkedBy' }
        ]);

        try {
            await api.request('/production/cleaning-logs/', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    machine: this.selectedMachine.id,
                    section: this.selectedSection.id
                })
            });
            
            App.toast('Entry added successfully', 'success');
            this.closeModal();
            this.loadCleaningEntries();
            App.renderContent();
        } catch (error) {
            App.toast('Failed to add entry', 'error');
        }
    },

    // Operation Entry methods
    showAddOperationEntry() {
        if (!this.selectedMachine || !this.selectedSection) {
            App.toast('Please select machine and section first', 'warning');
            this.switchView('select');
            return;
        }

        const fields = [
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'productName', label: 'Product Name', type: 'text' },
            { key: 'batchNo', label: 'Batch No.', type: 'text' },
            { key: 'batchSize', label: 'Batch Size', type: 'text' },
            { key: 'operationStart', label: 'Start Time', type: 'time' },
            { key: 'operationEnd', label: 'End Time', type: 'time' },
            { key: 'incidentBrief', label: 'Incident Brief', type: 'text' },
            { key: 'incidentAction', label: 'Action Taken', type: 'text' },
            { key: 'doneBy', label: 'Done By', type: 'text' },
            { key: 'checkedBy', label: 'Checked By', type: 'text' }
        ];

        const modal = renderEntryDialog('Add Operation Entry', fields, {},
            'ProductionLogBooksPage.saveOperationEntry()',
            'ProductionLogBooksPage.closeModal'
        );
        
        document.body.insertAdjacentHTML('beforeend', modal);
    },

    async saveOperationEntry() {
        const formData = EntryDialog.getFormData([
            { key: 'date' }, { key: 'productName' }, { key: 'batchNo' },
            { key: 'batchSize' }, { key: 'operationStart' }, { key: 'operationEnd' },
            { key: 'incidentBrief' }, { key: 'incidentAction' },
            { key: 'doneBy' }, { key: 'checkedBy' }
        ]);

        try {
            await api.request('/production/operation-logs/', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    machine: this.selectedMachine.id,
                    section: this.selectedSection.id
                })
            });
            
            App.toast('Entry added successfully', 'success');
            this.closeModal();
            this.loadOperationEntries();
            App.renderContent();
        } catch (error) {
            App.toast('Failed to add entry', 'error');
        }
    },

    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
    }
};