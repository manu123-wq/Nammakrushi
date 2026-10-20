export type TabType = 
  | 'dashboard'
  | 'chatbot'
  | 'inventory'
  | 'predict'
  | 'marketplace'
  | 'tasks'
  | 'market-rates'
  | 'purchase-history'
  | 'consumer-orders'
  | 'order-tracking'
  | 'farmer-orders'
  | 'admin';

export type UserRole = 'farmer' | 'consumer' | 'admin';

export type OrderStatus = 
  | 'placed' 
  | 'confirmed' 
  | 'preparing' 
  | 'ready_for_pickup' 
  | 'in_transit' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'rejected' 
  | 'cancelled'
  | 'Confirmed' 
  | 'Harvested & Packed' 
  | 'Dispatched' 
  | 'Out for Delivery' 
  | 'Delivered';

export interface TrackingMilestone {
  stage: string;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
  current?: boolean;
}

export interface OrderStatusHistoryItem {
  id: string;
  order_id: string;
  status: string;
  note: string;
  updated_by: string;
  created_at: string;
}

export interface ShipmentDetails {
  id?: string;
  order_id?: string;
  tracking_id?: string;
  carrier_name?: string;
  vehicle_number?: string;
  driver_name?: string;
  driver_phone?: string;
  pickup_timestamp?: string;
  transit_timestamp?: string;
  out_for_delivery_timestamp?: string;
  delivery_timestamp?: string;
  status?: string;
  current_location_note?: string;
  delivery_confirmation_code?: string;
  notes?: string;
}

export interface ConsumerOrder {
  orderId: string;
  parent_order_id?: string | null;
  farmer_id?: string | null;
  farmerName?: string;
  farmerLocation?: string;
  farmerPhone?: string;
  isFarmerVerified?: boolean;
  date: string;
  items: CartItem[];
  subtotal?: number;
  deliveryCharge?: number;
  total: number;
  status: string;
  rejectionReason?: string;
  deliveryMode: 'doorstep' | 'pickup';
  deliveryAddress: string;
  consumerName: string;
  consumerPhone: string;
  paymentMode: string;
  paymentStatus?: string;
  transactionId?: string;
  gatewayStatus?: 'SUCCESS' | 'PENDING' | 'FAILED';
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  carrierName?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  trackingMilestones?: TrackingMilestone[];
  statusHistory?: OrderStatusHistoryItem[];
  shipment?: ShipmentDetails;
  isFavorite?: boolean;
  rated?: boolean;
  rating?: number;
  feedback?: string;
  createdAt?: string;
  childOrders?: ConsumerOrder[];
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
  seller_id?: string;
  title: string;
  category: 'Grains & Cereals' | 'Pulses' | 'Vegetables' | 'Fruits' | 'Seeds' | 'Fertilizers' | 'Farm Implements';
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
