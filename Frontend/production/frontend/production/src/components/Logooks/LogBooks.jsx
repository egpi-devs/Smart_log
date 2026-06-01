import React, { useState, useEffect } from 'react';
import CleaningEquipmentLog from './CleaningEquipmentLog';
import OperationEquipmentLog from './OperationEquipmentLog';
import SelectMachineSection from './SelectMachineSection';
import MachinesPage from './MachinesPage';
import SectionsPage from './SectionsPage';
import axios from 'axios';

// Use environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const LogBooks = () => {
  const [activeTab, setActiveTab] = useState('select');
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [machines, setMachines] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load machines and sections from API
  useEffect(() => {
    loadMachinesAndSections();
  }, []);

  const loadMachinesAndSections = async () => {
    setLoading(true);
    try {
      const [machinesRes, sectionsRes] = await Promise.all([
        axios.get(`${API_URL}/production/machines/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${API_URL}/production/sections/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      setMachines(machinesRes.data);
      setSections(sectionsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartODIT = (machine, section) => {
    setSelectedMachine(machine);
    setSelectedSection(section);
    setActiveTab('operation');
  };

  const tabs = [
    { id: 'select', label: 'Select Machine & Section' },
    { id: 'cleaning', label: 'Cleaning Log' },
    { id: 'operation', label: 'Operation Log' },
    { id: 'machines', label: 'Machines' },
    { id: 'sections', label: 'Sections' }
  ];

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="logbooks-app">
      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'select' && (
        <SelectMachineSection 
          onStart={handleStartODIT} 
          machines={machines}
          sections={sections}
        />
      )}
      
      {activeTab === 'cleaning' && (
        <CleaningEquipmentLog 
          machine={selectedMachine} 
          section={selectedSection} 
        />
      )}
      
      {activeTab === 'operation' && (
        <OperationEquipmentLog 
          machine={selectedMachine} 
          section={selectedSection} 
        />
      )}
      
      {activeTab === 'machines' && (
        <MachinesPage 
          machines={machines}
          onMachinesChange={loadMachinesAndSections}
        />
      )}
      
      {activeTab === 'sections' && (
        <SectionsPage 
          sections={sections}
          onSectionsChange={loadMachinesAndSections}
        />
      )}
    </div>
  );
};

export default LogBooks;