import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const Sidebar: React.FC = () => {
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

  return (
    <div className="sidebar-gradient w-64 shadow-2xl relative">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-2">
          <img
            src="/sua-nha-sai-gon-247.png"
            alt="Logo"
            className="h-12 w-12 rounded-lg"
          />
          <h1 className="text-lg font-semibold text-white">Sua Nha Saigon 24/7</h1>
        </div>
        <p className="text-sm text-white text-center">MANAGEMENT SYSTEM</p>

        {/* Divider */}
        <div className="mt-4">
          <div className="text-white text-center">
            ————————————
          </div>
        </div>
      </div>

      <nav className="mt-3 relative z-10">
        <ul className="space-y-2 px-4">
          {navItems
            .filter(item => item.roles.includes(user?.role || ''))
            .map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-all duration-300 nav-item text-white ${
                    isActive(item.path)
                      ? 'nav-item active bg-white/20'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <span className={`font-medium ${isActive(item.path) ? 'text-blue-600' : 'text-white'}`}>{item.label}</span>
                </Link>
              </li>
            ))}
        </ul>
      </nav>

      <div className="absolute bottom-0 w-64 p-6 relative z-10">
        {/* Divider above user info */}
        <div className="mb-4">
          <div className="border-t border-white/20"></div>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
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