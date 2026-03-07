/**
 * Notification Context
 * Manages toast notifications across the application
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Notification, NotificationType } from '@/types';
import { NOTIFICATION_DURATION } from '@/constants';

interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (type: NotificationType, message: string, duration?: number) => string;
  removeNotification: (id: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string, persistent?: boolean) => string;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback(
    (type: NotificationType, message: string, duration?: number): string => {
      const id = Math.random().toString(36).substring(2, 11);
      const notification: Notification = {
        id,
        type,
        message,
        duration: duration !== undefined ? duration : NOTIFICATION_DURATION[type.toUpperCase() as keyof typeof NOTIFICATION_DURATION],
      };

      setNotifications((prev) => [...prev, notification]);

      // Auto remove after duration (if duration > 0)
      if (notification.duration && notification.duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, notification.duration);
      }

      return id;
    },
    [removeNotification]
  );

  const success = useCallback((message: string) => addNotification('success', message), [addNotification]);
  const error = useCallback((message: string) => addNotification('error', message), [addNotification]);
  const warning = useCallback((message: string) => addNotification('warning', message), [addNotification]);
  const info = useCallback((message: string, persistent = false): string => {
    return addNotification('info', message, persistent ? 0 : undefined);
  }, [addNotification]);

  const value: NotificationContextValue = {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);

  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }

  return context;
}
