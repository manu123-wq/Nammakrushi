import { InventoryItem, FarmTask, NotificationItem, MarketplaceProduct, MarketRate } from '../types';

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-1',
    name: 'Neem-Coated Urea (46% N)',
    category: 'Fertilizers',
    quantity: 3, // LOW STOCK (min is 10)
    unit: 'bags',
    minThreshold: 10,
    costPerUnit: 268,
    location: 'Warehouse Shed A',
    lastUpdated: 'Today, 08:30 AM',
    notes: 'Primary nitrogen source for upcoming sugarcane top dressing.'
  },
  {
    id: 'inv-2',
    name: 'DAP (Di-Ammonium Phosphate 18:46:0)',
    category: 'Fertilizers',
    quantity: 18,
    unit: 'bags',
    minThreshold: 8,
    costPerUnit: 1350,
    location: 'Warehouse Shed A',
    lastUpdated: 'Yesterday',
    notes: 'Basal application stock for Kharif sowing.'
  },
  {
    id: 'inv-3',
    name: 'Bt Cotton Seed Hybrid (Bollgard II)',
    category: 'Seeds',
    quantity: 2, // LOW STOCK (min is 6)
    unit: 'bags',
    minThreshold: 6,
    costPerUnit: 864,
    location: 'Seed Storage Box 2',
    lastUpdated: '2 days ago',
    notes: 'Certified BG-II seeds for 4-acre plot.'
  },
  {
    id: 'inv-4',
    name: 'Maldandi Jowar (M35-1) Certified Seeds',
    category: 'Seeds',
    quantity: 45,
    unit: 'kg',
    minThreshold: 20,
    costPerUnit: 85,
    location: 'Cold Bin C',
    lastUpdated: '3 days ago',
    notes: 'Popular drought-hardy winter sorghum for Dharwad soil.'
  },
  {
    id: 'inv-5',
    name: 'Trichoderma Viride Bio-Fungicide',
    category: 'Pesticides',
    quantity: 1, // CRITICAL (min is 5)
    unit: 'liters',
    minThreshold: 5,
    costPerUnit: 340,
    location: 'Chemical Rack 1',
    lastUpdated: '5 days ago',
    notes: 'Seed treatment for root rot prevention.'
  },
  {
    id: 'inv-6',
    name: 'Drip Irrigation Inline Pipes (16mm)',
    category: 'Tools & Equipment',
    quantity: 1200,
    unit: 'units',
    minThreshold: 200,
    costPerUnit: 12,
    location: 'Tool Shed',
    lastUpdated: '1 week ago',
    notes: 'Rolls in good condition with 40cm emitter spacing.'
  },
  {
    id: 'inv-7',
    name: 'Harvested Byadgi Red Chillies',
    category: 'Harvested Produce',
    quantity: 14,
    unit: 'quintals',
    minThreshold: 2,
    costPerUnit: 38000,
    location: 'Drying Yard',
    lastUpdated: 'Today, 07:15 AM',
    notes: 'Grade A deep red color, moisture content 10%.'
  },
  {
    id: 'inv-8',
    name: 'Organic Desi Cotton Bolls',
    category: 'Harvested Produce',
    quantity: 28,
    unit: 'quintals',
    minThreshold: 5,
    costPerUnit: 7400,
    location: 'Clean Storehouse',
    lastUpdated: 'Yesterday',
    notes: 'Ready to transport to Hubballi APMC or marketplace listing.'
  }
];

