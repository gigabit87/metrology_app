import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

function Register({ setIsAuthenticated }) {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    full_name: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      await axios.post(`${API_URL}/api/auth/register`, formData);
      setSuccess('Регистрация прошла успешно! Перенаправление на страницу входа...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка регистрации. Попробуйте другие данные.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="auth-card">
        <h2>Регистрация</h2>
        <p className="subtitle">Создайте аккаунт для работы с системой</p>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          
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
              type="text"
              placeholder="ФИО (необязательно)"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
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
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        
        <Link to="/login">
          <button className="link-btn">Уже есть аккаунт? Войти</button>
        </Link>
      </div>
    </div>
  );
}

export default Register;