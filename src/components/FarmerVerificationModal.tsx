import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RotateCcw,
  MapPin,
  User,
  Phone,
  LandPlot,
  Building,
  Check,
  Eye,
  AlertCircle
} from 'lucide-react';
import { playNotificationChime } from '../utils/audio';

interface FarmerVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  verificationStatus: 'unverified' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  onVerificationSubmitted: (verifData: any) => void;
  farmerName?: string;
  farmerPhone?: string;
}

export const FarmerVerificationModal: React.FC<FarmerVerificationModalProps> = ({
  isOpen,
  onClose,
  verificationStatus,
  rejectionReason,
  onVerificationSubmitted,
  farmerName = 'Manish S.B.',
  farmerPhone = '9876543210'
}) => {
  const [fullName, setFullName] = useState(farmerName);
  const [phone, setPhone] = useState(farmerPhone);
  const [surveyNumber, setSurveyNumber] = useState('142');
  const [hissaNumber, setHissaNumber] = useState('2A');
  const [village, setVillage] = useState('Navalgund');
  const [hobli, setHobli] = useState('Navalgund Hobli');
  const [taluk, setTaluk] = useState('Navalgund');
  const [district, setDistrict] = useState('Dharwad');
  const [state, setState] = useState('Karnataka');
  const [totalAcres, setTotalAcres] = useState<number>(4.5);
  const [cropTypes, setCropTypes] = useState('Bt Cotton, Byadgi Chillies, Maldandi Jowar');
  const [ownershipType, setOwnershipType] = useState<'owned' | 'leased'>('owned');

  // File Upload State
  const [fileName, setFileName] = useState<string>('RTC_Pahani_Survey_142.pdf');
  const [fileDataUrl, setFileDataUrl] = useState<string>('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80');
  const [fileError, setFileError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size exceeds 5 MB limit. Please upload a compressed PDF or image.');
      return;
    }

    // Validate MIME type (PDF, JPEG, PNG)
    const validMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      setFileError('Invalid file type. Please upload a PDF, JPG, or PNG document.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFileDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!surveyNumber.trim() || !hissaNumber.trim() || !village.trim() || !taluk.trim() || !district.trim()) {
      setErrorMessage('Please fill in all mandatory land revenue records.');
      return;
    }

    if (!fileDataUrl) {
      setErrorMessage('Please upload your RTC / Pahani document to verify land ownership.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('nammakrushi_token');
      const res = await fetch('/api/farmers/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          fullName,
          phone,
          surveyNumber,
          hissaNumber,
          village,
          hobli,
          taluk,
          district,
          state,
          totalAcres: Number(totalAcres),
          cropTypes,
          ownershipType,
          rtcDocumentUrl: fileDataUrl,
          rtcFileName: fileName
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit verification');
      }

      playNotificationChime();
      onVerificationSubmitted(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-stone-900 text-lg">
                  Farmer Land & RTC Verification
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Government Land Audit
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Pahani / RTC verification protects consumers against middleman fraud and unlocks direct selling.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* STATUS BANNER 1: PENDING */}
          {verificationStatus === 'pending' && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1">
                <h4 className="font-bold text-amber-950 text-sm">
                  Verification Pending – Waiting for Admin Approval
                </h4>
                <p className="text-amber-800 leading-relaxed text-xs">
                  Your submitted RTC / Pahani document for Survey No. <strong>{surveyNumber}/{hissaNumber}</strong> ({village}) is currently under review by the NammaKrushi agricultural audit desk. Product listing will unlock immediately upon verification approval.
                </p>
              </div>
            </div>
          )}

          {/* STATUS BANNER 2: REJECTED */}
          {verificationStatus === 'rejected' && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-rose-950 text-sm">
                  Verification Rejected by Administrative Desk
                </h4>
                <p className="text-rose-800 leading-relaxed text-xs">
                  <strong>Reason for Rejection:</strong> "{rejectionReason || 'Uploaded document was illegible or survey number did not match taluk revenue records.'}"
                </p>
                <p className="text-rose-700 text-[11px] font-semibold pt-1">
                  Please correct the fields below and re-submit an authentic RTC / Pahani document.
                </p>
              </div>
            </div>
          )}

          {/* Verification Form (shown when unverified, rejected, or re-submitting) */}
          {(verificationStatus === 'unverified' || verificationStatus === 'rejected') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {errorMessage && (
                <div className="p-3 bg-rose-100 text-rose-900 border border-rose-300 rounded-xl font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 block">Grower / Landowner Full Name:</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 font-semibold focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 block">Mobile Phone Number (Aadhaar linked):</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 font-semibold focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Revenue Land Records (Karnataka Bhoomi) */}
              <div className="p-4 bg-stone-50/80 rounded-2xl border border-stone-200 space-y-3">
                <span className="font-extrabold text-stone-900 text-xs block border-b border-stone-200 pb-2">
                  🌾 Karnataka Bhoomi Land Revenue Details
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 block">Survey Number:</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 142"
                      value={surveyNumber}
                      onChange={(e) => setSurveyNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-semibold focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 block">Hissa Number:</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2A or 1"
                      value={hissaNumber}
                      onChange={(e) => setHissaNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-semibold focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 block">Village / Grama:</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Navalgund"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-semibold focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 block">Hobli:</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Navalgund"
                      value={hobli}
                      onChange={(e) => setHobli(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-semibold focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 block">Taluk:</label>
                    <input
                      type="text"
                      required
                      value={taluk}
                      onChange={(e) => setTaluk(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-semibold focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 block">District:</label>
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-white font-semibold focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-stone-700 block">State:</label>
                    <input
                      type="text"
                      disabled
                      value={state}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-stone-100 font-semibold text-stone-600"
                    />
                  </div>
                </div>
              </div>

              {/* Land Area & Crops */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 block">Total Cultivated Area (Acres):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={totalAcres}
                    onChange={(e) => setTotalAcres(parseFloat(e.target.value) || 1.0)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 font-semibold focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 block">Ownership Status:</label>
                  <select
                    value={ownershipType}
                    onChange={(e: any) => setOwnershipType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 font-semibold focus:outline-hidden focus:border-emerald-600"
                  >
                    <option value="owned">Sole Ownership (Pattedar)</option>
                    <option value="leased">Registered Leaseholder</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-700 block">Primary Crops Cultivated:</label>
                  <input
                    type="text"
                    required
                    value={cropTypes}
                    onChange={(e) => setCropTypes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 font-semibold focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* RTC / Pahani Document Upload */}
              <div className="space-y-2 p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-emerald-950 block">
                    Upload RTC (Record of Rights, Tenancy and Crops) / Pahani Document:
                  </label>
                  <span className="text-[10px] font-bold text-emerald-800">Max 5 MB (PDF/JPG/PNG)</span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold cursor-pointer transition flex items-center gap-2 shadow-xs">
                    <Upload className="w-4 h-4" />
                    <span>Choose RTC Document</span>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-stone-600 font-mono truncate max-w-xs">
                    {fileName}
                  </span>
                </div>

                {fileError && (
                  <span className="text-xs text-rose-600 font-bold block mt-1">{fileError}</span>
                )}

                <p className="text-[11px] text-stone-500">
                  You can download your certified RTC directly from Karnataka Bhoomi portal (<code className="text-emerald-700 font-mono">landrecords.karnataka.gov.in</code>).
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Submitting Land Record...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Submit for Verification</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Pending Screen Controls */}
          {verificationStatus === 'pending' && (
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
                <h5 className="font-bold text-stone-900">Submitted Verification Summary:</h5>
                <div className="grid grid-cols-2 gap-2 text-stone-600">
                  <div>Farmer: <strong>{fullName}</strong></div>
                  <div>Phone: <strong>{phone}</strong></div>
                  <div>Survey No: <strong>{surveyNumber}/{hissaNumber}</strong></div>
                  <div>Village: <strong>{village}, {taluk}</strong></div>
                  <div>Area: <strong>{totalAcres} Acres ({ownershipType})</strong></div>
                  <div>Document: <strong className="font-mono text-emerald-800">{fileName}</strong></div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
                >
                  Close & Return
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
