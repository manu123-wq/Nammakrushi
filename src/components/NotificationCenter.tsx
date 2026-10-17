import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  AlertTriangle, 
  Calendar, 
  Package, 
  CloudSun, 
  CloudRain,
  ShoppingBag, 
  Send, 
  Volume2, 
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { NotificationItem, TabType } from '../types';
import { playNotificationChime } from '../utils/audio';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotification: (id: string) => void;
  onTriggerCheck: () => void;
  onNavigateTab: (tab: TabType) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotification,
  onTriggerCheck,
  onNavigateTab,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'task' | 'inventory' | 'weather' | 'order'>('all');
  const [browserPermission, setBrowserPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  if (!isOpen) return null;

  const filtered = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    return n.type === activeFilter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const requestBrowserPush = async () => {
    if (typeof Notification === 'undefined') {
      alert('Browser notifications not supported in this environment');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      if (permission === 'granted') {
        playNotificationChime();
        new Notification('🌾 NammaKrushi Notification System Active', {
          body: 'Task due reminders and low-stock alerts are now connected and working!',
          icon: '/favicon.ico'
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'task':
        return <Calendar className="w-4 h-4 text-amber-600" />;
      case 'inventory':
        return <Package className="w-4 h-4 text-rose-600" />;
      case 'weather':
        return <CloudRain className="w-4 h-4 text-rose-600 animate-pulse" />;
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-emerald-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    }
  };

  const getBadgeColor = (type: NotificationItem['type']) => {
    switch (type) {
      case 'task':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'inventory':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'weather':
        return 'bg-rose-50 text-rose-900 border-rose-300 font-bold';
      case 'order':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-stone-200">
        
        {/* Header */}
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-900 text-base">Notification Center</h3>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">
                Live field alerts, low stock warnings & orders
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Toolbar */}
        <div className="px-4 py-3 bg-emerald-50/70 border-b border-emerald-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Automated Alert Dispatcher
            </span>
            <button
              onClick={() => {
                playNotificationChime();
                onTriggerCheck();
              }}
              className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Send className="w-3 h-3" />
              Check Due Now
            </button>
          </div>
          
          <div className="flex items-center justify-between text-[11px] text-stone-600 pt-1">
            <span className="flex items-center gap-1 text-stone-500">
              <Volume2 className="w-3 h-3 text-emerald-600" /> Audio Chimes Active
            </span>
            {browserPermission !== 'granted' ? (
              <button
                onClick={requestBrowserPush}
                className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
              >
                Enable Desktop Alerts
              </button>
            ) : (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                ✓ Desktop Alerts Allowed
              </span>
            )}
          </div>
        </div>

        {/* Filter Chips */}
        <div className="px-4 py-2 border-b border-stone-200 flex items-center gap-1.5 overflow-x-auto text-xs font-medium scrollbar-none">
          {[
            { id: 'all', label: `All (${notifications.length})` },
            { id: 'task', label: 'Tasks' },
            { id: 'inventory', label: 'Inventory' },
            { id: 'weather', label: 'Weather' },
            { id: 'order', label: 'Orders' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition cursor-pointer ${
                activeFilter === f.id
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {f.label}
            </button>
          ))}
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="ml-auto text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 whitespace-nowrap"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <Bell className="w-10 h-10 mx-auto text-stone-300 mb-2 stroke-1" />
              <p className="text-sm font-medium text-stone-600">No notifications in this filter</p>
              <p className="text-xs text-stone-400 mt-1">All farm tasks and inventory levels are in sync.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.read) onMarkAsRead(item.id);
                  if (item.actionTab) {
                    onNavigateTab(item.actionTab);
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-xl border transition cursor-pointer relative ${
                  item.read
                    ? 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                    : 'bg-emerald-50/40 border-emerald-200/90 text-stone-900 shadow-xs'
                }`}
              >
                {!item.read && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-rose-200" />
                )}
                <div className="flex items-start gap-2.5">
                  <div className={`p-2 rounded-lg border ${getBadgeColor(item.type)} shrink-0`}>
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-stone-900">{item.title}</h4>
                    </div>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="flex items-center justify-between mt-2.5 text-[11px] text-stone-400 font-medium">
                      <span>{item.timestamp}</span>
                      {item.actionTab && (
                        <span className="text-emerald-700 font-bold flex items-center gap-1 hover:underline">
                          View in {item.actionTab} <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-stone-200 bg-stone-50 text-[11px] text-stone-500 text-center">
          NammaKrushi Automated Real-time Alert & Notification System
        </div>
      </div>
    </div>
  );
};
