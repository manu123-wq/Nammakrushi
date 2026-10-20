import React, { useState, useEffect } from 'react';
import { 
  Package, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Truck, 
  MapPin, 
  Phone, 
  Calendar, 
  ArrowRight, 
  Search, 
  Filter, 
  RefreshCw, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Check, 
  ShieldCheck, 
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  User,
  X
} from 'lucide-react';
import { playNotificationChime } from '../utils/audio';

interface FarmerOrderDashboardProps {
  farmerId?: string;
  onNavigateMarketplace?: () => void;
  onSelectOrderToTrack?: (orderId: string) => void;
}

export const FarmerOrderDashboard: React.FC<FarmerOrderDashboardProps> = ({
  farmerId = 'usr-farmer-01',
  onNavigateMarketplace,
  onSelectOrderToTrack
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'accepted' | 'preparing' | 'ready_for_pickup' | 'in_transit' | 'completed' | 'rejected'>('all');
  const [orders, setOrders] = useState<any[]>([]);
  const [counts, setCounts] = useState<{
    total: number;
    new: number;
    accepted: number;
    preparing: number;
    ready_for_pickup: number;
    in_transit: number;
    completed: number;
    rejected: number;
  }>({
    total: 0,
    new: 0,
    accepted: 0,
    preparing: 0,
    ready_for_pickup: 0,
    in_transit: 0,
    completed: 0,
    rejected: 0
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Privacy toggle to reveal customer address only when needed for packing/dispatch
  const [revealedAddresses, setRevealedAddresses] = useState<Record<string, boolean>>({});

  // Reject Modal State
  const [rejectingOrder, setRejectingOrder] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Logistics / Dispatch Modal State
  const [dispatchOrder, setDispatchOrder] = useState<any | null>(null);
  const [carrierName, setCarrierName] = useState('NammaKrushi Rural Cold-Chain Logistics');
  const [vehicleNumber, setVehicleNumber] = useState('KA-25-EA-8842');
  const [driverName, setDriverName] = useState('Manjunath K.');
  const [driverPhone, setDriverPhone] = useState('9448123988');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [currentLocationNote, setCurrentLocationNote] = useState('Dispatched from farmgate sorting center');

  // Load orders from backend
  const loadFarmerOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('nammakrushi_auth_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/farmer/orders?status=${activeTab}`, { headers });
      if (!res.ok) {
        throw new Error('Failed to retrieve orders for farmer fulfillment.');
      }
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      } else {
        throw new Error(data.error || 'Failed to load orders.');
      }
    } catch (err: any) {
      console.warn('Error loading farmer orders:', err);
      setError(err.message || 'Unable to connect to order fulfillment database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarmerOrders();
  }, [activeTab]);

  const toggleAddressReveal = (orderId: string) => {
    setRevealedAddresses(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // Status transition handler
  const handleUpdateStatus = async (orderId: string, nextStatus: string, reason?: string) => {
    setSubmittingAction(true);
    try {
      const token = localStorage.getItem('nammakrushi_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/farmer/orders/${orderId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status: nextStatus,
          rejectionReason: reason
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to transition order to ${nextStatus}.`);
      }

      playNotificationChime();
      // Reload orders to reflect update
      await loadFarmerOrders();
    } catch (err: any) {
      alert(err.message || 'Could not update order status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleOpenRejectModal = (order: any) => {
    setRejectingOrder(order);
    setRejectionReason('');
    setRejectError(null);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setRejectError('Please specify a reason for rejecting this order (e.g. crop damaged, stock exhausted).');
      return;
    }
    await handleUpdateStatus(rejectingOrder.orderId, 'rejected', rejectionReason.trim());
    setRejectingOrder(null);
  };

  const handleOpenDispatchModal = (order: any) => {
    setDispatchOrder(order);
    setTrackingNumber(order.trackingNumber || `TRK-KA-${order.orderId}`);
    setCarrierName(order.carrierName || 'NammaKrushi Rural Cold-Chain Logistics');
    setVehicleNumber(order.vehicleNumber || 'KA-25-EA-8842');
    setDriverName(order.driverName || 'Manjunath K.');
    setDriverPhone(order.driverPhone || '9448123988');
    setCurrentLocationNote('Dispatched from farmgate sorting center');
  };

  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchOrder) return;
    setSubmittingAction(true);

    try {
      const token = localStorage.getItem('nammakrushi_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/orders/${dispatchOrder.orderId}/shipment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          carrierName,
          trackingNumber,
          vehicleNumber,
          driverName,
          driverPhone,
          currentLocationNote
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch shipment.');
      }

      playNotificationChime();
      setDispatchOrder(null);
      await loadFarmerOrders();
    } catch (err: any) {
      alert(err.message || 'Error updating shipment logistics.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filter orders by search term
  const filteredOrders = orders.filter(o => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const idMatch = o.orderId.toLowerCase().includes(q);
    const custMatch = (o.consumerName || '').toLowerCase().includes(q);
    const itemMatch = (o.items || []).some((it: any) => (it.product?.title || it.product_title || '').toLowerCase().includes(q));
    return idMatch || custMatch || itemMatch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-16">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-800/80 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-bold text-emerald-200 mb-2">
            <Package className="w-4 h-4 text-emerald-400" />
            <span>Direct Farmgate Fulfillment Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Farmer Order Management & Fulfillment
          </h1>
          <p className="text-emerald-100/80 text-xs sm:text-sm mt-1 max-w-2xl">
            Accept direct purchase orders, schedule quality harvesting & packaging, assign rural cold-chain logistics, and track deliveries.
          </p>
        </div>

        <button
          onClick={loadFarmerOrders}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Filter Tabs / Segmented Control with Live Counters */}
      <div className="bg-white p-2 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'All Orders', count: counts.total },
          { id: 'new', label: 'New Orders', count: counts.new, alert: counts.new > 0 },
          { id: 'accepted', label: 'Accepted', count: counts.accepted },
          { id: 'preparing', label: 'Preparing', count: counts.preparing },
          { id: 'ready_for_pickup', label: 'Ready for Pickup', count: counts.ready_for_pickup },
          { id: 'in_transit', label: 'In Transit', count: counts.in_transit },
          { id: 'completed', label: 'Delivered', count: counts.completed },
          { id: 'rejected', label: 'Rejected / Cancelled', count: counts.rejected }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === tab.id
                ? 'bg-emerald-950/60 text-emerald-100'
                : tab.alert
                ? 'bg-amber-100 text-amber-800'
                : 'bg-stone-200 text-stone-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Actions Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, buyer name, or produce..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 text-stone-800"
          />
        </div>
        <p className="text-xs text-stone-500 font-medium">
          Showing <strong>{filteredOrders.length}</strong> orders for fulfillment
        </p>
      </div>

      {/* Orders List Container */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-stone-200 shadow-xs">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-stone-800">Loading farmer fulfillment orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <Package className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">No orders found in this stage</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {activeTab === 'new'
              ? 'Great job! There are currently no pending orders waiting for initial acceptance.'
              : 'No orders match the selected fulfillment stage or search filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const isRevealed = revealedAddresses[order.orderId];
            const rawStatus = (order.status || 'placed').toLowerCase();

            return (
              <div 
                key={order.orderId}
                className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 sm:p-6 space-y-4 transition hover:border-emerald-600/40"
              >
                {/* Order Top Ribbon */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-stone-900">
                      Order #{order.orderId}
                    </span>
                    {order.parent_order_id && (
                      <span className="text-[10px] text-stone-500 font-medium bg-stone-100 px-2 py-0.5 rounded-md">
                        Part of master #{order.parent_order_id}
                      </span>
                    )}
                    <span className="text-stone-300">·</span>
                    <span className="text-xs text-stone-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{order.date}</span>
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md capitalize ${
                      rawStatus === 'placed'
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : rawStatus === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        : rawStatus === 'preparing' || rawStatus === 'packed'
                        ? 'bg-blue-100 text-blue-900 border border-blue-200'
                        : rawStatus === 'ready_for_pickup'
                        ? 'bg-purple-100 text-purple-900 border border-purple-200'
                        : rawStatus === 'in_transit' || rawStatus === 'shipped' || rawStatus === 'out_for_delivery'
                        ? 'bg-sky-100 text-sky-900 border border-sky-200'
                        : rawStatus === 'delivered'
                        ? 'bg-teal-100 text-teal-900 border border-teal-200'
                        : 'bg-rose-100 text-rose-900 border border-rose-200'
                    }`}>
                      {rawStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Main Middle Row: Items & Customer Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Items Col (Takes 2 cols) */}
                  <div className="md:col-span-2 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      Produce Items Ordered
                    </h4>

                    <div className="space-y-2">
                      {order.items?.map((it: any, i: number) => {
                        const prod = it.product || it;
                        const qty = it.quantity || 1;
                        const price = prod.price || it.price || 0;

                        return (
                          <div key={i} className="flex items-center justify-between bg-stone-50 rounded-xl p-3 border border-stone-200/60">
                            <div className="flex items-center gap-3">
                              {prod.imageUrl ? (
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.title}
                                  className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-stone-200 flex items-center justify-center text-stone-500 shrink-0">
                                  <Package className="w-5 h-5" />
                                </div>
                              )}
                              <div>
                                <h5 className="font-bold text-xs text-stone-900">{prod.title || 'Farm Produce'}</h5>
                                <div className="flex items-center gap-2 text-[11px] text-stone-500">
                                  <span>{qty} {prod.unit || 'kg'}</span>
                                  <span aria-hidden="true">·</span>
                                  <span>₹{price} / {prod.unit || 'kg'}</span>
                                </div>
                              </div>
                            </div>

                            <span className="text-xs font-bold text-stone-900">
                              ₹{(price * qty).toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-2 text-xs">
                      <span className="text-stone-500">
                        Payment: <strong>{order.paymentMode?.toUpperCase() || 'COD'}</strong> ({order.paymentStatus === 'success' ? 'Authorized in Escrow' : 'Pay on Delivery'})
                      </span>
                      <span className="text-sm font-extrabold text-stone-900">
                        Order Value: ₹{order.total?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Customer Delivery Details (Fulfilment view with privacy toggle) */}
                  <div className="bg-stone-50/70 border border-stone-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-stone-500" />
                        <span>Customer Delivery</span>
                      </h4>
                      <button
                        onClick={() => toggleAddressReveal(order.orderId)}
                        className="text-[11px] text-emerald-800 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{isRevealed ? 'Hide' : 'Reveal'}</span>
                      </button>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-stone-400 block text-[10px] uppercase font-bold">Recipient</span>
                        <span className="font-semibold text-stone-900">{order.consumerName || 'Direct Buyer'}</span>
                      </div>

                      <div>
                        <span className="text-stone-400 block text-[10px] uppercase font-bold">Contact</span>
                        <a href={`tel:${order.consumerPhone}`} className="text-emerald-800 font-semibold hover:underline flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{isRevealed ? order.consumerPhone : `${order.consumerPhone?.slice(0, 3)}****${order.consumerPhone?.slice(-3)}`}</span>
                        </a>
                      </div>

                      <div>
                        <span className="text-stone-400 block text-[10px] uppercase font-bold">Delivery Address</span>
                        <p className="text-stone-700 text-xs">
                          {isRevealed 
                            ? order.deliveryAddress 
                            : `${order.deliveryAddress?.slice(0, 20)}... [Click Reveal to View Complete Address]`}
                        </p>
                      </div>

                      {order.carrierName && (
                        <div className="pt-2 border-t border-stone-200">
                          <span className="text-stone-400 block text-[10px] uppercase font-bold">Logistics Courier</span>
                          <span className="text-stone-800 font-medium">{order.carrierName} ({order.vehicleNumber})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rejection Note If Present */}
                {rawStatus === 'rejected' && order.rejectionReason && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Rejection Reason: <strong>{order.rejectionReason}</strong></span>
                  </div>
                )}

                {/* Bottom Action Buttons (Stage Transitions) */}
                <div className="border-t border-stone-100 pt-3 flex flex-wrap items-center justify-between gap-3">
                  
                  {/* Track link */}
                  {onSelectOrderToTrack && (
                    <button
                      onClick={() => onSelectOrderToTrack(order.orderId)}
                      className="text-xs text-emerald-800 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Customer Timeline</span>
                    </button>
                  )}

                  {/* Actions for Farmer based on status */}
                  <div className="flex items-center gap-2 ml-auto">
                    {rawStatus === 'placed' && (
                      <>
                        <button
                          onClick={() => handleOpenRejectModal(order)}
                          disabled={submittingAction}
                          className="px-3 py-1.5 border border-rose-300 hover:bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.orderId, 'confirmed')}
                          disabled={submittingAction}
                          className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept Order</span>
                        </button>
                      </>
                    )}

                    {rawStatus === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateStatus(order.orderId, 'preparing')}
                        disabled={submittingAction}
                        className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer inline-flex items-center gap-1"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Start Preparing Produce</span>
                      </button>
                    )}

                    {rawStatus === 'preparing' && (
                      <button
                        onClick={() => handleUpdateStatus(order.orderId, 'ready_for_pickup')}
                        disabled={submittingAction}
                        className="px-4 py-1.5 bg-purple-800 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Ready for Pickup</span>
                      </button>
                    )}

                    {rawStatus === 'ready_for_pickup' && (
                      <button
                        onClick={() => handleOpenDispatchModal(order)}
                        disabled={submittingAction}
                        className="px-4 py-1.5 bg-sky-800 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer inline-flex items-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Handover to Logistics Carrier</span>
                      </button>
                    )}

                    {rawStatus === 'in_transit' && (
                      <button
                        onClick={() => handleUpdateStatus(order.orderId, 'out_for_delivery')}
                        disabled={submittingAction}
                        className="px-4 py-1.5 bg-sky-800 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer inline-flex items-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Move to Out for Delivery</span>
                      </button>
                    )}

                    {rawStatus === 'out_for_delivery' && (
                      <button
                        onClick={() => handleUpdateStatus(order.orderId, 'delivered')}
                        disabled={submittingAction}
                        className="px-4 py-1.5 bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Delivered</span>
                      </button>
                    )}

                    {rawStatus === 'delivered' && (
                      <span className="text-xs font-semibold text-teal-800 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-teal-600" />
                        <span>Completed & Settled</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Order Modal */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-stone-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Reject Order #{rejectingOrder.orderId}</span>
              </h3>
              <button 
                onClick={() => setRejectingOrder(null)}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Please specify the mandatory reason for rejecting this direct produce order. The customer will be notified immediately and any escrow authorization will be returned.
            </p>

            {rejectError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {rejectError}
              </div>
            )}

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Reason for Rejection *
                </label>
                <select
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-xl text-stone-800 focus:ring-2 focus:ring-rose-500 mb-2"
                >
                  <option value="">Select a common reason...</option>
                  <option value="Harvest delay due to unseasonal rain in field">Harvest delay due to unseasonal rain in field</option>
                  <option value="Available farm stock already booked by APMC mandi">Available farm stock already booked by APMC mandi</option>
                  <option value="Produce quality did not meet Grade A standard">Produce quality did not meet Grade A standard</option>
                  <option value="Packaging materials temporarily unavailable">Packaging materials temporarily unavailable</option>
                  <option value="Other">Custom Reason (Type below)</option>
                </select>

                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Describe reason clearly for the customer..."
                  rows={3}
                  className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-xl text-stone-800 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingOrder(null)}
                  className="px-4 py-2 border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {submittingAction ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch / Logistics Assignment Modal */}
      {dispatchOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-stone-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-700" />
                <span>Assign Logistics & Dispatch #{dispatchOrder.orderId}</span>
              </h3>
              <button 
                onClick={() => setDispatchOrder(null)}
                className="text-stone-400 hover:text-stone-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Assign a delivery partner and driver for cold-chain transit. Customer will receive immediate notification with driver contact and tracking number.
            </p>

            <form onSubmit={handleConfirmDispatch} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Logistics Carrier Service
                </label>
                <input
                  type="text"
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-xl text-stone-800 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Transit Vehicle Number
                  </label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-xl text-stone-800 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Tracking Consignment ID
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-xl font-mono text-stone-800 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Driver / Courier Name
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-xl text-stone-800 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Driver Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-xl text-stone-800 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Location / Dispatch Status Note
                </label>
                <input
                  type="text"
                  value={currentLocationNote}
                  onChange={(e) => setCurrentLocationNote(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-xl text-stone-800 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setDispatchOrder(null)}
                  className="px-4 py-2 border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-4 py-2 bg-sky-800 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {submittingAction ? 'Dispatching...' : 'Dispatch Consignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