export const INITIAL_TASKS: FarmTask[] = [
  {
    id: 'task-1',
    title: 'Top-dressing Urea fertilization for Sugarcane Plot',
    category: 'Fertilization',
    dueDate: new Date().toISOString().split('T')[0], // TODAY!
    priority: 'High',
    status: 'Pending',
    fieldSector: 'Sector B (North Block)',
    assignedTo: 'Manish S.B.'
  },
  {
    id: 'task-2',
    title: 'Soil moisture inspection & Drip line flushing',
    category: 'Irrigation',
    dueDate: new Date().toISOString().split('T')[0], // TODAY!
    priority: 'Medium',
    status: 'Pending',
    fieldSector: 'Sector A (Cotton Field)',
    assignedTo: 'Harish M.A.'
  },
  {
    id: 'task-3',
    title: 'Spray organic Neem oil (1500 ppm) for aphid control',
    category: 'Pest Control',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    priority: 'High',
    status: 'Pending',
    fieldSector: 'Sector C (Chilli Nursery)',
    assignedTo: 'Mallikarjun J.'
  },
  {
    id: 'task-4',
    title: 'Tractor routine engine oil check & disc plough sharpening',
    category: 'Equipment Maintenance',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    priority: 'Low',
    status: 'Pending',
    fieldSector: 'Main Workshop',
    assignedTo: 'Manjunath A.H.'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: '⏰ Task Due Today',
    message: 'Top-dressing Urea fertilization for Sugarcane Plot in Sector B is scheduled for today.',
    type: 'task',
    timestamp: 'Just now',
    read: false,
    actionTab: 'tasks'
  },
  {
    id: 'notif-2',
    title: '⚠️ Low Stock Alert: Urea & Bio-Fungicide',
    message: 'Neem-Coated Urea has only 3 bags left (reorder threshold: 10). Trichoderma Viride has 1 liter left.',
    type: 'inventory',
    timestamp: '15 mins ago',
    read: false,
    actionTab: 'inventory'
  },
  {
    id: 'notif-3',
    title: '🌦️ Local Climate Advisory: Dharwad',
    message: 'Passing afternoon showers expected. Recommended to complete field spraying before 1:00 PM.',
    type: 'weather',
    timestamp: '1 hour ago',
    read: false,
    actionTab: 'dashboard'
  },
  {
    id: 'notif-4',
    title: '🛒 Marketplace Order Received',
    message: 'Buyer Ramesh Patil placed an order for 2 Quintals of Byadgi Chilli (#ORD-7749).',
    type: 'order',
    timestamp: '2 hours ago',
    read: true,
    actionTab: 'marketplace'
  }
];

