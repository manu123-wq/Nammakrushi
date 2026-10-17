import { OrderModel } from '../models/OrderModel.ts';
import { ConsumerOrder } from '../../types/index.ts';

export const OrderController = {
  getAll: () => {
    return {
      success: true,
      orders: OrderModel.findAll()
    };
  },

  getById: (orderId: string) => {
    const order = OrderModel.findById(orderId);
    if (!order) {
      return { success: false, error: 'Order not found' };
    }
    return { success: true, order };
  },

  create: (data: Partial<ConsumerOrder>) => {
    const orderNumber = data.orderId || `NK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: ConsumerOrder = {
      orderId: orderNumber,
      date: data.date || 'Today, Just now',
      status: data.status || 'Confirmed',
      deliveryMode: data.deliveryMode || 'doorstep',
      deliveryAddress: data.deliveryAddress || '#104, Green Glen Layout, Bengaluru',
      consumerName: data.consumerName || 'Ananya Sharma',
      consumerPhone: data.consumerPhone || '9876543210',
      paymentMode: data.paymentMode || 'UPI (Direct Escrow)',
      transactionId: data.transactionId || `TXN_${Date.now().toString().slice(-8)}`,
      gatewayStatus: 'SUCCESS',
      driverName: data.driverName || 'Manjunath Kariyappa (Agri-Logistics)',
      driverPhone: data.driverPhone || '9448123988',
      vehicleNumber: data.vehicleNumber || 'KA-25-EA-8842',
      estimatedDelivery: data.estimatedDelivery || 'Within 24 Hours',
      total: Number(data.total || 0),
      isFavorite: Boolean(data.isFavorite),
      rated: false,
      items: data.items || [],
      trackingMilestones: data.trackingMilestones || [
        {
          stage: 'Confirmed',
          title: 'Order & Payment Verified in Escrow',
          description: 'Payment verified and held safely in direct farmer escrow account.',
          timestamp: 'Just now',
          completed: true,
          current: true
        },
        {
          stage: 'Harvested & Packed',
          title: 'Weighing & Quality Sealing at Farm',
          description: 'Weighed in kilograms and packed in certified tamper-proof packaging.',
          timestamp: 'Scheduled',
          completed: false
        },
        {
          stage: 'Dispatched',
          title: 'Dispatched via Direct Cold-Chain Van',
          description: 'Transit toward city distribution hub.',
          timestamp: 'Scheduled',
          completed: false
        },
        {
          stage: 'Delivered',
          title: 'Doorstep Handover',
          description: 'Digital OTP verification at consumer delivery.',
          timestamp: 'Scheduled',
          completed: false
        }
      ]
    };

    const saved = OrderModel.create(newOrder);
    return { success: true, order: saved };
  },

  submitRating: (orderId: string, rating: number, feedback: string) => {
    const success = OrderModel.updateRating(orderId, rating, feedback);
    return { success, message: success ? 'Rating saved' : 'Order not found' };
  }
};
