import React from 'react';
import { 
  Sprout, 
  Package, 
  Calendar, 
  TrendingUp, 
  CloudSun, 
  AlertTriangle, 
  Bot, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  ShieldCheck,
  Droplets,
  Wind,
  CloudRain,
  Flame,
  BellRing
} from 'lucide-react';
import { TabType, InventoryItem, FarmTask, NotificationItem } from '../types';
import { WeatherTrendChart } from './WeatherTrendChart';

interface DashboardProps {
  district: string;
  onDistrictChange?: (district: string) => void;
  weather: { temp: number; condition: string; humidity: number; rainfall?: number; wind?: string; soilMoisture?: string } | null;
  inventory: InventoryItem[];
  tasks: FarmTask[];
  notifications: NotificationItem[];
  onNavigateTab: (tab: TabType) => void;
  onOpenGuideModal: () => void;
  onOpenNotifications: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  district,
  onDistrictChange,
  weather,
  inventory,
  tasks,
  notifications,
  onNavigateTab,
  onOpenGuideModal,
  onOpenNotifications
}) => {
  const today = new Date().toISOString().split('T')[0];
  const pendingTasksToday = tasks.filter(t => t.status === 'Pending' && t.dueDate === today);
  const lowStockItems = inventory.filter(i => i.quantity <= i.minThreshold);
  const unreadNotifications = notifications.filter(n => !n.read);

  // Weather Threshold Trigger Evaluation
  const isHeavyRainBreach = (weather?.rainfall ?? 0) >= 10.0;
  const isHeatwaveBreach = (weather?.temp ?? 0) >= 33.0;
  const isWindBreach = parseInt(weather?.wind || '0', 10) >= 18;
  const isSaturationBreach = !!(weather?.soilMoisture && weather.soilMoisture.toLowerCase().includes('saturated'));
  const hasExtremeCondition = isHeavyRainBreach || isHeatwaveBreach || isWindBreach || isSaturationBreach;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Extreme Weather Threshold Breach Banner (Automated Alert System) */}
      {hasExtremeCondition && (
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 text-white rounded-3xl p-5 sm:p-6 shadow-lg border border-rose-700/60 animate-fade-in relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-800/80 border border-rose-600 flex items-center justify-center text-rose-200 shrink-0 shadow-inner">
                {isHeavyRainBreach ? (
                  <CloudRain className="w-7 h-7 text-amber-300 animate-pulse" />
                ) : isHeatwaveBreach ? (
                  <Flame className="w-7 h-7 text-amber-400 animate-pulse" />
                ) : (
                  <Wind className="w-7 h-7 text-sky-300 animate-pulse" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider bg-rose-600/90 text-white px-2.5 py-0.5 rounded-full border border-rose-400">
                    Threshold Breach Alert
                  </span>
                  <span className="text-xs text-rose-200 font-semibold">
                    {district}, Karnataka
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                  {isHeavyRainBreach
                    ? `Extreme Heavy Rainfall Alert (${weather?.rainfall} mm)`
                    : isHeatwaveBreach
                    ? `Severe Heatwave Warning (${weather?.temp}°C)`
                    : isWindBreach
                    ? `High Wind & Gust Warning (${weather?.wind})`
                    : 'Soil Water Saturation Alert'}
                </h3>
                <p className="text-xs text-rose-100 max-w-2xl mt-1 leading-relaxed">
                  {isHeavyRainBreach
                    ? `Precipitation (${weather?.rainfall} mm) exceeds the 10.0 mm heavy rain safety threshold. High risk of waterlogging, root asphyxiation, and fertilizer leaching. Open bund drainage channels and postpone all foliar chemical sprays.`
                    : isHeatwaveBreach
                    ? `Ambient temperature (${weather?.temp}°C) exceeds the 33.0 °C heat threshold. High risk of flower and boll drop in cotton/chillies. Initiate evening drip irrigation and avoid midday nitrogen top-dressing.`
                    : isWindBreach
                    ? `Wind velocity (${weather?.wind}) exceeds the 18 km/h safety threshold. High lodging risk in maize and sugarcane. Stake young saplings and secure greenhouse shade sheets.`
                    : 'Soil moisture has reached saturation level. Delay tractor tillage to prevent soil compaction.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap md:flex-col gap-2 shrink-0 w-full md:w-auto">
              <button
                onClick={onOpenNotifications}
                className="flex-1 md:flex-none px-4 py-2 bg-white hover:bg-rose-50 text-rose-950 font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BellRing className="w-4 h-4 text-rose-700" />
                <span>View Alert in Notification Center</span>
              </button>

              <button
                onClick={() => onNavigateTab('chatbot')}
                className="flex-1 md:flex-none px-4 py-2 bg-rose-800/80 hover:bg-rose-800 text-white font-semibold text-xs rounded-xl transition border border-rose-600/60 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Bot className="w-4 h-4 text-rose-200" />
                <span>Ask AI Emergency Mitigation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Farm Overview Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-emerald-700/80 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-bold text-emerald-200 mb-3">
            <Sprout className="w-3.5 h-3.5" />
            <span>Climate-Smart Agricultural Intelligence & Farmer Marketplace</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            NammaKrushi: Farm Operations & Commerce
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-2 leading-relaxed">
            Real-time agro-climatic intelligence, smart categorized inventory tracking, predictive ML crop modeling, and direct market linkage for farmers.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('chatbot')}
              className="bg-white text-emerald-950 hover:bg-emerald-50 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Bot className="w-4 h-4 text-emerald-700" />
              <span>Ask AI Farming Assistant</span>
            </button>

            <button
              onClick={() => onNavigateTab('marketplace')}
              className="bg-emerald-700/80 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer border border-emerald-500/30"
            >
              <TrendingUp className="w-4 h-4 text-emerald-300" />
              <span>Explore Marketplace</span>
            </button>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-emerald-500/10 pointer-events-none blur-2xl" />
      </div>

      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Today's Tasks */}
        <div 
          onClick={() => onNavigateTab('tasks')}
          className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Tasks Due Today</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-stone-900">
              {pendingTasksToday.length}
            </div>
            <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
              <span>{tasks.filter(t => t.status === 'Completed').length} completed</span>
              <span className="text-stone-300">•</span>
              <span className="text-amber-700 font-bold">Auto-reminders active</span>
            </p>
          </div>
        </div>

        {/* Card 2: Inventory Status */}
        <div 
          onClick={() => onNavigateTab('inventory')}
          className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">Farm Inventory</span>
            <div className={`p-2 rounded-xl ${lowStockItems.length > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-stone-900">
              {inventory.length} <span className="text-sm font-semibold text-stone-500">Items</span>
            </div>
            <p className="text-xs mt-1 font-semibold flex items-center gap-1">
              {lowStockItems.length > 0 ? (
                <span className="text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {lowStockItems.length} Low Stock Alert{lowStockItems.length > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-emerald-700">All stocks above threshold</span>
              )}
            </p>
          </div>
        </div>

        {/* Card 3: Crop Land & Sector */}
        <div 
          onClick={() => onNavigateTab('predict')}
          className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">AI Crop Suitability</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Sprout className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-emerald-800">
              92%
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Top match: <strong>Bt Cotton & Jowar</strong>
            </p>
          </div>
        </div>

        {/* Card 4: Mandi Pulse */}
        <div 
          onClick={() => onNavigateTab('market-rates')}
          className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500">APMC Mandi Hub</span>
            <div className="p-2 rounded-xl bg-green-50 text-green-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-stone-900">
              Hubballi
            </div>
            <p className="text-xs text-emerald-700 mt-1 font-bold flex items-center gap-1">
              <span>Cotton ₹7,450 / Qtl (+3.2%)</span>
            </p>
          </div>
        </div>
      </div>

      {/* 7-Day Temperature & Rainfall Trends Chart (recharts) */}
      <WeatherTrendChart 
        selectedDistrict={district} 
        onDistrictChange={onDistrictChange} 
      />

      {/* Main Grid: Weather + Today's Schedule & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Weather & Field Recommendations (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Weather Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Field Micro-Climate</span>
                <h3 className="font-bold text-stone-900 text-lg">{district}, Karnataka</h3>
              </div>
              <CloudSun className="w-8 h-8 text-amber-500" />
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <span className="text-4xl font-black text-stone-900">{weather?.temp || 28}°C</span>
                <span className="text-xs font-semibold text-stone-500 block mt-0.5">{weather?.condition || 'Partly Cloudy'}</span>
              </div>
              <div className="text-right text-xs text-stone-500 space-y-1">
                <div className="flex items-center gap-1.5 justify-end">
                  <Droplets className="w-3.5 h-3.5 text-sky-600" />
                  <span>Humidity: <strong>{weather?.humidity || 66}%</strong></span>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <Wind className="w-3.5 h-3.5 text-stone-400" />
                  <span>Wind: <strong>{weather?.wind || '14 km/h'}</strong></span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-950">
              <span className="font-bold block mb-0.5">🌾 Agronomic Advisory for Today:</span>
              Optimal atmospheric moisture for foliar nutrient sprays before 12:30 PM. Rain risk rises towards late evening.
            </div>
          </div>

          {/* Quick AI Farming Prompt Box */}
          <div className="bg-gradient-to-br from-emerald-800 to-green-900 text-white rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-300" />
              <h3 className="font-bold text-base">Ask NammaKrushi AI</h3>
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed">
              Powered by Google Gemini 3.8 Flash. Instant advice on pest remedies, NPK ratios, weed control, and mandi price timing.
            </p>
            <button
              onClick={() => onNavigateTab('chatbot')}
              className="w-full py-2.5 bg-white text-emerald-950 hover:bg-emerald-50 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Open AI Chatbot</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Active Schedule & Notifications (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Today's Tasks */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-stone-900 text-base">Today's Field Schedule</h3>
                <p className="text-xs text-stone-500">Automated reminder triggers active</p>
              </div>
              <button
                onClick={() => onNavigateTab('tasks')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Manage Tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {pendingTasksToday.length === 0 ? (
                <div className="text-center py-6 text-stone-400 text-xs">
                  All scheduled tasks for today are completed!
                </div>
              ) : (
                pendingTasksToday.map(task => (
                  <div
                    key={task.id}
                    className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <div>
                        <h4 className="font-bold text-stone-900">{task.title}</h4>
                        <span className="text-[11px] text-stone-500">{task.fieldSector} • Assigned to {task.assignedTo}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                      {task.priority} Priority
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Stock Warning Strip */}
          {lowStockItems.length > 0 && (
            <div className="bg-white rounded-2xl border border-rose-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <h4 className="font-bold text-stone-900 text-sm">Low Stock Reorder Alerts</h4>
                </div>
                <button
                  onClick={() => onNavigateTab('inventory')}
                  className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer"
                >
                  Restock <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {lowStockItems.map(item => (
                  <div key={item.id} className="p-2.5 bg-rose-50/60 rounded-xl border border-rose-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900 block truncate">{item.name}</span>
                      <span className="text-[11px] text-rose-700">
                        Remaining: <strong>{item.quantity} {item.unit}</strong> (Min: {item.minThreshold})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Working Notification Trigger Quick Test */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <span className="font-bold text-stone-900 block">Notification Center Operational</span>
                <span className="text-stone-500">{unreadNotifications.length} unread alerts queued</span>
              </div>
            </div>
            <button
              onClick={onOpenNotifications}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
            >
              Open Alerts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