export const INITIAL_PRODUCTS: MarketplaceProduct[] = [
  {
    id: 'prod-1',
    title: 'Organic Byadgi Red Chillies (Stemless)',
    category: 'Vegetables',
    price: 395,
    unit: 'kg',
    availableStock: 1400,
    farmerName: 'Harish M.A. (Batch 09)',
    farmerLocation: 'Varur, Dharwad',
    farmerPhone: '9845012345',
    isVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=600&q=80',
    description: 'High pungent, rich red color GI-tagged Byadgi variety grown with vermicompost and zero chemical pesticides.',
    qualityGrade: 'Grade A (Organic)',
    rating: 4.9,
    reviewCount: 38,
    isFarmerProduce: true,
    harvestDate: 'Harvested 3 days ago',
    reviews: [
      {
        id: 'rev-1',
        consumerName: 'Deepak Patil (Hubballi Grocers)',
        rating: 5,
        comment: 'Outstanding quality and authentic dark red color! Direct delivery from Harish\'s farm in Varur arrived in 24 hours.',
        date: '3 days ago',
        verifiedDelivery: true
      },
      {
        id: 'rev-2',
        consumerName: 'Suresh Rao (Spice Exporters)',
        rating: 5,
        comment: 'Zero seed moisture and stemless grade. Best price without APMC middleman brokerage.',
        date: '1 week ago',
        verifiedDelivery: true
      }
    ]
  },
  {
    id: 'prod-2',
    title: 'Certified Maldandi Jowar (M35-1) Grain',
    category: 'Grains & Cereals',
    price: 42,
    unit: 'kg',
    availableStock: 2500,
    farmerName: 'Mallikarjun J.',
    farmerLocation: 'Hubballi Rural',
    farmerPhone: '9448123456',
    isVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
    description: 'Traditional pearl-white Maldandi grain, ideal for soft Karnataka jolada rotti with high dietary fiber.',
    qualityGrade: 'Grade A',
    rating: 4.8,
    reviewCount: 29,
    isFarmerProduce: true,
    harvestDate: 'Harvested 5 days ago',
    reviews: [
      {
        id: 'rev-3',
        consumerName: 'Rajeshwari Kulkarni (Consumer)',
        rating: 5,
        comment: 'Fresh harvest grain makes the softest jolada rotti. Great communication from Mallikarjun directly over phone.',
        date: '5 days ago',
        verifiedDelivery: true
      }
    ]
  },
  {
    id: 'prod-3',
    title: 'Premium Raw Bt Cotton (Medium Staple)',
    category: 'Grains & Cereals',
    price: 75,
    unit: 'kg',
    availableStock: 2800,
    farmerName: 'Manish S.B.',
    farmerLocation: 'Kundgol, Dharwad',
    farmerPhone: '9845987654',
    isVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=600&q=80',
    description: 'Freshly harvested clean white cotton bolls with minimal trash and moisture under 8%.',
    qualityGrade: 'Grade A',
    rating: 4.7,
    reviewCount: 16,
    isFarmerProduce: true,
    harvestDate: 'Harvested 1 week ago',
    reviews: [
      {
        id: 'rev-4',
        consumerName: 'Mahalakshmi Ginning Mills',
        rating: 5,
        comment: 'Low trash content and high staple strength. Clean weighing at farm gate pickup.',
        date: '2 weeks ago',
        verifiedDelivery: true
      }
    ]
  },
  {
    id: 'prod-4',
    title: 'Enriched Neem Cake Bio-Fertilizer',
    category: 'Fertilizers',
    price: 18,
    unit: 'kg',
    availableStock: 1500,
    farmerName: 'Manjunath A.H.',
    farmerLocation: 'Kalghatgi',
    farmerPhone: '9880123456',
    isVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=600&q=80',
    description: '100% pure cold-pressed neem cake. Controls nematodes and soil-borne termites while slowly releasing nitrogen.',
    qualityGrade: 'Grade A (Organic)',
    rating: 4.9,
    reviewCount: 42,
    isFarmerProduce: false, // Agricultural input/fertilizer
    reviews: [
      {
        id: 'rev-5',
        consumerName: 'Prakash Organic Farm',
        rating: 5,
        comment: 'Authentic neem aroma and great result on our sugarcane plots. Quick truck delivery.',
        date: '4 days ago',
        verifiedDelivery: true
      }
    ]
  },
  {
    id: 'prod-5',
    title: 'Solar Insect Light Trap (Field Model)',
    category: 'Farm Implements',
    price: 2400,
    unit: 'Unit',
    availableStock: 8,
    farmerName: 'Krushi Yantra Kendra',
    farmerLocation: 'Varur Industrial Area',
    farmerPhone: '9448001122',
    isVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    description: 'Automatic dusk-to-dawn UV LED trap for fruit borer, bollworm, and sucking pests. Zero electricity cost.',
    qualityGrade: 'Grade A',
    rating: 4.6,
    reviewCount: 12,
    isFarmerProduce: false, // Equipment/tool
    reviews: [
      {
        id: 'rev-6',
        consumerName: 'Vinod Hegde',
        rating: 5,
        comment: 'Trapped thousands of moths in the first week. Saves thousands on chemical spray.',
        date: '1 week ago',
        verifiedDelivery: true
      }
    ]
  },
  {
    id: 'prod-6',
    title: 'Desi Brown Chana / Bengal Gram (Annigeri-1)',
    category: 'Pulses',
    price: 64,
    unit: 'kg',
    availableStock: 1800,
    farmerName: 'Shivanand Patil',
    farmerLocation: 'Navalgund, Dharwad',
    farmerPhone: '9844556677',
    isVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    description: 'High protein drought-tolerant Annigeri-1 variety chickpeas, machine cleaned and sorted.',
    qualityGrade: 'Grade A',
    rating: 4.8,
    reviewCount: 22,
    isFarmerProduce: true,
    harvestDate: 'Harvested 4 days ago',
    reviews: [
      {
        id: 'rev-7',
        consumerName: 'Basavaraj (Dharwad Retail)',
        rating: 5,
        comment: 'Clean seeds with high germination and excellent cooking quality.',
        date: '3 days ago',
        verifiedDelivery: true
      }
    ]
  },
  {
    id: 'prod-7',
    title: 'Direct Farm Organic Sona Masoori Rice (Aged)',
    category: 'Grains & Cereals',
    price: 52,
    unit: 'kg',
    availableStock: 3500,
    farmerName: 'Suresh Gowda (Gowda Naturals)',
    farmerLocation: 'Mandya / Gangavathi belt',
    farmerPhone: '9740123987',
    isVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    description: '1-year aged aromatic lightweight Sona Masoori grain. Grown with Jeevamrutha organic bio-manure without synthetic chemicals.',
    qualityGrade: 'Grade A (Organic)',
    rating: 5.0,
    reviewCount: 47,
    isFarmerProduce: true,
    harvestDate: 'Harvested & aged 6 months',
    reviews: [
      {
        id: 'rev-8',
        consumerName: 'Smita Hegde (Bengaluru)',
        rating: 5,
        comment: 'Pure fragrance when cooked. Knowing we buy directly from Suresh without mandi commission makes all the difference!',
        date: 'Yesterday',
        verifiedDelivery: true
      }
    ]
  },
  {
    id: 'prod-8',
    title: 'Fresh Farmgate Desi Country Tomatoes',
    category: 'Vegetables',
    price: 35,
    unit: 'kg',
    availableStock: 1000,
    farmerName: 'Basavaraj Patil (Farmer)',
    farmerLocation: 'Tadkod, Dharwad',
    farmerPhone: '9845112233',
    isVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    description: 'Naturally ripened on the vine, firm and tangy desi tomatoes picked at dawn. Zero carbide or cold storage treatment.',
    qualityGrade: 'Grade A',
    rating: 4.9,
    reviewCount: 31,
    isFarmerProduce: true,
    harvestDate: 'Freshly plucked today morning',
    reviews: [
      {
        id: 'rev-9',
        consumerName: 'Karthik Rao (Hubballi Consumer)',
        rating: 5,
        comment: 'So fresh they lasted two weeks without losing crispness. Great farmgate price.',
        date: '2 days ago',
        verifiedDelivery: true
      }
    ]
  },
  {
    id: 'prod-9',
    title: 'High Curcumin Organic Turmeric Rhizomes',
    category: 'Vegetables',
    price: 95,
    unit: 'kg',
    availableStock: 1200,
    farmerName: 'Anusuya Biradar (Women Farmer Self-Help)',
    farmerLocation: 'Bagalkote Rural',
    farmerPhone: '9900223344',
    isVerified: true,
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
    description: 'Salem & Rajapuri high-curcumin (5.2%) sun-dried turmeric fingers. Cleaned and cured on farm premises.',
    qualityGrade: 'Grade A (Organic)',
    rating: 5.0,
    reviewCount: 19,
    isFarmerProduce: true,
    harvestDate: 'Sun-dried last week',
    reviews: [
      {
        id: 'rev-10',
        consumerName: 'Dr. Meenakshi (Ayurvedic Practitioner)',
        rating: 5,
        comment: 'Remarkable aroma and laboratory-tested purity. Direct delivery in moisture-proof gunny bags.',
        date: '4 days ago',
        verifiedDelivery: true
      }
    ]
  }
];

