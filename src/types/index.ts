export type TabType = 
  | 'dashboard'
  | 'chatbot'
  | 'inventory'
  | 'predict'
  | 'marketplace'
  | 'tasks'
  | 'market-rates'
  | 'purchase-history'
  | 'consumer-orders';

export type UserRole = 'farmer' | 'consumer';

export type OrderStatus = 'Confirmed' | 'Harvested & Packed' | 'Dispatched' | 'Out for Delivery' | 'Delivered';

export interface TrackingMilestone {
  stage: OrderStatus;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
  current?: boolean;
}

export interface ConsumerOrder {
  orderId: string;
  date: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  deliveryMode: 'doorstep' | 'pickup';
  deliveryAddress: string;
  consumerName: string;
  consumerPhone: string;
  paymentMode: string;
  transactionId?: string;
  gatewayStatus?: 'SUCCESS' | 'PENDING' | 'FAILED';
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  estimatedDelivery?: string;
  trackingMilestones?: TrackingMilestone[];
  isFavorite?: boolean;
  rated?: boolean;
  rating?: number;
  feedback?: string;
}

export interface UserProfile {
  uid: string;
  email?: string;
  phone?: string;
  displayName: string;
  role: UserRole;
  district?: string;
  farmAcres?: number;
  deliveryAddress?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Seeds' | 'Fertilizers' | 'Pesticides' | 'Tools & Equipment' | 'Harvested Produce' | 'Livestock Feed';
  quantity: number;
  unit: 'kg' | 'quintals' | 'liters' | 'bags' | 'units' | 'tonnes';
  minThreshold: number; // Reorder level
  costPerUnit: number;
  location: string;
  lastUpdated: string;
  notes?: string;
}

export interface FarmTask {
  id: string;
  title: string;
  category: 'Sowing' | 'Irrigation' | 'Fertilization' | 'Pest Control' | 'Harvesting' | 'Equipment Maintenance';
  dueDate: string; // YYYY-MM-DD
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Completed';
  fieldSector: string;
  assignedTo?: string;
  notes?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'urgent' | 'task' | 'inventory' | 'weather' | 'order';
  timestamp: string;
  read: boolean;
  actionTab?: TabType;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  references?: string[];
}

export interface ProductReview {
  id: string;
  consumerName: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  verifiedDelivery: boolean;
}

export interface MarketplaceProduct {
  id: string;
  title: string;
  category: 'Grains & Cereals' | 'Pulses' | 'Vegetables' | 'Seeds' | 'Fertilizers' | 'Farm Implements';
  price: number;
  unit: string;
  availableStock: number;
  farmerName: string;
  farmerLocation: string;
  farmerPhone?: string;
  isVerified: boolean;
  imageUrl: string;
  description: string;
  qualityGrade: 'Grade A (Organic)' | 'Grade A' | 'Grade B';
  rating?: number; // 1.0 to 5.0
  reviewCount?: number;
  reviews?: ProductReview[];
  isFarmerProduce?: boolean;
  harvestDate?: string;
  batchNumber?: string;
  traceabilityId?: string;
}

export interface TransportLogStep {
  id: string;
  stage: string;
  timestamp: string;
  location: string;
  vehicle: string;
  temperature?: string;
  driverName?: string;
  driverPhone?: string;
  status: 'completed' | 'in-progress' | 'scheduled';
  details: string;
}

export interface FarmTraceability {
  productId: string;
  productTitle: string;
  batchNumber: string;
  harvestDate: string;
  harvestTimestamp: string;
  farmLocation: {
    village: string;
    taluk: string;
    district: string;
    state: string;
    coordinates: string;
    mapUrl: string;
    surveyNumber: string;
    farmSizeAcres: number;
  };
  farmerDetails: {
    name: string;
    phone: string;
    photoUrl?: string;
    certification: string;
    farmingPractice: string;
  };
  qualityMetrics: {
    grade: string;
    moistureContent: string;
    pesticideResidue: string;
    organicStatus: string;
    testReportId: string;
  };
  transportLogs: TransportLogStep[];
  verificationHash: string;
  qrPayload: string;
}

export interface CartItem {
  product: MarketplaceProduct;
  quantity: number;
}



export interface MarketRate {
  crop: string;
  mandi: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  trend: 'up' | 'down' | 'steady';
  change: string;
  arrivals: string;
}

export interface CropPredictionResult {
  top3: {
    crop: string;
    confidence: number;
    riskBand: 'Low' | 'Medium' | 'High';
    estimatedYield: string;
    sowingSeason: string;
    waterRequirement: string;
    profitEstimate: string;
    rationale: string;
  }[];
  soilHealthAdvisory: string;
  climateSuitabilityScore: number;
}
