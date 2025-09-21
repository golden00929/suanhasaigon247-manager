import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();

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

  const handleLinkClick = () => {
    // 모바일에서 링크 클릭 시 사이드바 닫기
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <div
      className={`
        sidebar-gradient shadow-2xl relative z-30 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        fixed inset-y-0 left-0 w-64 md:static md:transform-none
      `}
    >
      {/* Close button for mobile */}
      <div className="md:hidden absolute top-4 right-4 z-40">
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-6">
        <div className="flex items-center space-x-3 mb-2">
          <img
            src="/sua-nha-sai-gon-247.png"
            alt="Logo"
            className="h-10 w-10 lg:h-12 lg:w-12 rounded-lg"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-base lg:text-lg font-semibold text-white truncate">
              Sua Nha Saigon 24/7
            </h1>
          </div>
        </div>
        <p className="text-xs lg:text-sm text-white text-center">MANAGEMENT SYSTEM</p>

        {/* Divider */}
        <div className="mt-4">
          <div className="text-white text-center text-xs lg:text-sm">
            ————————————
          </div>
        </div>
      </div>

      <nav className="mt-3 relative z-10 flex-1 overflow-y-auto">
        <ul className="space-y-2 px-4 pb-6">
          {navItems
            .filter(item => item.roles.includes(user?.role || ''))
            .map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={handleLinkClick}
                  className={`flex items-center px-3 lg:px-4 py-3 text-sm font-medium transition-all duration-300 nav-item text-white rounded-lg ${
                    isActive(item.path)
                      ? 'nav-item active bg-white/20'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <span className={`font-medium ${isActive(item.path) ? 'text-blue-600' : 'text-white'}`}>
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
        </ul>
      </nav>

      <div className="absolute bottom-0 w-64 p-4 lg:p-6 relative z-10">
        {/* Divider above user info */}
        <div className="mb-4">
          <div className="border-t border-white/20"></div>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 lg:p-4 border border-white/30">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 lg:h-10 lg:w-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xs lg:text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs lg:text-sm font-semibold text-white truncate">
                {user?.name}
              </p>
              <p className="text-xs text-white truncate">
                {user?.role === 'ADMIN' ? t('accountManagement.roles.admin') : t('accountManagement.roles.employee')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;