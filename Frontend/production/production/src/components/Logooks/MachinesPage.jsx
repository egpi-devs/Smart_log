import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const MachinesPage = ({ machines, onMachinesChange }) => {
  const [machineName, setMachineName] = useState('');
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (machineName.trim() === '') {
      setError('Machine name cannot be empty');
      return;
    }
    
    try {
      await axios.post(`${API_URL}/production/machines/`, 
        { name: machineName },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setMachineName('');
      setError('');
      onMachinesChange();
    } catch (error) {
      console.error('Error adding machine:', error);
      setError('Failed to add machine');
    }
  };

  const handleEdit = async (id, currentName) => {
    const newName = prompt('Edit machine name', currentName);
    if (newName && newName !== currentName) {
      try {
        await axios.put(`${API_URL}/production/machines/${id}/`,
          { name: newName },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        onMachinesChange();
      } catch (error) {
        console.error('Error updating machine:', error);
        alert('Failed to update machine');
      }
    }
  };

  return (
    <div className="log-book-container operation">
      <h2 className="log-book-title">Machines</h2>
      <div className="form-grid">
        <input
          type="text"
          placeholder="New Machine Name"
          value={machineName}
          onChange={(e) => setMachineName(e.target.value)}
        />
        <button className="submit-btn" onClick={handleAdd}>Add Machine</button>
      </div>
      {error && <div className="error-message">{error}</div>}

      <table className="log-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Machine Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {machines.map((machine, index) => (
            <tr key={machine.id}>
              <td>{index + 1}</td>
              <td>{machine.name}</td>
              <td>
                <button 
                  className="submit-btn" 
                  onClick={() => handleEdit(machine.id, machine.name)}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MachinesPage;