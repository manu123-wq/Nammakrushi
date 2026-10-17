import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Star, 
  CheckCircle2, 
  Truck, 
  MapPin, 
  MessageSquare, 
  Calendar, 
  ArrowRight,
  ShieldCheck, 
  User, 
  Phone, 
  Sparkles, 
  Clock, 
  RefreshCw, 
  Search, 
  Filter, 
  Receipt, 
  ExternalLink,
  ChevronRight,
  X,
  AlertCircle,
  Package,
  Heart,
  Navigation,
  QrCode
} from 'lucide-react';
import { ConsumerOrder, MarketplaceProduct, CartItem, OrderStatus, TrackingMilestone, FarmTraceability } from '../types';
import { playNotificationChime } from '../utils/audio';
import { FarmToTableQRModal } from './FarmToTableQRModal';
import { getTraceabilityForProduct } from '../utils/traceabilityData';

interface PurchaseHistoryProps {
  orders: ConsumerOrder[];
  products: MarketplaceProduct[];
  onReorderProduct: (product: MarketplaceProduct, quantity?: number) => void;
  onReorderBasket: (items: CartItem[]) => void;
  onAddReview: (productId: string, rating: number, comment: string, orderId: string) => void;
  onUpdateOrderStatus?: (orderId: string, nextStatus: OrderStatus) => void;
  onNavigateMarketplace: () => void;
}

