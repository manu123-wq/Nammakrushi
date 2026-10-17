/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Chatbot } from './components/Chatbot';
import { InventoryManager } from './components/InventoryManager';
import { CropPredictor } from './components/CropPredictor';
import { Marketplace } from './components/Marketplace';
import { TaskTracker } from './components/TaskTracker';
import { MarketRates } from './components/MarketRates';
import { NotificationCenter } from './components/NotificationCenter';
import { CartDrawer } from './components/CartDrawer';
import { GuideReviewModal } from './components/GuideReviewModal';
import { AuthScreen } from './components/AuthScreen';
import { PurchaseHistory } from './components/PurchaseHistory';
import { MvcRouteInspectorModal } from './components/MvcRouteInspectorModal';
import { 
  TabType, 
  InventoryItem, 
  FarmTask, 
  NotificationItem, 
  MarketplaceProduct, 
  CartItem,
  UserRole,
  ConsumerOrder,
  ProductReview,
  OrderStatus,
  TrackingMilestone
} from './types';
import { 
  INITIAL_INVENTORY, 
  INITIAL_TASKS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_PRODUCTS,
  INITIAL_CONSUMER_ORDERS
} from './utils/mockData';
import { playNotificationChime } from './utils/audio';
import { 
  auth, 
  db, 
  testFirestoreConnection, 
  FirebaseUser 
} from './firebase';
import { 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs,
  getDoc
} from 'firebase/firestore';

function getTabFromPathname(pathname: string, defaultRole: UserRole): TabType {
  const p = pathname.toLowerCase().replace(/\/$/, '') || '/';
  if (p === '/marketplace' || p === '/market' || p === '/shop') return 'marketplace';
  if (p === '/purchase-history' || p === '/orders' || p === '/history') return 'purchase-history';
  if (p === '/market-rates' || p === '/rates' || p === '/mandi') return 'market-rates';
  if (p === '/dashboard' || p === '/farm') return 'dashboard';
  if (p === '/chatbot' || p === '/chat' || p === '/ai') return 'chatbot';
  if (p === '/inventory') return 'inventory';
  if (p === '/predict' || p === '/crop-predictor' || p === '/advisor') return 'predict';
  if (p === '/tasks' || p === '/schedule') return 'tasks';
  if (p === '/consumer-orders') return 'consumer-orders';
  return defaultRole === 'consumer' ? 'marketplace' : 'dashboard';
}

function getPathForTab(tab: TabType): string {
  switch (tab) {
    case 'marketplace': return '/marketplace';
    case 'purchase-history': return '/purchase-history';
    case 'consumer-orders': return '/purchase-history';
    case 'market-rates': return '/market-rates';
    case 'dashboard': return '/dashboard';
    case 'chatbot': return '/chatbot';
    case 'inventory': return '/inventory';
    case 'predict': return '/predict';
    case 'tasks': return '/tasks';
    default: return '/';
  }
}

