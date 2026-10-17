import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  CheckCircle2, 
  MapPin, 
  Plus, 
  CreditCard, 
  QrCode, 
  ArrowRight, 
  Check, 
  Store,
  Tag,
  Truck,
  Phone,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Info,
  Star,
  X,
  MessageSquare,
  UserCheck
} from 'lucide-react';
import { MarketplaceProduct, CartItem, UserRole } from '../types';

interface MarketplaceProps {
  products: MarketplaceProduct[];
  cart: CartItem[];
  onAddToCart: (product: MarketplaceProduct, quantity?: number) => void;
  onOpenCart: () => void;
  onAddProduct: (newProd: MarketplaceProduct) => void;
  onSimulateOrder: (items: CartItem[], total: number) => void;
  userRole?: UserRole;
  onNavigateConsumerOrders?: () => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({
  products,
  cart,
  onAddToCart,
  onOpenCart,
  onAddProduct,
  userRole = 'farmer',
  onNavigateConsumerOrders
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showSellModal, setShowSellModal] = useState(false);
  const [viewingReviewsProduct, setViewingReviewsProduct] = useState<MarketplaceProduct | null>(null);

  // Selected kg quantities per product for direct purchasing
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

  const getSelectedKg = (productId: string) => selectedQuantities[productId] || 1;

  const handleSetKg = (productId: string, kg: number) => {
    const cleanKg = Math.max(1, Math.min(2000, Math.round(kg) || 1));
    setSelectedQuantities(prev => ({ ...prev, [productId]: cleanKg }));
  };

  // Form for selling
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MarketplaceProduct['category']>('Vegetables');
  const [price, setPrice] = useState<number>(45);
  const [unit, setUnit] = useState('kg');
  const [stock, setStock] = useState<number>(100);
  const [location, setLocation] = useState('Varur, Dharwad');
  const [desc, setDesc] = useState('');
  const [grade, setGrade] = useState<MarketplaceProduct['qualityGrade']>('Grade A');

  const categories = userRole === 'consumer' 
    ? ['All Produce', 'Vegetables', 'Grains & Cereals', 'Pulses'] 
    : ['All', 'Vegetables', 'Grains & Cereals', 'Pulses', 'Fertilizers', 'Farm Implements'];

  const filteredProducts = products.filter(p => {
    // If consumer is logged in, strictly show ONLY products produced by farmers directly!
    if (userRole === 'consumer') {
      if (p.isFarmerProduce === false || p.category === 'Fertilizers' || p.category === 'Farm Implements') {
        return false;
      }
    }
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.farmerLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.farmerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = (selectedCategory === 'All' || selectedCategory === 'All Produce') || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleSellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newProd: MarketplaceProduct = {
      id: `prod-${Date.now()}`,
      title: title.trim(),
      category,
      price: Number(price),
      unit,
      availableStock: Number(stock),
      farmerName: 'Manish S.B. (Verified Farmer)',
      farmerLocation: location.trim(),
      isVerified: true,
      imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
      description: desc.trim() || 'Direct from farm, harvest grade inspection approved.',
      qualityGrade: grade,
      rating: 5.0,
      reviewCount: 1,
      isFarmerProduce: true,
      harvestDate: 'Fresh harvest lot',
      reviews: [
        {
          id: `rev-init-${Date.now()}`,
          consumerName: 'Verified Direct Buyer',
          rating: 5,
          comment: 'New harvest lot. Direct farm gate inspection verified.',
          date: 'Just now',
          verifiedDelivery: true
        }
      ]
    };

    onAddProduct(newProd);
    setTitle('');
    setDesc('');
    setShowSellModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Consumer Portal Notice (when role === consumer) */}
      {userRole === 'consumer' ? (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-green-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-700/80 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-bold text-emerald-200 mb-2">
              <UserCheck className="w-4 h-4 text-emerald-300" />
              <span>Consumer Portal • 100% Direct from Farmers</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-1">
              Buy Farm Produce Directly from Growers
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl mt-1 leading-relaxed">
              Every crop, spice, and grain listed below is produced and shipped directly by verified Karnataka farmers with zero APMC middleman markups.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {onNavigateConsumerOrders && (
              <button
                onClick={onNavigateConsumerOrders}
                className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-md"
              >
                <Star className="w-4 h-4 fill-stone-950 text-stone-950" />
                <span>My Orders & Farmer Ratings</span>
              </button>
            )}
            <button
              onClick={onOpenCart}
              className="flex items-center gap-2 bg-white text-emerald-950 hover:bg-emerald-50 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-md"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-700" />
              <span>Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
            </button>
          </div>
        </div>
      ) : (
        /* Farmer General Banner */
        <div className="bg-gradient-to-r from-emerald-900 to-green-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-700/80 text-emerald-200 border border-emerald-500/30">
              🌾 Raitha Santhe / Direct Farm Produce Marketplace
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-2">
              Direct Farm Produce & Supply Marketplace
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mt-1 leading-relaxed">
              Eliminating middlemen: Sell freshly harvested crops directly to consumers, mills, and buyers with automated star ratings and escrow payments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSellModal(true)}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>List My Produce</span>
            </button>
          </div>
        </div>
      )}

      {/* How Consumers Buy Direct From Farmers Guide */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <ShoppingBag className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-stone-900 text-sm">
              How Consumers & Retail Buyers Buy Direct from Farmers
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Zero APMC Middleman
            </span>
          </div>
          <span className="text-xs text-stone-400 hidden sm:inline">
            Direct Farm-to-Consumer (F2C)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-stone-900">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">1</span>
              <span>Browse Local Produce</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Explore freshly harvested crops, organic pulses, and spices directly from verified growers in Karnataka.
            </p>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-stone-900">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">2</span>
              <span>Transparent Pricing</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Wholesale & retail rates set by the farmer. 100% of sales funds go directly into the farmer's account.
            </p>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-stone-900">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">3</span>
              <span>Choose Delivery Mode</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Select <strong>🚚 Doorstep Truck Logistics</strong> or choose <strong>📍 Farmgate Pickup</strong> at the grower's field.
            </p>
          </div>

          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-stone-900">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">4</span>
              <span>Instant Pay & Rate Farmer</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Pay via <strong>UPI QR (GPay/PhonePe)</strong> or Mandi COD. Rate the farmer with 1-5 stars after delivery!
            </p>
          </div>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search produce, farmer, or mandi..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map(prod => (
          <div
            key={prod.id}
            className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              {/* Product Image */}
              <div className="relative h-44 bg-stone-100 overflow-hidden">
                <img
                  src={prod.imageUrl}
                  alt={prod.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-xs text-white">
                    {prod.category}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600/90 backdrop-blur-xs text-white">
                    {prod.qualityGrade}
                  </span>
                  {prod.harvestDate && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-600/90 backdrop-blur-xs text-white shadow-xs">
                      {prod.harvestDate}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-2.5">
                <h3 className="font-bold text-stone-900 text-base leading-snug">
                  {prod.title}
                </h3>

                {/* Star Rating & Review Count */}
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{prod.rating ? prod.rating.toFixed(1) : '4.8'}</span>
                  </div>
                  <button 
                    onClick={() => setViewingReviewsProduct(prod)}
                    className="text-stone-400 hover:text-emerald-700 underline text-[11px] transition cursor-pointer"
                  >
                    ({prod.reviewCount || prod.reviews?.length || 0} reviews)
                  </button>
                  <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold ml-auto">
                    Direct Farm Produce
                  </span>
                </div>
                
                <p className="text-xs text-stone-600 line-clamp-2">
                  {prod.description}
                </p>

                {/* Farmer Details */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-stone-800">{prod.farmerName}</span>
                    {prod.isVerified && (
                      <span title="Verified Farmer Badge">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-[11px]">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    {prod.farmerLocation}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Pricing & kg Quantity Selector */}
            <div className="p-4 bg-stone-50 border-t border-stone-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
                    <span>Price per {prod.unit}</span>
                    {prod.unit === 'kg' && (
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.5 rounded">
                        Direct Farm Gate
                      </span>
                    )}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-black text-stone-900">
                      ₹{prod.price.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-stone-500">
                      / {prod.unit}
                    </span>
                  </div>
                </div>

                {/* Live calculated subtotal */}
                <div className="text-right">
                  <span className="text-[10px] text-stone-400 block font-medium">Order Total</span>
                  <span className="text-sm font-extrabold text-emerald-800">
                    ₹{(prod.price * getSelectedKg(prod.id)).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-stone-500 block">
                    for {getSelectedKg(prod.id)} {prod.unit}
                  </span>
                </div>
              </div>

              {/* kg Quantity selector & quick chips (especially relevant when buying by the kg) */}
              {prod.unit === 'kg' && (
                <div className="space-y-1.5 pt-2 border-t border-stone-200/70">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider">
                      Select Quantity (kg):
                    </span>
                    <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleSetKg(prod.id, getSelectedKg(prod.id) - 1)}
                        disabled={getSelectedKg(prod.id) <= 1}
                        className="px-2 py-0.5 text-stone-600 hover:bg-stone-100 disabled:opacity-30 cursor-pointer font-bold"
                        title="Decrease 1 kg"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={prod.availableStock || 2000}
                        value={getSelectedKg(prod.id)}
                        onChange={(e) => handleSetKg(prod.id, Number(e.target.value))}
                        className="w-12 text-center text-xs font-black text-stone-900 focus:outline-hidden py-0.5 bg-transparent"
                      />
                      <span className="text-[11px] font-bold text-stone-400 pr-1.5">kg</span>
                      <button
                        type="button"
                        onClick={() => handleSetKg(prod.id, getSelectedKg(prod.id) + 1)}
                        className="px-2 py-0.5 text-stone-600 hover:bg-stone-100 cursor-pointer font-bold"
                        title="Increase 1 kg"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Quick kg chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[1, 2, 5, 10, 25].map(kgAmt => (
                      <button
                        key={kgAmt}
                        type="button"
                        onClick={() => handleSetKg(prod.id, kgAmt)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition cursor-pointer ${
                          getSelectedKg(prod.id) === kgAmt
                            ? 'bg-emerald-700 text-white shadow-2xs'
                            : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        {kgAmt} kg
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onAddToCart(prod, getSelectedKg(prod.id))}
                  className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-stone-200"
                  title="Add selected kg quantity to shopping cart"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-stone-600" />
                  <span>Add {getSelectedKg(prod.id)} {prod.unit}</span>
                </button>

                <button
                  onClick={() => {
                    onAddToCart(prod, getSelectedKg(prod.id));
                    onOpenCart();
                  }}
                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Buy {getSelectedKg(prod.id)} {prod.unit}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product Reviews & Farmer Trust Modal */}
      {viewingReviewsProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-stone-900 text-base">
                  Farmer Reviews & Ratings
                </h3>
                <p className="text-xs text-stone-500">
                  {viewingReviewsProduct.title} • by {viewingReviewsProduct.farmerName}
                </p>
              </div>
              <button
                onClick={() => setViewingReviewsProduct(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overall Rating Score Card */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-emerald-900">
                  {viewingReviewsProduct.rating ? viewingReviewsProduct.rating.toFixed(1) : '4.8'}
                </span>
                <div>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= Math.round(viewingReviewsProduct.rating || 5)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-stone-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-stone-500 font-medium">
                    Based on {viewingReviewsProduct.reviewCount || viewingReviewsProduct.reviews?.length || 0} direct buyer reviews
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900">
                100% Verified
              </span>
            </div>

            {/* Reviews List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {(viewingReviewsProduct.reviews || []).map((rev) => (
                <div
                  key={rev.id}
                  className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900">{rev.consumerName}</span>
                    <span className="text-[11px] text-stone-400">{rev.date}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                        }`}
                      />
                    ))}
                    {rev.verifiedDelivery && (
                      <span className="ml-2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                        ✓ Verified Farm Delivery
                      </span>
                    )}
                  </div>
                  <p className="text-stone-700 leading-relaxed text-xs">
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                onAddToCart(viewingReviewsProduct);
                setViewingReviewsProduct(null);
                onOpenCart();
              }}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <span>Buy From This Farmer (₹{viewingReviewsProduct.price.toLocaleString()} / {viewingReviewsProduct.unit})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* List Product Modal (Farmer only) */}
      {showSellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="text-lg font-bold text-stone-900 mb-1">List Produce on Marketplace</h3>
            <p className="text-xs text-stone-500 mb-4">
              Sell directly to buyers with verified farmer status and instant order notification.
            </p>

            <form onSubmit={handleSellSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Organic Byadgi Chilli / Hybrid Maize Grain"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600 bg-white"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Quality Grade</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600 bg-white"
                  >
                    <option value="Grade A (Organic)">Grade A (Organic)</option>
                    <option value="Grade A">Grade A</option>
                    <option value="Grade B">Grade B</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Price per {unit} (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Pricing Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600 bg-white font-medium"
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="Quintal">Quintal (100 kg)</option>
                    <option value="Bag (50kg)">Bag (50kg)</option>
                    <option value="Tonne">Tonne (1000 kg)</option>
                    <option value="Unit">Unit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Stock ({unit})</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Farm Location</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Harvest Description</label>
                <textarea
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Describe crop variety, moisture content, organic practices..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSellModal(false)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
