// frontend/production/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import LogBooks from './components/logbooks/LogBooks';
import MachinesPage from './components/logbooks/MachinesPage';
import SectionsPage from './components/logbooks/SectionsPage';
import CleaningEquipmentLog from './components/logbooks/CleaningEquipmentLog';
import OperationEquipmentLog from './components/logbooks/OperationEquipmentLog';
import './index.css';
import './assets/LogBookStyles.css';

// Make sure React and ReactDOM are available globally
window.React = React;
window.ReactDOM = ReactDOM;

// Expose render functions globally
window.ProductionApp = {
  renderLogBooks: (containerId) => {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = ''; // Clear container
      const root = ReactDOM.createRoot(container);
      root.render(<LogBooks />);
    }
  },
  renderMachines: (containerId) => {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
      const root = ReactDOM.createRoot(container);
      root.render(<MachinesPage />);
    }
  },
  renderSections: (containerId) => {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
      const root = ReactDOM.createRoot(container);
      root.render(<SectionsPage />);
    }
  },
  renderCleaningLog: (containerId) => {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
      const root = ReactDOM.createRoot(container);
      root.render(<CleaningEquipmentLog />);
    }
  },
  renderOperationLog: (containerId) => {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
      const root = ReactDOM.createRoot(container);
      root.render(<OperationEquipmentLog />);
    }
  }
};

// For standalone development
if (document.getElementById('root')) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <LogBooks />
    </React.StrictMode>
  );
}