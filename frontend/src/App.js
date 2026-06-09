import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import Measurements from './components/Measurements';
import Calculator from './components/Calculator';
import Navbar from './components/Navbar';
import './App.css';

const API_URL = 'http://localhost:8000';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        setUser(response.data);
        setIsAuthenticated(true);
      })
      .catch(() => {
        localStorage.removeItem('access_token');
        setIsAuthenticated(false);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
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
        <Route path="/" element={<Home isAuthenticated={isAuthenticated} user={user} />} />
        
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated} setUser={setUser} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/register" 
          element={!isAuthenticated ? <Register setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />} 
        />
        
        <Route 
          path="/measurements" 
          element={isAuthenticated ? <Measurements user={user} setUser={setUser} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/calculator" 
          element={isAuthenticated ? <Calculator user={user} setUser={setUser} /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;