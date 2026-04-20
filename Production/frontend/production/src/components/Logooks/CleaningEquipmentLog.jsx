import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const CleaningEquipmentLog = ({ machine, section }) => {
  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({
    by: '',
    date: '',
    productName: '',
    batchNo: '',
    batchSize: '',
    timeStart: '',
    timeEnd: '',
    dueDate: '',
    cleaningReason: '',
    doneBy: '',
    checkedBy: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!machine || !section) {
      alert('Please select a machine and section first!');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/production/cleaning-logs/`, 
        {
          ...formData,
          machine: machine.id,
          section: section.id
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      setEntries([...entries, { ...formData, machine, section, id: response.data.id }]);
      setFormData({
        by: '',
        date: '',
        productName: '',
        batchNo: '',
        batchSize: '',
        timeStart: '',
        timeEnd: '',
        dueDate: '',
        cleaningReason: '',
        doneBy: '',
        checkedBy: ''
      });
    } catch (error) {
      console.error('Error adding entry:', error);
      alert('Failed to add entry');
    }
  };

  return (
    <div className="log-book-container cleaning">
      <h3>Machine: {machine?.name || 'Not selected'} | Section: {section?.name || 'Not selected'}</h3>

      <form onSubmit={handleSubmit} className="entry-form">
        <div className="form-grid">
          <input type="text" name="by" placeholder="By" value={formData.by} onChange={handleInputChange} required />
          <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
          <input type="text" name="productName" placeholder="Product Name" value={formData.productName} onChange={handleInputChange} required />
          <input type="text" name="batchNo" placeholder="Batch No." value={formData.batchNo} onChange={handleInputChange} required />
          <input type="text" name="batchSize" placeholder="Batch Size" value={formData.batchSize} onChange={handleInputChange} required />
          <input type="time" name="timeStart" value={formData.timeStart} onChange={handleInputChange} required />
          <input type="time" name="timeEnd" value={formData.timeEnd} onChange={handleInputChange} required />
          <input type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} required />
          <input type="text" name="cleaningReason" placeholder="Cleaning Reason" value={formData.cleaningReason} onChange={handleInputChange} required />
          <input type="text" name="doneBy" placeholder="Done By" value={formData.doneBy} onChange={handleInputChange} required />
          <input type="text" name="checkedBy" placeholder="Checked By" value={formData.checkedBy} onChange={handleInputChange} required />
        </div>
        <button type="submit" className="submit-btn">Add Entry</button>
      </form>

      <table className="log-table">
        <thead>
          <tr>
            <th>By</th><th>Date</th><th>Product</th><th>Batch No.</th><th>Batch Size</th>
            <th>Time Start</th><th>Time End</th><th>Due Date</th><th>Cleaning Reason</th><th>Done By</th><th>Checked By</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr key={idx}>
              <td>{entry.by}</td><td>{entry.date}</td><td>{entry.productName}</td><td>{entry.batchNo}</td><td>{entry.batchSize}</td>
              <td>{entry.timeStart}</td><td>{entry.timeEnd}</td><td>{entry.dueDate}</td><td>{entry.cleaningReason}</td><td>{entry.doneBy}</td><td>{entry.checkedBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="footer-note">PR-002F3</div>
    </div>
  );
};

export default CleaningEquipmentLog;