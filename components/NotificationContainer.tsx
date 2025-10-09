import React from 'react';
import { AppNotification } from '../types';
import { NotificationToast } from './NotificationToast';
import { useAppContext } from './AppContext';

interface NotificationContainerProps {
  onNotificationClick: (orderId?: string) => void;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({ onNotificationClick }) => {
  const { notifications, removeNotification } = useAppContext();
  
  return (
    <div className="fixed bottom-4 right-4 z-[100] w-full max-w-sm space-y-3">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={removeNotification}
          onClick={() => onNotificationClick(notification.orderId)}
        />
      ))}
    </div>
  );
};