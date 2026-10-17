import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  Server, 
  Terminal, 
  Globe, 
  Layers, 
  CheckCircle2, 
  Code2, 
  ExternalLink,
  Play,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';
import { TabType } from '../types';

interface MvcRouteInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: TabType;
  onNavigateTab: (tab: TabType) => void;
}

export const MvcRouteInspectorModal: React.FC<MvcRouteInspectorModalProps> = ({
  isOpen,
  onClose,
  currentTab,
  onNavigateTab
}) => {
  const [activeTab, setActiveTab] = useState<'routes' | 'models' | 'vscode' | 'test'>('routes');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Live Route Tester State
  const [testEndpoint, setTestEndpoint] = useState('/api/health');
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isLoadingTest, setIsLoadingTest] = useState(false);

  const currentPath = window.location.pathname || '/';

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const runTestApi = async (url: string) => {
    setIsLoadingTest(true);
    setTestEndpoint(url);
    try {
      const res = await fetch(url);
      const data = await res.json();
      setTestResponse({ status: res.status, data });
    } catch (err: any) {
      setTestResponse({ status: 500, error: err.message });
    } finally {
      setIsLoadingTest(false);
    }
  };

  useEffect(() => {
    if (isOpen && !testResponse) {
      runTestApi('/api/health');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const browserRoutes = [
    { path: '/marketplace', tab: 'marketplace' as TabType, label: 'Farmer Direct Produce Store', desc: 'Browse and purchase farm produce in kg with direct escrow pricing' },
    { path: '/purchase-history', tab: 'purchase-history' as TabType, label: 'Purchase History & Tracking', desc: '1-Click reorder, live farm transit, and Farm-to-Table QR passport' },
    { path: '/market-rates', tab: 'market-rates' as TabType, label: 'APMC Mandi Benchmarks', desc: 'Real-time mandi rates with 30-day historical Recharts trend analysis' },
    { path: '/dashboard', tab: 'dashboard' as TabType, label: 'Farmer Command Dashboard', desc: 'Overview of yield projections, harvest schedules, and weather' },
    { path: '/inventory', tab: 'inventory' as TabType, label: 'Smart Farm Inventory', desc: 'Farmer stock manager with 1-click publish to marketplace' },
    { path: '/tasks', tab: 'tasks' as TabType, label: 'Field Task Scheduling', desc: 'Agricultural activity tracker with alerts' },
    { path: '/chatbot', tab: 'chatbot' as TabType, label: 'Gemini Agronomist Chatbot', desc: 'Multi-turn climate-smart AI farm advisor' },
    { path: '/predict', tab: 'predict' as TabType, label: 'AI Crop Suitability Engine', desc: 'Soil NPK and climate algorithm predictor' },
  ];

  const apiEndpoints = [
    { method: 'GET', url: '/api/health', desc: 'Check SQLite engine status and architecture' },
    { method: 'GET', url: '/api/products', desc: 'Fetch products from SQLite products table' },
    { method: 'POST', url: '/api/products', desc: 'Insert new produce item into SQLite' },
    { method: 'GET', url: '/api/orders', desc: 'Fetch consumer purchase history from SQLite' },
    { method: 'POST', url: '/api/orders', desc: 'Insert verified consumer order into SQLite' },
    { method: 'POST', url: '/api/orders/rate', desc: 'Record consumer star rating & feedback' },
    { method: 'GET', url: '/api/traceability/prod-1', desc: 'Fetch harvest date, farm GPS & transport logs' },
    { method: 'GET', url: '/api/market_rates', desc: 'Fetch APMC mandi benchmarks' },
    { method: 'GET', url: '/api/weather?district=Dharwad', desc: 'Live weather & rainfall forecasts' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-700/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-stone-900 text-lg">MERN & SQLite MVC Architecture</h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  SQLAlchemy ORM + SQLite
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Express Server • SQLite (<code className="text-stone-700 font-mono">nammakrushi.sqlite</code>) • Browser Routes & VS Studio Ready
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('routes')}
            className={`py-3 px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'routes'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            Browser Routes ({browserRoutes.length})
          </button>

          <button
            onClick={() => setActiveTab('models')}
            className={`py-3 px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'models'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            MVC Models & Tables
          </button>

          <button
            onClick={() => setActiveTab('test')}
            className={`py-3 px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'test'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Play className="w-4 h-4" />
            Live API Route Tester
          </button>

          <button
            onClick={() => setActiveTab('vscode')}
            className={`py-3 px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'vscode'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Run in VS Studio / VS Code
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-50/50">
          
          {/* 1. BROWSER ROUTES */}
          {activeTab === 'routes' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-900 block">Current Browser Path:</span>
                  <code className="text-sm font-mono font-extrabold text-emerald-700 bg-white px-2 py-1 rounded border border-emerald-200">
                    {currentPath}
                  </code>
                </div>
                <span className="text-xs text-emerald-800 font-medium bg-emerald-100 px-2.5 py-1 rounded-full">
                  ✓ Synced with HTML5 History & URL routing
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {browserRoutes.map((r) => {
                  const isActive = currentTab === r.tab;
                  return (
                    <div 
                      key={r.path}
                      className={`p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
                        isActive 
                          ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20' 
                          : 'bg-white border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <code className="text-xs font-bold font-mono text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded">
                            {r.path}
                          </code>
                          {isActive && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-stone-800 text-xs mt-1">{r.label}</h4>
                        <p className="text-[11px] text-stone-500 mt-0.5">{r.desc}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                        <button
                          onClick={() => {
                            onNavigateTab(r.tab);
                            onClose();
                          }}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                        >
                          Navigate to route →
                        </button>
                        <button
                          onClick={() => handleCopy(`http://localhost:3000${r.path}`)}
                          className="text-[10px] text-stone-400 hover:text-stone-600 flex items-center gap-1"
                        >
                          {copiedText === `http://localhost:3000${r.path}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          Copy URL
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. MVC MODELS & SQLALCHEMY TABLES */}
          {activeTab === 'models' && (
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-stone-900 text-sm">SQLite Relational Tables (<code className="font-mono text-emerald-700">nammakrushi.sqlite</code>)</h4>
                </div>
                <p className="text-xs text-stone-600">
                  Configured with both Node.js native <code className="font-mono text-xs">node:sqlite DatabaseSync</code> and Python <code className="font-mono text-xs">SQLAlchemy 2.0</code> declarative models.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Products Table */}
                <div className="bg-white rounded-xl border border-stone-200 p-4">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100 mb-2">
                    <span className="font-mono font-bold text-xs text-emerald-700">Table: products</span>
                    <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono">ProductModel</span>
                  </div>
                  <ul className="text-xs font-mono space-y-1 text-stone-600">
                    <li>• <b className="text-stone-900">id</b>: TEXT PRIMARY KEY</li>
                    <li>• <b className="text-stone-900">title</b>: TEXT NOT NULL</li>
                    <li>• <b className="text-stone-900">price</b>: REAL NOT NULL (in kg)</li>
                    <li>• <b className="text-stone-900">unit</b>: TEXT DEFAULT 'kg'</li>
                    <li>• <b className="text-stone-900">availableStock</b>: REAL NOT NULL</li>
                    <li>• <b className="text-stone-900">farmerName</b>: TEXT NOT NULL</li>
                    <li>• <b className="text-stone-900">farmerLocation</b>: TEXT</li>
                    <li>• <b className="text-stone-900">qualityGrade</b>: TEXT</li>
                    <li>• <b className="text-stone-900">rating / reviews</b>: REAL / INTEGER</li>
                  </ul>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-xl border border-stone-200 p-4">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100 mb-2">
                    <span className="font-mono font-bold text-xs text-emerald-700">Table: orders</span>
                    <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono">OrderModel</span>
                  </div>
                  <ul className="text-xs font-mono space-y-1 text-stone-600">
                    <li>• <b className="text-stone-900">orderId</b>: TEXT PRIMARY KEY</li>
                    <li>• <b className="text-stone-900">total</b>: REAL NOT NULL</li>
                    <li>• <b className="text-stone-900">paymentMode</b>: TEXT (UPI Escrow)</li>
                    <li>• <b className="text-stone-900">transactionId</b>: TEXT</li>
                    <li>• <b className="text-stone-900">status</b>: TEXT</li>
                    <li>• <b className="text-stone-900">itemsJson</b>: TEXT (JSON Array)</li>
                    <li>• <b className="text-stone-900">trackingMilestonesJson</b>: TEXT</li>
                    <li>• <b className="text-stone-900">rated / feedback</b>: INTEGER / TEXT</li>
                  </ul>
                </div>

                {/* Traceability Table */}
                <div className="bg-white rounded-xl border border-stone-200 p-4">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100 mb-2">
                    <span className="font-mono font-bold text-xs text-emerald-700">Table: traceability</span>
                    <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono">TraceabilityModel</span>
                  </div>
                  <ul className="text-xs font-mono space-y-1 text-stone-600">
                    <li>• <b className="text-stone-900">productId</b>: TEXT PRIMARY KEY</li>
                    <li>• <b className="text-stone-900">harvestDate</b>: TEXT NOT NULL</li>
                    <li>• <b className="text-stone-900">farmLocationJson</b>: TEXT (GPS)</li>
                    <li>• <b className="text-stone-900">transportLogsJson</b>: TEXT</li>
                    <li>• <b className="text-stone-900">verificationHash</b>: TEXT</li>
                    <li>• <b className="text-stone-900">qrPayload</b>: TEXT (QR Code)</li>
                  </ul>
                </div>

                {/* Market Rates Table */}
                <div className="bg-white rounded-xl border border-stone-200 p-4">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100 mb-2">
                    <span className="font-mono font-bold text-xs text-emerald-700">Table: market_rates</span>
                    <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono">MarketRateModel</span>
                  </div>
                  <ul className="text-xs font-mono space-y-1 text-stone-600">
                    <li>• <b className="text-stone-900">id</b>: INTEGER PRIMARY KEY</li>
                    <li>• <b className="text-stone-900">crop</b>: TEXT NOT NULL</li>
                    <li>• <b className="text-stone-900">mandi</b>: TEXT NOT NULL</li>
                    <li>• <b className="text-stone-900">modalPrice</b>: REAL NOT NULL</li>
                    <li>• <b className="text-stone-900">trend / change</b>: TEXT</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 3. LIVE ROUTE TESTER */}
          {activeTab === 'test' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-stone-200">
                <label className="text-xs font-bold text-stone-700 mb-2 block">
                  Select an SQLite MVC Route to Test Live:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {apiEndpoints.map((ep) => (
                    <button
                      key={ep.url}
                      onClick={() => runTestApi(ep.url)}
                      className={`px-3 py-2 text-left rounded-lg border text-xs font-mono transition-colors ${
                        testEndpoint === ep.url 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-emerald-600 block">{ep.method}</span>
                      {ep.url}
                    </button>
                  ))}
                </div>
              </div>

              {/* Response output */}
              <div className="bg-stone-900 rounded-xl p-4 text-stone-100 shadow-inner">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-stone-800 text-xs">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-emerald-400 font-bold">GET</span>
                    <span>{testEndpoint}</span>
                  </div>
                  <button 
                    onClick={() => runTestApi(testEndpoint)}
                    disabled={isLoadingTest}
                    className="flex items-center gap-1 text-[11px] bg-stone-800 hover:bg-stone-700 px-2 py-1 rounded text-stone-300"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingTest ? 'animate-spin' : ''}`} />
                    Re-run
                  </button>
                </div>

                <pre className="text-xs font-mono text-emerald-400 overflow-x-auto max-h-60 p-2 bg-stone-950 rounded">
                  {isLoadingTest 
                    ? 'Loading response from SQLite...' 
                    : JSON.stringify(testResponse?.data || testResponse, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* 4. RUN IN VS STUDIO / VS CODE */}
          {activeTab === 'vscode' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-4">
                <h4 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-emerald-600" />
                  Quick-Start in Visual Studio / VS Code
                </h4>
                
                <p className="text-xs text-stone-600">
                  You can run NammaKrushi either via the full-stack <b>MERN Stack (Node.js + Express)</b> or via the <b>Python SQLAlchemy Backend</b>. Both seamlessly connect to the same SQLite database file (<code className="font-mono text-xs">nammakrushi.sqlite</code>).
                </p>

                {/* Option A */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900">Option 1: MERN Stack (Node.js + Express + React + SQLite)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      Standard
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">In Visual Studio terminal:</p>
                  <div className="bg-stone-900 text-stone-100 p-3 rounded-lg font-mono text-xs flex items-center justify-between">
                    <code>npm run dev</code>
                    <button onClick={() => handleCopy('npm run dev')} className="text-stone-400 hover:text-white">
                      {copiedText === 'npm run dev' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-500">Opens instantly on <code className="text-emerald-700 font-mono">http://localhost:3000</code> with all browser routes working.</p>
                </div>

                {/* Option B */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900">Option 2: Python SQLAlchemy Backend (Flask + SQLite)</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                      Python Backend
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">In Visual Studio terminal:</p>
                  <div className="bg-stone-900 text-stone-100 p-3 rounded-lg font-mono text-xs flex items-center justify-between">
                    <code>pip install -r backend/requirements.txt && python -m backend.app</code>
                    <button onClick={() => handleCopy('pip install -r backend/requirements.txt && python -m backend.app')} className="text-stone-400 hover:text-white">
                      {copiedText === 'pip install -r backend/requirements.txt && python -m backend.app' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-500">Runs SQLAlchemy ORM REST API on <code className="text-emerald-700 font-mono">http://localhost:5000</code>.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-white flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-stone-700">MERN Stack • SQLite Database: nammakrushi.sqlite</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-colors"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