export const PurchaseHistory: React.FC<PurchaseHistoryProps> = ({
  orders,
  products,
  onReorderProduct,
  onReorderBasket,
  onAddReview,
  onUpdateOrderStatus,
  onNavigateMarketplace
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'transit' | 'delivered' | 'favorites'>('all');
  
  // Tracking Modal State
  const [trackingOrder, setTrackingOrder] = useState<ConsumerOrder | null>(null);

  // Digital Invoice Modal State
  const [invoiceOrder, setInvoiceOrder] = useState<ConsumerOrder | null>(null);

  // Farm-to-Table QR Modal State
  const [qrTraceabilityModal, setQrTraceabilityModal] = useState<{
    traceability: FarmTraceability;
    product?: MarketplaceProduct;
    order?: ConsumerOrder;
  } | null>(null);

  const handleOpenTraceability = async (product: MarketplaceProduct, order?: ConsumerOrder) => {
    let trace = getTraceabilityForProduct(product.id, product);
    try {
      const res = await fetch(`/api/traceability/${product.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.traceability) {
          trace = data.traceability;
        }
      }
    } catch (e) {
      console.warn('Traceability SQLite fetch note:', e);
    }

    setQrTraceabilityModal({
      traceability: trace,
      product,
      order
    });
    playNotificationChime();
  };

  // Star Rating Modal State
  const [ratingOrder, setRatingOrder] = useState<ConsumerOrder | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [stars, setStars] = useState<number>(5);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  // Quick reorder toast feedback
  const [reorderToast, setReorderToast] = useState<string | null>(null);

  const starLabels: Record<number, string> = {
    1: '1 Star - Poor quality or delay',
    2: '2 Stars - Fair produce quality',
    3: '3 Stars - Good farm produce',
    4: '4 Stars - Very good & fresh',
    5: '5 Stars - Exceptional farm quality & fast delivery!'
  };

  // Collect unique favorite products previously purchased
  const favoriteItems: { product: MarketplaceProduct; orderCount: number; lastOrdered: string }[] = [];
  orders.forEach(order => {
    order.items.forEach(item => {
      const match = products.find(p => p.id === item.product.id) || item.product;
      const existing = favoriteItems.find(f => f.product.id === match.id);
      if (existing) {
        existing.orderCount += 1;
      } else {
        favoriteItems.push({
          product: match,
          orderCount: 1,
          lastOrdered: order.date
        });
      }
    });
  });

  // Filtered orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some(i => i.product.title.toLowerCase().includes(searchTerm.toLowerCase()) || i.product.farmerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'transit') {
      return order.status !== 'Delivered';
    }
    if (filterTab === 'delivered') {
      return order.status === 'Delivered';
    }
    if (filterTab === 'favorites') {
      return order.isFavorite;
    }
    return true;
  });

  const handle1ClickReorderProduct = (product: MarketplaceProduct, quantity = 1) => {
    onReorderProduct(product, quantity);
    playNotificationChime();
    setReorderToast(`1-Click Reorder: Added ${quantity} ${product.unit} of "${product.title}" to cart & opened checkout!`);
    setTimeout(() => setReorderToast(null), 3500);
  };

  const handle1ClickReorderBasket = (order: ConsumerOrder) => {
    onReorderBasket(order.items);
    playNotificationChime();
    setReorderToast(`1-Click Reorder: Re-added all ${order.items.length} farm items from Order #${order.orderId} to cart!`);
    setTimeout(() => setReorderToast(null), 3500);
  };

  const handleOpenRateModal = (order: ConsumerOrder, defaultProductId?: string) => {
    setRatingOrder(order);
    setSelectedProductId(defaultProductId || order.items[0]?.product.id || '');
    setStars(5);
    setComment('');
    setSubmittedMessage(null);
  };

  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingOrder || !selectedProductId) return;

    onAddReview(
      selectedProductId, 
      stars, 
      comment.trim() || 'Direct from farm, produce was fresh and packed cleanly. Highly satisfied with grower!', 
      ratingOrder.orderId
    );
    playNotificationChime();
    setSubmittedMessage('Thank you! Your star rating and feedback have been published directly to the farmer profile.');
    
    setTimeout(() => {
      setRatingOrder(null);
      setSubmittedMessage(null);
    }, 1800);
  };

  // Simulate advancing the tracking status
  const handleAdvanceTracking = (order: ConsumerOrder) => {
    if (!onUpdateOrderStatus) return;
    const stages: OrderStatus[] = ['Confirmed', 'Harvested & Packed', 'Dispatched', 'Out for Delivery', 'Delivered'];
    const currentIndex = stages.indexOf(order.status);
    if (currentIndex >= 0 && currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1];
      onUpdateOrderStatus(order.orderId, nextStage);
      playNotificationChime();
      
      // Update local modal if open
      setTrackingOrder(prev => prev && prev.orderId === order.orderId ? { ...prev, status: nextStage } : prev);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Toast Notification */}
      {reorderToast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-emerald-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-400/40 text-xs sm:text-sm font-bold flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
          <span>{reorderToast}</span>
        </div>
      )}

      {/* Hero Banner: Purchase History & 1-Click Reorders */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-green-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-800/80 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-bold text-emerald-200 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Direct Farm-to-Consumer Purchase Vault</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Consumer Purchase History & 1-Click Reorders
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl mt-1 leading-relaxed">
            Reorder your favorite farm produce with 1-click, track live harvest shipments, view verified payment gateway receipts, and rate Karnataka growers directly.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateMarketplace}
            className="bg-white text-emerald-950 hover:bg-emerald-50 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shadow-md"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-700" />
            <span>Browse Fresh Crops</span>
          </button>
        </div>
      </div>

      {/* 1-Click "Favorite Farm-Fresh Produce" Reorder Shelf */}
      {favoriteItems.length > 0 && (
        <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-100 text-amber-800">
                <Heart className="w-4 h-4 fill-amber-500 text-amber-600" />
              </span>
              <div>
                <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                  Reorder Favorite Farm-Fresh Produce (1-Click)
                </h3>
                <p className="text-[11px] text-stone-500">
                  Quickly repurchase seasonal crops directly from growers you trust
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              ⚡ Instant 1-Click Add
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {favoriteItems.slice(0, 4).map(({ product, lastOrdered }, idx) => (
              <div 
                key={`fav-${product.id}-${idx}`}
                className="p-3.5 bg-stone-50 hover:bg-emerald-50/50 rounded-2xl border border-stone-200 hover:border-emerald-300 transition flex flex-col justify-between space-y-3"
              >
                <div className="flex gap-3">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 inline-block mb-1">
                      {product.qualityGrade}
                    </span>
                    <h4 className="font-bold text-xs text-stone-900 truncate">
                      {product.title}
                    </h4>
                    <p className="text-[10px] text-stone-500 truncate">
                      Grower: <strong>{product.farmerName}</strong>
                    </p>
                    <div className="text-xs font-black text-emerald-900 mt-1">
                      ₹{product.price.toLocaleString()} <span className="text-[10px] text-stone-400 font-normal">/ {product.unit}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-200/60">
                  <span className="text-[10px] text-stone-400">
                    Last: {lastOrdered}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenTraceability(product)}
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 transition cursor-pointer"
                      title="Scan Farm-to-Table QR Passport"
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                    </button>
                    <button
                      onClick={() => handle1ClickReorderProduct(product, 1)}
                      className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                      title="1-Click Reorder this produce"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reorder 1-Click</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Order #, crop name, or grower..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600 shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          {[
            { id: 'all', label: `All Orders (${orders.length})` },
            { id: 'transit', label: `🚚 In Transit (${orders.filter(o => o.status !== 'Delivered').length})` },
            { id: 'delivered', label: `✅ Delivered (${orders.filter(o => o.status === 'Delivered').length})` },
            { id: 'favorites', label: `⭐ Favorites` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">No purchase records found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                {searchTerm 
                  ? 'No orders match your search keyword. Try searching for crop names like Jowar or Chilli.'
                  : 'You have not placed any direct farm orders yet.'}
              </p>
            </div>
            <button
              onClick={onNavigateMarketplace}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
            >
              Explore Farm Marketplace
            </button>
          </div>
        ) : (
          filteredOrders.map(order => {
            const isDelivered = order.status === 'Delivered';
            const firstItem = order.items[0]?.product;

            return (
              <div
                key={order.orderId}
                className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs hover:border-emerald-300 transition space-y-4"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-base font-extrabold text-stone-900">
                      Order #{order.orderId}
                    </span>
                    <span className="text-xs text-stone-400">
                      • {order.date}
                    </span>
                    {order.transactionId && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                        {order.transactionId}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                      isDelivered 
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                        : 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                    }`}>
                      <Truck className="w-3.5 h-3.5" />
                      <span>{order.status}</span>
                    </span>

                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700">
                      {order.deliveryMode === 'doorstep' ? '🚚 Doorstep Delivery' : '📍 Farmgate Pickup'}
                    </span>
                  </div>
                </div>

                {/* Items in this Order */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {order.items.map((item, idx) => (
                    <div
                      key={`order-${order.orderId}-${item.product.id}-${idx}`}
                      className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200"
                    >
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.title}
                        className="w-14 h-14 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-stone-900 truncate">
                          {item.product.title}
                        </h4>
                        <p className="text-[11px] text-stone-500 truncate">
                          Farmer: <strong>{item.product.farmerName}</strong>
                        </p>
                        <div className="flex items-center justify-between mt-1 text-xs">
                          <span className="text-stone-600 font-medium">
                            {item.quantity} {item.product.unit} <span className="text-stone-400 font-normal">(@ ₹{item.product.price}/{item.product.unit})</span>
                          </span>
                          <span className="font-bold text-emerald-800">
                            ₹{(item.product.price * item.quantity).toLocaleString()}
                          </span>
                        </div>

                        {/* Farm-to-Table QR Passport Button for this Produce */}
                        <button
                          type="button"
                          onClick={() => handleOpenTraceability(item.product, order)}
                          className="mt-2.5 w-full py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/90 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Generate virtual QR code showing harvest date, farm location and transport logs"
                        >
                          <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Farm-to-Table QR</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Footer & Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
                  <div className="text-xs text-stone-600">
                    <span>Total Paid: </span>
                    <strong className="text-sm font-black text-stone-900">
                      ₹{order.total.toLocaleString()}
                    </strong>
                    <span className="text-stone-400 ml-2">via {order.paymentMode}</span>
                  </div>

                  {/* Actions: Reorder Basket, Farm-to-Table QR, Track Order, Rate Farmer, Invoice */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* FARM-TO-TABLE QR BUTTON */}
                    {order.items[0]?.product && (
                      <button
                        onClick={() => handleOpenTraceability(order.items[0].product, order)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
                        title="Generate Farm-to-Table QR code for harvest & transport transparency"
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Farm QR</span>
                      </button>
                    )}

                    {/* 1-CLICK REORDER ENTIRE BASKET BUTTON */}
                    <button
                      onClick={() => handle1ClickReorderBasket(order)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                      title="Reorder all products from this order with 1 click"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reorder Basket (1-Click)</span>
                    </button>

                    {/* LIVE TRACK ORDER BUTTON */}
                    <button
                      onClick={() => setTrackingOrder(order)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-emerald-50 text-stone-800 hover:text-emerald-900 border border-stone-200 hover:border-emerald-300 rounded-xl text-xs font-bold transition cursor-pointer"
                      title="Track live shipment progress & delivery milestones"
                    >
                      <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Track Order</span>
                    </button>

                    {/* DIGITAL INVOICE BUTTON */}
                    <button
                      onClick={() => setInvoiceOrder(order)}
                      className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl border border-stone-200 transition cursor-pointer"
                      title="View Digital Invoice & Gateway Receipt"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>

                    {/* STAR RATING / REVIEW BUTTON */}
                    {order.rated ? (
                      <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>Rated {order.rating || 5}/5</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenRateModal(order, firstItem?.id)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        title="Rate grower and produce quality"
                      >
                        <Star className="w-3.5 h-3.5 fill-white text-white" />
                        <span>Rate Farmer</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 1. INTERACTIVE LIVE ORDER TRACKING MODAL */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-700" />
                  <h3 className="font-extrabold text-stone-900 text-base">
                    Live Farm-to-Doorstep Tracking
                  </h3>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Order <strong>#{trackingOrder.orderId}</strong> • {trackingOrder.items.length} Farm Items
                </p>
              </div>
              <button
                onClick={() => setTrackingOrder(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Status Highlight Card */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Current Shipment Status
                </span>
                <span className="text-lg font-black text-stone-900">
                  {trackingOrder.status}
                </span>
                <p className="text-xs text-stone-600 mt-0.5">
                  Estimated Delivery: <strong>{trackingOrder.estimatedDelivery || 'Today by 5:00 PM'}</strong>
                </p>
              </div>

              {/* Transit simulation button */}
              {trackingOrder.status !== 'Delivered' && onUpdateOrderStatus && (
                <button
                  onClick={() => handleAdvanceTracking(trackingOrder)}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Simulate Next Transit Step</span>
                </button>
              )}
            </div>

            {/* Logistics Vehicle & Driver Info */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Logistics Driver</span>
                <span className="font-bold text-stone-900 block">{trackingOrder.driverName || 'Manjunath Kariyappa'}</span>
                <a 
                  href={`tel:${trackingOrder.driverPhone || '9448123988'}`}
                  className="text-emerald-700 hover:underline flex items-center gap-1 text-[11px] font-semibold mt-0.5"
                >
                  <Phone className="w-3 h-3" />
                  <span>+91 {trackingOrder.driverPhone || '9448123988'}</span>
                </a>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Vehicle Number</span>
                <span className="font-bold text-stone-900 block font-mono">{trackingOrder.vehicleNumber || 'KA-25-EA-8842'}</span>
                <span className="text-stone-500 text-[11px] block mt-0.5">Refrigerated Produce Transport</span>
              </div>
            </div>

            {/* Tracking Milestones Timeline */}
            <div className="space-y-4 pt-1">
              <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                Transit Milestones & Proof of Origin
              </h4>
              
              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
                {(trackingOrder.trackingMilestones || [
                  { stage: 'Confirmed', title: 'Payment Confirmed', description: 'Transaction verified via gateway.', timestamp: '09:15 AM', completed: true },
                  { stage: 'Harvested & Packed', title: 'Harvested at Farm', description: 'Freshly packed at grower plot.', timestamp: '10:45 AM', completed: true },
                  { stage: 'Dispatched', title: 'Agri-Truck Transit', description: 'En route to city distribution hub.', timestamp: '12:30 PM', completed: trackingOrder.status !== 'Confirmed', current: trackingOrder.status === 'Dispatched' },
                  { stage: 'Out for Delivery', title: 'Out for Doorstep Delivery', description: 'Local Indiranagar delivery route.', timestamp: '03:45 PM', completed: trackingOrder.status === 'Out for Delivery' || trackingOrder.status === 'Delivered', current: trackingOrder.status === 'Out for Delivery' },
                  { stage: 'Delivered', title: 'Delivered to Doorstep', description: 'Received directly by buyer.', timestamp: '04:45 PM', completed: trackingOrder.status === 'Delivered', current: trackingOrder.status === 'Delivered' },
                ]).map((milestone, idx) => {
                  const isDone = milestone.completed || trackingOrder.status === 'Delivered';
                  return (
                    <div key={idx} className="relative">
                      <span className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isDone 
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-50' 
                          : 'bg-stone-200 text-stone-500'
                      }`}>
                        {isDone ? '✓' : idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center justify-between">
                          <h5 className={`text-xs font-bold ${isDone ? 'text-stone-900' : 'text-stone-500'}`}>
                            {milestone.title}
                          </h5>
                          <span className="text-[11px] text-stone-400 font-medium">
                            {milestone.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                          {milestone.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Destination */}
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-start gap-2 text-xs text-stone-600">
              <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-stone-900 block">Delivery Address:</span>
                <span>{trackingOrder.deliveryAddress}</span>
              </div>
            </div>

            <button
              onClick={() => setTrackingOrder(null)}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Close Live Tracker
            </button>
          </div>
        </div>
      )}

      {/* 2. DIGITAL INVOICE & GATEWAY RECEIPT MODAL */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="font-extrabold text-stone-900 text-base">
                  Direct Farmgate Purchase Receipt
                </h3>
                <p className="text-xs text-stone-500">
                  Tax Invoice & APMC Direct Farmer Gate Pass
                </p>
              </div>
              <button
                onClick={() => setInvoiceOrder(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-2.5">
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500 font-semibold">Order Number:</span>
                <span className="font-bold text-stone-900">#{invoiceOrder.orderId}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500 font-semibold">Date of Purchase:</span>
                <span className="font-bold text-stone-900">{invoiceOrder.date}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500 font-semibold">Transaction Reference:</span>
                <span className="font-mono font-bold text-emerald-800">{invoiceOrder.transactionId || 'TXN_UPI_VERIFIED'}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500 font-semibold">Payment Gateway:</span>
                <span className="font-bold text-stone-900">{invoiceOrder.paymentMode} (Status: Cleared)</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500 font-semibold">Buyer:</span>
                <span className="font-bold text-stone-900">{invoiceOrder.consumerName} (+91 {invoiceOrder.consumerPhone})</span>
              </div>
            </div>

            {/* Produce breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-stone-800 block">Harvest Line Items:</span>
              <div className="space-y-1.5 text-xs">
                {invoiceOrder.items.map((item, idx) => (
                  <div key={`inv-${invoiceOrder.orderId}-${item.product.id}-${idx}`} className="flex justify-between p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                    <div>
                      <span className="font-bold text-stone-900 block">{item.product.title}</span>
                      <span className="text-[11px] text-stone-500">Farmer: {item.product.farmerName} • {item.quantity} {item.product.unit}</span>
                    </div>
                    <span className="font-black text-stone-900">₹{(item.product.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-sm font-black text-stone-900">
              <span>Total Paid (Zero Middleman):</span>
              <span className="text-emerald-800 text-base">₹{invoiceOrder.total.toLocaleString()}</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Print / Save PDF
              </button>
              <button
                onClick={() => setInvoiceOrder(null)}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. INTERACTIVE STAR RATING MODAL */}
      {ratingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2 shadow-xs">
                <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">Rate Farmer & Delivery</h3>
              <p className="text-xs text-stone-500 mt-1">
                Order #{ratingOrder.orderId} • Direct Farm Produce Review
              </p>
            </div>

            {submittedMessage ? (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center text-xs text-emerald-950 font-medium">
                {submittedMessage}
              </div>
            ) : (
              <form onSubmit={handleSubmitRating} className="space-y-4">
                {/* Product Select */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Select Produce to Rate:
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-emerald-600 bg-white"
                  >
                    {ratingOrder.items.map((item, idx) => (
                      <option key={`rate-opt-${item.product.id}-${idx}`} value={item.product.id}>
                        {item.product.title} (Farmer: {item.product.farmerName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Star rating selection */}
                <div className="text-center py-2">
                  <div className="flex justify-center items-center gap-1.5 mb-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onMouseEnter={() => setHoverStars(s)}
                        onMouseLeave={() => setHoverStars(0)}
                        onClick={() => setStars(s)}
                        className="p-1 transition-transform hover:scale-125 cursor-pointer focus:outline-hidden"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            s <= (hoverStars || stars)
                              ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                              : 'text-stone-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-stone-700 block min-h-[18px]">
                    {starLabels[hoverStars || stars]}
                  </span>
                </div>

                {/* Review feedback input */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Community Feedback & Farmer Commendation:
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe harvest freshness, taste, moisture grade, packaging quality, and communication with the farmer..."
                    className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setRatingOrder(null)}
                    className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                  >
                    Publish Rating
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Farm-to-Table Transparency QR Passport Modal */}
      {qrTraceabilityModal && (
        <FarmToTableQRModal
          traceability={qrTraceabilityModal.traceability}
          product={qrTraceabilityModal.product}
          order={qrTraceabilityModal.order}
          onClose={() => setQrTraceabilityModal(null)}
        />
      )}
    </div>
  );
};
