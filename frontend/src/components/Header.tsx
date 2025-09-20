import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    if (window.confirm(t('auth.logoutConfirm'))) {
      logout();
    }
  };

  return (
    <header style={{backgroundColor: 'white', padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '80px', flexShrink: 0}}>
      <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '40px'}}>
        <h2 style={{fontSize: '18px', fontWeight: '600', color: '#6b7280', margin: 0}}>
          {t('auth.welcome')}, {user?.name}
        </h2>
      </div>

      <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
        {/* System Status */}
        <div style={{display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#6b7280'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span style={{width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%'}} className="animate-pulse"></span>
            <span>System Online</span>
          </div>
          <div>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Language Switcher */}
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px'}}>
          <button
            onClick={() => setLanguage('ko')}
            style={{
              padding: '4px 8px',
              backgroundColor: 'transparent',
              border: 'none',
              color: language === 'ko' ? '#2563eb' : '#6b7280',
              fontWeight: language === 'ko' ? '600' : '400',
              cursor: 'pointer'
            }}
          >
            KO
          </button>
          <span style={{color: '#d1d5db'}}>|</span>
          <button
            onClick={() => setLanguage('vi')}
            style={{
              padding: '4px 8px',
              backgroundColor: 'transparent',
              border: 'none',
              color: language === 'vi' ? '#2563eb' : '#6b7280',
              fontWeight: language === 'vi' ? '600' : '400',
              cursor: 'pointer'
            }}
          >
            VN
          </button>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer',
            borderRadius: '8px'
          }}
          title={t('auth.logout')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16,17 21,12 16,7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;

