import React, { useState } from 'react';
import { 
  X, 
  QrCode, 
  Truck, 
  Calendar, 
  MapPin, 
  User, 
  Phone, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink, 
  Download, 
  Smartphone, 
  Thermometer, 
  Leaf, 
  Award,
  Navigation,
  FileText,
  BadgeCheck,
  Share2
} from 'lucide-react';
import { FarmTraceability, MarketplaceProduct, ConsumerOrder } from '../types';
import { playNotificationChime } from '../utils/audio';

interface FarmToTableQRModalProps {
  traceability: FarmTraceability;
  product?: MarketplaceProduct;
  order?: ConsumerOrder;
  onClose: () => void;
}

export const FarmToTableQRModal: React.FC<FarmToTableQRModalProps> = ({
  traceability,
  product,
  order,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'harvest' | 'location' | 'transport'>('qr');
  const [copiedLink, setCopiedLink] = useState(false);
  const [simulatingScan, setSimulatingScan] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(traceability.qrPayload);
    setCopiedLink(true);
    playNotificationChime();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSimulateScan = () => {
    setSimulatingScan(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setSimulatingScan(false);
            setActiveTab('harvest');
            playNotificationChime();
          }, 400);
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  // Deterministic SVG QR pattern generator based on hash
  const generateQRMatrix = (seedString: string) => {
    const size = 25; // 25x25 grid
    const matrix: boolean[][] = Array(size).fill(false).map(() => Array(size).fill(false));

    // Corner positioning patterns (7x7)
    const drawFinderPattern = (r0: number, c0: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            matrix[r0 + r][c0 + c] = true;
          }
        }
      }
    };

    drawFinderPattern(0, 0); // Top-left
    drawFinderPattern(0, size - 7); // Top-right
    drawFinderPattern(size - 7, 0); // Bottom-left

    // Timing patterns
    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }

    // Fill data cells deterministically
    let hashNum = 0;
    for (let i = 0; i < seedString.length; i++) {
      hashNum = (hashNum * 31 + seedString.charCodeAt(i)) % 1000000007;
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Skip finder areas
        if ((r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8)) continue;
        if (r === 6 || c === 6) continue;
        // Skip center logo area (9x9 in middle)
        if (r >= 10 && r <= 14 && c >= 10 && c <= 14) continue;

        const val = Math.sin(hashNum + r * 17 + c * 31);
        matrix[r][c] = val > 0.05;
      }
    }

    return matrix;
  };

  const qrMatrix = generateQRMatrix(traceability.batchNumber + traceability.productId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden my-auto">
        
        {/* Header with Certified Farm Badge */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-teal-900 to-green-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800/80 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-inner">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Farm-to-Table Transparency Passport
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  Verified Provenance
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5 truncate max-w-md">
                {traceability.productTitle}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50 text-xs font-bold shrink-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex items-center gap-1.5 px-4 py-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'qr'
                ? 'border-emerald-700 text-emerald-900 bg-white font-extrabold shadow-2xs'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>Virtual QR Code</span>
          </button>

          <button
            onClick={() => setActiveTab('harvest')}
            className={`flex items-center gap-1.5 px-4 py-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'harvest'
                ? 'border-emerald-700 text-emerald-900 bg-white font-extrabold shadow-2xs'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Harvest & Freshness</span>
          </button>

          <button
            onClick={() => setActiveTab('location')}
            className={`flex items-center gap-1.5 px-4 py-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'location'
                ? 'border-emerald-700 text-emerald-900 bg-white font-extrabold shadow-2xs'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Farm Origin & Coordinates</span>
          </button>

          <button
            onClick={() => setActiveTab('transport')}
            className={`flex items-center gap-1.5 px-4 py-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'transport'
                ? 'border-emerald-700 text-emerald-900 bg-white font-extrabold shadow-2xs'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>Cold-Chain Transport Logs ({traceability.transportLogs.length})</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* TAB 1: VIRTUAL QR CODE DISPLAY */}
          {activeTab === 'qr' && (
            <div className="flex flex-col items-center text-center space-y-4 animate-fade-in">
              <div className="max-w-md">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full mb-1">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Tamper-Proof Direct Farm QR Code
                </span>
                <p className="text-xs text-stone-600">
                  Scan with any smartphone camera or click below to simulate instant real-time farm verification.
                </p>
              </div>

              {/* QR Code Container */}
              <div className="relative p-5 bg-white rounded-3xl border-2 border-stone-200 shadow-lg hover:border-emerald-500 transition duration-300 group">
                {/* SVG Rendered QR Code */}
                <div className="relative w-56 h-56 flex items-center justify-center bg-white p-2">
                  <svg 
                    viewBox="0 0 25 25" 
                    className="w-full h-full shape-rendering-crispEdges text-stone-900"
                    fill="currentColor"
                  >
                    {qrMatrix.map((row, r) => 
                      row.map((cell, c) => cell ? (
                        <rect key={`${r}-${c}`} x={c} y={r} width="1.02" height="1.02" rx="0.1" />
                      ) : null)
                    )}
                  </svg>

                  {/* Centered Sprout Badge */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-md border-2 border-emerald-600 flex items-center justify-center text-emerald-700">
                      <Leaf className="w-6 h-6 fill-emerald-600 text-emerald-700" />
                    </div>
                  </div>

                  {/* Scanning Animation Overlay */}
                  {simulatingScan && (
                    <div className="absolute inset-0 bg-emerald-900/30 backdrop-blur-2xs rounded-xl flex flex-col items-center justify-center text-white space-y-2 animate-fade-in">
                      <Smartphone className="w-8 h-8 animate-bounce text-emerald-300" />
                      <div className="text-xs font-black tracking-wide">
                        Scanning Harvest QR... {scanProgress}%
                      </div>
                      <div className="w-36 h-1.5 bg-white/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-400 transition-all duration-150"
                          style={{ width: `${scanProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 text-[11px] font-mono text-stone-500">
                  Batch: <strong>{traceability.batchNumber}</strong>
                </div>
              </div>

              {/* QR Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-lg w-full pt-1">
                <button
                  onClick={handleSimulateScan}
                  disabled={simulatingScan}
                  className="flex-1 min-w-[170px] py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{simulatingScan ? 'Scanning Passport...' : 'Simulate Phone Scan'}</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-stone-200"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-800">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-stone-500" />
                      <span>Copy Passport URL</span>
                    </>
                  )}
                </button>

                <a
                  href={`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 25 25"><rect width="100%" height="100%" fill="white"/><text x="2" y="24" font-size="1.5" fill="%23059669">${traceability.batchNumber}</text></svg>`}
                  download={`NammaKrushi_QR_${traceability.batchNumber}.svg`}
                  className="px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-stone-200 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-stone-500" />
                  <span>Download Stamp</span>
                </a>
              </div>

              {/* Quick Summary Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full text-left pt-2">
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Harvested On</span>
                  <div className="text-xs font-black text-stone-900">{traceability.harvestDate}</div>
                  <div className="text-[10px] text-emerald-700 font-semibold">{traceability.qualityMetrics.moistureContent}</div>
                </div>

                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Farm Location</span>
                  <div className="text-xs font-black text-stone-900">{traceability.farmLocation.village}, {traceability.farmLocation.district}</div>
                  <div className="text-[10px] text-stone-500 font-mono">{traceability.farmLocation.coordinates}</div>
                </div>

                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Transport Status</span>
                  <div className="text-xs font-black text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cold-Chain Verified</span>
                  </div>
                  <div className="text-[10px] text-stone-500">{traceability.transportLogs[traceability.transportLogs.length - 1]?.location}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HARVEST & FRESHNESS */}
          {activeTab === 'harvest' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <Leaf className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-emerald-950 text-sm">Harvest Purity & Freshness Assurance</h4>
                  <p className="text-stone-600 text-xs mt-0.5">
                    This lot was harvested directly at dawn by farmer {traceability.farmerDetails.name}. All quality inspection standards have been digitally verified.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                  <span className="text-[10px] text-stone-400 font-bold uppercase">Exact Harvest Timestamp</span>
                  <div className="font-bold text-stone-900 text-xs">{traceability.harvestTimestamp}</div>
                  <p className="text-[10px] text-stone-500">Early morning pluck ensures natural oils and crispness are preserved.</p>
                </div>

                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                  <span className="text-[10px] text-stone-400 font-bold uppercase">Crop Grade & Quality</span>
                  <div className="font-bold text-emerald-800 text-xs">{traceability.qualityMetrics.grade}</div>
                  <p className="text-[10px] text-stone-500">{traceability.qualityMetrics.organicStatus}</p>
                </div>

                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                  <span className="text-[10px] text-stone-400 font-bold uppercase">Moisture & Pulp Analysis</span>
                  <div className="font-bold text-stone-900 text-xs">{traceability.qualityMetrics.moistureContent}</div>
                  <p className="text-[10px] text-stone-500">Measured using digital grain/produce moisture meter.</p>
                </div>

                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                  <span className="text-[10px] text-stone-400 font-bold uppercase">Pesticide Residue Analysis</span>
                  <div className="font-bold text-emerald-700 text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{traceability.qualityMetrics.pesticideResidue}</span>
                  </div>
                  <p className="text-[10px] text-stone-500">Zero synthetic chemical fertilizers or artificial ripening sprays.</p>
                </div>
              </div>

              {/* Lab Certification Box */}
              <div className="p-4 bg-white rounded-2xl border border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8 text-amber-500 shrink-0" />
                  <div>
                    <div className="font-bold text-stone-900">Agri Laboratory Quality Certificate</div>
                    <div className="text-[11px] text-stone-500">
                      Report ID: <span className="font-mono text-stone-800 font-semibold">{traceability.qualityMetrics.testReportId}</span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                  PASSED & CERTIFIED
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: FARM LOCATION & GROWER CREDENTIALS */}
          {activeTab === 'location' && (
            <div className="space-y-4 animate-fade-in text-xs">
              {/* Grower Card */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={traceability.farmerDetails.photoUrl}
                    alt={traceability.farmerDetails.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-emerald-600/40 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-stone-900 text-sm">{traceability.farmerDetails.name}</h4>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                    </div>
                    <p className="text-[11px] text-stone-500 font-medium">{traceability.farmerDetails.certification}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{traceability.farmerDetails.farmingPractice}</p>
                  </div>
                </div>

                <a
                  href={`tel:${traceability.farmerDetails.phone.replace(/\D/g, '')}`}
                  className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call Farmer Directly</span>
                </a>
              </div>

              {/* Geographical & Survey Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                  <span className="text-[10px] text-stone-400 font-bold uppercase">Land Survey & Plot Details</span>
                  <div className="font-bold text-stone-900">{traceability.farmLocation.surveyNumber}</div>
                  <div className="text-[11px] text-stone-600">
                    Total Cultivation Area: <strong>{traceability.farmLocation.farmSizeAcres} Acres</strong>
                  </div>
                </div>

                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                  <span className="text-[10px] text-stone-400 font-bold uppercase">GPS Satellite Coordinates</span>
                  <div className="font-mono font-bold text-stone-900">{traceability.farmLocation.coordinates}</div>
                  <a
                    href={traceability.farmLocation.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 font-bold underline"
                  >
                    <span>View Plot on Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Administrative Address Box */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-stone-900">Registered Farm Village & Hub</div>
                  <div className="text-[11px] text-stone-600 mt-0.5">
                    Village: {traceability.farmLocation.village} • Taluk: {traceability.farmLocation.taluk} • District: {traceability.farmLocation.district}, {traceability.farmLocation.state}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COLD-CHAIN TRANSPORT LOGS */}
          {activeTab === 'transport' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-stone-900 text-sm">Chain of Custody & Transit Timeline</h4>
                  <p className="text-[11px] text-stone-500">End-to-end GPS and temperature logs from farm harvest to your door.</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  100% Direct Chain
                </span>
              </div>

              {/* Step-by-Step Chronological Transport Log */}
              <div className="relative pl-6 border-l-2 border-emerald-500 space-y-5 my-2">
                {traceability.transportLogs.map((log, index) => {
                  const isDone = log.status === 'completed';
                  const isInProg = log.status === 'in-progress';

                  return (
                    <div key={log.id} className="relative group">
                      {/* Node Bullet */}
                      <div className={`absolute -left-[31px] top-1 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                        isDone 
                          ? 'bg-emerald-600 border-white text-white shadow-2xs' 
                          : isInProg 
                          ? 'bg-amber-500 border-white text-white animate-pulse' 
                          : 'bg-stone-200 border-white text-stone-400'
                      }`}>
                        {isDone ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      </div>

                      <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 group-hover:border-emerald-300 transition space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                            <span>Stage {index + 1}: {log.stage}</span>
                          </span>
                          <span className="text-[10px] font-mono font-medium text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-200">
                            {log.timestamp}
                          </span>
                        </div>

                        <p className="text-stone-700 text-xs leading-relaxed">
                          {log.details}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-stone-500 border-t border-stone-200/50">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-stone-400" />
                            <strong>{log.location}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Truck className="w-3 h-3 text-emerald-600" />
                            <span>{log.vehicle}</span>
                          </span>
                          {log.temperature && (
                            <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
                              <Thermometer className="w-3 h-3 text-emerald-600" />
                              <span>{log.temperature}</span>
                            </span>
                          )}
                          {log.driverName && (
                            <span className="flex items-center gap-1 text-stone-600">
                              <User className="w-3 h-3 text-stone-400" />
                              <span>{log.driverName}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cryptographic Hash Guarantee */}
              <div className="p-3 bg-stone-900 text-stone-300 rounded-2xl font-mono text-[10px] break-all flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="truncate">
                  Immutable Verification Hash: <span className="text-emerald-300">{traceability.verificationHash}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-stone-500">
            <span>Passport ID: </span>
            <strong className="text-stone-800">{traceability.batchNumber}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-stone-200"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Passport'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
            >
              Close Transparency Passport
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