export default function App() {
  // Role state: 'consumer' vs 'farmer'
  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem('nammakrushi_user_role');
      if (saved === 'consumer' || saved === 'farmer') return saved;
    } catch (e) {}
    return 'consumer';
  });

  const [currentTab, setCurrentTab] = useState<TabType>(() => {
    try {
      const matched = getTabFromPathname(window.location.pathname, 'consumer');
      return matched;
    } catch (e) {}
    return 'marketplace';
  });

  const [selectedDistrict, setSelectedDistrict] = useState('Dharwad');
  const [weather, setWeather] = useState<{ temp: number; condition: string; humidity: number; wind?: string; rainfall?: number } | null>({
    temp: 28,
    condition: 'Partly Cloudy',
    humidity: 66,
    wind: '14 km/h',
    rainfall: 4.2
  });

  // User state from Firebase Auth
  const [user, setUser] = useState<FirebaseUser | null>(null);

  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [tasks, setTasks] = useState<FarmTask[]>(INITIAL_TASKS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [products, setProducts] = useState<MarketplaceProduct[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [consumerOrders, setConsumerOrders] = useState<ConsumerOrder[]>(INITIAL_CONSUMER_ORDERS);

  // Modals & Drawers
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isMvcInspectorOpen, setIsMvcInspectorOpen] = useState(false);

  // Authentication Stage toggle (Separate stage for Login & Sign Up)
  const [showAuthStage, setShowAuthStage] = useState(false);

  // Browser route synchronization
  const handleNavigateTab = (tab: TabType) => {
    setCurrentTab(tab);
    const targetPath = getPathForTab(tab);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab }, '', targetPath);
    }
  };

  // Popstate listener for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const matched = getTabFromPathname(window.location.pathname, userRole);
      setCurrentTab(matched);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [userRole]);

  // Synchronize initial data from SQLite MVC backend
  useEffect(() => {
    async function loadSqliteBackendData() {
      try {
        const prodRes = await fetch('/api/products');
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          if (prodData.success && Array.isArray(prodData.products) && prodData.products.length > 0) {
            setProducts(prodData.products);
          }
        }
      } catch (err) {
        console.warn('SQLite products sync note:', err);
      }

      try {
        const orderRes = await fetch('/api/orders');
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          if (orderData.success && Array.isArray(orderData.orders) && orderData.orders.length > 0) {
            setConsumerOrders(orderData.orders);
          }
        }
      } catch (err) {
        console.warn('SQLite orders sync note:', err);
      }
    }

    loadSqliteBackendData();
  }, []);

  // Initialize Firebase Auth listener and test Firestore connection
  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch or create user profile in Firestore
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userDocRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.role && (data.role === 'consumer' || data.role === 'farmer')) {
              setUserRole(data.role as UserRole);
              localStorage.setItem('nammakrushi_user_role', data.role);
            }
            if (data.district || data.farmDistrict) {
              setSelectedDistrict(data.district || data.farmDistrict);
            }
          } else {
            await setDoc(userDocRef, {
              id: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              role: userRole,
              lastLogin: new Date().toISOString()
            }, { merge: true });
          }

          // Fetch user tasks from Firestore (for farmers)
          const tasksSnapshot = await getDocs(collection(db, 'users', currentUser.uid, 'tasks'));
          if (!tasksSnapshot.empty) {
            const loadedTasks: FarmTask[] = [];
            tasksSnapshot.forEach(docSnap => loadedTasks.push(docSnap.data() as FarmTask));
            setTasks(loadedTasks);
          }

          // Fetch user inventory from Firestore (for farmers)
          const invSnapshot = await getDocs(collection(db, 'users', currentUser.uid, 'inventory'));
          if (!invSnapshot.empty) {
            const loadedInv: InventoryItem[] = [];
            invSnapshot.forEach(docSnap => loadedInv.push(docSnap.data() as InventoryItem));
            setInventory(loadedInv);
          }

          // Fetch user orders from Firestore
          const ordersSnapshot = await getDocs(collection(db, 'users', currentUser.uid, 'orders'));
          if (!ordersSnapshot.empty) {
            const loadedOrders: ConsumerOrder[] = [];
            ordersSnapshot.forEach(docSnap => loadedOrders.push(docSnap.data() as ConsumerOrder));
            setConsumerOrders(prev => {
              // Combine and deduplicate
              const combined = [...loadedOrders, ...prev];
              return combined.filter((v, i, a) => a.findIndex(t => t.orderId === v.orderId) === i);
            });
          }
        } catch (err) {
          console.warn('Firestore sync note:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Threshold-based Extreme Weather Alert Evaluation
  const evaluateWeatherThresholds = (weatherData: any, districtName: string): NotificationItem[] => {
    const alerts: NotificationItem[] = [];
    if (!weatherData) return alerts;

    const currentTemp = weatherData.temp || 0;
    const currentRain = weatherData.rainfall || 0;
    const currentWindNum = parseInt(weatherData.wind || '0', 10);
    const weeklyForecast: any[] = weatherData.weeklyForecast || [];

    // Threshold 1: Heavy Rainfall Alert
    const heavyRainDay = weeklyForecast.find((d: any) => d.rainfall >= 10.0);
    if (currentRain >= 10.0 || heavyRainDay) {
      const rainAmount = currentRain >= 10.0 ? currentRain : heavyRainDay?.rainfall;
      const timing = currentRain >= 10.0 ? 'today' : `on ${heavyRainDay?.day}`;
      alerts.push({
        id: `alert-weather-rain-${districtName}-${Date.now()}`,
        title: `🌧️ Heavy Rainfall Alert (${rainAmount} mm)`,
        message: `Rainfall has reached extreme threshold ${timing} in ${districtName}. High risk of soil waterlogging and fertilizer wash-off. Open drainage channels and postpone foliar sprays.`,
        type: 'weather',
        timestamp: 'Just now',
        read: false,
        actionTab: userRole === 'farmer' ? 'dashboard' : 'marketplace'
      });
    }

    // Threshold 2: Heatwave Alert
    const heatwaveDay = weeklyForecast.find((d: any) => d.temp >= 33.0);
    if (currentTemp >= 33.0 || heatwaveDay) {
      const peakTemp = Math.max(currentTemp, heatwaveDay ? heatwaveDay.temp : 0);
      const timing = currentTemp >= 33.0 ? 'currently' : `forecasted for ${heatwaveDay?.day}`;
      alerts.push({
        id: `alert-weather-heat-${districtName}-${Date.now()}`,
        title: `☀️ Extreme Heatwave Warning (${peakTemp}°C)`,
        message: `Extreme heat threshold breached (${timing} in ${districtName}). Thermal stress alert for standing crops and farm storage. Ensure adequate watering.`,
        type: 'weather',
        timestamp: 'Just now',
        read: false,
        actionTab: userRole === 'farmer' ? 'dashboard' : 'marketplace'
      });
    }

    // Threshold 3: Strong Wind Warning
    if (currentWindNum >= 18) {
      alerts.push({
        id: `alert-weather-wind-${districtName}-${Date.now()}`,
        title: `💨 Strong Wind Alert (${weatherData.wind})`,
        message: `High wind velocity exceeds safety threshold in ${districtName}. Risk of crop lodging in tall crops (maize, sugarcane, jowar). Secure polyhouse netting.`,
        type: 'weather',
        timestamp: 'Just now',
        read: false,
        actionTab: userRole === 'farmer' ? 'dashboard' : 'marketplace'
      });
    }

    return alerts;
  };

  // Fetch weather when district changes and evaluate extreme thresholds
  useEffect(() => {
    async function loadWeather() {
      try {
        const res = await fetch(`/api/weather?district=${encodeURIComponent(selectedDistrict)}`);
        const data = await res.json();
        if (data.success && data.weather) {
          setWeather(data.weather);

          const weatherAlerts = evaluateWeatherThresholds(data.weather, selectedDistrict);
          if (weatherAlerts.length > 0) {
            setNotifications(prev => {
              const newItems = weatherAlerts.filter(wa => 
                !prev.some(p => p.title === wa.title && !p.read)
              );
              if (newItems.length > 0) {
                playNotificationChime();
                return [...newItems, ...prev];
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.error('Weather load error:', err);
      }
    }
    loadWeather();
  }, [selectedDistrict]);

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
    setUser(null);
    setShowAuthStage(true);
  };

  // Role toggle handler
  const handleToggleUserRole = () => {
    const nextRole: UserRole = userRole === 'consumer' ? 'farmer' : 'consumer';
    setUserRole(nextRole);
    try {
      localStorage.setItem('nammakrushi_user_role', nextRole);
    } catch (e) {}

    if (nextRole === 'consumer') {
      setCurrentTab('marketplace');
    } else {
      setCurrentTab('dashboard');
    }
    playNotificationChime();
  };

  // Sync tasks to state & Firestore
  const handleUpdateTasks = async (newTasks: FarmTask[]) => {
    setTasks(newTasks);
    if (user) {
      try {
        for (const t of newTasks) {
          await setDoc(doc(db, 'users', user.uid, 'tasks', t.id), t, { merge: true });
        }
      } catch (e) {
        console.warn('Task sync warning:', e);
      }
    }
  };

  // Sync inventory to state & Firestore
  const handleUpdateInventory = async (newInventory: InventoryItem[]) => {
    setInventory(newInventory);
    if (user) {
      try {
        for (const item of newInventory) {
          await setDoc(doc(db, 'users', user.uid, 'inventory', item.id), item, { merge: true });
        }
      } catch (e) {
        console.warn('Inventory sync warning:', e);
      }
    }
  };

  // Automated Alert Evaluation
  const triggerAutomatedCheck = () => {
    const today = new Date().toISOString().split('T')[0];
    const newAlerts: NotificationItem[] = [];

    // Check tasks due today or overdue
    tasks.forEach(task => {
      if (task.status === 'Pending' && task.dueDate <= today) {
        newAlerts.push({
          id: `alert-task-${task.id}-${Date.now()}`,
          title: task.dueDate < today ? '⚠️ Overdue Farm Task' : '⏰ Farm Task Due Today',
          message: `${task.title} in ${task.fieldSector} is awaiting completion.`,
          type: 'task',
          timestamp: 'Just now',
          read: false,
          actionTab: 'tasks'
        });
      }
    });

    // Check low stock inventory
    inventory.forEach(item => {
      if (item.quantity <= item.minThreshold) {
        newAlerts.push({
          id: `alert-inv-${item.id}-${Date.now()}`,
          title: item.quantity === 0 ? '🚫 Out of Stock' : '⚠️ Low Stock Alert',
          message: `${item.name} has ${item.quantity} ${item.unit} remaining (Reorder threshold: ${item.minThreshold}).`,
          type: 'inventory',
          timestamp: 'Just now',
          read: false,
          actionTab: 'inventory'
        });
      }
    });

    if (newAlerts.length > 0) {
      setNotifications(prev => {
        const unique = newAlerts.filter(na => !prev.some(p => p.title === na.title && !p.read));
        return [...unique, ...prev];
      });
      playNotificationChime();
    }
  };

  // Notification handlers
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleItemLowStockTrigger = (item: InventoryItem) => {
    const alertItem: NotificationItem = {
      id: `alert-lowstock-${item.id}-${Date.now()}`,
      title: '⚠️ Low Stock Warning Triggered',
      message: `${item.name} is down to ${item.quantity} ${item.unit} (reorder level: ${item.minThreshold}).`,
      type: 'inventory',
      timestamp: 'Just now',
      read: false,
      actionTab: 'inventory'
    };
    setNotifications(prev => [alertItem, ...prev]);
    playNotificationChime();
  };

  const handleDispatchTaskAlert = (task: FarmTask) => {
    const alertTask: NotificationItem = {
      id: `alert-task-${task.id}-${Date.now()}`,
      title: '⏰ Scheduled Task Reminder',
      message: `${task.title} (${task.priority} Priority) is due today in ${task.fieldSector}.`,
      type: 'task',
      timestamp: 'Just now',
      read: false,
      actionTab: 'tasks'
    };
    setNotifications(prev => [alertTask, ...prev]);
    playNotificationChime();
  };

  const handlePublishToMarketplace = (item: InventoryItem) => {
    const newProduct: MarketplaceProduct = {
      id: `prod-inv-${item.id}-${Date.now()}`,
      title: item.name,
      category: item.category === 'Seeds' ? 'Seeds' : 'Grains & Cereals',
      price: item.costPerUnit * 1.15,
      unit: item.unit,
      availableStock: item.quantity,
      farmerName: user?.displayName || 'Mallikarjun Patil (Verified Farmer)',
      farmerLocation: `${selectedDistrict}, Karnataka`,
      isVerified: true,
      imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
      description: `Harvested produce synchronized directly from Farm Inventory (${item.location}). Quality guaranteed.`,
      qualityGrade: 'Grade A (Organic)',
      isFarmerProduce: true,
      harvestDate: 'Freshly harvested'
    };
    setProducts(prev => [newProduct, ...prev]);

    const notif: NotificationItem = {
      id: `notif-pub-${Date.now()}`,
      title: '🛍️ Produce Published to Marketplace',
      message: `${item.name} (${item.quantity} ${item.unit}) is now live for consumers in the Direct Marketplace.`,
      type: 'order',
      timestamp: 'Just now',
      read: false,
      actionTab: 'marketplace'
    };
    setNotifications(prev => [notif, ...prev]);
    playNotificationChime();
  };

  // Cart operations
  const handleAddToCart = (product: MarketplaceProduct, quantity = 1) => {
    const qty = Math.max(1, quantity);
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { product, quantity: qty }];
    });
    playNotificationChime();
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity } : i));
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  // 1-Click Reorder for Single Product
  const handleReorderProduct = (product: MarketplaceProduct, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setIsCartOpen(true);
  };

  // 1-Click Reorder for Entire Order Basket
  const handleReorderBasket = (items: CartItem[]) => {
    setCart(prev => {
      let updated = [...prev];
      items.forEach(newItem => {
        const existingIndex = updated.findIndex(u => u.product.id === newItem.product.id);
        if (existingIndex >= 0) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + newItem.quantity
          };
        } else {
          updated.push({ ...newItem });
        }
      });
      return updated;
    });
    setIsCartOpen(true);
  };

  // Live order tracking progress update
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setConsumerOrders(prev => prev.map(order => {
      if (order.orderId === orderId) {
        const milestones = order.trackingMilestones || [];
        const updatedMilestones = milestones.map(m => {
          if (m.stage === nextStatus) {
            return { ...m, completed: true, current: true, timestamp: 'Just now' };
          }
          if (m.current) {
            return { ...m, current: false };
          }
          return m;
        });

        const updatedOrder: ConsumerOrder = {
          ...order,
          status: nextStatus,
          trackingMilestones: updatedMilestones
        };

        if (user) {
          try {
            setDoc(doc(db, 'users', user.uid, 'orders', orderId), updatedOrder, { merge: true });
          } catch (e) {
            console.warn('Order status sync warning:', e);
          }
        }

        return updatedOrder;
      }
      return order;
    }));

    const statusNotif: NotificationItem = {
      id: `notif-track-${Date.now()}`,
      title: `🚚 Order #${orderId} Updated`,
      message: `Shipment status advanced to: ${nextStatus}. Track live farm transit on Purchase History.`,
      type: 'order',
      timestamp: 'Just now',
      read: false,
      actionTab: 'purchase-history'
    };
    setNotifications(prev => [statusNotif, ...prev]);
  };

  // Checkout complete handler - creates a ConsumerOrder and logs to state & Firestore
  const handleCheckoutComplete = async (orderData: { 
    items: CartItem[]; 
    total: number; 
    paymentMode: string; 
    orderId?: string;
    transactionId?: string;
    consumerDetails?: any;
  }) => {
    const { items, total, paymentMode, transactionId, consumerDetails } = orderData;

    // Deduct available stock
    setProducts(prev =>
      prev.map(p => {
        const ordered = items.find(i => i.product.id === p.id);
        if (ordered) {
          return { ...p, availableStock: Math.max(0, p.availableStock - ordered.quantity) };
        }
        return p;
      })
    );

    const generatedOrderId = orderData.orderId || `NK-${Math.floor(1000 + Math.random() * 9000)}`;
    const txn = transactionId || `TXN_UPI_${Date.now().toString().slice(-8)}_SBI`;

    const trackingMilestones: TrackingMilestone[] = [
      {
        stage: 'Confirmed',
        title: 'Payment Gateway Verified',
        description: `Instant payment authorized via ${paymentMode}. Reference: ${txn}. Escrow locked for growers.`,
        timestamp: 'Just now',
        completed: true
      },
      {
        stage: 'Harvested & Packed',
        title: 'Farm Quality Grading & Packing',
        description: 'Grower farmer sorting moisture-safe bags and attaching APMC farmgate QR pass.',
        timestamp: 'Today, within 2 hrs',
        completed: false,
        current: true
      },
      {
        stage: 'Dispatched',
        title: 'Loaded on Agri-Logistics Transport',
        description: 'Refrigerated vehicle assigned for highway transit.',
        timestamp: 'Today, 03:00 PM',
        completed: false
      },
      {
        stage: 'Out for Delivery',
        title: 'Local Hub Arrival',
        description: 'Entering local delivery corridor.',
        timestamp: 'Today, 05:00 PM',
        completed: false
      },
      {
        stage: 'Delivered',
        title: 'Doorstep Handover',
        description: 'Delivery handover and digital inspection.',
        timestamp: 'Today, 06:00 PM',
        completed: false
      }
    ];

    const newConsumerOrder: ConsumerOrder = {
      orderId: generatedOrderId,
      date: 'Today, Just now',
      items: [...items],
      total,
      status: 'Harvested & Packed',
      deliveryMode: consumerDetails?.deliveryMode || 'doorstep',
      deliveryAddress: consumerDetails?.address || 'Doorstep Delivery Address, Karnataka',
      consumerName: consumerDetails?.name || user?.displayName || 'Ananya Sharma',
      consumerPhone: consumerDetails?.phone || (user as any)?.phone || '9876543210',
      paymentMode,
      transactionId: txn,
      gatewayStatus: 'SUCCESS',
      driverName: 'Manjunath Kariyappa (Agri-Express)',
      driverPhone: '9448123988',
      vehicleNumber: 'KA-25-EA-8842',
      estimatedDelivery: 'Today by 06:00 PM',
      trackingMilestones,
      isFavorite: true,
      rated: false
    };

    setConsumerOrders(prev => [newConsumerOrder, ...prev]);

    // Persist order to SQLite MVC backend
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConsumerOrder)
    }).catch(e => console.warn('SQLite order sync note:', e));

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'orders', generatedOrderId), newConsumerOrder, { merge: true });
      } catch (e) {
        console.warn('Order sync warning:', e);
      }
    }

    const orderNotif: NotificationItem = {
      id: `notif-order-${Date.now()}`,
      title: '📦 Farm Purchase Confirmed',
      message: `Order #${generatedOrderId} for ₹${total.toLocaleString()} confirmed via ${paymentMode} (Txn: ${txn}). Fresh produce is being harvested!`,
      type: 'order',
      timestamp: 'Just now',
      read: false,
      actionTab: 'purchase-history'
    };
    setNotifications(prev => [orderNotif, ...prev]);
    setCart([]);
  };

  // Add star review handler for consumers rating farmers after delivery
  const handleAddReview = (productId: string, rating: number, comment: string, orderId: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const existingReviews = p.reviews || [];
        const newReview: ProductReview = {
          id: `rev-${Date.now()}`,
          consumerName: user?.displayName || 'Verified Direct Buyer',
          rating,
          comment,
          date: 'Just now',
          verifiedDelivery: true
        };
        const allReviews = [newReview, ...existingReviews];
        const newAvg = Number((allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1));
        return {
          ...p,
          rating: newAvg,
          reviewCount: allReviews.length,
          reviews: allReviews
        };
      }
      return p;
    }));

    // Mark order as rated
    setConsumerOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, rated: true, rating, feedback: comment } : o));

    // Persist rating to SQLite MVC backend
    fetch('/api/orders/rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, rating, feedback: comment })
    }).catch(e => console.warn('SQLite rating sync note:', e));

    const rateNotif: NotificationItem = {
      id: `notif-rate-${Date.now()}`,
      title: '⭐ Farmer Star Rating Submitted',
      message: `You rated your farmer ${rating} stars! This review has been published directly to the produce page to build community trust.`,
      type: 'order',
      timestamp: 'Just now',
      read: false,
      actionTab: 'marketplace'
    };
    setNotifications(prev => [rateNotif, ...prev]);
    playNotificationChime();
  };

  // Render Auth Stage if requested
  if (showAuthStage) {
    return (
      <AuthScreen
        onAuthSuccess={(authenticatedUser) => {
          setUser(authenticatedUser);
          const role: UserRole = authenticatedUser.role || 'consumer';
          setUserRole(role);
          try {
            localStorage.setItem('nammakrushi_user_role', role);
          } catch (e) {}

          if (role === 'consumer') {
            handleNavigateTab('marketplace');
          } else {
            handleNavigateTab('dashboard');
          }
          setShowAuthStage(false);

          if (authenticatedUser.district || authenticatedUser.farmDistrict) {
            setSelectedDistrict(authenticatedUser.district || authenticatedUser.farmDistrict);
          }
          playNotificationChime();
        }}
        onContinueAsGuest={() => setShowAuthStage(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col selection:bg-emerald-200 selection:text-emerald-950">
      
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onTabChange={handleNavigateTab}
        selectedDistrict={selectedDistrict}
        onDistrictChange={setSelectedDistrict}
        weather={weather}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        user={user}
        userRole={userRole}
        onToggleUserRole={handleToggleUserRole}
        onOpenAuthScreen={() => setShowAuthStage(true)}
        onSignOut={handleSignOut}
        onOpenMvcInspector={() => setIsMvcInspectorOpen(true)}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Consumer View: Marketplace (Direct from Farmer) */}
        {currentTab === 'marketplace' && (
          <Marketplace
            products={products}
            cart={cart}
            onAddToCart={handleAddToCart}
            onOpenCart={() => setIsCartOpen(true)}
            onAddProduct={(newProd) => {
              setProducts(prev => [newProd, ...prev]);
              fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProd)
              }).catch(e => console.warn('SQLite product sync note:', e));
            }}
            onSimulateOrder={(items, total) => handleCheckoutComplete({ items, total, paymentMode: 'UPI' })}
            userRole={userRole}
            onNavigateConsumerOrders={() => handleNavigateTab('purchase-history')}
          />
        )}

        {/* Consumer Purchase History, 1-Click Reorder & Live Order Tracking */}
        {(currentTab === 'purchase-history' || currentTab === 'consumer-orders') && (
          <PurchaseHistory
            orders={consumerOrders}
            products={products}
            onReorderProduct={handleReorderProduct}
            onReorderBasket={handleReorderBasket}
            onAddReview={handleAddReview}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onNavigateMarketplace={() => handleNavigateTab('marketplace')}
          />
        )}

        {/* Farm Dashboard (Farmer primary screen) */}
        {currentTab === 'dashboard' && (
          <Dashboard
            district={selectedDistrict}
            onDistrictChange={setSelectedDistrict}
            weather={weather}
            inventory={inventory}
            tasks={tasks}
            notifications={notifications}
            onNavigateTab={handleNavigateTab}
            onOpenGuideModal={() => setIsGuideModalOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
          />
        )}

        {/* AI Assistant */}
        {currentTab === 'chatbot' && (
          <Chatbot
            district={selectedDistrict}
            weatherInfo={weather ? `${weather.temp}°C, ${weather.condition}, ${weather.humidity}% RH` : undefined}
          />
        )}

        {/* Smart Inventory (Farmer) */}
        {currentTab === 'inventory' && (
          <InventoryManager
            inventory={inventory}
            onUpdateInventory={handleUpdateInventory}
            onItemLowStockTrigger={handleItemLowStockTrigger}
            onNavigateTab={handleNavigateTab}
            onPublishToMarketplace={handlePublishToMarketplace}
          />
        )}

        {/* AI Crop Predictor (Farmer) */}
        {currentTab === 'predict' && (
          <CropPredictor
            district={selectedDistrict}
            currentWeather={weather}
          />
        )}

        {/* Task Tracker (Farmer) */}
        {currentTab === 'tasks' && (
          <TaskTracker
            tasks={tasks}
            onUpdateTasks={handleUpdateTasks}
            onDispatchTaskAlert={handleDispatchTaskAlert}
          />
        )}

        {/* Mandi Rates (Both Farmer & Consumer) */}
        {currentTab === 'market-rates' && (
          <MarketRates
            onNavigateChatbotWithQuery={() => {
              handleNavigateTab('chatbot');
            }}
          />
        )}
      </main>

      {/* Notification Center Drawer */}
      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearNotification={handleClearNotification}
        onTriggerCheck={triggerAutomatedCheck}
        onNavigateTab={handleNavigateTab}
      />

      {/* Cart Drawer with Valid Payment Gateway */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckoutComplete={handleCheckoutComplete}
        onNavigateTracking={() => handleNavigateTab('purchase-history')}
      />

      {/* Guide Review & Progress Diary Modal */}
      <GuideReviewModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        onNavigateTab={handleNavigateTab}
      />

      {/* MERN & SQLite MVC Architecture Inspector Modal */}
      <MvcRouteInspectorModal
        isOpen={isMvcInspectorOpen}
        onClose={() => setIsMvcInspectorOpen(false)}
        currentTab={currentTab}
        onNavigateTab={handleNavigateTab}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 mt-12 py-6 text-stone-500 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-stone-900">NammaKrushi (ನಮ್ಮ ಕೃಷಿ)</span>
            <span>• Direct Farm-to-Consumer & Smart Agriculture Platform</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-stone-400">
              Empowering Karnataka Farmers with Direct Consumer Sales, Valid Payment Gateway & 1-Click Reorders
            </span>
            <button
              onClick={() => setIsMvcInspectorOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] transition cursor-pointer whitespace-nowrap"
            >
              ⚙️ SQLite MVC & Routes
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
