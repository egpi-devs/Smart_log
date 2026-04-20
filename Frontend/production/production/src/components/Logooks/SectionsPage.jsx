import React, { useState } from 'react';
import api from '../../api';

const SectionsPage = ({ sections, onSectionsChange }) => {
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionType, setNewSectionType] = useState('Solid');

  const sectionTypes = ['Solid', 'Semi-Solid', 'Liquid'];

  const handleAdd = async () => {
    if (newSectionName.trim() !== '') {
      try {
        await api.post('/api/production/sections/', {
          name: newSectionName,
          type: newSectionType
        });
        setNewSectionName('');
        onSectionsChange();
      } catch (error) {
        console.error('Error adding section:', error);
      }
    }
  };

  const handleEdit = async (id, currentName, currentType) => {
    const newName = prompt('Edit section name', currentName);
    if (newName && newName !== currentName) {
      try {
        await api.put(`/api/production/sections/${id}/`, {
          name: newName,
          type: currentType
        });
        onSectionsChange();
      } catch (error) {
        console.error('Error updating section:', error);
      }
    }
  };

  return (
    <div className="log-book-container operation">
      <h2 className="log-book-title">Sections</h2>
      <div className="form-grid">
        <input
          type="text"
          placeholder="New Section Name"
          value={newSectionName}
          onChange={(e) => setNewSectionName(e.target.value)}
        />
        <select value={newSectionType} onChange={(e) => setNewSectionType(e.target.value)}>
          {sectionTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <button className="submit-btn" onClick={handleAdd}>Add Section</button>
      </div>

      <table className="log-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Section Name</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((section, index) => (
            <tr key={section.id}>
              <td>{index + 1}</td>
              <td>{section.name}</td>
              <td>{section.type}</td>
              <td>
                <button 
                  className="submit-btn" 
                  onClick={() => handleEdit(section.id, section.name, section.type)}
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

export default SectionsPage;