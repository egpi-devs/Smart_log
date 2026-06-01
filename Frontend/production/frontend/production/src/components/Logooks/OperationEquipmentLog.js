import React, { useState } from 'react';
import '../styles/LogBookStyles.css';

const OperationEquipmentLog = ({ machine, section }) => {
  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({
    date: '',
    productName: '',
    batchNo: '',
    batchSize: '',
    operationStart: '',
    operationEnd: '',
    incidentBrief: '',
    incidentAction: '',
    doneBy: '',
    checkedBy: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setEntries([...entries, { ...formData, machine, section }]);
    setFormData({
      date: '',
      productName: '',
      batchNo: '',
      batchSize: '',
      operationStart: '',
      operationEnd: '',
      incidentBrief: '',
      incidentAction: '',
      doneBy: '',
      checkedBy: ''
    });
  };

  return (
    <div className="log-book-container operation">
      <h3>Machine: {machine || 'Not selected'} | Section: {section || 'Not selected'}</h3>

      <form onSubmit={handleSubmit} className="entry-form">
        <div className="form-grid operation-grid">
          <input type="date" name="date" value={formData.date} onChange={handleInputChange} />
          <input type="text" name="productName" placeholder="Product Name" value={formData.productName} onChange={handleInputChange} />
          <input type="text" name="batchNo" placeholder="Batch No." value={formData.batchNo} onChange={handleInputChange} />
          <input type="text" name="batchSize" placeholder="Batch Size" value={formData.batchSize} onChange={handleInputChange} />
          <input type="time" name="operationStart" placeholder="Start" value={formData.operationStart} onChange={handleInputChange} />
          <input type="time" name="operationEnd" placeholder="End" value={formData.operationEnd} onChange={handleInputChange} />
          <input type="text" name="incidentBrief" placeholder="Incident Brief" value={formData.incidentBrief} onChange={handleInputChange} />
          <input type="text" name="incidentAction" placeholder="Action" value={formData.incidentAction} onChange={handleInputChange} />
          <input type="text" name="doneBy" placeholder="Done By" value={formData.doneBy} onChange={handleInputChange} />
          <input type="text" name="checkedBy" placeholder="Checked By" value={formData.checkedBy} onChange={handleInputChange} />
        </div>
        <button type="submit" className="submit-btn">Add Entry</button>
      </form>

      <table className="log-table">
        <thead>
          <tr>
            <th>Date</th><th>Product</th><th>Batch No.</th><th>Batch Size</th>
            <th colSpan="2">Operation</th><th colSpan="2">Incident</th>
            <th>Done By</th><th>Checked By</th>
          </tr>
          <tr>
            <th></th><th></th><th></th><th></th>
            <th>Start</th><th>End</th><th>Brief</th><th>Action</th>
            <th></th><th></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr key={idx}>
              <td>{entry.date}</td><td>{entry.productName}</td><td>{entry.batchNo}</td><td>{entry.batchSize}</td>
              <td>{entry.operationStart}</td><td>{entry.operationEnd}</td><td>{entry.incidentBrief}</td><td>{entry.incidentAction}</td>
              <td>{entry.doneBy}</td><td>{entry.checkedBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OperationEquipmentLog;