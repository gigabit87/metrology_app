import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

function Login({ setIsAuthenticated, setUser }) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const formParams = new URLSearchParams();
      formParams.append('username', formData.username);
      formParams.append('password', formData.password);
      
      const response = await axios.post(`${API_URL}/api/auth/login`, formParams, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      localStorage.setItem('access_token', response.data.access_token);

      const userResponse = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${response.data.access_token}` }
      });
      setUser(userResponse.data);
      
      setIsAuthenticated(true);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка входа. Проверьте имя пользователя и пароль.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="auth-card">
        <h2>С возвращением</h2>
        <p className="subtitle">Войдите в Метрологическую лабораторию</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              placeholder="Имя пользователя"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>
          
          <div className="input-group">
            <input
              type="password"
              placeholder="Пароль"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        
        <Link to="/register">
          <button className="link-btn">Создать аккаунт →</button>
        </Link>
      </div>
    </div>
  );
}

export default Login;