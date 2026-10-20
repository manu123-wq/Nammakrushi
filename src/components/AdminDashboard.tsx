import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  UserCheck, 
  ShoppingBag, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  Download, 
  Truck, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  ArrowUpRight, 
  Send,
  AlertCircle,
  ExternalLink,
  Ban,
  Lock,
  Layers,
  ChevronRight
} from 'lucide-react';
import { playNotificationChime } from '../utils/audio';

interface AdminDashboardProps {
  onNavigateTab?: (tab: any) => void;
  adminUser?: any;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateTab,
  adminUser
}) => {
  const [activeModule, setActiveModule] = useState<
    'verifications' | 'overview' | 'farmers' | 'consumers' | 'orders' | 'payments' | 'products'
  >('verifications');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Module data states
  const [overviewStats, setOverviewStats] = useState<any>(null);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [verifFilter, setVerifFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedVerif, setSelectedVerif] = useState<any | null>(null);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Other admin entities
  const [farmers, setFarmers] = useState<any[]>([]);
  const [consumers, setConsumers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState<string>('All');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Logistics edit state
  const [editingLogisticsOrder, setEditingLogisticsOrder] = useState<any | null>(null);
  const [courierName, setCourierName] = useState('NammaKrushi Direct Rural Logistics');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');

  const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem('nammakrushi_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    playNotificationChime();
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // 1. Load Overview Data
  const loadOverview = async () => {
    try {
      const res = await fetch('/api/admin/overview', { credentials: 'omit', headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setOverviewStats(data);
        }
      }
    } catch (e) {
      console.warn('Overview fetch note:', e);
    }
  };

  // 2. Load Verifications
  const loadVerifications = async () => {
    setLoading(true);
    try {
      const url = verifFilter === 'all' 
        ? '/api/admin/verifications' 
        : `/api/admin/verifications?status=${verifFilter}`;
      const res = await fetch(url, { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.verifications)) {
          setVerifications(data.verifications);
          if (data.verifications.length > 0 && !selectedVerif) {
            setSelectedVerif(data.verifications[0]);
          }
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to fetch verification queue');
    } finally {
      setLoading(false);
    }
  };

  // 3. Load Farmers
  const loadFarmers = async () => {
    try {
      const res = await fetch('/api/admin/farmers', { credentials: 'omit', headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setFarmers(data.farmers || []);
      }
    } catch (e) {}
  };

  // 4. Load Consumers
  const loadConsumers = async () => {
    try {
      const res = await fetch('/api/admin/consumers', { credentials: 'omit', headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setConsumers(data.consumers || []);
      }
    } catch (e) {}
  };

  // 5. Load Orders
  const loadOrders = async () => {
    try {
      const url = orderFilter === 'All' ? '/api/admin/orders' : `/api/admin/orders?status=${orderFilter}`;
      const res = await fetch(url, { credentials: 'omit', headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setOrders(data.orders || []);
      }
    } catch (e) {}
  };

  // 6. Load Payments
  const loadPayments = async () => {
    try {
      const res = await fetch('/api/admin/payments', { credentials: 'omit', headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setPayments(data.payments || []);
      }
    } catch (e) {}
  };

  // 7. Load Products
  const loadProducts = async () => {
    try {
      const res = await fetch('/api/admin/products', { credentials: 'omit', headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setProducts(data.products || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadOverview();
    loadVerifications();
    loadFarmers();
    loadConsumers();
    loadOrders();
    loadPayments();
    loadProducts();
  }, []);

  useEffect(() => {
    loadVerifications();
  }, [verifFilter]);

  useEffect(() => {
    loadOrders();
  }, [orderFilter]);

  // Handle Approve Verification
  const handleApproveVerification = async (verifId: string) => {
    if (!window.confirm('Confirm approval of this farmer RTC/Pahani land record? This unlocks produce selling immediately.')) {
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/admin/verifications/${verifId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ action: 'approve' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to approve verification');
      }

      showToast('Farmer Land Verification APPROVED! Produce selling unlocked.');
      loadVerifications();
      loadOverview();
      loadFarmers();
      if (selectedVerif?.id === verifId) {
        setSelectedVerif((prev: any) => ({ ...prev, status: 'approved' }));
      }
    } catch (err: any) {
      alert(err.message || 'Error reviewing verification');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Open Reject Modal
  const handleOpenRejectModal = (verifId: string) => {
    setReviewingId(verifId);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  // Submit Reject Verification
  const handleSubmitReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingId) return;

    if (!rejectionReason.trim()) {
      alert('Rejection reason is mandatory. Please state why the RTC/Pahani document was rejected.');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/admin/verifications/${reviewingId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          action: 'reject',
          reason: rejectionReason.trim()
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reject verification');
      }

      showToast('Farmer Verification REJECTED with reason recorded.');
      setRejectModalOpen(false);
      setRejectionReason('');
      setReviewingId(null);
      loadVerifications();
      loadOverview();
      loadFarmers();
      if (selectedVerif?.id === reviewingId) {
        setSelectedVerif((prev: any) => ({ ...prev, status: 'rejected', rejection_reason: rejectionReason.trim() }));
      }
    } catch (err: any) {
      alert(err.message || 'Error rejecting verification');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Farmer block/unblock
  const handleToggleFarmerBlock = async (farmerId: string, currentBlocked: number) => {
    try {
      const res = await fetch(`/api/admin/farmers/${farmerId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ isBlocked: !currentBlocked })
      });
      if (res.ok) {
        showToast(`Farmer account ${currentBlocked ? 'reactivated' : 'suspended'}.`);
        loadFarmers();
      }
    } catch (e) {}
  };

  // Consumer block/unblock
  const handleToggleConsumerBlock = async (consumerId: string, currentBlocked: number) => {
    try {
      const res = await fetch(`/api/admin/consumers/${consumerId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ isBlocked: !currentBlocked })
      });
      if (res.ok) {
        showToast(`Consumer account ${currentBlocked ? 'unblocked' : 'blocked'}.`);
        loadConsumers();
      }
    } catch (e) {}
  };

  // Order status update
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    const note = prompt(`Enter optional note for transitioning Order #${orderId} to "${nextStatus}":`, `Status moved to ${nextStatus} by Admin`);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ status: nextStatus, note: note || '' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Order #${orderId} updated to ${nextStatus}. Buyer & Seller notified!`);
        loadOrders();
        loadOverview();
      } else {
        alert(data.error || 'Failed to update order status');
      }
    } catch (e: any) {
      alert(e.message || 'Failed to update order');
    }
  };

  // Save logistics
  const handleSaveLogistics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLogisticsOrder) return;

    try {
      const res = await fetch(`/api/admin/orders/${editingLogisticsOrder.orderId}/logistics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          courierName,
          trackingNumber,
          vehicleNumber,
          driverName,
          driverPhone,
          expectedDelivery
        })
      });
      if (res.ok) {
        showToast(`Logistics for #${editingLogisticsOrder.orderId} updated!`);
        setEditingLogisticsOrder(null);
        loadOrders();
      }
    } catch (e) {}
  };

  // Product publish toggle
  const handleToggleProductPublish = async (prodId: string, currentPublished: number) => {
    try {
      const res = await fetch(`/api/admin/products/${prodId}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ isPublished: !currentPublished })
      });
      if (res.ok) {
        showToast(`Product ${currentPublished ? 'unpublished' : 'published'}.`);
        loadProducts();
      }
    } catch (e) {}
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      
      {/* Toast */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/50 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="font-bold text-xs sm:text-sm">{successToast}</span>
        </div>
      )}

      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-purple-950 to-stone-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-purple-900/80 border border-purple-500/40 px-3 py-1 rounded-full text-xs font-bold text-purple-200 mb-2">
            <ShieldCheck className="w-4 h-4 text-purple-300" />
            <span>Government & Administrative Command Center • Karnataka Bhoomi Portal Link</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            NammaKrushi Platform Administration
          </h1>
          <p className="text-xs sm:text-sm text-purple-200 max-w-2xl mt-1 leading-relaxed">
            Verify farmer RTC/Pahani land revenue records, moderate produce catalog, inspect COD/UPI payments, and orchestrate cold-chain logistics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadOverview();
              loadVerifications();
              loadFarmers();
              loadConsumers();
              loadOrders();
              loadPayments();
              loadProducts();
              showToast('Refreshed administrative data from SQLite.');
            }}
            className="flex items-center gap-2 bg-purple-700/60 hover:bg-purple-700 border border-purple-400/30 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync Live SQLite DB</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-stone-200 text-xs font-bold">
        <button
          onClick={() => setActiveModule('verifications')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeModule === 'verifications'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Farmer Verification Queue</span>
          {overviewStats?.stats?.pendingVerifications > 0 && (
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-black">
              {overviewStats.stats.pendingVerifications}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveModule('overview')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeModule === 'overview'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Platform Overview</span>
        </button>

        <button
          onClick={() => setActiveModule('orders')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeModule === 'orders'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Orders & Logistics</span>
          <span className="px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px]">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveModule('farmers')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeModule === 'farmers'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Farmers & Landholdings</span>
          <span className="px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px]">
            {farmers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveModule('consumers')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeModule === 'consumers'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Registered Consumers</span>
          <span className="px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px]">
            {consumers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveModule('payments')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeModule === 'payments'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payments Ledger</span>
          <span className="px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px]">
            {payments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveModule('products')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 ${
            activeModule === 'products'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Produce Catalog</span>
          <span className="px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px]">
            {products.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* MODULE 1: FARMER VERIFICATION QUEUE (CORE FEATURE) */}
      {/* ======================================================== */}
      {activeModule === 'verifications' && (
        <div className="space-y-6">
          
          {/* Top Bar with Filter and Counter */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Queue Filter:</span>
              <div className="inline-flex rounded-xl p-1 bg-stone-100 text-xs font-bold">
                {(['pending', 'approved', 'rejected', 'all'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setVerifFilter(tab)}
                    className={`px-3 py-1.5 rounded-lg transition capitalize cursor-pointer ${
                      verifFilter === tab 
                        ? 'bg-white text-purple-950 shadow-xs' 
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-stone-500">
              Showing <strong>{verifications.length}</strong> applications
            </div>
          </div>

          {/* Verification Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Applications List */}
            <div className="lg:col-span-5 space-y-3">
              {verifications.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center space-y-2">
                  <ShieldCheck className="w-10 h-10 text-stone-300 mx-auto" />
                  <h4 className="font-bold text-stone-800 text-sm">No Verification Records Found</h4>
                  <p className="text-xs text-stone-500">
                    No farmer applications in the "{verifFilter}" queue at this moment.
                  </p>
                </div>
              ) : (
                verifications.map((item) => {
                  const isSelected = selectedVerif?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedVerif(item)}
                      className={`p-4 rounded-2xl border transition cursor-pointer text-xs space-y-2.5 ${
                        isSelected
                          ? 'bg-purple-50/80 border-purple-400 shadow-sm'
                          : 'bg-white border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-stone-900 text-sm">{item.full_name}</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                          item.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : item.status === 'rejected'
                            ? 'bg-rose-100 text-rose-900 border-rose-300'
                            : 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="text-stone-600 grid grid-cols-2 gap-1 text-[11px]">
                        <div>Survey: <strong className="text-stone-800">{item.survey_number}/{item.hissa_number}</strong></div>
                        <div>Village: <strong className="text-stone-800">{item.village}</strong></div>
                        <div>Taluk: <strong>{item.taluk}</strong></div>
                        <div>Acres: <strong>{item.total_acres} ({item.ownership_type})</strong></div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[10px] text-stone-400">
                        <span>Submitted: {new Date(item.created_at).toLocaleDateString()}</span>
                        <span className="font-mono text-purple-700 flex items-center gap-1 font-bold">
                          View RTC Details <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Detailed Verification Review Card */}
            <div className="lg:col-span-7">
              {selectedVerif ? (
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-sm space-y-6">
                  
                  {/* Status Banner */}
                  <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-stone-900 text-lg sm:text-xl">
                          {selectedVerif.full_name}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs uppercase border ${
                          selectedVerif.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : selectedVerif.status === 'rejected'
                            ? 'bg-rose-100 text-rose-900 border-rose-300'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}>
                          {selectedVerif.status}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Application ID: <span className="font-mono text-purple-800">{selectedVerif.id}</span> • User: <span className="font-mono">{selectedVerif.user_id}</span>
                      </p>
                    </div>

                    {/* Action buttons (Approve / Reject) */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenRejectModal(selectedVerif.id)}
                        disabled={submittingReview}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => handleApproveVerification(selectedVerif.id)}
                        disabled={submittingReview}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve Land Record</span>
                      </button>
                    </div>
                  </div>

                  {/* Rejection Notice if already rejected */}
                  {selectedVerif.status === 'rejected' && selectedVerif.rejection_reason && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-1">
                      <span className="font-bold text-rose-950 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        Rejection Reason on Record:
                      </span>
                      <p className="text-rose-800 italic">
                        "{selectedVerif.rejection_reason}"
                      </p>
                    </div>
                  )}

                  {/* Land Revenue Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100">
                      <span className="text-[10px] text-stone-400 font-bold block uppercase">Phone Number</span>
                      <span className="font-bold text-stone-900 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        {selectedVerif.phone}
                      </span>
                    </div>

                    <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100">
                      <span className="text-[10px] text-stone-400 font-bold block uppercase">Survey & Hissa No.</span>
                      <span className="font-bold text-stone-900 mt-0.5">
                        {selectedVerif.survey_number} / {selectedVerif.hissa_number}
                      </span>
                    </div>

                    <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100">
                      <span className="text-[10px] text-stone-400 font-bold block uppercase">Land Ownership</span>
                      <span className="font-bold text-stone-900 mt-0.5 capitalize">
                        {selectedVerif.ownership_type} Pattedar
                      </span>
                    </div>

                    <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100">
                      <span className="text-[10px] text-stone-400 font-bold block uppercase">Total Cultivated Area</span>
                      <span className="font-bold text-stone-900 mt-0.5">
                        {selectedVerif.total_acres} Acres
                      </span>
                    </div>

                    <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100">
                      <span className="text-[10px] text-stone-400 font-bold block uppercase">Village & Hobli</span>
                      <span className="font-bold text-stone-900 mt-0.5">
                        {selectedVerif.village}, {selectedVerif.hobli}
                      </span>
                    </div>

                    <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100">
                      <span className="text-[10px] text-stone-400 font-bold block uppercase">Taluk & District</span>
                      <span className="font-bold text-stone-900 mt-0.5">
                        {selectedVerif.taluk}, {selectedVerif.district} ({selectedVerif.state})
                      </span>
                    </div>
                  </div>

                  {/* Cultivated Crops */}
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-1">
                    <span className="font-bold text-stone-700 block">Cultivated Crops on Record:</span>
                    <p className="font-semibold text-stone-900">{selectedVerif.crop_types}</p>
                  </div>

                  {/* Document Preview & Verification Link */}
                  <div className="space-y-3 p-5 bg-purple-50/60 rounded-2xl border border-purple-200 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-700" />
                        <div>
                          <span className="font-extrabold text-purple-950 block">
                            Uploaded RTC / Pahani Land Record Document
                          </span>
                          <span className="text-[11px] text-stone-500 font-mono">
                            {selectedVerif.rtc_file_name || 'RTC_Document.pdf'}
                          </span>
                        </div>
                      </div>

                      <a
                        href={selectedVerif.rtc_document_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 text-white rounded-xl font-bold hover:bg-purple-800 transition cursor-pointer text-xs shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Inspect Original Document</span>
                      </a>
                    </div>

                    {/* Image preview if image */}
                    {selectedVerif.rtc_document_url && selectedVerif.rtc_document_url.startsWith('data:image') && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-purple-200 max-h-64 bg-white flex items-center justify-center">
                        <img 
                          src={selectedVerif.rtc_document_url} 
                          alt="RTC Pahani Document" 
                          className="max-h-64 object-contain"
                        />
                      </div>
                    )}
                  </div>

                  {/* Audit Metadata */}
                  <div className="pt-2 text-[11px] text-stone-400 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100">
                    <span>Submitted Timestamp: {new Date(selectedVerif.created_at).toLocaleString()}</span>
                    {selectedVerif.reviewed_at && (
                      <span>Reviewed: {new Date(selectedVerif.reviewed_at).toLocaleString()}</span>
                    )}
                  </div>

                </div>
              ) : (
                <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center text-stone-400 text-xs">
                  Select an application from the queue to review land details.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* REJECT MODAL (MANDATORY REJECTION REASON ENFORCED) */}
      {/* ======================================================== */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-lg w-full p-6 space-y-4">
            
            <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-stone-900 text-base">
                  Reject Farmer RTC Verification
                </h3>
                <p className="text-xs text-stone-500">
                  Government audit rules require a mandatory reason before rejection.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitReject} className="space-y-4">
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-stone-800 block">
                  Mandatory Reason for Rejection: <span className="text-rose-600">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Survey number does not match Navalgund taluk revenue registry, or RTC scan is illegible. Please re-upload certified Bhoomi Pahani copy."
                  className="w-full p-3 rounded-xl border border-stone-300 bg-stone-50 font-medium text-stone-900 focus:outline-hidden focus:border-rose-600"
                />
                <span className="text-[11px] text-stone-400 block">
                  This note is recorded in the audit log and dispatched directly to the farmer so they can correct details and re-submit.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectModalOpen(false);
                    setRejectionReason('');
                    setReviewingId(null);
                  }}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingReview || !rejectionReason.trim()}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{submittingReview ? 'Recording Rejection...' : 'Confirm Rejection'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODULE 2: OVERVIEW */}
      {/* ======================================================== */}
      {activeModule === 'overview' && overviewStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-stone-200">
              <span className="text-[11px] text-stone-400 font-bold block uppercase">Total Consumers</span>
              <span className="text-xl sm:text-2xl font-black text-stone-900 mt-1 block">
                {overviewStats.stats.totalConsumers}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200">
              <span className="text-[11px] text-stone-400 font-bold block uppercase">Total Farmers</span>
              <span className="text-xl sm:text-2xl font-black text-stone-900 mt-1 block">
                {overviewStats.stats.totalFarmers}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200">
              <span className="text-[11px] text-amber-600 font-bold block uppercase">Pending Verif.</span>
              <span className="text-xl sm:text-2xl font-black text-amber-700 mt-1 block">
                {overviewStats.stats.pendingVerifications}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200">
              <span className="text-[11px] text-emerald-600 font-bold block uppercase">Approved Farmers</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 block">
                {overviewStats.stats.approvedVerifications}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200">
              <span className="text-[11px] text-stone-400 font-bold block uppercase">Platform Revenue</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 block">
                ₹{overviewStats.stats.totalRevenue.toLocaleString()}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200">
              <span className="text-[11px] text-stone-400 font-bold block uppercase">Total Payments</span>
              <span className="text-xl sm:text-2xl font-black text-purple-700 mt-1 block">
                {overviewStats.stats.totalPayments}
              </span>
            </div>
          </div>

          {/* Orders by Status & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <h3 className="font-extrabold text-stone-900 text-sm">Orders Fulfillment Breakdown</h3>
              <div className="space-y-2 text-xs">
                {overviewStats.ordersByStatus?.map((st: any) => (
                  <div key={st.status} className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl">
                    <span className="font-semibold text-stone-700 capitalize">{st.status.replace(/_/g, ' ')}</span>
                    <span className="font-black text-stone-900">{st.count} orders</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
              <h3 className="font-extrabold text-stone-900 text-sm">Recent Platform Activity</h3>
              <div className="space-y-2 text-xs">
                {overviewStats.recentActivity?.map((act: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl">
                    <div>
                      <span className="font-bold text-stone-900 block">{act.title}</span>
                      <span className="text-[11px] text-stone-500">{act.subtitle} ({act.status})</span>
                    </div>
                    <span className="text-[10px] text-stone-400 font-mono">{act.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODULE 3: ORDERS & LOGISTICS */}
      {/* ======================================================== */}
      {activeModule === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-500 uppercase">Status:</span>
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-stone-300 font-bold"
              >
                {['All', 'placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <span className="text-stone-500">Orders tracked: <strong>{orders.length}</strong></span>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Consumer</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Stage / Status</th>
                    <th className="p-4">Logistics Partner</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.map(order => (
                    <tr key={order.orderId} className="hover:bg-stone-50/80">
                      <td className="p-4 font-mono font-bold text-purple-900">{order.orderId}</td>
                      <td className="p-4">
                        <span className="font-bold text-stone-900 block">{order.consumerName}</span>
                        <span className="text-[11px] text-stone-400">{order.consumerPhone}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold uppercase text-stone-700">{order.paymentMode}</span>
                        <span className={`block text-[10px] font-bold ${
                          order.paymentStatus === 'success' ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-stone-900">₹{order.total?.toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase border ${
                          order.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : order.status === 'shipped' || order.status === 'out_for_delivery'
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 text-[11px] text-stone-600">
                        {order.courier_name || 'NammaKrushi Transit'}
                        {order.tracking_number && (
                          <span className="block font-mono text-[10px] text-stone-400">{order.tracking_number}</span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.orderId, e.target.value)}
                          className="px-2 py-1 bg-stone-100 rounded-lg text-stone-800 font-bold border border-stone-300 cursor-pointer text-[11px]"
                        >
                          {['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODULE 4: FARMERS & LANDHOLDINGS */}
      {/* ======================================================== */}
      {activeModule === 'farmers' && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-700">
            Registered Karnataka Farmers & Landholder Verification Registry
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Farmer Name</th>
                  <th className="p-4">Email / Phone</th>
                  <th className="p-4">District</th>
                  <th className="p-4">Land Records</th>
                  <th className="p-4">Verification</th>
                  <th className="p-4">Products</th>
                  <th className="p-4 text-right">Account Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {farmers.map(f => (
                  <tr key={f.id} className="hover:bg-stone-50/80">
                    <td className="p-4 font-bold text-stone-900">{f.name}</td>
                    <td className="p-4 text-stone-600">
                      <div>{f.email}</div>
                      <div className="text-[11px] text-stone-400">{f.phone}</div>
                    </td>
                    <td className="p-4">{f.district || 'Dharwad'}</td>
                    <td className="p-4 text-stone-600">
                      <div>{f.farm_acres ? `${f.farm_acres} Acres` : 'Unregistered'}</div>
                      <div className="text-[10px] text-stone-400 font-mono">Survey: {f.survey_number || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                        f.verification_status === 'approved'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : f.verification_status === 'rejected'
                          ? 'bg-rose-100 text-rose-900 border-rose-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        {f.verification_status || 'unverified'}
                      </span>
                    </td>
                    <td className="p-4 font-bold">{f.product_count || 0}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleFarmerBlock(f.id, f.is_blocked)}
                        className={`px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                          f.is_blocked
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                      >
                        {f.is_blocked ? 'Reactivate' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODULE 5: REGISTERED CONSUMERS */}
      {/* ======================================================== */}
      {activeModule === 'consumers' && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-700">
            Direct Consumers & Retail Buyers
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Consumer Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Orders Placed</th>
                  <th className="p-4">Total Spent</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {consumers.map(c => (
                  <tr key={c.id} className="hover:bg-stone-50/80">
                    <td className="p-4 font-bold text-stone-900">{c.name}</td>
                    <td className="p-4 text-stone-600">
                      <div>{c.email}</div>
                      <div className="text-[11px] text-stone-400">{c.phone}</div>
                    </td>
                    <td className="p-4 font-bold">{c.order_count || 0}</td>
                    <td className="p-4 font-bold text-emerald-800">₹{(c.total_spent || 0).toLocaleString()}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleConsumerBlock(c.id, c.is_blocked)}
                        className={`px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                          c.is_blocked
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {c.is_blocked ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODULE 6: PAYMENTS LEDGER */}
      {/* ======================================================== */}
      {activeModule === 'payments' && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-700">
            Escrow & Payment Transactions Ledger (COD & Masked UPI)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Transaction Ref</th>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Consumer</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Masked UPI</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-stone-50/80">
                    <td className="p-4 text-stone-800 font-bold">{p.transaction_ref}</td>
                    <td className="p-4 text-purple-900">{p.order_id}</td>
                    <td className="p-4 font-sans font-semibold text-stone-900">{p.consumerName}</td>
                    <td className="p-4 uppercase font-bold font-sans">{p.method}</td>
                    <td className="p-4 text-stone-500">{p.upi_id_masked || '—'}</td>
                    <td className="p-4 font-sans font-bold text-emerald-700">₹{p.amount?.toLocaleString()}</td>
                    <td className="p-4 font-sans">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        p.status === 'success' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-stone-400 font-sans text-[11px]">{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODULE 7: PRODUCE CATALOG MODERATION */}
      {/* ======================================================== */}
      {activeModule === 'products' && (
        <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-700">
            Marketplace Produce Listings & Seller Verification Status
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Produce Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Seller / Farmer</th>
                  <th className="p-4">Seller Verification</th>
                  <th className="p-4">Price / kg</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-stone-50/80">
                    <td className="p-4 font-bold text-stone-900">{p.title}</td>
                    <td className="p-4 text-stone-600">{p.category}</td>
                    <td className="p-4 text-stone-800">{p.seller_name || p.farmerName}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                        p.seller_verification === 'approved' || p.isVerified
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        {p.seller_verification || 'verified'}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-emerald-700">₹{p.price}</td>
                    <td className="p-4">{p.availableStock} kg</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleProductPublish(p.id, p.isPublished)}
                        className={`px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                          p.isPublished
                            ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                      >
                        {p.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
