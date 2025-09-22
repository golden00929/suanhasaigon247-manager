import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const location = useLocation();

  const handleLogout = () => {
    if (window.confirm(t('auth.logoutConfirm'))) {
      logout();
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      path: '/dashboard',
      icon: '📊',
      label: t('nav.dashboard'),
      roles: ['ADMIN']
    },
    {
      path: '/customers',
      icon: '👥',
      label: t('nav.customers'),
      roles: ['ADMIN', 'EMPLOYEE']
    },
    {
      path: '/quotations',
      icon: '📋',
      label: t('nav.quotations'),
      roles: ['ADMIN', 'EMPLOYEE']
    },
    {
      path: '/price-calculator',
      icon: '💰',
      label: t('nav.priceCalculator'),
      roles: ['ADMIN']
    },
    {
      path: '/account-management',
      icon: '⚙️',
      label: t('nav.accountManagement'),
      roles: ['ADMIN']
    },
    {
      path: '/activity-log',
      icon: '📋',
      label: t('activityLog.title'),
      roles: ['ADMIN', 'EMPLOYEE']
    }
  ];

  return (
    <header className="bg-white border-b border-gray-200 flex-shrink-0">
      {/* Single Compact Row */}
      <div className="px-3 md:px-6 py-2 flex items-center justify-between gap-4">
        {/* Left: Logo and Navigation */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <img
              src="/sua-nha-sai-gon-247.png"
              alt="Logo"
              className="h-6 w-6 md:h-8 md:w-8 rounded-lg"
            />
            <div className="hidden sm:block">
              <h1 className="text-xs md:text-sm font-semibold text-gray-800">Sua Nha 24/7</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1 overflow-x-auto flex-1">
            {navItems
              .filter(item => item.roles.includes(user?.role || ''))
              .map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1 px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium rounded whitespace-nowrap transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="hidden lg:inline">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
          </nav>
        </div>

        {/* Right: User Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* User Welcome - Hidden on small screens */}
          <div className="hidden lg:block text-xs text-gray-600">
            {t('auth.welcome')}, <span className="font-medium">{user?.name}</span>
          </div>

          {/* System Status */}
          <div className="hidden xl:flex items-center gap-1 text-xs text-gray-500">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            <span>Online</span>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setLanguage('ko')}
              className={`px-1.5 py-1 rounded ${
                language === 'ko' ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              KO
            </button>
            <button
              onClick={() => setLanguage('vi')}
              className={`px-1.5 py-1 rounded ${
                language === 'vi' ? 'bg-blue-100 text-blue-600 font-medium' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              VN
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title={t('auth.logout')}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

