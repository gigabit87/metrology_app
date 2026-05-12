import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Measurements from './components/Measurements';
import Calculator from './components/Calculator';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return <div className="container">Загрузка...</div>;
  }

  return (
    <Router>
      {isAuthenticated && <Navbar user={user} onLogout={handleLogout} />}
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/calculator" />} />
        <Route path="/register" element={!isAuthenticated ? <Register setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/calculator" />} />
        <Route path="/measurements" element={isAuthenticated ? <Measurements user={user} setUser={setUser} /> : <Navigate to="/login" />} />
        <Route path="/calculator" element={isAuthenticated ? <Calculator user={user} setUser={setUser} /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to="/calculator" />} />
      </Routes>
    </Router>
  );
}

export default App;