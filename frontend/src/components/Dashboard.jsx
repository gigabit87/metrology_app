import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

function Dashboard({ user, setUser }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      
      try {
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (err) {
        console.error('Failed to fetch user');
      } finally {
        setLoading(false);
      }
    };
    
    if (!user) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [user, setUser]);

  if (loading) {
    return (
      <div style={{ paddingTop: '80px' }} className="container">
        Загрузка...
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '80px' }} className="dashboard">
      <div className="dashboard-header">
        <div>
          <div className="welcome-text">
            Здравствуйте, {user?.full_name || user?.username}
          </div>
          <div className="welcome-email">{user?.email}</div>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)' }}>
          Система метрологической обработки данных v1.0
        </div>
      </div>
      
      <div className="measurement-card">
        <h3>Модуль метрологической обработки измерений</h3>
        <p style={{ marginTop: '1rem' }}>
        </p>
        <ul style={{ marginTop: '1rem', marginLeft: '0' }}>

        </ul>
      </div>
    </div>
  );
}

export default Dashboard;