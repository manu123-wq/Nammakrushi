import React, { useState, useEffect, useMemo } from 'react';
import { 
  Droplets, 
  CloudRain, 
  Sun, 
  Clock, 
  Calendar, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Layers, 
  Sliders, 
  Tractor, 
  Timer, 
  Bell, 
  ArrowRight,
  ShieldCheck,
  Info,
  Check,
  Edit3,
  Plus,
  Trash2,
  Settings2,
  X,
  Save
} from 'lucide-react';
import { FarmTask, NotificationItem, TabType } from '../types';
import { playNotificationChime } from '../utils/audio';

interface SmartIrrigationSchedulerProps {
  district: string;
  weather: {
    temp: number;
    condition: string;
    humidity: number;
    rainfall?: number;
    wind?: string;
    soilMoisture?: string;
    weeklyForecast?: any[];
  } | null;
  onAddTask?: (task: FarmTask) => void;
  onDispatchNotification?: (notif: NotificationItem) => void;
  onNavigateTab?: (tab: TabType) => void;
}

export interface SectorZone {
  id: string;
  name: string;
  crop: string;
  acres: number;
  system: 'Drip Irrigation' | 'Sprinkler' | 'Furrow / Ridge' | 'Micro-jet / Basin';
  soilType: 'Deep Black Cotton' | 'Red Sandy Loam' | 'Clayey Loam' | 'Alluvial Silt';
  baseMoisture: number; // percentage
}

const DEFAULT_ZONES: SectorZone[] = [
  {
    id: 'zone-1',
    name: 'Sector A (North Field)',
    crop: 'Bt Cotton (Hybrid BG-II)',
    acres: 3.5,
    system: 'Drip Irrigation',
    soilType: 'Deep Black Cotton',
    baseMoisture: 42,
  },
  {
    id: 'zone-2',
    name: 'Sector B (East Field)',
    crop: 'Byadgi Red Chillies',
    acres: 2.0,
    system: 'Drip Irrigation',
    soilType: 'Red Sandy Loam',
    baseMoisture: 36,
  },
  {
    id: 'zone-3',
    name: 'Sector C (South Terraces)',
    crop: 'Maldandi Jowar (Sorghum)',
    acres: 4.0,
    system: 'Furrow / Ridge',
    soilType: 'Deep Black Cotton',
    baseMoisture: 58,
  },
  {
    id: 'zone-4',
    name: 'Nursery & Polyhouse',
    crop: 'Exotic Vegetables & Seedlings',
    acres: 1.0,
    system: 'Sprinkler',
    soilType: 'Clayey Loam',
    baseMoisture: 68,
  },
];

