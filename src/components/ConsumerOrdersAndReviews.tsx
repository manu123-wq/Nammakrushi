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
  QrCode
} from 'lucide-react';
import { ConsumerOrder, MarketplaceProduct, FarmTraceability } from '../types';
import { playNotificationChime } from '../utils/audio';
import { FarmToTableQRModal } from './FarmToTableQRModal';
import { getTraceabilityForProduct } from '../utils/traceabilityData';

interface ConsumerOrdersAndReviewsProps {
  orders: ConsumerOrder[];
  products: MarketplaceProduct[];
  onAddReview: (productId: string, rating: number, comment: string, orderId: string) => void;
  onNavigateMarketplace: () => void;
}

export const ConsumerOrdersAndReviews: React.FC<ConsumerOrdersAndReviewsProps> = ({
  orders,
  products,
  onAddReview,
  onNavigateMarketplace
}) => {
  // Modal / active rating state
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [stars, setStars] = useState<number>(5);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  // Farm-to-Table QR Modal State
  const [qrTraceabilityModal, setQrTraceabilityModal] = useState<{
    traceability: FarmTraceability;
    product?: MarketplaceProduct;
    order?: ConsumerOrder;
  } | null>(null);

  const handleOpenTraceability = (product: MarketplaceProduct, order?: ConsumerOrder) => {
    const trace = getTraceabilityForProduct(product.id, product);
    setQrTraceabilityModal({
      traceability: trace,
      product,
      order
    });
    playNotificationChime();
  };

  const starLabels: Record<number, string> = {
    1: '1 Star - Poor quality or delayed',
    2: '2 Stars - Fair produce quality',
    3: '3 Stars - Good farm produce',
    4: '4 Stars - Very good & fresh',
    5: '5 Stars - Exceptional farm quality & fast delivery!'
  };

  const handleOpenRateModal = (order: ConsumerOrder, defaultProductId?: string) => {
    setRatingOrderId(order.orderId);
    setSelectedProductId(defaultProductId || order.items[0]?.product.id || '');
    setStars(5);
    setComment('');
    setSubmittedMessage(null);
  };

  const handleSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingOrderId || !selectedProductId) return;

    onAddReview(selectedProductId, stars, comment.trim() || 'Fresh produce received directly from farm. Highly satisfied!', ratingOrderId);
    playNotificationChime();
    setSubmittedMessage('Thank you! Your star rating and feedback have been published directly to the farmer profile.');
    
    setTimeout(() => {
      setRatingOrderId(null);
      setSubmittedMessage(null);
    }, 1800);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Consumer Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-800/80 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-bold text-emerald-200 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Direct Farm-to-Consumer Trust Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            My Direct Farmer Purchases & Star Ratings
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl mt-1 leading-relaxed">
            Rate your farmers after delivery to build community trust, reward organic quality growers, and help other buyers find the best harvests across Karnataka.
          </p>
        </div>

        <button
          onClick={onNavigateMarketplace}
          className="bg-white text-emerald-950 hover:bg-emerald-50 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shadow-md"
        >
          <ShoppingBag className="w-4 h-4 text-emerald-700" />
          <span>Buy More Fresh Produce</span>
        </button>
      </div>

      {/* Orders List Container */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
            <span>Direct Farm Orders ({orders.length})</span>
          </h2>
          <span className="text-xs text-stone-500">
            Verified direct farm gate shipments
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">No orders placed yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                Browse our marketplace to purchase crops, spices, and grains produced by Karnataka farmers directly.
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
          <div className="grid grid-cols-1 gap-4">
            {orders.map((order) => {
              const firstItem = order.items[0]?.product;
              return (
                <div
                  key={order.orderId}
                  className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs hover:border-emerald-300 transition space-y-4"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3.5">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold text-stone-900">
                        Order #{order.orderId}
                      </span>
                      <span className="text-xs text-stone-400">
                        Placed on {order.date}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{order.status}</span>
                      </span>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700">
                        {order.deliveryMode === 'doorstep' ? '🚚 Doorstep Delivery' : '📍 Farmgate Pickup'}
                      </span>
                    </div>
                  </div>

                  {/* Order Items Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {order.items.map((item) => (
                      <div
                        key={item.product.id}
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
                          <p className="text-[11px] text-stone-500">
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

                          {/* Farm-to-Table QR Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenTraceability(item.product, order)}
                            className="mt-2 w-full py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/90 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Generate virtual QR code showing harvest date, farm location and transport logs"
                          >
                            <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Farm-to-Table QR</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer Bar: Total + Rating Action */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
                    <div className="text-xs text-stone-600">
                      <span>Total Paid: </span>
                      <strong className="text-sm font-black text-stone-900">
                        ₹{order.total.toLocaleString()}
                      </strong>
                      <span className="text-stone-400 ml-2">via {order.paymentMode}</span>
                    </div>

                    {/* Star Rating Button */}
                    <div>
                      {order.rated ? (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-900">
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= (order.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span>Farmer Rated ({order.rating || 5}/5)</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenRateModal(order, firstItem?.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 fill-white text-white" />
                          <span>Rate Farmer & Produce</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Star Rating Modal */}
      {ratingOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2 shadow-xs">
                <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">Rate Farmer & Delivery</h3>
              <p className="text-xs text-stone-500 mt-1">
                Order #{ratingOrderId} • Direct Farm Produce Review
              </p>
            </div>

            {submittedMessage ? (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center text-xs text-emerald-950 font-medium">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                {submittedMessage}
              </div>
            ) : (
              <form onSubmit={handleSubmitRating} className="space-y-4 text-xs">
                {/* Product Selector if multiple */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Select Produce to Rate:
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-semibold text-stone-900"
                  >
                    {orders
                      .find((o) => o.orderId === ratingOrderId)
                      ?.items.map((it) => (
                        <option key={it.product.id} value={it.product.id}>
                          {it.product.title} (by {it.product.farmerName})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Interactive 5-Star Selection */}
                <div className="text-center py-2 bg-stone-50 rounded-2xl border border-stone-200">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                    Tap to Choose Rating:
                  </span>
                  
                  <div className="flex justify-center items-center gap-2 my-2">
                    {[1, 2, 3, 4, 5].map((s) => {
                      const isActive = s <= (hoverStars || stars);
                      return (
                        <button
                          key={s}
                          type="button"
                          onMouseEnter={() => setHoverStars(s)}
                          onMouseLeave={() => setHoverStars(0)}
                          onClick={() => setStars(s)}
                          className="p-1 transition transform active:scale-90 cursor-pointer"
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${
                              isActive
                                ? 'fill-amber-400 text-amber-500'
                                : 'text-stone-300 hover:text-amber-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs font-bold text-emerald-900">
                    {starLabels[hoverStars || stars]}
                  </p>
                </div>

                {/* Feedback Comment */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Consumer Feedback & Quality Review:
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="e.g. Excellent fresh quality, clean bolls/grain, timely direct delivery, and fair price!"
                    className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600 resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRatingOrderId(null)}
                    className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition cursor-pointer shadow-md"
                  >
                    Submit Farmer Rating
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
