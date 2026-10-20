import React, { useState, useEffect } from 'react';
import { 
  Package, 
  CheckCircle2, 
  Truck, 
  MapPin, 
  Phone, 
  Calendar, 
  Clock, 
  ArrowLeft, 
  Search, 
  ShieldCheck, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw,
  ShoppingBag,
  CreditCard,
  QrCode,
  User,
  Check,
  ChevronRight
} from 'lucide-react';
import { ConsumerOrder, TrackingMilestone, OrderStatusHistoryItem, ShipmentDetails } from '../types';
import { playNotificationChime } from '../utils/audio';

interface CustomerOrderTrackerProps {
  orderId?: string;
  initialOrder?: ConsumerOrder;
  onBack?: () => void;
  onNavigateMarketplace?: () => void;
}

export const CustomerOrderTracker: React.FC<CustomerOrderTrackerProps> = ({
  orderId: propOrderId,
  initialOrder,
  onBack,
  onNavigateMarketplace
}) => {
  const [searchOrderId, setSearchOrderId] = useState<string>(propOrderId || initialOrder?.orderId || '');
  const [activeOrderId, setActiveOrderId] = useState<string>(propOrderId || initialOrder?.orderId || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<any | null>(null);
  const [confirmingDelivery, setConfirmingDelivery] = useState<boolean>(false);
  const [deliveryConfirmed, setDeliveryConfirmed] = useState<boolean>(false);

  // Fetch full tracking details from backend
  const fetchTracking = async (idToFetch: string) => {
    if (!idToFetch || !idToFetch.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${idToFetch.trim()}/tracking`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`Order #${idToFetch} not found in the agricultural registry.`);
        }
        throw new Error('Failed to load tracking data from server.');
      }
      const data = await res.json();
      if (data.success && data.tracking) {
        setTrackingData(data.tracking);
        if (data.tracking.currentStatus === 'delivered') {
          setDeliveryConfirmed(true);
        }
      } else {
        throw new Error(data.error || 'Tracking details unavailable.');
      }
    } catch (err: any) {
      console.warn('Tracking fetch warning:', err);
      // Fallback to initialOrder if matched
      if (initialOrder && initialOrder.orderId === idToFetch) {
        setTrackingData({
          orderId: initialOrder.orderId,
          parentOrderId: initialOrder.parent_order_id,
          currentStatus: initialOrder.status,
          date: initialOrder.date,
          expectedDelivery: initialOrder.estimatedDelivery || 'Within 2-3 days',
          total: initialOrder.total,
          deliveryCharge: initialOrder.deliveryCharge || 0,
          deliveryMode: initialOrder.deliveryMode,
          deliveryAddress: initialOrder.deliveryAddress,
          consumerName: initialOrder.consumerName,
          consumerPhone: initialOrder.consumerPhone,
          paymentMode: initialOrder.paymentMode,
          items: initialOrder.items,
          farmer: {
            id: initialOrder.farmer_id || 'usr-farmer-01',
            name: initialOrder.farmerName || 'Manish S.B. (Raitha Bandhu)',
            location: initialOrder.farmerLocation || 'Navalgund, Dharwad',
            phone: initialOrder.farmerPhone || '9876543210',
            isVerified: true
          },
          shipment: {
            trackingId: initialOrder.trackingNumber || `TRK-${initialOrder.orderId}`,
            carrierName: initialOrder.carrierName || 'NammaKrushi Rural Cold-Chain Logistics',
            vehicleNumber: initialOrder.vehicleNumber || 'KA-25-EA-8842',
            driverName: initialOrder.driverName || 'Manjunath K.',
            driverPhone: initialOrder.driverPhone || '9448123988',
            currentLocationNote: 'In transit to destination delivery address',
            status: initialOrder.status
          },
          timeline: initialOrder.trackingMilestones || [],
          statusHistory: []
        });
      } else {
        setError(err.message || 'Unable to find tracking records for this Order ID.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeOrderId) {
      fetchTracking(activeOrderId);
    }
  }, [activeOrderId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchOrderId.trim()) {
      setActiveOrderId(searchOrderId.trim());
    }
  };

  const handleConfirmDelivery = async () => {
    if (!trackingData?.orderId) return;
    setConfirmingDelivery(true);
    try {
      const res = await fetch(`/api/orders/${trackingData.orderId}/confirm-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        playNotificationChime();
        setDeliveryConfirmed(true);
        // Refresh tracking data
        fetchTracking(trackingData.orderId);
      } else {
        alert(data.error || 'Failed to confirm delivery.');
      }
    } catch (e) {
      console.error('Error confirming delivery:', e);
    } finally {
      setConfirmingDelivery(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-16">
      
      {/* Top Navigation & Lookup Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
              Order Tracking & Fulfillment Timeline
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              Transparent farm-to-doorstep journey · Authentic farmer attribution & verified logistics
            </p>
          </div>
        </div>

        {/* Order Lookup Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchOrderId}
              onChange={(e) => setSearchOrderId(e.target.value)}
              placeholder="Enter Order ID (e.g. NK-1024)"
              className="pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600 w-48 sm:w-56 font-mono text-stone-800"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer"
          >
            Track
          </button>
          <button
            type="button"
            onClick={() => activeOrderId && fetchTracking(activeOrderId)}
            className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition cursor-pointer"
            title="Refresh Tracking"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </form>
      </div>

      {loading && (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-xs">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-stone-800">Fetching live farm logistics records...</p>
          <p className="text-xs text-stone-500 mt-1">Connecting to rural transit checkpoints & farmer warehouse</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-8 text-center bg-white rounded-2xl border border-amber-200 shadow-xs space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
          <h3 className="font-bold text-stone-900 text-base">{error}</h3>
          <p className="text-xs text-stone-600 max-w-md mx-auto">
            Please verify the order number on your invoice or purchase confirmation. You can also browse your full order history.
          </p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Return to Purchase History
            </button>
          )}
        </div>
      )}

      {!loading && !error && trackingData && (
        <div className="space-y-6">
          
          {/* Rejection / Cancellation Alert Banner if applicable */}
          {trackingData.isRejected && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-900 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-rose-900">Order Rejected by Farmer</h3>
                <p className="text-xs text-rose-700 mt-1">
                  Reason provided: <span className="font-semibold">{trackingData.rejectionReason || 'Produce temporarily unavailable due to harvest conditions.'}</span>
                </p>
                <p className="text-xs text-rose-600 mt-1">
                  Any authorized advance payments have been unlocked in escrow and will reflect back in your account within 24 hours.
                </p>
              </div>
            </div>
          )}

          {trackingData.isCancelled && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-amber-900">Order Cancelled</h3>
                <p className="text-xs text-amber-700 mt-1">
                  This order has been cancelled. Produce was returned to the farmer’s local inventory.
                </p>
              </div>
            </div>
          )}

          {/* Flipkart-Style Main Tracking Card */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            
            {/* Order Header Ribbon */}
            <div className="p-6 bg-stone-50/80 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-stone-900">
                    Order #{trackingData.orderId}
                  </span>
                  {trackingData.parentOrderId && (
                    <span className="text-[11px] text-stone-500 font-medium">
                      (Part of master #{trackingData.parentOrderId})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
                  <span>Placed on {trackingData.date}</span>
                  <span aria-hidden="true">·</span>
                  <span>{trackingData.items?.length || 1} produce items</span>
                  <span aria-hidden="true">·</span>
                  <span>Total: ₹{trackingData.total?.toLocaleString()}</span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="text-right">
                <span className="text-xs text-stone-500 block">Expected Delivery</span>
                <span className="font-bold text-sm text-emerald-800">
                  {trackingData.expectedDelivery || 'Within 2-3 Business Days'}
                </span>
              </div>
            </div>

            {/* 7-Stage Flipkart-Style Timeline Stepper */}
            <div className="p-6 sm:p-8">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-6">
                Fulfillment Journey & Delivery Progress
              </h2>

              <div className="relative pl-6 sm:pl-8 border-l-2 border-stone-200 space-y-8 ml-3">
                {trackingData.timeline?.map((step: TrackingMilestone, idx: number) => {
                  const isDone = step.completed;
                  const isCurrent = step.current;

                  return (
                    <div key={idx} className="relative group">
                      {/* Stepper Node Icon */}
                      <div className={`absolute -left-[33px] sm:-left-[41px] top-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isDone
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-50'
                          : isCurrent
                          ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                          : 'bg-stone-100 text-stone-400 border border-stone-300'
                      }`}>
                        {isDone ? (
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        ) : isCurrent ? (
                          <Truck className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-bold">{idx + 1}</span>
                        )}
                      </div>

                      {/* Step Content */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm font-bold ${
                              isDone ? 'text-stone-900' : isCurrent ? 'text-amber-900' : 'text-stone-400'
                            }`}>
                              {step.stage}
                            </h4>
                            {isCurrent && (
                              <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                                Current Stage
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-stone-400 font-medium">
                            {step.timestamp}
                          </span>
                        </div>
                        <p className={`text-xs ${isDone || isCurrent ? 'text-stone-600' : 'text-stone-400'}`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Delivery Confirmation Action for Consumer */}
              {trackingData.currentStatus === 'out_for_delivery' && !deliveryConfirmed && (
                <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950">Produce arrived at your doorstep?</h4>
                      <p className="text-xs text-emerald-700">Inspect the fresh farm produce and confirm receipt to release escrow to the farmer.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleConfirmDelivery}
                    disabled={confirmingDelivery}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-xs shrink-0 cursor-pointer"
                  >
                    {confirmingDelivery ? 'Confirming...' : 'Confirm Produce Received'}
                  </button>
                </div>
              )}

              {deliveryConfirmed && (
                <div className="mt-8 p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-xs font-semibold">
                    Delivery confirmed and closed. Produce quality inspected & grower settlement released.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Two-Column Grid: Farmer Attribution & Shipment Logistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Farmer Attribution Card */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-700" />
                  <span>Assigned Grower Farmer</span>
                </h3>
                {trackingData.farmer?.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>RTC Verified Farmer</span>
                  </span>
                )}
              </div>

              <div>
                <h4 className="font-extrabold text-stone-900 text-base">
                  {trackingData.farmer?.name || 'Manish S.B. (Raitha Bandhu)'}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-stone-600 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>{trackingData.farmer?.location || 'Navalgund, Dharwad, Karnataka'}</span>
                </div>
                {trackingData.farmer?.acres && (
                  <p className="text-xs text-stone-500 mt-0.5 pl-5">
                    Landholding: {trackingData.farmer.acres} Acres (Organic Farmgate)
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-stone-500">Direct Farmer Contact</span>
                <a
                  href={`tel:${trackingData.farmer?.phone || '9876543210'}`}
                  className="inline-flex items-center gap-1 text-emerald-800 font-bold hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{trackingData.farmer?.phone || '+91 98765 43210'}</span>
                </a>
              </div>
            </div>

            {/* Shipment Logistics & Delivery Partner */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-700" />
                  <span>Logistics & Courier Details</span>
                </h3>
                <span className="text-[11px] font-mono text-stone-500">
                  {trackingData.shipment?.trackingId || `TRK-KA-${trackingData.orderId}`}
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-stone-900 text-base">
                  {trackingData.shipment?.carrierName || 'NammaKrushi Rural Cold-Chain Logistics'}
                </h4>
                <div className="flex items-center gap-3 text-xs text-stone-600 mt-1">
                  <span>Vehicle: <strong className="text-stone-800">{trackingData.shipment?.vehicleNumber || 'KA-25-EA-8842'}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>Driver: <strong className="text-stone-800">{trackingData.shipment?.driverName || 'Manjunath K.'}</strong></span>
                </div>
              </div>

              {trackingData.shipment?.currentLocationNote && (
                <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/60 text-xs text-stone-700">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                    Latest Transit Note
                  </span>
                  <span>{trackingData.shipment.currentLocationNote}</span>
                </div>
              )}

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-stone-500">Driver Contact</span>
                <a
                  href={`tel:${trackingData.shipment?.driverPhone || '9448123988'}`}
                  className="inline-flex items-center gap-1 text-emerald-800 font-bold hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{trackingData.shipment?.driverPhone || '+91 94481 23988'}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Ordered Products Breakdown */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Produce Consignment Items
            </h3>

            <div className="divide-y divide-stone-100">
              {trackingData.items?.map((it: any, i: number) => {
                const prod = it.product || it;
                const qty = it.quantity || 1;
                const price = prod.price || it.price || 0;

                return (
                  <div key={i} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.title}
                          className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 shrink-0">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-stone-900">{prod.title || 'Organic Farm Produce'}</h4>
                        <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                          <span>{qty} {prod.unit || 'kg'}</span>
                          <span aria-hidden="true">·</span>
                          <span>₹{price} / {prod.unit || 'kg'}</span>
                          {prod.qualityGrade && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{prod.qualityGrade}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-stone-900">
                        ₹{(price * qty).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Math summary */}
            <div className="pt-4 border-t border-stone-100 space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Produce Subtotal</span>
                <span>₹{(trackingData.total - (trackingData.deliveryCharge || 0)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Cold-Chain Direct Farm Delivery</span>
                <span>{trackingData.deliveryCharge > 0 ? `₹${trackingData.deliveryCharge}` : 'Free Farmgate Delivery'}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-stone-900 pt-2 border-t border-stone-100">
                <span>Total Amount Paid ({trackingData.paymentMode?.toUpperCase() || 'COD'})</span>
                <span className="text-emerald-800">₹{trackingData.total?.toLocaleString()}</span>
              </div>
              <div className="pt-2 text-[11px] text-stone-500">
                <span>Delivered to: </span>
                <span className="font-semibold text-stone-700">{trackingData.deliveryAddress}</span>
              </div>
            </div>
          </div>

          {/* Timestamped Fulfillment History Trail */}
          {trackingData.statusHistory && trackingData.statusHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Audit Trail & Status History Log
              </h3>
              <div className="divide-y divide-stone-100 text-xs">
                {trackingData.statusHistory.map((log: OrderStatusHistoryItem, i: number) => (
                  <div key={i} className="py-2.5 flex items-start justify-between gap-4">
                    <div>
                      <span className="font-semibold text-stone-800 capitalize">
                        {log.status.replace(/_/g, ' ')}
                      </span>
                      <p className="text-stone-500 mt-0.5">{log.note}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-stone-400 block text-[11px]">{log.created_at}</span>
                      <span className="text-stone-500 text-[10px]">by {log.updated_by}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Orders / Multi-Farmer Split Orders If Present */}
          {trackingData.childOrders && trackingData.childOrders.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  🌱 Multi-Farmer Fulfilment Packages ({trackingData.childOrders.length} Farms)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  This order was split across multiple grower farms to ensure farmgate freshness. Track each parcel independently below:
                </p>
              </div>

              <div className="space-y-3">
                {trackingData.childOrders.map((child: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-stone-900">Package #{child.orderId}</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                          {child.status}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1">
                        Grower: <strong>{child.farmer_name || 'Verified Farmer'}</strong> ({child.farmer_district || 'Karnataka'})
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Subtotal: ₹{child.total?.toLocaleString()} · Carrier: {child.carrier_name || 'Agri Express'}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSearchOrderId(child.orderId);
                        setActiveOrderId(child.orderId);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-700 bg-white border border-stone-300 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-stone-100 transition cursor-pointer"
                    >
                      <span>Track This Package</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-200">
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                ← Back to Order History
              </button>
            )}
            {onNavigateMarketplace && (
              <button
                onClick={onNavigateMarketplace}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Shop More Farm Produce</span>
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
