import React from 'react';
import { 
  Sprout, 
  Bell, 
  ShoppingCart, 
  MapPin, 
  CloudSun,
  LogIn,
  LogOut,
  User,
  Radio,
  CloudCheck
} from 'lucide-react';
import { TabType, NotificationItem, UserRole } from '../types';
import type { FirebaseUser } from '../firebase';

interface HeaderProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  selectedDistrict: string;
  onDistrictChange: (district: string) => void;
  weather: { temp: number; condition: string; humidity: number } | null;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  cartCount: number;
  onOpenCart: () => void;
  user: any;
  userRole?: UserRole;
  onOpenAuthScreen: () => void;
  onSignOut: () => void;
}

export const DISTRICTS = [
  'Dharwad',
  'Belagavi',
  'Hubballi',
  'Bagalkote',
  'Vijayapura',
  'Kalaburagi',
  'Shivamogga',
  'Bengaluru'
];

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  selectedDistrict,
  onDistrictChange,
  weather,
  notifications,
  onOpenNotifications,
  cartCount,
  onOpenCart,
  user,
  userRole = 'farmer',
  onOpenAuthScreen,
  onSignOut,
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  const consumerTabs = [
    { id: 'marketplace', label: '🛒 Buy Farmer Produce' },
    { id: 'purchase-history', label: '📜 My Orders' },
    { id: 'order-tracking', label: '🚚 Order Tracking' },
    { id: 'market-rates', label: '📈 APMC Mandi Rates' },
    { id: 'chatbot', label: '🤖 Farm AI Assistant' },
  ];

  const farmerTabs = [
    { id: 'dashboard', label: '🌾 Farm Dashboard' },
    { id: 'farmer-orders', label: '📦 Order Management' },
    { id: 'marketplace', label: '🛒 Produce Marketplace' },
    { id: 'inventory', label: '📦 Smart Inventory' },
    { id: 'tasks', label: '📋 Task Schedule' },
    { id: 'market-rates', label: '📈 APMC Mandi Rates' },
    { id: 'predict', label: '🧪 AI Crop Predictor' },
    { id: 'chatbot', label: '🤖 AI Chatbot' },
  ];

  const adminTabs = [
    { id: 'admin', label: '🛡️ Admin Command Center' },
    { id: 'marketplace', label: '🛒 Produce Catalog' },
    { id: 'market-rates', label: '📈 APMC Mandi Rates' },
  ];

  const activeTabs = userRole === 'admin' ? adminTabs : userRole === 'consumer' ? consumerTabs : farmerTabs;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => onTabChange(userRole === 'admin' ? 'admin' : userRole === 'consumer' ? 'marketplace' : 'dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-stone-900">NammaKrushi</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ನಮ್ಮ ಕೃಷಿ
                </span>
                {/* Active Role Tag */}
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  userRole === 'admin'
                    ? 'bg-purple-100 text-purple-900 border-purple-300'
                    : userRole === 'consumer' 
                    ? 'bg-amber-100 text-amber-900 border-amber-300' 
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}>
                  {userRole === 'admin' ? '🛡️ Administrator' : userRole === 'consumer' ? '🛒 Consumer Direct' : '🌾 Farmer'}
                </span>
              </div>
              <p className="text-[11px] font-medium text-stone-500 tracking-wide">
                {userRole === 'admin'
                  ? 'Government & Platform Administrative Gateway'
                  : userRole === 'consumer'
                  ? 'Direct Farm-to-Consumer Produce Store'
                  : 'AI Farm Management & Direct Marketplace'}
              </p>
            </div>
          </div>

          {/* Quick Context Controls */}
          <div className="hidden lg:flex items-center gap-3">
            {/* District Selector */}
            <div className="flex items-center gap-1.5 bg-stone-100/90 hover:bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-700 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <select
                value={selectedDistrict}
                onChange={(e) => onDistrictChange(e.target.value)}
                className="bg-transparent border-none text-stone-800 font-semibold focus:outline-hidden cursor-pointer"
              >
                {DISTRICTS.map(d => (
                  <option key={d} value={d}>{d}, Karnataka</option>
                ))}
              </select>
            </div>

            {/* Weather Widget */}
            {weather && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-lg text-xs text-emerald-900 font-medium">
                <CloudSun className="w-4 h-4 text-amber-500" />
                <span>{weather.temp}°C</span>
                <span className="text-emerald-700/70">• {weather.condition}</span>
                <span className="text-stone-500">({weather.humidity}% RH)</span>
              </div>
            )}
          </div>

          {/* Right Action Icons & Firebase Auth */}
          <div className="flex items-center gap-2.5">

            {/* Notifications Button with active badge */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl hover:bg-stone-100 text-stone-700 transition cursor-pointer border border-stone-200/60"
              title="Notification Center"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2 rounded-xl hover:bg-stone-100 text-stone-700 transition cursor-pointer border border-stone-200/60"
              title="Marketplace Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Firebase Email/Password Auth Button & Profile */}
            {user ? (
              <div className="flex items-center gap-2 pl-1 border-l border-stone-200">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || (userRole === 'consumer' ? 'Consumer' : 'Farmer')}
                    className="w-8 h-8 rounded-full border border-emerald-300 object-cover"
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    userRole === 'consumer'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    <User className="w-4 h-4" />
                  </div>
                )}
                <div className="hidden sm:block text-left text-xs">
                  <span className="font-bold text-stone-900 block truncate max-w-[130px]">
                    {user.displayName || (user as any).phone || user.email?.split('@')[0] || (userRole === 'consumer' ? 'Consumer' : 'Farmer')}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 
                    {userRole === 'consumer' ? 'Consumer Logged In' : 'Farmer Logged In'}
                  </span>
                </div>
                <button
                  onClick={onSignOut}
                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthScreen}
                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ml-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login / Register</span>
              </button>
            )}
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 border-t border-stone-100 scrollbar-none text-xs sm:text-sm font-semibold">
          {activeTabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as TabType)}
                className={`relative px-3.5 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/20'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
