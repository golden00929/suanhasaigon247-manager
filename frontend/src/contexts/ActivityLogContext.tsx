import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  page: string;
  timestamp: string;
  category: 'customer' | 'quotation' | 'calculator' | 'account' | 'system' | 'other';
}

interface ActivityLogContextType {
  logs: ActivityLog[];
  addLog: (action: string, details: string, page: string, category: ActivityLog['category']) => void;
  getUserLogs: (userId?: string) => ActivityLog[];
  clearLogs: () => void;
}

const ActivityLogContext = createContext<ActivityLogContextType | undefined>(undefined);

export const useActivityLog = () => {
  const context = useContext(ActivityLogContext);
  if (!context) {
    throw new Error('useActivityLog must be used within an ActivityLogProvider');
  }
  return context;
};

interface ActivityLogProviderProps {
  children: ReactNode;
}

export const ActivityLogProvider: React.FC<ActivityLogProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // 로컬스토리지에서 로그 불러오기
  useEffect(() => {
    const savedLogs = localStorage.getItem('activityLogs');
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (error) {
        console.error('활동 로그 불러오기 실패:', error);
      }
    }
  }, []);

  // 로그 변경시 로컬스토리지에 저장
  useEffect(() => {
    localStorage.setItem('activityLogs', JSON.stringify(logs));
  }, [logs]);

  const addLog = (action: string, details: string, page: string, category: ActivityLog['category']) => {
    if (!user) return;

    const newLog: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id || user.username,
      userName: user.name || user.username,
      action,
      details,
      page,
      category,
      timestamp: new Date().toISOString()
    };

    setLogs(prevLogs => [newLog, ...prevLogs].slice(0, 1000)); // 최대 1000개 로그 유지
  };

  const getUserLogs = (userId?: string) => {
    const targetUserId = userId || user?.id || user?.username;
    if (!targetUserId) return [];

    return logs.filter(log => log.userId === targetUserId);
  };

  const clearLogs = () => {
    setLogs([]);
    localStorage.removeItem('activityLogs');
  };

  return (
    <ActivityLogContext.Provider value={{ logs, addLog, getUserLogs, clearLogs }}>
      {children}
    </ActivityLogContext.Provider>
  );
};