export const INITIAL_CONSUMER_ORDERS: import('../types').ConsumerOrder[] = [
  {
    orderId: 'NK-9234',
    date: 'Today, 09:15 AM',
    status: 'Dispatched',
    deliveryMode: 'doorstep',
    deliveryAddress: '#104, Green Glen Layout, Indiranagar, Bengaluru - 560038',
    consumerName: 'Ananya Sharma',
    consumerPhone: '9876543210',
    paymentMode: 'UPI (GPay / PhonePe)',
    transactionId: 'TXN_UPI_98241042_SBI',
    gatewayStatus: 'SUCCESS',
    driverName: 'Manjunath Kariyappa (Agri-Express)',
    driverPhone: '9448123988',
    vehicleNumber: 'KA-25-EA-8842 (Refrigerated Produce Van)',
    estimatedDelivery: 'Today by 4:45 PM',
    isFavorite: true,
    total: 1650,
    items: [
      {
        product: INITIAL_PRODUCTS[6], // Organic Sona Masoori Rice (₹52/kg)
        quantity: 25 // 25 kg = ₹1,300
      },
      {
        product: INITIAL_PRODUCTS[7], // Desi Country Tomatoes (₹35/kg)
        quantity: 10 // 10 kg = ₹350
      }
    ],
    trackingMilestones: [
      {
        stage: 'Confirmed',
        title: 'Payment Gateway Confirmed',
        description: 'Instant UPI transaction verified via SBI Gateway (Ref: TXN_UPI_98241042_SBI). 100% funds held in escrow for growers.',
        timestamp: 'Today, 09:15 AM',
        completed: true
      },
      {
        stage: 'Harvested & Packed',
        title: 'Harvested & Quality Graded at Farm',
        description: 'Suresh Gowda & Basavaraj Patil inspected, weighed 35 kg produce and bagged into certified moisture-safe packaging.',
        timestamp: 'Today, 10:45 AM',
        completed: true
      },
      {
        stage: 'Dispatched',
        title: 'Loaded on Agri-Logistics Truck (KA-25-EA-8842)',
        description: 'Truck carrying 35 kg farm produce dispatched towards Bengaluru hub. Driver: Manjunath K. (+91 9448123988).',
        timestamp: 'Today, 12:30 PM',
        completed: true,
        current: true
      },
      {
        stage: 'Out for Delivery',
        title: 'Arriving at City Hub & Local Transit',
        description: 'Passing Tumakuru toll. Local delivery executive preparing Indiranagar route.',
        timestamp: 'Estimated 03:45 PM',
        completed: false
      },
      {
        stage: 'Delivered',
        title: 'Doorstep Delivery & Freshness Handover',
        description: 'Direct farmgate produce handed over to Ananya Sharma. Digital OTP signature.',
        timestamp: 'Estimated 04:45 PM',
        completed: false
      }
    ],
    rated: false
  },
  {
    orderId: 'NK-8421',
    date: '12 Oct 2026',
    status: 'Delivered',
    deliveryMode: 'doorstep',
    deliveryAddress: '#104, Green Glen Layout, Indiranagar, Bengaluru - 560038',
    consumerName: 'Ananya Sharma',
    consumerPhone: '9876543210',
    paymentMode: 'RuPay Debit Card',
    transactionId: 'TXN_CARD_88710294_ICICI',
    gatewayStatus: 'SUCCESS',
    driverName: 'Ramesh Naik',
    driverPhone: '9880199221',
    vehicleNumber: 'KA-22-B-9912',
    estimatedDelivery: 'Delivered on 12 Oct',
    isFavorite: true,
    total: 1975,
    items: [
      {
        product: INITIAL_PRODUCTS[0], // Organic Byadgi Red Chillies (₹395/kg)
        quantity: 5 // 5 kg = ₹1,975
      }
    ],
    trackingMilestones: [
      {
        stage: 'Confirmed',
        title: 'Card Payment Cleared',
        description: 'RuPay Card verified with 3D Secure OTP.',
        timestamp: '11 Oct 2026, 02:20 PM',
        completed: true
      },
      {
        stage: 'Harvested & Packed',
        title: 'Sun-dried Chillies Sorted',
        description: 'Harish M.A. packed 5 kg stemless Byadgi chillies at Varur farm yard.',
        timestamp: '11 Oct 2026, 04:00 PM',
        completed: true
      },
      {
        stage: 'Dispatched',
        title: 'Transit via NH-48 Express',
        description: 'Dispatched in ventilated truck.',
        timestamp: '11 Oct 2026, 08:30 PM',
        completed: true
      },
      {
        stage: 'Out for Delivery',
        title: 'Out for Delivery in Indiranagar',
        description: 'Courier executive assigned.',
        timestamp: '12 Oct 2026, 10:15 AM',
        completed: true
      },
      {
        stage: 'Delivered',
        title: 'Delivered to Doorstep',
        description: 'Successfully received 5 kg fresh Byadgi chillies inspected by Ananya Sharma.',
        timestamp: '12 Oct 2026, 12:40 PM',
        completed: true,
        current: true
      }
    ],
    rated: false
  },
  {
    orderId: 'NK-7195',
    date: '08 Oct 2026',
    status: 'Delivered',
    deliveryMode: 'pickup',
    deliveryAddress: 'Direct Farmgate Pickup: Mallikarjun J. Farm, Hubballi Rural',
    consumerName: 'Ananya Sharma',
    consumerPhone: '9876543210',
    paymentMode: 'Farmgate Cash on Delivery',
    transactionId: 'TXN_COD_7195_VERIFIED',
    gatewayStatus: 'SUCCESS',
    estimatedDelivery: 'Picked up on 08 Oct',
    total: 2100,
    isFavorite: false,
    items: [
      {
        product: INITIAL_PRODUCTS[1], // Maldandi Jowar (₹42/kg)
        quantity: 50 // 50 kg = ₹2,100
      }
    ],
    trackingMilestones: [
      {
        stage: 'Confirmed',
        title: 'Farmgate Reservation Placed',
        description: 'Reserved 50 kg Maldandi Jowar.',
        timestamp: '07 Oct 2026, 04:10 PM',
        completed: true
      },
      {
        stage: 'Delivered',
        title: 'Collected at Farm Gate',
        description: 'Buyer inspected 50 kg lot and paid cash directly to Mallikarjun J.',
        timestamp: '08 Oct 2026, 11:30 AM',
        completed: true,
        current: true
      }
    ],
    rated: true,
    rating: 5,
    feedback: 'Collected 50 kg directly at the farm gate in Hubballi Rural. The jowar grain makes the softest rotis and is super fresh!'
  }
];

