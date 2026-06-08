import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home({ isAuthenticated, user }) {
  const navigate = useNavigate();

  const handleNavigateToCalculator = (tab) => {
    navigate('/calculator', { state: { activeTab: tab } });
  };

  if (isAuthenticated && user) {
    return (
      <div style={{ paddingTop: '80px' }} className="dashboard">
        <div className="dashboard-header">
          <div>
            <div className="welcome-text">Здравствуйте, {user?.full_name || user?.username}</div>
            <div className="welcome-email">{user?.email}</div>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)' }}>
            Система метрологической обработки данных
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Карточка регрессии */}
          <div 
            className="measurement-card" 
            style={{ cursor: 'pointer' }} 
            onClick={() => handleNavigateToCalculator('regression')}
          >
            <h3>📈 Регрессионный анализ</h3>
            <p>Построение градуировочных зависимостей, расчёт коэффициентов корреляции, прогнозирование</p>
            <button style={{ width: 'auto', marginTop: '1rem', background: 'var(--primary-deep)' }}>
              Перейти к расчётам
            </button>
          </div>
          
          {/* Карточка статистики */}
          <div 
            className="measurement-card" 
            style={{ cursor: 'pointer' }} 
            onClick={() => handleNavigateToCalculator('sample')}
          >
            <h3>📊 Статистика выборки</h3>
            <p>Расчёт среднего, СКО, доверительного интервала, коэффициента вариации</p>
            <button style={{ width: 'auto', marginTop: '1rem', background: 'var(--primary-deep)' }}>
              Перейти к расчётам
            </button>
          </div>
          
          {/* Карточка истории */}
          <div className="measurement-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/measurements')}>
            <h3>💾 История расчётов</h3>
            <p>Все сохранённые расчёты, просмотр и управление</p>
            <button style={{ width: 'auto', marginTop: '1rem', background: 'var(--primary-deep)' }}>
              Открыть историю
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-light)' }}>
      <nav style={{
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary-deep)' }}>Metrology Lab</div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/login')} 
            style={{
              background: 'transparent',
              color: 'var(--primary-deep)',
              width: 'auto',
              padding: '0.5rem 1.5rem',
              marginTop: 0,
              border: '1px solid var(--primary-deep)',
              cursor: 'pointer',
              borderRadius: '40px'
            }}
          >
            Вход
          </button>
          <button 
            onClick={() => navigate('/register')} 
            style={{
              background: 'var(--primary-deep)',
              width: 'auto',
              padding: '0.5rem 1.5rem',
              marginTop: 0,
              border: 'none',
              cursor: 'pointer',
              borderRadius: '40px',
              color: 'white'
            }}
          >
            Регистрация
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-dark)' }}>
          Метрологическая обработка<br />результатов измерений
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-soft)', maxWidth: '700px', margin: '0 auto 2rem auto' }}>
          Профессиональный инструмент для регрессионного анализа, статистической обработки данных
        </p>
        <button 
          onClick={() => navigate('/register')} 
          style={{
            background: 'var(--primary-deep)',
            width: 'auto',
            padding: '0.8rem 2rem',
            fontSize: '1rem',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '40px',
            color: 'white'
          }}
        >
          Начать работу
        </button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--primary-deep)' }}>📈</div>
          <h3>Регрессионный анализ</h3>
          <p>Градуировочные зависимости, корреляция, прогнозирование</p>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--primary-deep)' }}>📊</div>
          <h3>Статистика выборки</h3>
          <p>Среднее, СКО, доверительный интервал, коэффициент вариации</p>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--primary-deep)' }}>💾</div>
          <h3>История расчётов</h3>
          <p>Автосохранение, просмотр и управление</p>
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-soft)', fontSize: '0.8rem' }}>
        <p>Metrology Lab - метрологическая обработка результатов измерений</p>

      </footer>
    </div>
  );
}

export default Home;