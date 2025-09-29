import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { quotationAPI, customerAPI } from '../services/api';

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

  const [recentQuotations, setRecentQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch quotations data
        const quotationsResponse = await quotationAPI.getQuotations({ page: 1, limit: 50 });
        const quotations = quotationsResponse.data?.quotations || [];

        // Fetch customers data
        const customersResponse = await customerAPI.getCustomers({ page: 1, limit: 10 });
        const customers = customersResponse.data?.customers || [];

        // Calculate today's quotations
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayQuotations = quotations.filter((q: any) => {
          const quotationDate = new Date(q.createdAt);
          return quotationDate >= todayStart;
        }).length;

        // Calculate monthly quotations
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthlyQuotations = quotations.filter((q: any) => {
          const quotationDate = new Date(q.createdAt);
          return quotationDate >= monthStart;
        }).length;

        // Calculate pending quotations
        const pendingQuotations = quotations.filter((q: any) =>
          q.status === 'DRAFT' || q.status === 'REVIEWED'
        ).length;

        // Calculate total revenue (from completed/contracted quotations)
        const totalRevenue = quotations
          .filter((q: any) => q.status === 'CONTRACTED')
          .reduce((sum: number, q: any) => sum + (q.total || 0), 0);

        setStats({
          todayQuotations,
          monthlyQuotations,
          pendingQuotations,
          totalRevenue
        });

        // Set recent quotations for activity feed
        const recent = quotations
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        setRecentQuotations(recent);

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Fallback to showing zeros or previous data
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentQuotations.length > 0 ? (
              recentQuotations.map((item, index) => {
                const getStatusIcon = (status: string) => {
                  switch (status) {
                    case 'CONTRACTED': return '✅';
                    case 'SENT': return '📤';
                    case 'REVIEWED': return '👁️';
                    case 'DRAFT': default: return '⏳';
                  }
                };

                const getTimeAgo = (dateString: string) => {
                  const date = new Date(dateString);
                  const now = new Date();
                  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
                  if (diffInHours < 1) return 'Just now';
                  if (diffInHours < 24) return `${diffInHours} hours ago`;
                  const diffInDays = Math.floor(diffInHours / 24);
                  return `${diffInDays} days ago`;
                };

                return (
                <div key={index} className="activity-item flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                      <span className="text-lg">{getStatusIcon(item.status)}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">{item.quotationNumber}</p>
                      <span className="text-xs text-gray-500">{getTimeAgo(item.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-600">{item.customer?.customerName || 'Unknown Customer'}</p>
                    <p className="text-sm font-medium text-blue-600">{formatCurrency(item.total || 0)}</p>
                  </div>
                </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No recent quotations found</p>
              </div>
            )}
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
            {loading ? (
              <div className="animate-pulse space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="h-2 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              (() => {
                // Calculate weekly quotations
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - 7);
                const weeklyQuotations = recentQuotations.filter((q: any) => {
                  const quotationDate = new Date(q.createdAt);
                  return quotationDate >= weekStart;
                }).length;

                // Calculate success rate
                const totalQuotations = recentQuotations.length;
                const contractedQuotations = recentQuotations.filter((q: any) => q.status === 'CONTRACTED').length;
                const successRate = totalQuotations > 0 ? Math.round((contractedQuotations / totalQuotations) * 100) : 0;

                const quickStats = [
                  { label: 'This Week', value: `${weeklyQuotations} 견적`, progress: Math.min(weeklyQuotations * 10, 100), color: 'bg-blue-500' },
                  { label: 'This Month', value: `${stats.monthlyQuotations} 견적`, progress: Math.min(stats.monthlyQuotations * 4, 100), color: 'bg-green-500' },
                  { label: 'Success Rate', value: `${successRate}%`, progress: successRate, color: 'bg-purple-500' },
                  { label: 'Pending Items', value: `${stats.pendingQuotations}`, progress: Math.min(stats.pendingQuotations * 12, 100), color: 'bg-orange-500' }
                ];

                return quickStats.map((stat, index) => (
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
                ));
              })()
            )}
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