export const SmartIrrigationScheduler: React.FC<SmartIrrigationSchedulerProps> = ({
  district,
  weather,
  onAddTask,
  onDispatchNotification,
  onNavigateTab
}) => {
  // Configurable sectors list with localStorage persistence
  const [zones, setZones] = useState<SectorZone[]>(() => {
    try {
      const saved = localStorage.getItem('nammakrushi_irrigation_sectors');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_ZONES;
  });

  const [selectedZone, setSelectedZone] = useState<SectorZone>(() => zones[0] || DEFAULT_ZONES[0]);

  // Sector Edit / Add Modal State
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [isCreatingNewSector, setIsCreatingNewSector] = useState(false);
  const [sectorFormData, setSectorFormData] = useState<SectorZone>({
    id: '',
    name: '',
    crop: '',
    acres: 1.0,
    system: 'Drip Irrigation',
    soilType: 'Deep Black Cotton',
    baseMoisture: 45
  });
  
  // Custom interactive moisture adjustment (overrides sensor default)
  const [soilMoistureOverride, setSoilMoistureOverride] = useState<number | null>(null);

  // Active Drip Timer simulation
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(45 * 60); // 45 min default
  const [timerInitialDuration, setTimerInitialDuration] = useState(45 * 60);
  const [isCycleCompleted, setIsCycleCompleted] = useState(false);

  // Scheduled feedback toast
  const [scheduledToast, setScheduledToast] = useState<string | null>(null);

  // Helper to persist zones to localStorage
  const saveZones = (updatedZones: SectorZone[]) => {
    setZones(updatedZones);
    try {
      localStorage.setItem('nammakrushi_irrigation_sectors', JSON.stringify(updatedZones));
    } catch (e) {}
  };

  // Open Edit Modal for a sector
  const handleOpenEditSector = (zone: SectorZone) => {
    setIsCreatingNewSector(false);
    setSectorFormData({ ...zone });
    setIsSectorModalOpen(true);
  };

  // Open Add Modal for a new sector
  const handleOpenAddSector = () => {
    setIsCreatingNewSector(true);
    setSectorFormData({
      id: `zone-${Date.now()}`,
      name: `Sector ${String.fromCharCode(65 + zones.length)} (New Plot)`,
      crop: 'Sugarcane (Co-86032)',
      acres: 2.5,
      system: 'Drip Irrigation',
      soilType: 'Deep Black Cotton',
      baseMoisture: 45
    });
    setIsSectorModalOpen(true);
  };

  // Save Sector (Create or Update)
  const handleSaveSector = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sectorFormData.name.trim() || !sectorFormData.crop.trim()) return;

    if (isCreatingNewSector) {
      const newZone: SectorZone = {
        ...sectorFormData,
        id: sectorFormData.id || `zone-${Date.now()}`,
        acres: Math.max(0.1, Number(sectorFormData.acres) || 1.0),
        baseMoisture: Math.max(10, Math.min(95, Number(sectorFormData.baseMoisture) || 45))
      };
      const updated = [...zones, newZone];
      saveZones(updated);
      setSelectedZone(newZone);
      setScheduledToast(`Added new sector: "${newZone.name}"!`);
    } else {
      const updated = zones.map(z => z.id === sectorFormData.id ? {
        ...sectorFormData,
        acres: Math.max(0.1, Number(sectorFormData.acres) || 1.0),
        baseMoisture: Math.max(10, Math.min(95, Number(sectorFormData.baseMoisture) || 45))
      } : z);
      saveZones(updated);
      const currentUpdated = updated.find(z => z.id === sectorFormData.id);
      if (currentUpdated) setSelectedZone(currentUpdated);
      setScheduledToast(`Updated sector: "${sectorFormData.name}"!`);
    }

    setIsSectorModalOpen(false);
    setSoilMoistureOverride(null);
    playNotificationChime();
    setTimeout(() => setScheduledToast(null), 3500);
  };

  // Delete Sector
  const handleDeleteSector = (id: string) => {
    if (zones.length <= 1) {
      alert('At least one field sector must be maintained.');
      return;
    }
    const updated = zones.filter(z => z.id !== id);
    saveZones(updated);
    if (selectedZone.id === id) {
      setSelectedZone(updated[0]);
    }
    setIsSectorModalOpen(false);
    setScheduledToast('Sector deleted.');
    playNotificationChime();
    setTimeout(() => setScheduledToast(null), 3500);
  };

  // Reset to default Karnataka presets
  const handleResetDefaultSectors = () => {
    saveZones(DEFAULT_ZONES);
    setSelectedZone(DEFAULT_ZONES[0]);
    setIsSectorModalOpen(false);
    setScheduledToast('Restored default Karnataka farm sectors.');
    playNotificationChime();
    setTimeout(() => setScheduledToast(null), 3500);
  };

  // Calculate current effective soil moisture
  const effectiveMoisture = useMemo(() => {
    if (soilMoistureOverride !== null) return soilMoistureOverride;
    
    // Parse weather soil moisture text if present (e.g. "Good (64%)" or "Dry (38%)")
    if (weather?.soilMoisture) {
      const match = weather.soilMoisture.match(/(\d+)%/);
      if (match && match[1]) {
        const val = parseInt(match[1], 10);
        return Math.min(100, Math.max(10, selectedZone.id === 'zone-2' ? val - 6 : val));
      }
    }
    return selectedZone.baseMoisture;
  }, [soilMoistureOverride, weather, selectedZone]);

  // Weather variables
  const temp = weather?.temp || 28;
  const humidity = weather?.humidity || 65;
  const rainToday = weather?.rainfall || 0;
  const rainRisk = rainToday > 8.0 || (weather?.condition || '').toLowerCase().includes('rain');

  // Irrigation Decision Logic
  const recommendation = useMemo(() => {
    // 1. Heavy rain imminent or soil already saturated
    if (effectiveMoisture >= 76 || rainToday >= 8.0) {
      return {
        status: 'HOLD',
        color: 'rose',
        headline: 'Hold Irrigation: Soil Saturated / Rain Expected',
        reason: `Soil moisture is at ${effectiveMoisture}% and local rainfall (${rainToday} mm) is detected in ${district}. Watering now would cause waterlogging, nutrient leaching, and root hypoxia.`,
        suggestedSlot: 'Postpone 24–48 Hours',
        recommendedDuration: 0,
        litersPerAcre: 0,
        urgency: 'Low',
        badge: '🛑 Delay / Skip'
      };
    }

    // 2. Critically dry (<40%) and high temperature
    if (effectiveMoisture <= 40) {
      const duration = selectedZone.system === 'Drip Irrigation' ? 55 : 75;
      return {
        status: 'CRITICAL',
        color: 'amber',
        headline: 'Immediate Irrigation Needed: Thermal Stress Alert',
        reason: `Soil moisture has fallen to ${effectiveMoisture}%. Coupled with ${temp}°C temperature, crop is vulnerable to moisture stress and blossom/boll drop.`,
        suggestedSlot: 'Early Morning (05:45 AM – 08:30 AM)',
        alternativeSlot: 'Late Evening (05:30 PM – 07:45 PM)',
        recommendedDuration: duration,
        litersPerAcre: selectedZone.acres * 19500,
        urgency: 'High',
        badge: '⚠️ Critical Watering'
      };
    }

    // 3. Moderate deficit (41% - 55%)
    if (effectiveMoisture <= 55) {
      const duration = selectedZone.system === 'Drip Irrigation' ? 40 : 50;
      return {
        status: 'SCHEDULED',
        color: 'emerald',
        headline: 'Scheduled Drip Cycle Recommended',
        reason: `Soil moisture (${effectiveMoisture}%) is in moderate depletion zone. Optimal for maintaining root turgidity without excess percolation.`,
        suggestedSlot: 'Early Morning (06:00 AM – 08:00 AM)',
        alternativeSlot: 'Sunset Window (05:45 PM – 07:30 PM)',
        recommendedDuration: duration,
        litersPerAcre: selectedZone.acres * 14000,
        urgency: 'Moderate',
        badge: '💧 Recommended'
      };
    }

    // 4. Optimal condition (56% - 75%)
    return {
      status: 'OPTIMAL',
      color: 'sky',
      headline: 'Soil Moisture in Optimal Band',
      reason: `Soil moisture at ${effectiveMoisture}% provides ideal water potential for ${selectedZone.crop}. Next light fertigation cycle recommended in 36 hours.`,
      suggestedSlot: 'Tomorrow Morning (06:15 AM)',
      alternativeSlot: 'Night Cycle if 3-Phase Power available',
      recommendedDuration: 25,
      litersPerAcre: selectedZone.acres * 8000,
      urgency: 'Low',
      badge: '✅ Moisture Optimal'
    };
  }, [effectiveMoisture, rainToday, district, temp, selectedZone]);

  // Sync timer duration with recommendation
  useEffect(() => {
    if (!isTimerRunning && recommendation.recommendedDuration > 0) {
      const totalSec = recommendation.recommendedDuration * 60;
      setTimerSecondsLeft(totalSec);
      setTimerInitialDuration(totalSec);
    }
  }, [recommendation, isTimerRunning]);

  // Active Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setIsCycleCompleted(true);
            playNotificationChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSecondsLeft]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Schedule task in TaskTracker
  const handleScheduleTask = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const taskTitle = `Irrigate ${selectedZone.name} (${selectedZone.crop})`;
    
    const newTask: FarmTask = {
      id: `task-irr-${Date.now()}`,
      title: taskTitle,
      category: 'Irrigation',
      dueDate: todayStr,
      priority: recommendation.urgency === 'High' ? 'High' : 'Medium',
      status: 'Pending',
      fieldSector: selectedZone.name,
      assignedTo: 'Irrigation Team / Automated Valves',
      notes: `Suggested Slot: ${recommendation.suggestedSlot}. Duration: ${recommendation.recommendedDuration} mins. Moisture: ${effectiveMoisture}%. Weather: ${temp}°C.`
    };

    if (onAddTask) {
      onAddTask(newTask);
    }

    if (onDispatchNotification) {
      onDispatchNotification({
        id: `notif-irr-${Date.now()}`,
        title: '💧 Smart Irrigation Task Scheduled',
        message: `${taskTitle} added to Task Schedule for ${recommendation.suggestedSlot}. Duration: ${recommendation.recommendedDuration} mins.`,
        type: 'task',
        timestamp: 'Just now',
        read: false,
        actionTab: 'tasks'
      });
    }

    playNotificationChime();
    setScheduledToast(`Scheduled ${selectedZone.name} for ${recommendation.suggestedSlot}!`);
    setTimeout(() => setScheduledToast(null), 3500);
  };

  // 7-day outlook mock generator from weekly forecast
  const weeklyIrrigationAdvice = useMemo(() => {
    const forecast = weather?.weeklyForecast || [
      { day: 'Today', temp: 28, rainfall: rainToday, rainProb: rainToday > 5 ? 75 : 20 },
      { day: 'Thu', temp: 26, rainfall: 8.5, rainProb: 80 },
      { day: 'Fri', temp: 25, rainfall: 14.0, rainProb: 90 },
      { day: 'Sat', temp: 27, rainfall: 2.0, rainProb: 40 },
      { day: 'Sun', temp: 29, rainfall: 0.0, rainProb: 15 },
      { day: 'Mon', temp: 30, rainfall: 0.0, rainProb: 10 },
      { day: 'Tue', temp: 31, rainfall: 0.0, rainProb: 5 },
    ];

    return forecast.map((d: any) => {
      let advice = 'Normal 40m Drip';
      let icon = '💧';
      let color = 'text-emerald-700 bg-emerald-50 border-emerald-200';

      if (d.rainfall >= 6.0 || d.rainProb >= 70) {
        advice = 'Hold (Rain Fall)';
        icon = '⏸️';
        color = 'text-rose-700 bg-rose-50 border-rose-200';
      } else if (d.temp >= 32) {
        advice = 'Deep 60m Evening';
        icon = '⚠️';
        color = 'text-amber-700 bg-amber-50 border-amber-200';
      } else if (d.rainfall > 0) {
        advice = 'Light 20m Top-up';
        icon = '🌦️';
        color = 'text-sky-700 bg-sky-50 border-sky-200';
      }

      return {
        ...d,
        advice,
        icon,
        color
      };
    });
  }, [weather, rainToday]);

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 text-white flex items-center justify-center shadow-md shadow-sky-600/20">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-stone-900 text-lg">Smart Irrigation Scheduler</h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-300">
                  AI & Weather Synced
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Precision watering times calibrated to soil moisture sensors & live rainfall forecasts in <strong>{district}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Real-time micro-climate feed pill */}
        <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-xl text-xs text-stone-700 shrink-0">
          <Sun className="w-4 h-4 text-amber-500" />
          <span>{temp}°C</span>
          <span className="text-stone-300">•</span>
          <Droplets className="w-3.5 h-3.5 text-sky-600" />
          <span>{humidity}% RH</span>
          <span className="text-stone-300">•</span>
          <CloudRain className="w-3.5 h-3.5 text-blue-600" />
          <span>{rainToday} mm rain</span>
        </div>
      </div>

      {/* Field Sector Zone Tabs with Modify Options */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Field Sectors / Zones ({zones.length}):
            </span>
            <span className="text-[11px] text-stone-400">
              Active: <strong>{selectedZone.name}</strong> ({selectedZone.system} • {selectedZone.soilType})
            </span>
          </div>

          {/* Modify Sector Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleOpenEditSector(selectedZone)}
              className="px-2.5 py-1 text-[11px] font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Modify selected sector details (crop, acres, irrigation system, soil type)"
            >
              <Edit3 className="w-3.5 h-3.5 text-sky-600" />
              <span>Modify Sector</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddSector}
              className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Add a new field sector to irrigation scheduler"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Add Sector</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaultSectors}
              className="px-2 py-1 text-[11px] font-semibold text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition flex items-center gap-1 cursor-pointer"
              title="Restore standard Karnataka farm sectors"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {zones.map((zone) => {
            const isSelected = selectedZone.id === zone.id;
            return (
              <div
                key={zone.id}
                onClick={() => {
                  setSelectedZone(zone);
                  setSoilMoistureOverride(null);
                  setIsTimerRunning(false);
                }}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer relative group flex flex-col justify-between ${
                  isSelected
                    ? 'bg-sky-50/70 border-sky-500 shadow-xs ring-2 ring-sky-500/20'
                    : 'bg-stone-50/60 border-stone-200 hover:border-stone-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold block truncate pr-1 ${isSelected ? 'text-sky-900' : 'text-stone-800'}`}>
                      {zone.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditSector(zone);
                      }}
                      className="p-1 rounded-md text-stone-400 hover:text-sky-700 hover:bg-stone-200/60 transition opacity-80 group-hover:opacity-100 cursor-pointer"
                      title="Edit this sector"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-[10px] text-stone-500 block truncate mt-0.5 font-medium">
                    {zone.crop}
                  </span>
                </div>
                <div className="mt-2 pt-1.5 border-t border-stone-200/60 flex items-center justify-between text-[10px] font-semibold">
                  <span className="text-stone-400">{zone.acres} Acres</span>
                  <span className={isSelected ? 'text-sky-700' : 'text-stone-600'}>
                    ~{zone.baseMoisture}% Moisture
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Grid: Moisture Gauge & Recommended Times */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Soil Moisture Sensor Level & Simulation Slider (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-stone-50 to-stone-100/60 rounded-2xl border border-stone-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <h4 className="font-extrabold text-stone-900 text-sm">Soil Moisture Reading</h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
              Depth: 30 cm (Root Zone)
            </span>
          </div>

          {/* Big Circular/Bar Moisture Display */}
          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-3xl sm:text-4xl font-black text-stone-900">
                  {effectiveMoisture}%
                </span>
                <span className="text-xs font-semibold text-stone-500 ml-1">Volumetric Water</span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                effectiveMoisture <= 40 
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : effectiveMoisture <= 55
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : effectiveMoisture <= 75
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-blue-100 text-blue-800 border-blue-300'
              }`}>
                {effectiveMoisture <= 40 
                  ? 'Dry / Deficit' 
                  : effectiveMoisture <= 55 
                  ? 'Moderate Depletion' 
                  : effectiveMoisture <= 75 
                  ? 'Optimal Moisture' 
                  : 'Saturated (Excess)'}
              </span>
            </div>

            {/* Visual Color Scale Bar */}
            <div className="space-y-1">
              <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden p-0.5 flex gap-0.5">
                <div 
                  style={{ width: `${Math.min(100, effectiveMoisture)}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    effectiveMoisture <= 40 
                      ? 'bg-rose-500' 
                      : effectiveMoisture <= 55 
                      ? 'bg-amber-500' 
                      : effectiveMoisture <= 75 
                      ? 'bg-emerald-500' 
                      : 'bg-blue-600'
                  }`}
                />
              </div>
              <div className="flex justify-between text-[9px] font-bold text-stone-400 px-0.5">
                <span>0% (Wilting Point)</span>
                <span>40%</span>
                <span>65% (Field Capacity)</span>
                <span>100% (Saturation)</span>
              </div>
            </div>
          </div>

          {/* Moisture Simulation / Sensor Calibration Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
              <span className="flex items-center gap-1 text-[11px]">
                <Sliders className="w-3.5 h-3.5 text-stone-400" />
                <span>Simulate / Calibrate Sensor:</span>
              </span>
              <span className="text-xs font-black text-sky-800">{effectiveMoisture}%</span>
            </div>
            <input
              type="range"
              min="15"
              max="95"
              value={effectiveMoisture}
              onChange={(e) => setSoilMoistureOverride(Number(e.target.value))}
              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
            />
            <div className="flex justify-between text-[10px] text-stone-400">
              <button 
                type="button"
                onClick={() => setSoilMoistureOverride(32)}
                className="hover:text-stone-700 underline cursor-pointer"
              >
                Set Dry (32%)
              </button>
              <button 
                type="button"
                onClick={() => setSoilMoistureOverride(50)}
                className="hover:text-stone-700 underline cursor-pointer"
              >
                Set Moderate (50%)
              </button>
              <button 
                type="button"
                onClick={() => setSoilMoistureOverride(68)}
                className="hover:text-stone-700 underline cursor-pointer"
              >
                Set Optimal (68%)
              </button>
              <button 
                type="button"
                onClick={() => setSoilMoistureOverride(85)}
                className="hover:text-stone-700 underline cursor-pointer"
              >
                Set Saturated (85%)
              </button>
            </div>
          </div>

          {/* Power Feeder Window in Karnataka */}
          <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/70 text-xs text-amber-950 flex items-start gap-2">
            <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">3-Phase Rural Feeder Schedule (HESCOM / BESCOM):</span>
              <span className="text-[11px] text-amber-900">
                Morning slot active: <strong>06:00 AM – 01:00 PM</strong>. Plan heavy 7.5 HP borewell pump runs during off-peak morning hours for uninterrupted voltage.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Suggested Times & Irrigation Engine (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Main Decision Banner */}
          <div className={`p-5 rounded-2xl border transition-all ${
            recommendation.status === 'HOLD'
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : recommendation.status === 'CRITICAL'
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-emerald-50 border-emerald-300 text-emerald-950'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    recommendation.status === 'HOLD'
                      ? 'bg-rose-600 text-white'
                      : recommendation.status === 'CRITICAL'
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-700 text-white'
                  }`}>
                    {recommendation.badge}
                  </span>
                  <span className="text-xs font-semibold text-stone-600">
                    Target: {selectedZone.crop}
                  </span>
                </div>
                <h4 className="font-black text-base sm:text-lg">
                  {recommendation.headline}
                </h4>
                <p className="text-xs mt-1 leading-relaxed opacity-90">
                  {recommendation.reason}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-bold">Recommended Cycle</span>
                <span className="text-xl sm:text-2xl font-black">
                  {recommendation.recommendedDuration} <span className="text-xs font-bold">mins</span>
                </span>
                <span className="text-[10px] text-stone-500 block">
                  ~{(recommendation.litersPerAcre).toLocaleString()} Litres
                </span>
              </div>
            </div>

            {/* Optimal Watering Times Grid */}
            <div className="mt-4 pt-3 border-t border-stone-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* Slot 1: Primary Morning */}
              <div className="bg-white/90 rounded-xl p-3 border border-stone-200/80 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-0.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Primary Window (Early Morning)</span>
                </div>
                <div className="text-sm font-extrabold text-stone-900">
                  {recommendation.suggestedSlot}
                </div>
                <p className="text-[10px] text-stone-500 mt-1">
                  Evaporative loss &lt;8%. Max root uptake before soil surface warms.
                </p>
              </div>

              {/* Slot 2: Alternative Sunset */}
              <div className="bg-white/90 rounded-xl p-3 border border-stone-200/80 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 mb-0.5">
                  <Sun className="w-3.5 h-3.5 text-sky-600" />
                  <span>Alternative Window (Dusk / Twilight)</span>
                </div>
                <div className="text-sm font-extrabold text-stone-900">
                  {recommendation.alternativeSlot || '05:45 PM – 07:30 PM'}
                </div>
                <p className="text-[10px] text-stone-500 mt-1">
                  Cool evening temperatures. Avoid midday watering (11:30 AM–03:30 PM).
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleScheduleTask}
                className="flex-1 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule to Field Tasks</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isTimerRunning) {
                    setIsTimerRunning(false);
                  } else {
                    setIsTimerRunning(true);
                    setIsCycleCompleted(false);
                  }
                  playNotificationChime();
                }}
                className={`py-2.5 px-4 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer border ${
                  isTimerRunning
                    ? 'bg-amber-600 text-white border-amber-700'
                    : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-300'
                }`}
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause Drip ({formatTimer(timerSecondsLeft)})</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-emerald-600" />
                    <span>Start Drip Timer ({recommendation.recommendedDuration}m)</span>
                  </>
                )}
              </button>

              {timerSecondsLeft < timerInitialDuration && (
                <button
                  type="button"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSecondsLeft(timerInitialDuration);
                    setIsCycleCompleted(false);
                  }}
                  className="p-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-600 cursor-pointer"
                  title="Reset timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Active timer status banner */}
            {isTimerRunning && (
              <div className="mt-3 p-3 bg-emerald-950 text-emerald-100 rounded-xl flex items-center justify-between text-xs animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span className="font-bold">Drip Solenoid Valve Open: {selectedZone.name}</span>
                </div>
                <span className="font-mono font-black text-sm text-emerald-300">
                  {formatTimer(timerSecondsLeft)} Remaining
                </span>
              </div>
            )}

            {isCycleCompleted && (
              <div className="mt-3 p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  Irrigation Cycle Completed! Soil moisture restored to optimal zone.
                </span>
                <button 
                  onClick={() => {
                    setSoilMoistureOverride(65);
                    setIsCycleCompleted(false);
                  }}
                  className="underline text-[11px]"
                >
                  Apply 65% Moisture
                </button>
              </div>
            )}

            {/* Scheduled toast feedback */}
            {scheduledToast && (
              <div className="mt-2 text-xs font-bold text-emerald-800 bg-white/95 px-3 py-1.5 rounded-lg border border-emerald-300 animate-fade-in flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{scheduledToast}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7-Day Weather-Based Irrigation Forecast Outlook */}
      <div className="pt-2 border-t border-stone-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-600" />
            <h4 className="font-bold text-stone-900 text-xs sm:text-sm">
              7-Day Smart Irrigation Forecast Outlook ({district})
            </h4>
          </div>
          <span className="text-[11px] text-stone-400">
            Water conservation score: <strong>88% (Rain avoidance active)</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
          {weeklyIrrigationAdvice.map((day: any, i: number) => (
            <div 
              key={`irr-forecast-${i}`}
              className={`p-2.5 rounded-xl border flex flex-col justify-between text-center transition ${day.color}`}
            >
              <div>
                <span className="font-bold text-[11px] block">{day.day}</span>
                <span className="text-[10px] text-stone-500 block">{day.temp}°C • {day.rainfall || 0}mm</span>
              </div>
              <div className="my-1.5 text-base">
                {day.icon}
              </div>
              <span className="text-[10px] font-extrabold leading-tight block">
                {day.advice}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modify / Add Sector Modal */}
      {isSectorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-base">
                    {isCreatingNewSector ? 'Add New Farm Sector' : 'Modify Sector Parameters'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Configure crop, acreage, and irrigation system to tune watering math
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSectorModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveSector} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              
              {/* Sector Name */}
              <div className="space-y-1">
                <label className="font-bold text-stone-700 block">
                  Sector / Plot Identifier Name:
                </label>
                <input
                  type="text"
                  required
                  value={sectorFormData.name}
                  onChange={(e) => setSectorFormData({ ...sectorFormData, name: e.target.value })}
                  placeholder="e.g. Sector A (North Field) or Borewell Plot 2"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-stone-50/50"
                />
              </div>

              {/* Crop Name & Quick Chips */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-700 block">
                    Cultivated Crop:
                  </label>
                  <span className="text-[10px] text-stone-400">Quick-select popular Karnataka crops</span>
                </div>
                <input
                  type="text"
                  required
                  value={sectorFormData.crop}
                  onChange={(e) => setSectorFormData({ ...sectorFormData, crop: e.target.value })}
                  placeholder="e.g. Bt Cotton, Byadgi Chillies, Sugarcane"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-stone-50/50"
                />
                
                {/* Crop Quick Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    'Bt Cotton', 
                    'Byadgi Red Chillies', 
                    'Maldandi Jowar', 
                    'Sugarcane', 
                    'Hybrid Maize', 
                    'Tomato', 
                    'Onion', 
                    'Pomegranate', 
                    'Turmeric'
                  ].map((cropTag) => (
                    <button
                      key={cropTag}
                      type="button"
                      onClick={() => setSectorFormData({ ...sectorFormData, crop: cropTag })}
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold transition cursor-pointer ${
                        sectorFormData.crop === cropTag 
                          ? 'bg-sky-100 text-sky-900 border-sky-300 font-bold'
                          : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                      }`}
                    >
                      {cropTag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Acreage & Base Moisture Target */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 block">
                    Sector Area (Acres):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="100"
                      required
                      value={sectorFormData.acres}
                      onChange={(e) => setSectorFormData({ ...sectorFormData, acres: parseFloat(e.target.value) || 1.0 })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-stone-50/50 pr-12"
                    />
                    <span className="absolute right-3 top-2 text-stone-400 font-bold text-[11px]">Acres</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700 block">
                    Baseline Moisture (%):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      max="90"
                      value={sectorFormData.baseMoisture}
                      onChange={(e) => setSectorFormData({ ...sectorFormData, baseMoisture: parseInt(e.target.value, 10) || 45 })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-stone-50/50 pr-8"
                    />
                    <span className="absolute right-3 top-2 text-stone-400 font-bold text-[11px]">%</span>
                  </div>
                </div>
              </div>

              {/* Irrigation System */}
              <div className="space-y-1">
                <label className="font-bold text-stone-700 block">
                  Irrigation Delivery System:
                </label>
                <select
                  value={sectorFormData.system}
                  onChange={(e: any) => setSectorFormData({ ...sectorFormData, system: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-stone-50/50 cursor-pointer"
                >
                  <option value="Drip Irrigation">Drip Irrigation (In-line emitter, 4 LPH)</option>
                  <option value="Sprinkler">Sprinkler (Overhead micro-sprinkler)</option>
                  <option value="Furrow / Ridge">Furrow / Ridge (Channel gravity flow)</option>
                  <option value="Micro-jet / Basin">Micro-jet / Basin (Orchard tree ring)</option>
                </select>
              </div>

              {/* Soil Texture Type */}
              <div className="space-y-1">
                <label className="font-bold text-stone-700 block">
                  Soil Texture Classification:
                </label>
                <select
                  value={sectorFormData.soilType}
                  onChange={(e: any) => setSectorFormData({ ...sectorFormData, soilType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-stone-50/50 cursor-pointer"
                >
                  <option value="Deep Black Cotton">Deep Black Cotton Soil (High water retention, clay-rich)</option>
                  <option value="Red Sandy Loam">Red Sandy Loam (Fast drainage, needs frequent light drip)</option>
                  <option value="Clayey Loam">Clayey Loam (Balanced moisture holding)</option>
                  <option value="Alluvial Silt">Alluvial Silt (River basin fertile soil)</option>
                </select>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-between gap-2">
                {!isCreatingNewSector && zones.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteSector(sectorFormData.id)}
                    className="px-3 py-2 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Sector</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSectorModalOpen(false)}
                    className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isCreatingNewSector ? 'Create Sector' : 'Save Modifications'}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
