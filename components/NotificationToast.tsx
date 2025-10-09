import React, { useEffect } from 'react';
import { AppNotification, NotificationColorType } from '../types';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

interface NotificationToastProps {
  notification: AppNotification;
  onDismiss: (id: string) => void;
  onClick: () => void;
}

const notificationConfig = {
  [NotificationColorType.Success]: {
    bgColor: 'bg-[#4CD964]/10 border-[#4CD964]/50',
    iconColor: 'text-[#4CD964]',
    textColor: 'text-green-200',
    borderColor: 'border-l-4 border-[#4CD964]',
    icon: <CheckCircle />,
    barColor: 'bg-[#4CD964]/50',
  },
  [NotificationColorType.Warning]: {
    bgColor: 'bg-[#DCFF00]/10 border-[#DCFF00]/50',
    iconColor: 'text-[#DCFF00]',
    textColor: 'text-yellow-100',
    borderColor: 'border-l-4 border-[#DCFF00]',
    icon: <Info />,
    barColor: 'bg-[#DCFF00]/50',
  },
  [NotificationColorType.Alert]: {
    bgColor: 'bg-[#FF3B30]/10 border-[#FF3B30]/50',
    iconColor: 'text-[#FF3B30]',
    textColor: 'text-red-200',
    borderColor: 'border-l-4 border-[#FF3B30]',
    icon: <AlertTriangle />,
    barColor: 'bg-[#FF3B30]/50',
  },
};

export const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onDismiss, onClick }) => {
  const config = notificationConfig[notification.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, 4000);

    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  return (
    <div
      onClick={notification.orderId ? onClick : undefined}
      className={`relative flex items-start w-full p-4 overflow-hidden rounded-lg shadow-lg bg-coal-black/80 backdrop-blur-sm transition-all hover:shadow-xl ${notification.orderId ? 'cursor-pointer' : 'cursor-default'} ${config.borderColor} animate-slide-in-right`}
    >
      <div className={`flex-shrink-0 ${config.iconColor}`}>{config.icon}</div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium text-gray-100">{notification.message}</p>
        {notification.details && <p className={`mt-1 text-sm ${config.textColor}`}>{notification.details}</p>}
      </div>
      <button onClick={(e) => { e.stopPropagation(); onDismiss(notification.id); }} className="ml-4 flex-shrink-0 text-gray-400 hover:text-white">
        <X size={16} />
      </button>
      <div className="absolute bottom-0 left-0 h-1 w-full bg-black/20">
        <div className={`${config.barColor} h-1 animate-timer-bar`} />
      </div>
    </div>
  );
};
