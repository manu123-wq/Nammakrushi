import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  Area
} from 'recharts';
import { 
  CloudRain, 
  Thermometer, 
  CalendarDays, 
  Sparkles, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle,
  Droplets,
  Tractor,
  Layers
} from 'lucide-react';
import { DISTRICTS } from './Header';

interface ForecastDay {
  day: string;
  date: string;
  temp: number;
  minTemp: number;
  rainfall: number;
  humidity: number;
  rainProb: number;
  condition: string;
  advice: string;
}

interface WeatherTrendChartProps {
  selectedDistrict: string;
  onDistrictChange?: (district: string) => void;
}

export const WeatherTrendChart: React.FC<WeatherTrendChartProps> = ({
  selectedDistrict,
  onDistrictChange
}) => {
  const [forecastData, setForecastData] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'combined' | 'temperature' | 'rainfall'>('combined');
  const [selectedDay, setSelectedDay] = useState<ForecastDay | null>(null);

  useEffect(() => {
    async function loadForecast() {
      setLoading(true);
      try {
        const res = await fetch(`/api/weather?district=${encodeURIComponent(selectedDistrict)}`);
        const data = await res.json();
        if (data.success && data.weather?.weeklyForecast) {
          setForecastData(data.weather.weeklyForecast);
          setSelectedDay(data.weather.weeklyForecast[0]);
        }
      } catch (err) {
        console.error('Failed to load forecast data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadForecast();
  }, [selectedDistrict]);

  // Compute best days for field operations
  const bestSprayingDays = forecastData.filter(d => d.rainfall <= 1.0 && d.rainProb < 30);
  const rainAlertDays = forecastData.filter(d => d.rainfall >= 8.0);
  const dryIrrigationDays = forecastData.filter(d => d.rainfall === 0);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: ForecastDay = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-stone-200 text-xs space-y-1.5 min-w-[200px]">
          <div className="flex items-center justify-between border-b border-stone-100 pb-1">
            <span className="font-bold text-stone-900">{data.day} ({data.date})</span>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
              {data.condition}
            </span>
          </div>

          <div className="flex items-center justify-between text-stone-600">
            <span className="flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-amber-500" /> Max Temp:
            </span>
            <span className="font-bold text-stone-900">{data.temp}°C</span>
          </div>

          <div className="flex items-center justify-between text-stone-600">
            <span className="flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-stone-400" /> Min Temp:
            </span>
            <span className="font-bold text-stone-700">{data.minTemp}°C</span>
          </div>

          <div className="flex items-center justify-between text-stone-600">
            <span className="flex items-center gap-1">
              <CloudRain className="w-3.5 h-3.5 text-sky-500" /> Rainfall:
            </span>
            <span className="font-bold text-sky-700">{data.rainfall} mm ({data.rainProb}% prob)</span>
          </div>

          <div className="flex items-center justify-between text-stone-600">
            <span className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-blue-400" /> Humidity:
            </span>
            <span className="font-semibold text-stone-700">{data.humidity}%</span>
          </div>

          <div className="pt-1.5 border-t border-stone-100 text-[11px] text-emerald-950 bg-emerald-50/70 p-2 rounded-lg font-medium">
            <strong>Advisory:</strong> {data.advice}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-stone-900 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-emerald-700" />
              <span>7-Day Temperature & Rainfall Trends</span>
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Recharts
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Agro-meteorological forecast and field activity planning for <strong>{selectedDistrict}, Karnataka</strong>.
          </p>
        </div>

        {/* District Selector & Mode Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {onDistrictChange && (
            <div className="flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-800">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <select
                value={selectedDistrict}
                onChange={(e) => onDistrictChange(e.target.value)}
                className="bg-transparent border-none text-stone-900 font-bold focus:outline-hidden cursor-pointer text-xs"
              >
                {DISTRICTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          {/* View Toggle Tabs */}
          <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveView('combined')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                activeView === 'combined' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Combined
            </button>
            <button
              onClick={() => setActiveView('temperature')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                activeView === 'temperature' ? 'bg-white text-amber-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Temp (°C)
            </button>
            <button
              onClick={() => setActiveView('rainfall')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                activeView === 'rainfall' ? 'bg-white text-sky-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Rain (mm)
            </button>
          </div>
        </div>
      </div>

      {/* Main Recharts Chart Container */}
      <div className="w-full h-72 sm:h-80">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">
            Loading forecast chart...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={forecastData}
              margin={{ top: 15, right: 10, left: -15, bottom: 5 }}
              onClick={(e: any) => {
                if (e?.activePayload?.[0]?.payload) {
                  setSelectedDay(e.activePayload[0].payload);
                }
              }}
            >
              <defs>
                {/* Temperature Gradient */}
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                </linearGradient>
                {/* Rainfall Gradient */}
                <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.4}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
              
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 11, fill: '#78716c', fontWeight: 600 }}
                tickLine={false}
                axisLine={{ stroke: '#e7e5e4' }}
              />

              {/* Left Y Axis: Temperature */}
              {(activeView === 'combined' || activeView === 'temperature') && (
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  domain={[15, 38]}
                  unit="°C"
                  tick={{ fontSize: 11, fill: '#b45309', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                />
              )}

              {/* Right Y Axis: Rainfall */}
              {(activeView === 'combined' || activeView === 'rainfall') && (
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 25]}
                  unit="mm"
                  tick={{ fontSize: 11, fill: '#0369a1', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                />
              )}

              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
              />

              {/* Rainfall Bars */}
              {(activeView === 'combined' || activeView === 'rainfall') && (
                <Bar
                  yAxisId="right"
                  dataKey="rainfall"
                  name="Expected Rainfall (mm)"
                  fill="url(#rainGradient)"
                  radius={[6, 6, 0, 0]}
                  barSize={24}
                />
              )}

              {/* Temperature Area & Line */}
              {(activeView === 'combined' || activeView === 'temperature') && (
                <>
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="temp"
                    name="Max Temperature (°C)"
                    fill="url(#tempGradient)"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#d97706', stroke: '#fff', strokeWidth: 2 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="minTemp"
                    name="Night Min Temp (°C)"
                    stroke="#a8a29e"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 7-Day Field Schedule Planning Insights */}
      <div className="pt-2 border-t border-stone-100">
        <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Tractor className="w-4 h-4 text-emerald-700" />
          Field Activity Windows (Derived from 7-Day Forecast)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Sowing / Spraying Window */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Pest & Nutrient Spraying</span>
              </div>
              <p className="text-stone-600 leading-relaxed text-[11px]">
                {bestSprayingDays.length > 0 
                  ? `Best on ${bestSprayingDays.map(d => d.day).join(', ')} with minimal rainfall risk and steady winds.`
                  : 'High rain risk across week; wait for clear break before spraying.'}
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 mt-2 block">
              ✓ Low runoff & high foliage absorption
            </span>
          </div>

          {/* Rain Alert Window */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Rain Watch & Drainage</span>
              </div>
              <p className="text-stone-600 leading-relaxed text-[11px]">
                {rainAlertDays.length > 0 
                  ? `Heaviest showers anticipated on ${rainAlertDays.map(d => `${d.day} (${d.rainfall}mm)`).join(', ')}. Keep drainage trenches open.`
                  : 'No heavy precipitation spikes predicted this week.'}
              </p>
            </div>
            <span className="text-[10px] font-bold text-amber-800 mt-2 block">
              ⚠️ Postpone dry fertilizer spreading
            </span>
          </div>

          {/* Irrigation Window */}
          <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-sky-900 mb-1">
                <Droplets className="w-4 h-4 text-sky-600" />
                <span>Irrigation Schedule</span>
              </div>
              <p className="text-stone-600 leading-relaxed text-[11px]">
                {dryIrrigationDays.length > 0 
                  ? `Dry weather on ${dryIrrigationDays.map(d => d.day).join(', ')}. Schedule drip irrigation cycles for cotton and chillies.`
                  : 'Natural rainfall sufficient for current soil moisture.'}
              </p>
            </div>
            <span className="text-[10px] font-bold text-sky-800 mt-2 block">
              💧 Conserve groundwater on rainy days
            </span>
          </div>
        </div>
      </div>

      {/* Selected Day Quick Inspector */}
      {selectedDay && (
        <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span className="font-bold text-stone-900">
              Selected: {selectedDay.day} ({selectedDay.date})
            </span>
            <span className="text-stone-500">• {selectedDay.condition}</span>
            <span className="text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-md text-[11px]">
              Temp: {selectedDay.temp}°C / {selectedDay.minTemp}°C
            </span>
            <span className="text-sky-800 font-bold bg-sky-100 px-2 py-0.5 rounded-md text-[11px]">
              Rain: {selectedDay.rainfall} mm ({selectedDay.rainProb}%)
            </span>
          </div>

          <p className="text-[11px] text-stone-600 italic">
            "{selectedDay.advice}"
          </p>
        </div>
      )}
    </div>
  );
};