export const INITIAL_MARKET_RATES: MarketRate[] = [
  { crop: 'Cotton (Bt Hybrid)', mandi: 'Hubballi APMC', minPrice: 6850, maxPrice: 7700, modalPrice: 7450, unit: 'Quintal', trend: 'up', change: '+3.2%', arrivals: '1,420 Qtl' },
  { crop: 'Jowar (Maldandi White)', mandi: 'Dharwad APMC', minPrice: 3200, maxPrice: 4150, modalPrice: 3900, unit: 'Quintal', trend: 'up', change: '+2.1%', arrivals: '890 Qtl' },
  { crop: 'Byadgi Red Chilli', mandi: 'Byadgi APMC', minPrice: 32000, maxPrice: 48500, modalPrice: 42000, unit: 'Quintal', trend: 'up', change: '+5.4%', arrivals: '620 Qtl' },
  { crop: 'Bengal Gram (Chana)', mandi: 'Kalaburagi APMC', minPrice: 5650, maxPrice: 6350, modalPrice: 6100, unit: 'Quintal', trend: 'up', change: '+1.5%', arrivals: '2,100 Qtl' },
  { crop: 'Maize (Hybrid)', mandi: 'Ranebennur APMC', minPrice: 2050, maxPrice: 2380, modalPrice: 2260, unit: 'Quintal', trend: 'steady', change: '0.0%', arrivals: '3,400 Qtl' },
  { crop: 'Soybean (Yellow)', mandi: 'Belagavi APMC', minPrice: 4250, maxPrice: 4800, modalPrice: 4620, unit: 'Quintal', trend: 'up', change: '+1.8%', arrivals: '1,200 Qtl' },
  { crop: 'Onion (Bellary Red)', mandi: 'Gadag APMC', minPrice: 1750, maxPrice: 2800, modalPrice: 2350, unit: 'Quintal', trend: 'down', change: '-4.8%', arrivals: '4,600 Qtl' },
  { crop: 'Sugarcane (Factory Price)', mandi: 'Sameerwadi Mill', minPrice: 3150, maxPrice: 3350, modalPrice: 3250, unit: 'Tonne', trend: 'steady', change: '0.0%', arrivals: 'Direct Factory' }
];
