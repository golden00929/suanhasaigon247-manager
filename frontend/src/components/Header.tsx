import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const handleLogout = () => {
    if (window.confirm(t('auth.logoutConfirm'))) {
      logout();
    }
  };

  return (
    <header className="bg-white px-4 lg:px-6 py-4 border-b border-gray-200 flex items-center justify-between h-16 lg:h-20 flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <h2 className="text-base lg:text-lg font-semibold text-gray-600 truncate">
          {t('auth.welcome')}, {user?.name}
        </h2>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        {/* System Status - Hidden on mobile */}
        <div className="hidden lg:flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>System Online</span>
          </div>
          <div>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-1 lg:gap-2 text-sm">
          <button
            onClick={() => setLanguage('ko')}
            className={`px-2 py-1 bg-transparent border-none cursor-pointer ${
              language === 'ko' ? 'text-blue-600 font-semibold' : 'text-gray-500 font-normal'
            }`}
          >
            KO
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => setLanguage('vi')}
            className={`px-2 py-1 bg-transparent border-none cursor-pointer ${
              language === 'vi' ? 'text-blue-600 font-semibold' : 'text-gray-500 font-normal'
            }`}
          >
            VN
          </button>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="p-2 bg-transparent border-none text-gray-500 cursor-pointer rounded-lg hover:bg-gray-100"
          title={t('auth.logout')}
        >
          <svg className="w-4 h-4 lg:w-5 lg:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

