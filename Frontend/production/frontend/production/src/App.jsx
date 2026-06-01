import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ProductionLogBooksPage from './pages/ProductionLogBooksPage';
import './assets/App.css';
import './assets/LogBookStyles.css';  // Import your log book styles

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="production-nav">
          <Link to="/">Home</Link>
          <Link to="/logbooks">Log Books</Link>
          {/* Add other production links here */}
        </nav>
        
        <Routes>
          <Route path="/" element={<div>Production Home</div>} />
          <Route path="/logbooks" element={<ProductionLogBooksPage />} />
          {/* Add other production routes here */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;