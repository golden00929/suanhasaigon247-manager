import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const [stats, setStats] = useState({
    todayQuotations: 0,
    monthlyQuotations: 0,
    pendingQuotations: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    // TODO: Fetch real data from API
    // For now, using mock data
    setStats({
      todayQuotations: 5,
      monthlyQuotations: 23,
      pendingQuotations: 8,
      totalRevenue: 125000000
    });
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'decimal'
    }).format(amount) + ' VND';
  };

  const statCards = [
    {
      title: t('dashboard.todayQuotations'),
      value: stats.todayQuotations,
      icon: '📊',
      color: 'bg-blue-500'
    },
    {
      title: t('dashboard.monthlyQuotations'),
      value: stats.monthlyQuotations,
      icon: '📈',
      color: 'bg-green-500'
    },
    {
      title: t('dashboard.pendingQuotations'),
      value: stats.pendingQuotations,
      icon: '⏳',
      color: 'bg-yellow-500'
    },
    {
      title: t('dashboard.totalRevenue'),
      value: formatCurrency(stats.totalRevenue),
      icon: '💰',
      color: 'bg-purple-500'
    }
  ];

  return (
    <div style={{padding: '24px', position: 'relative'}}>

      {/* Hero Section */}
      <div className="glass-card p-8 relative overflow-hidden" style={{marginBottom: '32px'}}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-10 transform translate-x-16 -translate-y-16"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold gradient-text mb-3">
            {t('dashboard.title')}
          </h1>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" style={{marginBottom: '32px'}}>
        {statCards.map((card, index) => (
          <div key={index} className="stat-card group cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-4 rounded-2xl ${card.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-2xl">{card.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
              <div className="text-green-500 text-sm font-semibold">
                +12% ↗
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${card.color} opacity-60`} style={{width: `${65 + index * 10}%`}}></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">vs last month</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {t('dashboard.recentActivity')}
            </h3>
            <button className="modern-button text-xs px-4 py-2">View All</button>
          </div>
          <div className="space-y-4">
            {[
              { id: 'QT-17/01/2025-001', company: 'ABC Company', amount: '15.000.000 VND', time: '2 hours ago', status: 'completed', icon: '✅' },
              { id: 'QT-17/01/2025-002', company: 'XYZ Corporation', amount: '8.500.000 VND', time: '4 hours ago', status: 'pending', icon: '⏳' },
              { id: 'QT-17/01/2025-003', company: 'DEF Ltd', amount: '12.000.000 VND', time: '6 hours ago', status: 'review', icon: '👁️' }
            ].map((item, index) => (
              <div key={index} className="activity-item flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                    <span className="text-lg">{item.icon}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{item.id}</p>
                    <span className="text-xs text-gray-500">{item.time}</span>
                  </div>
                  <p className="text-xs text-gray-600">{item.company}</p>
                  <p className="text-sm font-medium text-blue-600">{item.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {t('dashboard.quickStats')}
            </h3>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-6">
            {[
              { label: 'This Week', value: '12 견적', progress: 75, color: 'bg-blue-500' },
              { label: 'This Month', value: '45 견적', progress: 90, color: 'bg-green-500' },
              { label: 'Success Rate', value: '78%', progress: 78, color: 'bg-purple-500' },
              { label: 'Avg. Response Time', value: '2.5 hours', progress: 85, color: 'bg-orange-500' }
            ].map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">{stat.label}</span>
                  <span className="text-sm font-bold text-gray-900">{stat.value}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${stat.color} transition-all duration-1000 ease-out`}
                    style={{ width: `${stat.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">System Performance</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600">Excellent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

