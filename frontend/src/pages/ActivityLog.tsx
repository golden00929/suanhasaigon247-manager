import React, { useState, useMemo } from 'react';
import { useActivityLog, ActivityLog as ActivityLogType } from '../contexts/ActivityLogContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const ActivityLog: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { logs, getUserLogs, clearLogs } = useActivityLog();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 현재 사용자의 로그만 가져오기 (관리자는 모든 로그 볼 수 있음)
  const userLogs = user?.role === 'ADMIN' ? logs : getUserLogs();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}분 전`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}시간 전`;
    } else if (diffInHours < 48) {
      return '어제';
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getCategoryIcon = (category: ActivityLogType['category']) => {
    const icons = {
      customer: '👥',
      quotation: '📋',
      calculator: '💰',
      account: '⚙️',
      system: '🔧',
      other: '📝'
    };
    return icons[category] || '📝';
  };

  const getCategoryName = (category: ActivityLogType['category']) => {
    return t(`activityLog.categories.${category}`) || t('activityLog.categories.other');
  };

  const getCategoryColor = (category: ActivityLogType['category']) => {
    const colors = {
      customer: 'bg-blue-100 text-blue-800',
      quotation: 'bg-green-100 text-green-800',
      calculator: 'bg-yellow-100 text-yellow-800',
      account: 'bg-purple-100 text-purple-800',
      system: 'bg-gray-100 text-gray-800',
      other: 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // 필터링된 로그
  const filteredLogs = useMemo(() => {
    let filtered = userLogs;

    // 카테고리 필터
    if (filterCategory !== 'all') {
      filtered = filtered.filter(log => log.category === filterCategory);
    }

    // 날짜 필터
    if (filterDate !== 'all') {
      const now = new Date();
      const filterDate_num = parseInt(filterDate);
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp);
        const diffInDays = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24);
        return diffInDays <= filterDate_num;
      });
    }

    // 검색 필터
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(searchLower) ||
        log.details.toLowerCase().includes(searchLower) ||
        log.page.toLowerCase().includes(searchLower) ||
        log.userName.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [userLogs, filterCategory, filterDate, searchTerm]);

  // 통계 계산
  const stats = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const todayLogs = userLogs.filter(log => new Date(log.timestamp) >= todayStart);
    const categoryStats = userLogs.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: userLogs.length,
      today: todayLogs.length,
      categories: categoryStats
    };
  }, [userLogs]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {user?.role === 'ADMIN' ? t('activityLog.allActivity') : t('activityLog.myActivity')}
        </h1>
        <p className="text-gray-600">
          {user?.role === 'ADMIN'
            ? t('activityLog.adminSubtitle')
            : t('activityLog.subtitle')}
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">📊</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">{t('activityLog.totalActivities')}</p>
              <p className="text-lg font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">📅</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">{t('activityLog.todayActivities')}</p>
              <p className="text-lg font-semibold text-gray-900">{stats.today}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold">👥</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">{t('activityLog.customerManagement')}</p>
              <p className="text-lg font-semibold text-gray-900">{stats.categories.customer || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 font-bold">📋</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">{t('activityLog.quotationManagement')}</p>
              <p className="text-lg font-semibold text-gray-900">{stats.categories.quotation || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t('activityLog.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('activityLog.allCategories')}</option>
              <option value="customer">{t('activityLog.categories.customer')}</option>
              <option value="quotation">{t('activityLog.categories.quotation')}</option>
              <option value="calculator">{t('activityLog.categories.calculator')}</option>
              <option value="account">{t('activityLog.categories.account')}</option>
              <option value="system">{t('activityLog.categories.system')}</option>
              <option value="other">{t('activityLog.categories.other')}</option>
            </select>
          </div>
          <div>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('activityLog.allPeriods')}</option>
              <option value="1">{t('activityLog.today')}</option>
              <option value="7">{t('activityLog.last7Days')}</option>
              <option value="30">{t('activityLog.last30Days')}</option>
              <option value="90">{t('activityLog.last90Days')}</option>
            </select>
          </div>
          {user?.role === 'ADMIN' && (
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              {t('activityLog.clearAll')}
            </button>
          )}
        </div>
      </div>

      {/* 활동 로그 리스트 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {t('activityLog.activitiesCount').replace('{count}', filteredLogs.length.toString())}
          </h3>
        </div>

        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              {t('activityLog.noActivities')}
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <span className="text-lg">{getCategoryIcon(log.category)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(log.category)}`}>
                          {getCategoryName(log.category)}
                        </span>
                        {user?.role === 'ADMIN' && (
                          <span className="text-sm text-gray-500">
                            {log.userName}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {log.action}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {log.details}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t('activityLog.page')}: {log.page}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;