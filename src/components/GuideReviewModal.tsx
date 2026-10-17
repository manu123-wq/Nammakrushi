import React from 'react';
import { 
  X, 
  CheckCircle2, 
  GraduationCap, 
  Bot, 
  Package, 
  Bell, 
  ExternalLink,
  Sparkles,
  Users
} from 'lucide-react';
import { TabType } from '../types';

interface GuideReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: TabType) => void;
}

export const GuideReviewModal: React.FC<GuideReviewModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold tracking-wider uppercase mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Academic Project Verification & Guide Remarks</span>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-black text-white">
            NammaKrushi: Farm Management & Marketplace
          </h2>
          <p className="text-xs text-emerald-200 mt-1">
            Department of Computer Science & Engineering • A.G.M. Rural College of Engineering & Technology, Varur (VTU Belagavi)
          </p>

          <div className="mt-4 pt-3 border-t border-emerald-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-100">
              <Users className="w-3.5 h-3.5 text-emerald-300" />
              <span><strong>Batch 09:</strong> Harish M A (26), Mallikarjun J (42), Manish S B (43), Manjunath A H (44)</span>
            </div>
            <div className="bg-emerald-700/80 px-2.5 py-1 rounded-md text-white font-medium">
              Guide: <strong>Ms. Jyothi Jawai</strong>
            </div>
          </div>
        </div>

        {/* Remarks Checklist */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              This audit panel compares the handwritten remarks recorded in the <strong>Major Project Progress Diary (Phase 2, 7th Semester)</strong> against the working implementation.
            </p>
          </div>

          {/* Remark 1 */}
          <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/30">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg mt-0.5">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                      Diary Entry 1
                    </span>
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 100% Solved
                    </span>
                  </div>
                  <h4 className="font-bold text-stone-900 text-sm mt-1">
                    "AI Chatbot needs to be fixed or excluded if not achieved."
                  </h4>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    <strong>Solution:</strong> Upgraded from defunct OpenAI key to server-side <strong>Google Gemini AI (gemini-3.8-flash)</strong>. Pre-loaded with regional climate knowledge for Karnataka, N-P-K nutrient calculations, crop disease diagnosis, and Kannada terminology.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onNavigateTab('chatbot');
                  onClose();
                }}
                className="shrink-0 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                Test Chatbot <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Remark 2 */}
          <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/30">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg mt-0.5">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                      Diary Entry 2
                    </span>
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 100% Solved
                    </span>
                  </div>
                  <h4 className="font-bold text-stone-900 text-sm mt-1">
                    "Need to check on inventory part and AI Model integration"
                  </h4>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    <strong>Solution:</strong>
                    <br />
                    1. <strong>Smart Inventory:</strong> Added categorized tracking (Seeds, Fertilizers, Tools, Produce), reorder thresholds, low-stock warnings, and direct 1-click marketplace listing.
                    <br />
                    2. <strong>AI Crop Predictor:</strong> Multi-factor agronomic classifier testing N, P, K, pH, rainfall, and temperature against climate models with confidence score & risk bands.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    onNavigateTab('inventory');
                    onClose();
                  }}
                  className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  Inventory <ExternalLink className="w-3 h-3" />
                </button>
                <button
                  onClick={() => {
                    onNavigateTab('predict');
                    onClose();
                  }}
                  className="text-xs font-bold bg-stone-800 hover:bg-stone-900 text-white px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  AI Predictor <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Remark 3 */}
          <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/30">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg mt-0.5">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                      Diary Entry 3
                    </span>
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 100% Solved
                    </span>
                  </div>
                  <h4 className="font-bold text-stone-900 text-sm mt-1">
                    "Notifications is to fixed, and made working"
                  </h4>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    <strong>Solution:</strong> Replaced broken SMTP/Twilio phone credentials with an end-to-end <strong>In-App Notification Dispatcher + Web Audio Chime + Native Browser Push Notification API</strong>. Automatically evaluates tasks due today, inventory running out, and local weather alerts.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onNavigateTab('tasks');
                  onClose();
                }}
                className="shrink-0 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                Task Alerts <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex items-center justify-between">
          <span className="text-xs text-stone-500 font-medium">
            Academic Project Phase 2 • VTU 7th Sem
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Close & Continue Exploring
          </button>
        </div>
      </div>
    </div>
  );
};
