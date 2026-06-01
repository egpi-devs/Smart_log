import React, { useState } from 'react';
import '../styles/LogBookStyles.css';

const SectionsPage = () => {
  const [sections, setSections] = useState([
    { type: 'Solid', name: 'Section A' },
    { type: 'Semi-Solid', name: 'Section B' },
    { type: 'Liquid', name: 'Section C' },
  ]);

  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionType, setNewSectionType] = useState('Solid');

  const handleAdd = () => {
    if (newSectionName.trim() !== '') {
      setSections([...sections, { name: newSectionName, type: newSectionType }]);
      setNewSectionName('');
    }
  };

  const handleEdit = (index) => {
    const updatedName = prompt('Edit section name', sections[index].name);
    if (updatedName) {
      const updatedSections = [...sections];
      updatedSections[index].name = updatedName;
      setSections(updatedSections);
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
          <option value="Solid">Solid</option>
          <option value="Semi-Solid">Semi-Solid</option>
          <option value="Liquid">Liquid</option>
        </select>
        <button className="submit-btn" onClick={handleAdd}>Add Section</button>
      </div>

      <table className="log-table">
        <thead>
          <tr><th>#</th><th>Section Name</th><th>Type</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {sections.map((s, i) => (
            <tr key={i}>
              <td>{i+1}</td>
              <td>{s.name}</td>
              <td>{s.type}</td>
              <td>
                <button className="submit-btn" onClick={() => handleEdit(i)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SectionsPage;