import React, { useState, useEffect, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Search, 
  RefreshCw, 
  Building2, 
  Sparkles, 
  ArrowRight,
  ShieldAlert,
  BarChart3,
  Calendar,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Clock,
  ChevronRight,
  CheckCircle2,
  Info,
  CalendarDays
} from 'lucide-react';
import { MarketRate } from '../types';
import { INITIAL_MARKET_RATES } from '../utils/mockData';

interface MarketRatesProps {
  onNavigateChatbotWithQuery: (query: string) => void;
}

export const MarketRates: React.FC<MarketRatesProps> = ({ onNavigateChatbotWithQuery }) => {
  const [rates, setRates] = useState<MarketRate[]>(INITIAL_MARKET_RATES);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<string>('Today, 10:30 AM');

  // Selected crop for the 30-day price trend graph
  const [selectedCrop, setSelectedCrop] = useState<MarketRate>(INITIAL_MARKET_RATES[2] || INITIAL_MARKET_RATES[0]); // Byadgi Red Chilli or Cotton
  const [chartView, setChartView] = useState<'composed' | 'priceOnly' | 'arrivals'>('composed');

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/market_rates');
      const data = await res.json();
      if (data.success && data.rates) {
        setRates(data.rates);
        setLastRefreshed(data.lastUpdated || 'Just now');
        
        // Preserve selected crop with updated rate if exists
        const matched = data.rates.find((r: MarketRate) => r.crop === selectedCrop.crop);
        if (matched) {
          setSelectedCrop(matched);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const filtered = rates.filter(r => 
    r.crop.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.mandi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generate realistic 30-day historical + 3-day projection price trend data for selectedCrop
  interface PriceHistoryPoint {
    day: string;
    fullDate: string;
    modalPrice: number;
    minPrice: number;
    maxPrice: number;
    arrivals: number;
    isForecast: boolean;
  }

  const priceHistory = useMemo(() => {
    if (!selectedCrop) return [];

    const points: PriceHistoryPoint[] = [];
    const basePrice = selectedCrop.modalPrice;
    const spread = (selectedCrop.maxPrice - selectedCrop.minPrice) || (basePrice * 0.15);
    const trendDir = selectedCrop.trend === 'up' ? 1 : selectedCrop.trend === 'down' ? -1 : 0.2;
    const seed = selectedCrop.crop.length;

    // 30 days of historical data up to today
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const fullDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      
      const progress = (30 - i) / 30; // 0 to 1
      const trendEffect = trendDir * (spread * 0.38) * (progress - 0.5);
      const wave = Math.sin((i + seed) * 0.65) * (spread * 0.16);
      
      const modal = Math.round(basePrice + trendEffect + wave);
      const min = Math.round(modal - (spread * 0.32) - Math.abs(Math.cos(i) * 40));
      const max = Math.round(modal + (spread * 0.42) + Math.abs(Math.sin(i) * 60));
      
      const baseArrivals = parseInt(selectedCrop.arrivals.replace(/\D/g, '') || '1200', 10);
      const arrivalNoise = Math.sin((i + seed) * 0.55) * (baseArrivals * 0.22);
      const arrivals = Math.max(120, Math.round(baseArrivals - (trendEffect * 0.12) + arrivalNoise));

      points.push({
        day: i === 0 ? 'Today' : dayLabel,
        fullDate,
        modalPrice: modal,
        minPrice: min,
        maxPrice: max,
        arrivals,
        isForecast: false
      });
    }

    // 3-day forward forecast projection
    for (let f = 1; f <= 3; f++) {
      const d = new Date();
      d.setDate(d.getDate() + f);
      const dayLabel = `+${f}d`;
      const fullDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' (Forecast)';
      
      const lastPoint = points[points.length - 1];
      const projDelta = trendDir * (spread * 0.07) * f;
      const projModal = Math.round(lastPoint.modalPrice + projDelta);

      points.push({
        day: dayLabel,
        fullDate,
        modalPrice: projModal,
        minPrice: Math.round(projModal - spread * 0.32),
        maxPrice: Math.round(projModal + spread * 0.42),
        arrivals: Math.round(lastPoint.arrivals * 0.94),
        isForecast: true
      });
    }

    return points;
  }, [selectedCrop]);

  // Statistical calculations
  const stats = useMemo(() => {
    if (priceHistory.length === 0) return { high: 0, low: 0, avg: 0, netChange: '0%' };
    const historicalOnly = priceHistory.filter(p => !p.isForecast);
    const prices = historicalOnly.map(p => p.modalPrice);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const netPercent = (((lastPrice - firstPrice) / firstPrice) * 100).toFixed(1);
    const netChange = (Number(netPercent) >= 0 ? `+${netPercent}%` : `${netPercent}%`);

    return { high, low, avg, netChange };
  }, [priceHistory]);

  // AI "When to Sell?" Recommendation Engine
  const recommendation = useMemo(() => {
    if (!selectedCrop || priceHistory.length === 0) return null;

    const current = selectedCrop.modalPrice;
    const historicalOnly = priceHistory.filter(p => !p.isForecast);
    const prices = historicalOnly.map(p => p.modalPrice);
    const min30 = Math.min(...prices);
    const max30 = Math.max(...prices);
    const percentile = (current - min30) / (max30 - min30 || 1);

    if (selectedCrop.trend === 'up' && percentile < 0.72) {
      return {
        action: '🟢 HOLD HARVEST: TARGET TO SELL IN 10-14 DAYS',
        badgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-300',
        cardBg: 'bg-emerald-50/60 border-emerald-200',
        headline: 'Bullish Momentum • Mandi arrivals tightening with rising demand',
        details: `Current modal rate is ₹${current.toLocaleString()} / ${selectedCrop.unit} (up ${selectedCrop.change}). APMC arrivals are tapering down. Farmers with moisture-controlled storage should hold Grade A crop to capture projected peak rates of ~₹${Math.round(current * 1.075).toLocaleString()}.`,
        actionPlan: 'Maintain seed moisture under 10% in clean gunny bags. Avoid arrival glut selling at spot yards.',
        estimatedGain: `+₹${Math.round(current * 0.075).toLocaleString()} / ${selectedCrop.unit} potential gain by holding`
      };
    } else if (percentile >= 0.72) {
      return {
        action: '🟡 BEST TIME TO SELL: LIQUIDATE 60-80% NOW',
        badgeClass: 'bg-amber-100 text-amber-950 border-amber-300',
        cardBg: 'bg-amber-50/60 border-amber-200',
        headline: 'Near 30-Day Peak • Optimal profit-booking window',
        details: `Crop is trading at ₹${current.toLocaleString()} / ${selectedCrop.unit} (${Math.round(percentile * 100)}th percentile of 30-day range). Upcoming supply surges from neighbouring APMC taluks are anticipated to cap price growth next week.`,
        actionPlan: 'Book profit on 60-80% of your harvested lot immediately. Keep remaining 20% if you wish to bid for premium mill auctions.',
        estimatedGain: `Locked in at peak 30-day auction price (High: ₹${max30.toLocaleString()})`
      };
    } else {
      return {
        action: '🔵 STAGGERED SELLING: SELL 40% NOW, HOLD 60%',
        badgeClass: 'bg-blue-100 text-blue-950 border-blue-300',
        cardBg: 'bg-blue-50/60 border-blue-200',
        headline: 'Market Consolidation • Steady APMC volume',
        details: `Prices are oscillating around the 30-day average of ₹${stats.avg.toLocaleString()}. Stagger sales in two tranches to protect against monsoon rainfall shocks and transport fluctuations.`,
        actionPlan: 'Cover short-term farm working capital needs with a 40% sale. Hold balance until APMC modal rate breaks resistance at ₹${Math.round(current * 1.04).toLocaleString()}.',
        estimatedGain: 'Hedge against price dips while covering immediate cash flow'
      };
    }
  }, [selectedCrop, priceHistory, stats]);

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-stone-900/95 text-white p-3 rounded-xl shadow-xl border border-stone-700 text-xs space-y-1.5 backdrop-blur-xs">
          <div className="flex items-center justify-between gap-3 border-b border-stone-700 pb-1">
            <span className="font-bold text-amber-300">{data.fullDate}</span>
            {data.isForecast && (
              <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.2 rounded font-bold">
                Projected
              </span>
            )}
          </div>
          <div className="space-y-1 pt-0.5">
            <div className="flex justify-between gap-4">
              <span className="text-stone-300">Modal Price:</span>
              <strong className="text-emerald-400 font-black">₹{data.modalPrice.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between gap-4 text-[11px] text-stone-400">
              <span>Mandi High / Low:</span>
              <span>₹{data.maxPrice.toLocaleString()} / ₹{data.minPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-4 text-[11px] text-stone-400 border-t border-stone-800 pt-1">
              <span>Arrival Volume:</span>
              <span className="text-stone-200 font-semibold">{data.arrivals} Qtl</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-stone-900">
              APMC Mandi Real-Time Benchmark Rates
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Karnataka Mandi Network
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Official modal prices, daily arrivals, and interactive 30-day trend analytics across Hubballi, Dharwad, Byadgi, Kalaburagi, and Belagavi APMCs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-400">
            Last Updated: <strong className="text-stone-700">{lastRefreshed}</strong>
          </span>
          <button
            onClick={fetchRates}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Mandi Feeds</span>
          </button>
        </div>
      </div>

      {/* 30-DAY VISUAL PRICE TREND GRAPH (RECHARTS) */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-7 shadow-xs space-y-5">
        
        {/* Graph Header: Selected Crop Info & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-base shadow-xs">
              <BarChart3 className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  30-Day APMC Price Trend
                </span>
                <span className="text-xs text-stone-400">
                  • {selectedCrop.mandi}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 mt-0.5 flex items-center gap-2">
                <span>{selectedCrop.crop}</span>
                <span className="text-emerald-800 text-lg sm:text-xl">
                  ₹{selectedCrop.modalPrice.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-stone-400">/ {selectedCrop.unit}</span>
              </h2>
            </div>
          </div>

          {/* Quick Crop Selector Dropdown / View Toggles */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Crop selector */}
            <div className="flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold">
              <span className="text-stone-500">Crop:</span>
              <select
                value={selectedCrop.crop}
                onChange={(e) => {
                  const match = rates.find(r => r.crop === e.target.value);
                  if (match) setSelectedCrop(match);
                }}
                className="bg-transparent border-none text-stone-900 font-bold focus:outline-hidden cursor-pointer"
              >
                {rates.map(r => (
                  <option key={r.crop} value={r.crop}>
                    {r.crop} ({r.mandi})
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode */}
            <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-bold border border-stone-200">
              <button
                type="button"
                onClick={() => setChartView('composed')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  chartView === 'composed' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Price & Volume
              </button>
              <button
                type="button"
                onClick={() => setChartView('priceOnly')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  chartView === 'priceOnly' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Price Band (Min-Max)
              </button>
            </div>
          </div>
        </div>

        {/* 30-Day Key Metric Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
            <span className="text-stone-500 block text-[11px]">30-Day High (Peak)</span>
            <span className="text-base font-black text-emerald-900">₹{stats.high.toLocaleString()}</span>
            <span className="text-[10px] text-stone-400 block mt-0.5">Top APMC auction rate</span>
          </div>

          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
            <span className="text-stone-500 block text-[11px]">30-Day Low (Floor)</span>
            <span className="text-base font-black text-stone-700">₹{stats.low.toLocaleString()}</span>
            <span className="text-[10px] text-stone-400 block mt-0.5">Minimum arrival support</span>
          </div>

          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
            <span className="text-stone-500 block text-[11px]">30-Day Modal Average</span>
            <span className="text-base font-black text-stone-900">₹{stats.avg.toLocaleString()}</span>
            <span className="text-[10px] text-stone-400 block mt-0.5">Benchmark mean</span>
          </div>

          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
            <span className="text-stone-500 block text-[11px]">30-Day Price Movement</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`text-base font-black ${stats.netChange.startsWith('+') ? 'text-emerald-700' : 'text-rose-600'}`}>
                {stats.netChange}
              </span>
              {stats.netChange.startsWith('+') ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-600" />
              )}
            </div>
            <span className="text-[10px] text-stone-400 block">30-day cumulative trend</span>
          </div>
        </div>

        {/* RECHARTS VISUAL CONTAINER */}
        <div className="w-full h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={priceHistory} margin={{ top: 15, right: 20, bottom: 5, left: 10 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="spreadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />

              <XAxis 
                dataKey="day" 
                stroke="#6b7280" 
                tick={{ fontSize: 11, fill: '#6b7280' }}
                interval={Math.floor(priceHistory.length / 8)}
              />

              <YAxis 
                yAxisId="price" 
                orientation="left" 
                stroke="#047857" 
                domain={['auto', 'auto']}
                tickFormatter={(val) => `₹${Number(val).toLocaleString()}`}
                tick={{ fontSize: 11, fill: '#047857', fontWeight: 600 }}
              />

              {chartView === 'composed' && (
                <YAxis 
                  yAxisId="volume" 
                  orientation="right" 
                  stroke="#9ca3af" 
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => `${val} Q`}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                />
              )}

              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />

              {/* Arrival volume bars (only in composed view) */}
              {chartView === 'composed' && (
                <Bar 
                  yAxisId="volume" 
                  dataKey="arrivals" 
                  name="Arrival Volume (Qtl)" 
                  fill="#cbd5e1" 
                  opacity={0.5} 
                  radius={[3, 3, 0, 0]} 
                />
              )}

              {/* Min & Max price lines in priceOnly view */}
              {chartView === 'priceOnly' && (
                <>
                  <Line 
                    yAxisId="price" 
                    type="monotone" 
                    dataKey="maxPrice" 
                    name="Max Auction (₹)" 
                    stroke="#f59e0b" 
                    strokeDasharray="4 4" 
                    strokeWidth={2} 
                    dot={false} 
                  />
                  <Line 
                    yAxisId="price" 
                    type="monotone" 
                    dataKey="minPrice" 
                    name="Min Floor (₹)" 
                    stroke="#94a3b8" 
                    strokeDasharray="2 2" 
                    strokeWidth={1.5} 
                    dot={false} 
                  />
                </>
              )}

              {/* Main Modal Price Area Curve */}
              <Area 
                yAxisId="price" 
                type="monotone" 
                dataKey="modalPrice" 
                name="Modal Price (₹)" 
                stroke="#059669" 
                strokeWidth={3} 
                fill="url(#priceGradient)" 
                activeDot={{ r: 6, fill: '#047857' }} 
              />

              {/* Current Price Reference Line */}
              <ReferenceLine 
                yAxisId="price" 
                y={selectedCrop.modalPrice} 
                stroke="#047857" 
                strokeDasharray="4 4" 
                label={{ 
                  value: `Current: ₹${selectedCrop.modalPrice.toLocaleString()}`, 
                  position: 'insideTopLeft', 
                  fill: '#047857', 
                  fontSize: 11, 
                  fontWeight: 700 
                }} 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* AI "DECIDE WHEN TO SELL" STRATEGY RECOMMENDATION CARD */}
        {recommendation && (
          <div className={`p-5 rounded-2xl border ${recommendation.cardBg} space-y-3`}>
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-700 shrink-0" />
                <span className={`text-xs font-black px-3 py-1 rounded-full border ${recommendation.badgeClass}`}>
                  {recommendation.action}
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-900 bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-200">
                {recommendation.estimatedGain}
              </span>
            </div>

            <div>
              <h4 className="font-extrabold text-stone-900 text-sm">
                {recommendation.headline}
              </h4>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                {recommendation.details}
              </p>
            </div>

            <div className="pt-2 border-t border-stone-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-stone-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Recommended Plan:</strong> {recommendation.actionPlan}</span>
              </div>

              <button
                onClick={() => onNavigateChatbotWithQuery(`Analyze the 30-day APMC price trend for ${selectedCrop.crop} in ${selectedCrop.mandi}. What is the exact best date to sell my harvest for maximum profit?`)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI Advisor for Exact Date</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* APMC Mandi Rates Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-stone-900">
              All Karnataka Mandi Quotations
            </h3>
            <p className="text-xs text-stone-500">
              Click any row to switch the 30-day visual graph and sell recommendations.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by crop (e.g. Cotton, Chilli)..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600 shadow-xs"
            />
          </div>
        </div>

        {/* Rates Table */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Commodity / Crop</th>
                  <th className="px-5 py-3.5">APMC Mandi</th>
                  <th className="px-5 py-3.5">Min Price (₹)</th>
                  <th className="px-5 py-3.5">Max Price (₹)</th>
                  <th className="px-5 py-3.5">Modal Price (₹)</th>
                  <th className="px-5 py-3.5">Unit</th>
                  <th className="px-5 py-3.5">Trend</th>
                  <th className="px-5 py-3.5">Arrivals</th>
                  <th className="px-5 py-3.5 text-right">Interactive Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((item, idx) => {
                  const isSelected = selectedCrop.crop === item.crop;
                  return (
                    <tr 
                      key={idx} 
                      onClick={() => setSelectedCrop(item)}
                      className={`transition cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-50/80 font-semibold' 
                          : 'hover:bg-stone-50'
                      }`}
                    >
                      <td className="px-5 py-4 font-bold text-stone-900 text-sm">
                        <div className="flex items-center gap-2">
                          <span>{item.crop}</span>
                          {isSelected && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                              Viewing Graph
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-stone-600 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                          {item.mandi}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-stone-600">
                        ₹{item.minPrice.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-stone-600">
                        ₹{item.maxPrice.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 font-black text-stone-900 text-sm">
                        <div>₹{item.modalPrice.toLocaleString()}</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">
                          ≈ ₹{Math.round(item.modalPrice / (item.unit === 'Quintal' ? 100 : item.unit === 'Tonne' ? 1000 : 1))}/kg
                        </div>
                      </td>
                      <td className="px-5 py-4 text-stone-500 font-medium">
                        {item.unit}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          item.trend === 'up'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.trend === 'down'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}>
                          {item.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                          {item.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                          {item.trend === 'steady' && <Minus className="w-3 h-3" />}
                          {item.change}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-stone-500">
                        {item.arrivals}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCrop(item);
                            onNavigateChatbotWithQuery(`What is the price forecast and best time to sell ${item.crop} in ${item.mandi}?`);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>AI Advisory</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* APMC Selling Strategy Tip */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3.5 text-xs text-amber-950">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-amber-900 text-sm">
            Government e-NAM & APMC Grain Storage Protocol
          </h4>
          <p className="leading-relaxed">
            Byadgi red chilli and Bt Cotton arrivals are currently witnessing firm demand. Farmers with moisture-controlled storage can hold Grade A harvest for 2-3 weeks to avoid arrival-glut price depression at local yards. You can pledge warehouse receipts for 70% pledge financing via Karnataka Gramin Bank.
          </p>
        </div>
      </div>
    </div>
  );
};
