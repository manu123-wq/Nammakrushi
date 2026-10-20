import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  QrCode, 
  CheckCircle2, 
  ShieldCheck, 
  ShoppingBag,
  ArrowRight,
  Truck,
  MapPin,
  User,
  Phone,
  Home,
  Receipt,
  Lock,
  Smartphone,
  Building2,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Navigation
} from 'lucide-react';
import { CartItem } from '../types';
import { playNotificationChime } from '../utils/audio';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckoutComplete: (orderSummary: { 
    items: CartItem[]; 
    total: number; 
    paymentMode: string; 
    orderId?: string;
    transactionId?: string;
    consumerDetails?: any;
  }) => void;
  onNavigateTracking?: (orderId?: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckoutComplete,
  onNavigateTracking
}) => {
  const [step, setStep] = useState<'cart' | 'delivery' | 'payment'>('cart');
  const [deliveryMode, setDeliveryMode] = useState<'doorstep' | 'pickup'>('doorstep');
  
  // Consumer details
  const [consumerName, setConsumerName] = useState('Ananya Sharma');
  const [consumerPhone, setConsumerPhone] = useState('9876543210');
  const [deliveryAddress, setDeliveryAddress] = useState('#104, Green Glen Layout, Indiranagar, Bengaluru');
  const [pinCode, setPinCode] = useState('560038');

  // Payment Gateway Mode
  const [paymentMode, setPaymentMode] = useState<'upi' | 'card' | 'netbanking' | 'cod'>('upi');

  // UPI Gateway State
  const [upiSubMode, setUpiSubMode] = useState<'qr' | 'id'>('qr');
  const [upiId, setUpiId] = useState('ananya.sharma@okaxis');
  const [isUpiValid, setIsUpiValid] = useState(true);
  const [upiTimer, setUpiTimer] = useState(300); // 5 mins countdown
  const [upiCopied, setUpiCopied] = useState(false);
  const [upiAppRequestSent, setUpiAppRequestSent] = useState(false);

  // Card Gateway State
  const [cardNumber, setCardNumber] = useState('4532 8812 9043 7812');
  const [cardHolder, setCardHolder] = useState('ANANYA SHARMA');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('384');
  const [cardErrors, setCardErrors] = useState<{ number?: string; expiry?: string; cvv?: string }>({});

  // NetBanking State
  const [selectedBank, setSelectedBank] = useState('SBI');

  // 3D Secure / OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);

  const [processing, setProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any | null>(null);

  // Countdown timer for UPI QR
  useEffect(() => {
    let interval: any = null;
    if (step === 'payment' && paymentMode === 'upi' && upiTimer > 0) {
      interval = setInterval(() => {
        setUpiTimer(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, paymentMode, upiTimer]);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = deliveryMode === 'doorstep' ? (subtotal > 0 ? (subtotal >= 500 ? 0 : 40) : 0) : 0;
  const grandTotal = subtotal + deliveryFee;

  // Multi-farmer detection
  const distinctFarmers = Array.from(new Set(cart.map(i => i.product.farmerName || 'Registered Grower')));
  const isMultiFarmerCart = distinctFarmers.length > 1;

  // Luhn algorithm validator for Card Gateway
  const validateLuhn = (num: string): boolean => {
    const clean = num.replace(/\D/g, '');
    if (clean.length < 13 || clean.length > 19) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = clean.length - 1; i >= 0; i--) {
      let digit = parseInt(clean.charAt(i), 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  // Detect card brand
  const getCardBrand = (num: string) => {
    const clean = num.replace(/\D/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'MasterCard';
    if (/^(60|65|81|82|508)/.test(clean)) return 'RuPay';
    if (/^3[47]/.test(clean)) return 'Amex';
    return 'Card';
  };

  const handleCardNumberChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 16);
    const formatted = clean.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    if (clean.length > 2) {
      setCardExpiry(`${clean.slice(0, 2)}/${clean.slice(2)}`);
    } else {
      setCardExpiry(clean);
    }
  };

  const validateCardForm = () => {
    const errors: { number?: string; expiry?: string; cvv?: string } = {};
    const cleanNum = cardNumber.replace(/\D/g, '');
    
    if (cleanNum.length !== 16 || !validateLuhn(cleanNum)) {
      errors.number = 'Please enter a valid 16-digit card number.';
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) {
      errors.expiry = 'Use MM/YY format.';
    } else {
      const [m, y] = cardExpiry.split('/').map(Number);
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      if (y < currentYear || (y === currentYear && m < currentMonth)) {
        errors.expiry = 'Card has expired.';
      }
    }

    if (!/^\d{3,4}$/.test(cardCvv)) {
      errors.cvv = '3 digits.';
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedPayment = () => {
    if (cart.length === 0) return;

    if (paymentMode === 'card') {
      if (!validateCardForm()) return;
      // Trigger 3D Secure OTP verification
      setShowOtpModal(true);
      return;
    }

    if (paymentMode === 'upi' && upiSubMode === 'id') {
      const isValid = /^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,49}$/.test(upiId.trim());
      setIsUpiValid(isValid);
      if (!isValid) return;
    }

    executeFinalPayment();
  };

  const executeFinalPayment = async () => {
    setProcessing(true);
    setShowOtpModal(false);

    try {
      const token = localStorage.getItem('nammakrushi_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: cart,
          paymentMode,
          consumerName,
          consumerPhone,
          deliveryAddress: deliveryMode === 'doorstep' ? `${deliveryAddress}, PIN: ${pinCode}` : 'Direct Farmgate Pickup',
          deliveryMode,
          deliveryCharge: deliveryFee,
          total: grandTotal
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit order to farm marketplace.');
      }

      const orderNumber = data.orderId || `NK-${Math.floor(1000 + Math.random() * 9000)}`;
      let txnId = `TXN_UPI_${Date.now().toString().slice(-8)}_SBI`;
      let paymentLabel = 'UPI (Instant Escrow)';

      if (paymentMode === 'card') {
        const brand = getCardBrand(cardNumber);
        txnId = `TXN_${brand.toUpperCase()}_${Date.now().toString().slice(-8)}_PG`;
        paymentLabel = `${brand} Card (Ending in ${cardNumber.slice(-4)})`;
      } else if (paymentMode === 'netbanking') {
        txnId = `TXN_NB_${selectedBank}_${Date.now().toString().slice(-8)}`;
        paymentLabel = `NetBanking (${selectedBank})`;
      } else if (paymentMode === 'cod') {
        txnId = `COD-${orderNumber}`;
        paymentLabel = 'Cash on Delivery (Mandi Pay)';
      }

      const orderData = {
        orderId: orderNumber,
        transactionId: txnId,
        items: [...cart],
        total: grandTotal,
        paymentMode: paymentLabel,
        isMultiFarmer: data.isMultiFarmer,
        childOrders: data.childOrders,
        consumerDetails: {
          name: consumerName,
          phone: consumerPhone,
          address: deliveryMode === 'doorstep' ? `${deliveryAddress}, PIN: ${pinCode}` : 'Direct Farmgate Pickup',
          pinCode,
          deliveryMode
        }
      };

      setProcessing(false);
      setConfirmedOrder(orderData);
      playNotificationChime();

      onCheckoutComplete(orderData);
    } catch (err: any) {
      console.error('Checkout error:', err);
      alert(err.message || 'Error communicating with order payment server.');
      setProcessing(false);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('nammakrushi.direct@icici');
    setUpiCopied(true);
    setTimeout(() => setUpiCopied(false), 2000);
  };

  const handleResetAndClose = () => {
    setConfirmedOrder(null);
    setStep('cart');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-stone-200">
        
        {/* Top Header */}
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-800" />
            <h3 className="font-extrabold text-stone-900 text-base">
              {confirmedOrder ? 'Payment Receipt & Order' : 'Direct Produce Checkout'}
            </h3>
            {!confirmedOrder && (
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {cart.reduce((c, i) => c + i.quantity, 0)} items
              </span>
            )}
          </div>
          <button 
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-step Breadcrumbs */}
        {!confirmedOrder && (
          <div className="flex border-b border-stone-200 bg-stone-100/70 text-xs font-bold text-center">
            <button
              onClick={() => setStep('cart')}
              className={`flex-1 py-2.5 transition cursor-pointer ${
                step === 'cart' ? 'bg-white text-emerald-800 border-b-2 border-emerald-700' : 'text-stone-500'
              }`}
            >
              1. Produce Cart
            </button>
            <button
              onClick={() => cart.length > 0 && setStep('delivery')}
              disabled={cart.length === 0}
              className={`flex-1 py-2.5 transition cursor-pointer ${
                step === 'delivery' ? 'bg-white text-emerald-800 border-b-2 border-emerald-700' : 'text-stone-500'
              }`}
            >
              2. Delivery Mode
            </button>
            <button
              onClick={() => cart.length > 0 && setStep('payment')}
              disabled={cart.length === 0}
              className={`flex-1 py-2.5 transition cursor-pointer ${
                step === 'payment' ? 'bg-white text-emerald-800 border-b-2 border-emerald-700' : 'text-stone-500'
              }`}
            >
              3. Valid Payment Gateway
            </button>
          </div>
        )}

        {/* ORDER CONFIRMED RECEIPT SCREEN */}
        {confirmedOrder ? (
          <div className="flex-1 flex flex-col justify-between p-6 animate-fade-in overflow-y-auto space-y-4">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Direct Payment Verified
                </span>
                <h4 className="text-xl font-black text-stone-900 mt-1">
                  Payment Successful!
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  Order <strong>#{confirmedOrder.orderId}</strong> registered directly with farmer.
                </p>
              </div>
            </div>

            {/* Official Digital Gateway Receipt Box */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500">Transaction ID:</span>
                <span className="font-mono font-bold text-stone-900">{confirmedOrder.transactionId}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500">Buyer Name:</span>
                <span className="font-bold text-stone-900">{confirmedOrder.consumerDetails.name}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500">Payment Channel:</span>
                <span className="font-bold text-emerald-800">{confirmedOrder.paymentMode}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-stone-500">Delivery Preference:</span>
                <span className="font-semibold text-stone-800">
                  {confirmedOrder.consumerDetails.deliveryMode === 'doorstep' ? '🚚 Farm Doorstep Delivery' : '📍 Direct Farmgate Pickup'}
                </span>
              </div>
              <div className="flex justify-between font-black text-stone-900 pt-1 text-sm">
                <span>Total Amount Paid:</span>
                <span className="text-emerald-800 text-base">₹{confirmedOrder.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Escrow Guarantee Note */}
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-[11px] text-emerald-950 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong>Direct Farmer Escrow Protection:</strong> 100% of your payment is held securely in escrow and released directly to the producer farmer once delivery inspection is completed.
              </div>
            </div>

            {/* Actions: Track Live Order & Continue Shopping */}
            <div className="space-y-2 pt-2">
              {onNavigateTracking && (
                <button
                  onClick={() => {
                    const oId = confirmedOrder?.orderId;
                    handleResetAndClose();
                    onNavigateTracking(oId);
                  }}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Track Live Order & View Purchase History</span>
                </button>
              )}

              <button
                onClick={handleResetAndClose}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Continue Shopping in Farm Marketplace
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* STEP 1: CART ITEMS */}
            {step === 'cart' && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cart.length === 0 ? (
                    <div className="text-center py-12 text-stone-400 text-xs">
                      Your cart is empty. Add farm produce from the Marketplace.
                    </div>
                  ) : (
                    <>
                      {isMultiFarmerCart && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 flex items-start gap-2.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Multi-Farmer Basket ({distinctFarmers.length} Local Growers):</span>
                            <p className="text-[11px] text-emerald-800 mt-0.5">
                              Items will be fulfilled by {distinctFarmers.join(' and ')} in separate direct farmgate packages.
                            </p>
                          </div>
                        </div>
                      )}
                      {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-200 rounded-xl"
                      >
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.title}
                          className="w-14 h-14 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-stone-900 text-xs truncate">
                            {item.product.title}
                          </h4>
                          <p className="text-[11px] text-stone-500">
                            By {item.product.farmerName} • {item.product.farmerLocation}
                          </p>
                          <div className="text-[11px] text-stone-600 font-semibold mt-0.5">
                            ₹{item.product.price} / {item.product.unit}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center border border-stone-300 rounded-lg bg-white shadow-2xs">
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                                className="px-2 py-0.5 hover:bg-stone-100 text-stone-600 cursor-pointer font-bold"
                                title="Decrease 1 kg"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-xs font-bold text-stone-800">
                                {item.quantity} {item.product.unit}
                              </span>
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                                className="px-2 py-0.5 hover:bg-stone-100 text-stone-600 cursor-pointer font-bold"
                                title="Increase 1 kg"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Quick +5kg button for bulk buying */}
                            {item.product.unit === 'kg' && (
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.product.id, item.quantity + 5)}
                                className="text-[10px] font-bold px-1.5 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded border border-stone-200 cursor-pointer"
                                title="Add 5 kg quickly"
                              >
                                +5kg
                              </button>
                            )}

                            <div className="ml-auto text-right">
                              <span className="text-xs font-black text-emerald-800 block">
                                ₹{(item.product.price * item.quantity).toLocaleString()}
                              </span>
                              <span className="text-[10px] text-stone-400">
                                ({item.quantity} {item.product.unit} @ ₹{item.product.price})
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    </>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-2">
                    <div className="flex justify-between items-center text-xs text-stone-600">
                      <span>Total Produce Weight:</span>
                      <span className="font-bold text-stone-900 bg-stone-200/70 px-2 py-0.5 rounded-md">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)} {cart.some(i => i.product.unit === 'kg') ? 'kg' : 'units'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-1">
                      <span className="text-xs text-stone-600 font-semibold">Subtotal ({cart.length} produce lots):</span>
                      <span className="text-base font-black text-emerald-900">₹{subtotal.toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => setStep('delivery')}
                      className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>Proceed to Delivery Mode</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: DELIVERY MODE & ADDRESS */}
            {step === 'delivery' && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  <div>
                    <span className="font-bold text-stone-800 block mb-2">Select Delivery Preference:</span>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setDeliveryMode('doorstep')}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                          deliveryMode === 'doorstep'
                            ? 'bg-emerald-50 border-emerald-700 text-emerald-950 font-bold'
                            : 'bg-stone-50 border-stone-200 text-stone-700'
                        }`}
                      >
                        <Truck className="w-5 h-5 text-emerald-700 mb-1" />
                        <span className="block font-bold">Doorstep Truck Delivery</span>
                        <span className="text-[10px] text-stone-500 font-normal">Refrigerated agri-truck delivery (+₹250)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryMode('pickup')}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                          deliveryMode === 'pickup'
                            ? 'bg-emerald-50 border-emerald-700 text-emerald-950 font-bold'
                            : 'bg-stone-50 border-stone-200 text-stone-700'
                        }`}
                      >
                        <MapPin className="w-5 h-5 text-emerald-700 mb-1" />
                        <span className="block font-bold">Direct Farmgate Pickup</span>
                        <span className="text-[10px] text-stone-500 font-normal">Collect directly at grower's field (FREE)</span>
                      </button>
                    </div>
                  </div>

                  {/* Delivery Input Fields */}
                  <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Consumer / Buyer Name</label>
                      <input
                        type="text"
                        value={consumerName}
                        onChange={(e) => setConsumerName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">Mobile Contact Number (for SMS & tracking)</label>
                      <input
                        type="tel"
                        value={consumerPhone}
                        onChange={(e) => setConsumerPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600"
                      />
                    </div>

                    {deliveryMode === 'doorstep' && (
                      <>
                        <div>
                          <label className="block font-bold text-stone-700 mb-1">Delivery Street Address</label>
                          <textarea
                            rows={2}
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="Apartment, House #, Street, City"
                            className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600 resize-none"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-stone-700 mb-1">Postal PIN Code</label>
                          <input
                            type="text"
                            value={pinCode}
                            onChange={(e) => setPinCode(e.target.value)}
                            placeholder="6-digit PIN code"
                            className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t border-stone-200 bg-stone-50 flex gap-2">
                  <button
                    onClick={() => setStep('cart')}
                    className="px-4 py-3 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep('payment')}
                    disabled={!consumerName || !consumerPhone}
                    className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Proceed to Valid Payment Gateway</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: VALID PAYMENT GATEWAY */}
            {step === 'payment' && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  
                  {/* Security Assurance Banner */}
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-[11px] text-emerald-950 font-medium">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Lock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>256-Bit SSL Encrypted Payment Gateway</span>
                    </span>
                    <span className="text-[10px] text-emerald-700">RBI Compliant</span>
                  </div>

                  {/* Payment Channel Tabs */}
                  <div>
                    <span className="text-xs font-bold text-stone-800 block mb-2">
                      Choose Secure Payment Channel:
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'upi', label: 'UPI / QR', icon: QrCode },
                        { id: 'card', label: 'Cards', icon: CreditCard },
                        { id: 'netbanking', label: 'NetBank', icon: Building2 },
                        { id: 'cod', label: 'COD / Mandi', icon: ShieldCheck },
                      ].map(mode => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setPaymentMode(mode.id as any)}
                          className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                            paymentMode === mode.id
                              ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          <mode.icon className="w-4 h-4" />
                          <span>{mode.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* GATEWAY 1: INSTANT UPI / QR */}
                  {paymentMode === 'upi' && (
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3 text-xs">
                      <div className="flex bg-stone-200/70 p-1 rounded-xl text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setUpiSubMode('qr')}
                          className={`flex-1 py-1.5 rounded-lg transition ${
                            upiSubMode === 'qr' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-600'
                          }`}
                        >
                          Dynamic QR Code
                        </button>
                        <button
                          type="button"
                          onClick={() => setUpiSubMode('id')}
                          className={`flex-1 py-1.5 rounded-lg transition ${
                            upiSubMode === 'id' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-600'
                          }`}
                        >
                          Enter UPI ID / VPA
                        </button>
                      </div>

                      {upiSubMode === 'qr' ? (
                        <div className="flex flex-col items-center text-center space-y-2 py-1">
                          <div className="p-3 bg-white rounded-2xl border border-stone-300 shadow-sm relative">
                            {/* Visual QR Code Representation */}
                            <div className="w-32 h-32 bg-stone-900 p-2 rounded-xl flex items-center justify-center text-white">
                              <QrCode className="w-28 h-28 text-white" />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="bg-white p-1 rounded-md shadow-xs">
                                <span className="text-[10px] font-black text-emerald-800">NK</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <span className="font-extrabold text-stone-900 block text-xs">
                              Scan with PhonePe, Google Pay, Paytm, or BHIM
                            </span>
                            <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
                              <span>VPA: <strong>nammakrushi.direct@icici</strong></span>
                              <button 
                                onClick={handleCopyUpi} 
                                className="p-1 hover:text-emerald-700 cursor-pointer"
                                title="Copy UPI VPA"
                              >
                                {upiCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                            <span className="text-[10px] text-amber-700 font-semibold block">
                              QR expires in: {Math.floor(upiTimer / 60)}:{(upiTimer % 60).toString().padStart(2, '0')}
                            </span>
                          </div>

                          <a
                            href={`upi://pay?pa=nammakrushi.direct@icici&pn=NammaKrushi%20Farmers&am=${grandTotal}&cu=INR&tn=Farm%20Produce`}
                            className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-emerald-200 transition"
                          >
                            <Smartphone className="w-3 h-3" />
                            <span>Launch Installed UPI App</span>
                          </a>
                        </div>
                      ) : (
                        <div className="space-y-2 pt-1">
                          <label className="block font-bold text-stone-700">
                            Enter Your Virtual Payment Address (UPI ID)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={upiId}
                              onChange={(e) => {
                                setUpiId(e.target.value);
                                setIsUpiValid(true);
                              }}
                              placeholder="e.g. mobile@upi or username@okaxis"
                              className="flex-1 px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const valid = /^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,49}$/.test(upiId.trim());
                                setIsUpiValid(valid);
                                if (valid) {
                                  setUpiAppRequestSent(true);
                                  setTimeout(() => setUpiAppRequestSent(false), 5000);
                                }
                              }}
                              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                            >
                              Verify
                            </button>
                          </div>
                          {!isUpiValid && (
                            <span className="text-[11px] text-rose-600 font-semibold block">
                              Invalid UPI ID. Format should be name@bank (e.g. yourname@oksbi).
                            </span>
                          )}
                          {upiAppRequestSent && (
                            <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 animate-pulse">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Payment request sent to your UPI App! Approve to finalize.</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* GATEWAY 2: CREDIT / DEBIT CARDS */}
                  {paymentMode === 'card' && (
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-800">Card Credentials:</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                          {getCardBrand(cardNumber)} Gateway
                        </span>
                      </div>

                      <div>
                        <label className="block text-stone-600 mb-1">Card Number (16 Digits)</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => handleCardNumberChange(e.target.value)}
                            placeholder="4532 8812 9043 7812"
                            className="w-full pl-3 pr-10 py-2 bg-white border border-stone-300 rounded-xl font-mono text-xs focus:outline-hidden focus:border-emerald-600"
                          />
                          <CreditCard className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        </div>
                        {cardErrors.number && (
                          <span className="text-[10px] text-rose-600 font-semibold mt-0.5 block">{cardErrors.number}</span>
                        )}
                      </div>

                      <div>
                        <label className="block text-stone-600 mb-1">Cardholder Full Name</label>
                        <input
                          type="text"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                          placeholder="AS APPEARS ON CARD"
                          className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono text-xs focus:outline-hidden focus:border-emerald-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-stone-600 mb-1">Expiry (MM/YY)</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => handleExpiryChange(e.target.value)}
                            placeholder="MM/YY"
                            maxLength={5}
                            className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono text-xs focus:outline-hidden focus:border-emerald-600"
                          />
                          {cardErrors.expiry && (
                            <span className="text-[10px] text-rose-600 font-semibold mt-0.5 block">{cardErrors.expiry}</span>
                          )}
                        </div>

                        <div>
                          <label className="block text-stone-600 mb-1">CVV / CVC</label>
                          <input
                            type="password"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.slice(0, 4))}
                            placeholder="•••"
                            maxLength={4}
                            className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono text-xs focus:outline-hidden focus:border-emerald-600"
                          />
                          {cardErrors.cvv && (
                            <span className="text-[10px] text-rose-600 font-semibold mt-0.5 block">{cardErrors.cvv}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GATEWAY 3: NETBANKING */}
                  {paymentMode === 'netbanking' && (
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3 text-xs">
                      <span className="font-bold text-stone-800 block">Select Your Bank:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {['SBI', 'HDFC Bank', 'ICICI Bank', 'Canara Bank', 'Karnataka Bank', 'Axis Bank'].map(bank => (
                          <button
                            key={bank}
                            type="button"
                            onClick={() => setSelectedBank(bank)}
                            className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                              selectedBank === bank
                                ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            {bank}
                          </button>
                        ))}
                      </div>
                      <span className="text-[10px] text-stone-500 block pt-1">
                        You will be securely routed through {selectedBank}'s Agri-Gateway portal for one-click authorization.
                      </span>
                    </div>
                  )}

                  {/* GATEWAY 4: CASH ON DELIVERY / MANDI PAY */}
                  {paymentMode === 'cod' && (
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-2 text-xs">
                      <div className="flex items-center gap-2 font-bold text-stone-900">
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        <span>Direct Farmgate Pay on Delivery</span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed">
                        Pay cash directly to the farmer or logistics driver upon delivery after quality inspection. Verified by SMS authorization to +91 {consumerPhone}.
                      </p>
                    </div>
                  )}

                  {/* Price Breakdown */}
                  <div className="space-y-2 text-xs text-stone-600 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                    <div className="flex justify-between">
                      <span>Produce Subtotal:</span>
                      <span className="font-semibold text-stone-900">₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Logistics Transport ({deliveryMode === 'doorstep' ? 'Doorstep' : 'Farmgate Pickup'}):</span>
                      <span className="font-semibold text-stone-900">
                        {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex justify-between font-black text-sm text-stone-900 pt-2 border-t border-stone-200">
                      <span>Total to Pay:</span>
                      <span className="text-emerald-800 text-base">₹{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-stone-200 bg-stone-50 flex gap-2">
                  <button
                    onClick={() => setStep('delivery')}
                    className="px-4 py-3 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleProceedPayment}
                    disabled={processing}
                    className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {processing ? (
                      <span>Connecting Bank Gateway...</span>
                    ) : (
                      <>
                        <span>Authorize ₹{grandTotal.toLocaleString()} & Confirm Order</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* 3D SECURE OTP MODAL (for Card Gateway Verification) */}
        {showOtpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs">
                <Lock className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  RBI 2-Factor Authentication
                </span>
                <h3 className="font-extrabold text-base text-stone-900 mt-1">
                  Bank 3D Secure Verification
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Enter the 6-digit OTP sent to your registered mobile <strong>+91 ******{consumerPhone.slice(-4)}</strong> for payment of <strong>₹{grandTotal.toLocaleString()}</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) => {
                    setOtpValue(e.target.value.replace(/\D/g, ''));
                    setOtpError(null);
                  }}
                  placeholder="Enter 6-digit OTP"
                  className="w-full text-center tracking-widest font-mono text-lg py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-emerald-600 font-bold"
                />
                
                {otpError && (
                  <span className="text-xs text-rose-600 font-semibold block">{otpError}</span>
                )}

                <button
                  type="button"
                  onClick={() => setOtpValue('842910')}
                  className="text-[11px] text-emerald-700 hover:underline font-semibold block mx-auto cursor-pointer"
                >
                  Click to Auto-fill Demo OTP (842910)
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (otpValue.length !== 6) {
                      setOtpError('Please enter a valid 6-digit OTP.');
                      return;
                    }
                    executeFinalPayment();
                  }}
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
                >
                  Verify & Pay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
