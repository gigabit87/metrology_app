import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/calculator', name: 'Расчёты', icon: '' },
    { path: '/measurements', name: 'История', icon: '' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: 'var(--bg-card)',
      padding: '0.75rem 1rem',
      boxShadow: 'var(--shadow-sm)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '0.5rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--primary-deep)',
          cursor: 'pointer'
        }} onClick={() => navigate('/')}>
          Метрологическая лаборатория
        </div>
        
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              style={{
                background: location.pathname === item.path ? 'var(--primary-warm)' : 'transparent',
                color: location.pathname === item.path ? 'var(--text-dark)' : 'var(--primary-deep)',
                border: 'none',
                padding: '0.3rem 0.8rem',
                borderRadius: '40px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 500,
                marginTop: 0,
                width: 'auto',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (location.pathname !== item.path) {
                  e.target.style.background = 'rgba(214, 201, 199, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== item.path) {
                  e.target.style.background = 'transparent';
                }
              }}
            >
              <span style={{ marginRight: '0.3rem', opacity: 0.7 }}>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          style={{
            background: 'var(--primary-warm)',
            width: '36px',
            height: '36px',
            borderRadius: '36px',
            padding: 0,
            marginTop: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem',
            fontWeight: 500,
            color: 'var(--text-dark)',
            cursor: 'pointer'
          }}
        >
          {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.username?.charAt(0).toUpperCase() || 'U'}
        </button>

        {isProfileOpen && (
          <div style={{
            position: 'absolute',
            top: '40px',
            right: 0,
            background: 'var(--bg-card)',
            border: '1px solid var(--primary-warm)',
            borderRadius: '12px',
            padding: '0.5rem 0',
            minWidth: '180px',
            boxShadow: 'var(--shadow-md)',
            zIndex: 1001
          }}>
            <div style={{
              padding: '0.5rem 1rem',
              borderBottom: '1px solid var(--primary-warm)',
              marginBottom: '0.3rem'
            }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user?.full_name || user?.username}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-soft)' }}>{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: 'transparent',
                color: 'var(--error)',
                marginTop: 0,
                padding: '0.4rem 1rem',
                textAlign: 'left',
                justifyContent: 'flex-start',
                borderRadius: 0,
                width: '100%',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Выйти
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;