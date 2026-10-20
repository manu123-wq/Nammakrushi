import React, { useState } from 'react';
import { 
  Sprout, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  MapPin, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  AlertCircle,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Home
} from 'lucide-react';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  db, 
  doc, 
  setDoc 
} from '../firebase';
import { DISTRICTS } from './Header';
import { UserRole } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (userData: any) => void;
  onContinueAsGuest: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, onContinueAsGuest }) => {
  // Role selection: 'farmer' vs 'consumer'
  const [selectedRole, setSelectedRole] = useState<UserRole>('consumer');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Sign up fields
  const [fullName, setFullName] = useState('');
  const [signupIdentifier, setSignupIdentifier] = useState('');
  const [district, setDistrict] = useState('Dharwad');
  
  // Farmer specific
  const [farmAcres, setFarmAcres] = useState<number>(4.5);
  
  // Consumer specific
  const [deliveryAddress, setDeliveryAddress] = useState('#104, Green Glen Layout, Indiranagar');

  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper to detect if input is a phone number (e.g. 9876543210 or +919876543210)
  const isPhoneNumber = (val: string): boolean => {
    const cleaned = val.replace(/[\s\-\+\(\)]/g, '');
    return /^\d{8,14}$/.test(cleaned);
  };

  // Convert identifier (phone or email) into standardized Firebase Auth identity
  const normalizeIdentity = (identifier: string, role: UserRole): { authEmail: string; isPhone: boolean; rawPhone: string } => {
    const trimmed = identifier.trim();
    if (isPhoneNumber(trimmed)) {
      const digits = trimmed.replace(/\D/g, '');
      const domain = role === 'consumer' ? 'consumer.nammakrushi.in' : 'farmer.nammakrushi.in';
      return {
        authEmail: `${digits}@${domain}`,
        isPhone: true,
        rawPhone: trimmed
      };
    }
    return {
      authEmail: trimmed,
      isPhone: false,
      rawPhone: ''
    };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    // 1. Try SQLite REST API first
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          password
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('nammakrushi_token', data.token);
        localStorage.setItem('nammakrushi_user_role', data.user.role);
        onAuthSuccess({
          uid: data.user.id,
          id: data.user.id,
          email: data.user.email,
          displayName: data.user.name,
          role: data.user.role,
          district: data.user.district,
          verificationStatus: data.user.verificationStatus,
          token: data.token
        });
        setLoading(false);
        return;
      } else if (!res.ok && res.status === 403) {
        setErrorMessage(data.error || 'Your account has been suspended by administration.');
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn('SQLite login fallback notice:', e);
    }

    // 2. Firebase Auth Fallback
    const { authEmail, isPhone, rawPhone } = normalizeIdentity(loginIdentifier, selectedRole);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, authEmail, password);
      const user = userCredential.user;
      
      onAuthSuccess({
        ...user,
        role: selectedRole,
        phone: isPhone ? rawPhone : '',
        loginIdentifier: loginIdentifier.trim(),
        district,
        deliveryAddress: selectedRole === 'consumer' ? deliveryAddress : undefined
      });
    } catch (err: any) {
      console.warn('Firebase login notice:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setErrorMessage(
          isPhone
            ? 'Incorrect phone number or password. Please verify or create a new account.'
            : 'Invalid email or password. Please verify or create a new account.'
        );
      } else {
        const localUser = {
          uid: `${selectedRole}-${loginIdentifier.replace(/[^a-zA-Z0-9]/g, '') || Date.now()}`,
          email: isPhone ? '' : loginIdentifier.trim(),
          phone: isPhone ? rawPhone : '',
          displayName: isPhone 
            ? `${selectedRole === 'consumer' ? 'Consumer' : 'Farmer'} (+91 ${rawPhone.slice(-10)})` 
            : loginIdentifier.split('@')[0],
          role: selectedRole,
          district,
          deliveryAddress: selectedRole === 'consumer' ? deliveryAddress : undefined,
          farmAcres: selectedRole === 'farmer' ? farmAcres : undefined
        };
        onAuthSuccess(localUser);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    // 1. Try SQLite REST API Registration first
    try {
      const emailValue = signupIdentifier.includes('@') 
        ? signupIdentifier.trim() 
        : `${signupIdentifier.trim()}@nammakrushi.in`;

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailValue,
          password,
          name: fullName.trim(),
          role: selectedRole,
          phone: isPhoneNumber(signupIdentifier) ? signupIdentifier.trim() : '',
          district,
          farmAcres: selectedRole === 'farmer' ? farmAcres : undefined,
          deliveryAddress: selectedRole === 'consumer' ? deliveryAddress : undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('nammakrushi_token', data.token);
        localStorage.setItem('nammakrushi_user_role', data.user.role);
        onAuthSuccess({
          uid: data.user.id,
          id: data.user.id,
          email: data.user.email,
          displayName: data.user.name,
          role: data.user.role,
          district: data.user.district,
          verificationStatus: data.user.verificationStatus,
          token: data.token
        });
        setLoading(false);
        return;
      } else if (!res.ok) {
        setErrorMessage(data.error || 'Registration failed');
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn('SQLite register fallback notice:', e);
    }

    // 2. Firebase Auth Fallback
    const { authEmail, isPhone, rawPhone } = normalizeIdentity(signupIdentifier, selectedRole);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, authEmail, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: fullName.trim(),
      });

      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        email: isPhone ? '' : authEmail,
        phoneNumber: isPhone ? rawPhone : '',
        displayName: fullName.trim(),
        role: selectedRole,
        district,
        deliveryAddress: selectedRole === 'consumer' ? deliveryAddress.trim() : '',
        farmAreaAcres: selectedRole === 'farmer' ? Number(farmAcres) : 0,
        createdAt: new Date().toISOString()
      }, { merge: true });

      onAuthSuccess({
        ...user,
        role: selectedRole,
        phone: isPhone ? rawPhone : '',
        district,
        deliveryAddress: selectedRole === 'consumer' ? deliveryAddress.trim() : undefined,
        farmAcres: selectedRole === 'farmer' ? farmAcres : undefined
      });
    } catch (err: any) {
      console.warn('Firebase signup notice:', err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('This account is already registered. Please sign in instead.');
      } else {
        setErrorMessage(err.message || 'Error creating account. Please check your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Logins
  const handleAdminQuickLogin = async () => {
    setLoginIdentifier('admin@nammakrushi.in');
    setPassword('Admin@NammaKrushi2026');
    setSelectedRole('admin' as any);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'admin@nammakrushi.in', password: 'Admin@NammaKrushi2026' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('nammakrushi_token', data.token);
        localStorage.setItem('nammakrushi_user_role', 'admin');
        onAuthSuccess({ ...data.user, token: data.token });
        return;
      }
    } catch (e) {}
    onAuthSuccess({
      uid: 'usr-admin-01',
      displayName: 'NammaKrushi Chief Agricultural Admin',
      email: 'admin@nammakrushi.in',
      role: 'admin' as UserRole
    });
  };

  const handleQuickDemoFarmerLogin = async () => {
    setLoginIdentifier('farmer@nammakrushi.in');
    setPassword('Farmer@NammaKrushi2026');
    setSelectedRole('farmer');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'farmer@nammakrushi.in', password: 'Farmer@NammaKrushi2026' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('nammakrushi_token', data.token);
        localStorage.setItem('nammakrushi_user_role', 'farmer');
        onAuthSuccess({ ...data.user, token: data.token });
        return;
      }
    } catch (e) {}
    onAuthSuccess({
      uid: 'usr-farmer-01',
      displayName: 'Manish S.B. (Verified Farmer)',
      email: 'farmer@nammakrushi.in',
      role: 'farmer' as UserRole,
      verificationStatus: 'approved'
    });
  };

  const handleQuickDemoConsumerLogin = async () => {
    setLoginIdentifier('consumer@nammakrushi.in');
    setPassword('Consumer@NammaKrushi2026');
    setSelectedRole('consumer');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'consumer@nammakrushi.in', password: 'Consumer@NammaKrushi2026' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('nammakrushi_token', data.token);
        localStorage.setItem('nammakrushi_user_role', 'consumer');
        onAuthSuccess({ ...data.user, token: data.token });
        return;
      }
    } catch (e) {}
    onAuthSuccess({
      uid: 'usr-consumer-01',
      displayName: 'Ananya Sharma (Direct Buyer)',
      email: 'consumer@nammakrushi.in',
      role: 'consumer' as UserRole
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-emerald-50/40 to-stone-100 flex flex-col justify-center items-center p-4 sm:p-6">
      
      {/* Brand Header */}
      <div className="text-center mb-5 max-w-md">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 text-white shadow-lg shadow-emerald-700/20 mb-3">
          <Sprout className="w-8 h-8" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">NammaKrushi</h1>
          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
            ನಮ್ಮ ಕೃಷಿ
          </span>
        </div>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Direct Farm-to-Consumer & AI Smart Agriculture Platform
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-stone-200 w-full max-w-md overflow-hidden">
        
        {/* Role Selector Header Tabs: Farmer vs Consumer */}
        <div className="p-3 bg-stone-100/80 border-b border-stone-200">
          <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2 text-center">
            Select Your Account Type / ಖಾತೆ ಪ್ರಕಾರ
          </label>
          <div className="grid grid-cols-2 gap-2 bg-stone-200/70 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('consumer');
                setErrorMessage(null);
              }}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedRole === 'consumer'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100/60'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Consumer / Buyer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('farmer');
                setErrorMessage(null);
              }}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedRole === 'farmer'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100/60'
              }`}
            >
              <Sprout className="w-4 h-4" />
              <span>Farmer / Producer</span>
            </button>
          </div>

          {/* Role Description Subtitle */}
          <div className="mt-2.5 px-2 text-center">
            {selectedRole === 'consumer' ? (
              <p className="text-[11px] text-emerald-800 font-medium bg-emerald-50 py-1.5 px-3 rounded-lg border border-emerald-200">
                🛒 <strong>Consumer Mode:</strong> Buy fresh harvest crops directly produced by Karnataka farmers with zero middlemen.
              </p>
            ) : (
              <p className="text-[11px] text-stone-600 font-medium bg-stone-50 py-1.5 px-3 rounded-lg border border-stone-200">
                🌾 <strong>Farmer Mode:</strong> Farm operations, AI predictor, inventory, task tracker & publish harvest.
              </p>
            )}
          </div>
        </div>

        {/* Toggle Stage: Login vs Sign Up */}
        <div className="flex border-b border-stone-200 bg-stone-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 text-center transition cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-700 shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            {selectedRole === 'consumer' ? 'Consumer Sign In' : 'Farmer Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 text-center transition cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-700 shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            {selectedRole === 'consumer' ? 'New Consumer Register' : 'New Farmer Register'}
          </button>
        </div>

        {/* Error Message Alert */}
        {errorMessage && (
          <div className="m-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Form Container */}
        <div className="p-6">
          {mode === 'login' ? (
            /* LOGIN FORM (Email or Phone Number) */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
                  <span>
                    {selectedRole === 'consumer' ? 'Consumer Mobile or Email' : 'Farmer Mobile or Email'}
                  </span>
                  <span className="text-[10px] text-stone-400 font-normal">ಇಮೇಲ್ ಅಥವಾ ಮೊಬೈಲ್</span>
                </label>
                <div className="relative">
                  {isPhoneNumber(loginIdentifier) ? (
                    <Phone className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  ) : (
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  )}
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder={
                      selectedRole === 'consumer'
                        ? 'e.g. 9876543210 or buyer@gmail.com'
                        : 'e.g. 9845012345 or farmer@nammakrushi.in'
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>
                      {selectedRole === 'consumer'
                        ? 'Sign In to Buy Farmer Produce'
                        : 'Sign In to Farm Dashboard'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* SIGN UP FORM */
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {selectedRole === 'consumer' ? 'Consumer Full Name' : 'Farmer Full Name'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={selectedRole === 'consumer' ? 'e.g. Ananya Sharma' : 'e.g. Mallikarjun Patil'}
                    className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span>Mobile Number or Email</span>
                  <span className="text-[10px] text-stone-400 font-normal">ಮೊಬೈಲ್ ಅಥವಾ ಇಮೇಲ್</span>
                </label>
                <div className="relative">
                  {isPhoneNumber(signupIdentifier) ? (
                    <Phone className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  ) : (
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  )}
                  <input
                    type="text"
                    required
                    value={signupIdentifier}
                    onChange={(e) => setSignupIdentifier(e.target.value)}
                    placeholder={
                      selectedRole === 'consumer'
                        ? 'e.g. 9876543210 or buyer@gmail.com'
                        : 'e.g. 9845012345 or farmer@nammakrushi.in'
                    }
                    className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>
              </div>

              {selectedRole === 'consumer' ? (
                /* Consumer specific fields */
                <>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Delivery City / District (Karnataka)
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600 bg-white"
                      >
                        {DISTRICTS.map(d => (
                          <option key={d} value={d}>{d}, Karnataka</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Default Delivery Address
                    </label>
                    <div className="relative">
                      <Home className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                      <textarea
                        rows={2}
                        required
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="House / Flat No., Street, Landmark, Pin code"
                        className="w-full pl-10 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600"
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Farmer specific fields */
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Farm District
                    </label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600 bg-white"
                    >
                      {DISTRICTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Farm Area (Acres)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={farmAcres}
                      onChange={(e) => setFarmAcres(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>
                      {selectedRole === 'consumer'
                        ? 'Create Consumer Account'
                        : 'Create Farmer Account'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Login Option */}
          <div className="mt-5 pt-4 border-t border-stone-100 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider text-center">
              Quick Test Accounts (SQLite + RBAC)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleAdminQuickLogin}
                className="py-2 px-2.5 bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                title="admin@nammakrushi.in"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                <span>🛡️ Admin Portal</span>
              </button>

              <button
                type="button"
                onClick={handleQuickDemoFarmerLogin}
                className="py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                title="farmer@nammakrushi.in"
              >
                <Sprout className="w-3.5 h-3.5 text-emerald-700" />
                <span>🌾 Farmer (Verified)</span>
              </button>

              <button
                type="button"
                onClick={handleQuickDemoConsumerLogin}
                className="py-2 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                title="consumer@nammakrushi.in"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
                <span>🛒 Consumer Direct</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onContinueAsGuest}
              className="text-stone-400 hover:text-stone-700 text-xs text-center font-medium pt-1 cursor-pointer"
            >
              Skip for now & browse direct marketplace as Guest →
            </button>
          </div>
        </div>

        {/* Footer banner */}
        <div className="bg-stone-50 p-3.5 border-t border-stone-200 text-center text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secured with Firebase Authentication & Cloud Firestore</span>
        </div>
      </div>
    </div>
  );
};
