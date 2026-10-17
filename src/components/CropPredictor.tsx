import React, { useState } from 'react';
import { 
  Sprout, 
  Sparkles, 
  Sliders, 
  CloudSun, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  FlaskConical,
  Droplets,
  Coins
} from 'lucide-react';
import { CropPredictionResult } from '../types';

interface CropPredictorProps {
  district: string;
  currentWeather: { temp: number; humidity: number; rainfall?: number } | null;
}

export const CropPredictor: React.FC<CropPredictorProps> = ({ district, currentWeather }) => {
  // Input parameters
  const [nitrogen, setNitrogen] = useState<number>(85);
  const [phosphorus, setPhosphorus] = useState<number>(45);
  const [potassium, setPotassium] = useState<number>(40);
  const [ph, setPh] = useState<number>(6.8);
  const [temperature, setTemperature] = useState<number>(currentWeather?.temp || 28);
  const [humidity, setHumidity] = useState<number>(currentWeather?.humidity || 65);
  const [rainfall, setRainfall] = useState<number>(680);
  
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<CropPredictionResult | null>({
    top3: [
      {
        crop: 'Bt Cotton (Hybrid BG-II)',
        confidence: 94,
        riskBand: 'Low',
        estimatedYield: '14 - 18 Quintals / acre',
        sowingSeason: 'Kharif (June - July)',
        waterRequirement: 'Moderate (600 - 750 mm)',
        profitEstimate: '₹42,000 - ₹62,000 / acre',
        rationale: 'Deep black clay-loam soil in North Karnataka with warm temperatures facilitates vigorous boll setting and fiber elongation.'
      },
      {
        crop: 'Maldandi Jowar (M35-1 Sorghum)',
        confidence: 88,
        riskBand: 'Low',
        estimatedYield: '16 - 20 Quintals / acre',
        sowingSeason: 'Rabi (September - October)',
        waterRequirement: 'Low - High Drought Tolerance',
        profitEstimate: '₹26,000 - ₹38,000 / acre',
        rationale: 'Exceptional moisture extraction efficiency in residual soil moisture; high local market demand for fodder and food grain.'
      },
      {
        crop: 'Soybean (JS-335)',
        confidence: 82,
        riskBand: 'Medium',
        estimatedYield: '9 - 12 Quintals / acre',
        sowingSeason: 'Early Kharif (June)',
        waterRequirement: 'Moderate (450 - 550 mm)',
        profitEstimate: '₹28,000 - ₹40,000 / acre',
        rationale: 'Short duration nitrogen-fixing legume that enhances microbial health and structure of soil.'
      }
    ],
    soilHealthAdvisory: 'Soil pH is well-buffered (6.8). Soil organic carbon can be elevated by incorporating 2 tons of enriched vermicompost with bio-fertilizers (Rhizobium / PSB).',
    climateSuitabilityScore: 92
  });

  const autofillCurrentWeather = () => {
    if (currentWeather) {
      setTemperature(currentWeather.temp);
      setHumidity(currentWeather.humidity);
    }
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/predict_crop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          N: nitrogen,
          P: phosphorus,
          K: potassium,
          ph,
          temperature,
          humidity,
          rainfall,
          region: district
        })
      });

      const data = await res.json();
      if (data.success && data.prediction) {
        setPrediction(data.prediction);
      }
    } catch (err) {
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-stone-900">
              AI Crop Prediction & Climate Modeling
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Deccan Plateau Agro-Model
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Machine Learning suitability classifier testing N, P, K soil nutrients and agro-climatic variables for {district}, Karnataka.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Advisory PDF</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input Sliders & Parameters (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-emerald-700" />
              Soil & Climate Parameters
            </h3>
            <button
              type="button"
              onClick={autofillCurrentWeather}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-1 rounded-md"
              title="Use current district weather values"
            >
              <CloudSun className="w-3.5 h-3.5" /> Auto-fill Weather
            </button>
          </div>

          <form onSubmit={handlePredict} className="space-y-4">
            
            {/* Nitrogen (N) */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-stone-700">Nitrogen (N)</span>
                <span className="font-bold text-emerald-800">{nitrogen} kg/ha</span>
              </div>
              <input
                type="range"
                min="10"
                max="160"
                value={nitrogen}
                onChange={(e) => setNitrogen(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-400">
                <span>Low (10)</span>
                <span>Medium (80)</span>
                <span>High (160)</span>
              </div>
            </div>

            {/* Phosphorus (P) */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-stone-700">Phosphorus (P)</span>
                <span className="font-bold text-emerald-800">{phosphorus} kg/ha</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={phosphorus}
                onChange={(e) => setPhosphorus(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-400">
                <span>Low (5)</span>
                <span>Medium (45)</span>
                <span>High (100)</span>
              </div>
            </div>

            {/* Potassium (K) */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-stone-700">Potassium (K)</span>
                <span className="font-bold text-emerald-800">{potassium} kg/ha</span>
              </div>
              <input
                type="range"
                min="5"
                max="140"
                value={potassium}
                onChange={(e) => setPotassium(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-400">
                <span>Low (5)</span>
                <span>Medium (50)</span>
                <span>High (140)</span>
              </div>
            </div>

            {/* Soil pH */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-stone-700">Soil pH</span>
                <span className="font-bold text-emerald-800">{ph}</span>
              </div>
              <input
                type="range"
                step="0.1"
                min="4.5"
                max="9.0"
                value={ph}
                onChange={(e) => setPh(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-400">
                <span>Acidic (4.5)</span>
                <span>Neutral (7.0)</span>
                <span>Alkaline (9.0)</span>
              </div>
            </div>

            {/* Climate Inputs */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Temperature (°C)</label>
                <input
                  type="number"
                  min="10"
                  max="48"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Humidity (%)</label>
                <input
                  type="number"
                  min="20"
                  max="100"
                  value={humidity}
                  onChange={(e) => setHumidity(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">Rainfall (Annual/Seasonal mm)</label>
                <input
                  type="number"
                  min="100"
                  max="2500"
                  value={rainfall}
                  onChange={(e) => setRainfall(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Calculating Model Predictions...</span>
                </>
              ) : (
                <>
                  <Sprout className="w-4 h-4" />
                  <span>Execute AI Crop Prediction</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Prediction Results & Analysis (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {prediction && (
            <>
              {/* Overall Climate Score Card */}
              <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wide">
                    Agro-Climatic Suitability Index
                  </span>
                  <h3 className="text-2xl font-black text-white mt-0.5">
                    {prediction.climateSuitabilityScore} / 100
                  </h3>
                  <p className="text-xs text-emerald-100 mt-1">
                    Strong alignment with {district} agro-ecological zone
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border-4 border-emerald-400">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Recommended Crops Cards */}
              <div className="space-y-3">
                <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-emerald-700" />
                  Top Recommended Crops (Ranked by Suitability)
                </h3>

                {prediction.top3.map((item, idx) => {
                  const riskColor = 
                    item.riskBand === 'Low' 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                      : item.riskBand === 'Medium'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-rose-100 text-rose-800 border-rose-200';

                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-emerald-300 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-800 text-white text-xs font-extrabold flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <h4 className="font-bold text-stone-900 text-base">
                              {item.crop}
                            </h4>
                          </div>
                          <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                            {item.rationale}
                          </p>
                        </div>

                        {/* Confidence Pill */}
                        <div className="text-right shrink-0">
                          <div className="text-base font-black text-emerald-700">
                            {item.confidence}% Match
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskColor}`}>
                            {item.riskBand} Risk
                          </span>
                        </div>
                      </div>

                      {/* Crop Key Indicators Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-stone-100 text-xs">
                        <div className="bg-stone-50 p-2 rounded-lg">
                          <span className="text-[10px] text-stone-400 block font-medium">Estimated Yield</span>
                          <span className="font-bold text-stone-800">{item.estimatedYield}</span>
                        </div>
                        <div className="bg-stone-50 p-2 rounded-lg">
                          <span className="text-[10px] text-stone-400 block font-medium">Sowing Window</span>
                          <span className="font-bold text-stone-800">{item.sowingSeason}</span>
                        </div>
                        <div className="bg-stone-50 p-2 rounded-lg">
                          <span className="text-[10px] text-stone-400 block font-medium">Water Need</span>
                          <span className="font-bold text-stone-800">{item.waterRequirement}</span>
                        </div>
                        <div className="bg-stone-50 p-2 rounded-lg">
                          <span className="text-[10px] text-stone-400 block font-medium">Expected Profit</span>
                          <span className="font-bold text-emerald-800">{item.profitEstimate}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Soil Health Advisory Box */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950">
                <div className="flex items-center gap-2 font-bold mb-1 text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Soil Health & Amendment Advisory
                </div>
                <p className="leading-relaxed">
                  {prediction.soilHealthAdvisory}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
