import { getDatabase } from '../database/sqlite.ts';
import { ConsumerOrder } from '../../types/index.ts';

export class OrderModel {
  static findAll(): ConsumerOrder[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all() as any[];

    return rows.map(r => ({
      orderId: r.orderId,
      date: r.date,
      status: r.status,
      deliveryMode: r.deliveryMode,
      deliveryAddress: r.deliveryAddress,
      consumerName: r.consumerName,
      consumerPhone: r.consumerPhone,
      paymentMode: r.paymentMode,
      transactionId: r.transactionId,
      gatewayStatus: r.gatewayStatus,
      driverName: r.driverName,
      driverPhone: r.driverPhone,
      vehicleNumber: r.vehicleNumber,
      estimatedDelivery: r.estimatedDelivery,
      total: Number(r.total),
      isFavorite: Boolean(r.isFavorite),
      rated: Boolean(r.rated),
      rating: r.rating ? Number(r.rating) : undefined,
      feedback: r.feedback || undefined,
      items: JSON.parse(r.itemsJson || '[]'),
      trackingMilestones: JSON.parse(r.trackingMilestonesJson || '[]')
    }));
  }

  static findById(orderId: string): ConsumerOrder | null {
    const db = getDatabase();
    const r = db.prepare('SELECT * FROM orders WHERE orderId = ?').get(orderId) as any;
    if (!r) return null;

    return {
      orderId: r.orderId,
      date: r.date,
      status: r.status,
      deliveryMode: r.deliveryMode,
      deliveryAddress: r.deliveryAddress,
      consumerName: r.consumerName,
      consumerPhone: r.consumerPhone,
      paymentMode: r.paymentMode,
      transactionId: r.transactionId,
      gatewayStatus: r.gatewayStatus,
      driverName: r.driverName,
      driverPhone: r.driverPhone,
      vehicleNumber: r.vehicleNumber,
      estimatedDelivery: r.estimatedDelivery,
      total: Number(r.total),
      isFavorite: Boolean(r.isFavorite),
      rated: Boolean(r.rated),
      rating: r.rating ? Number(r.rating) : undefined,
      feedback: r.feedback || undefined,
      items: JSON.parse(r.itemsJson || '[]'),
      trackingMilestones: JSON.parse(r.trackingMilestonesJson || '[]')
    };
  }

  static create(order: ConsumerOrder): ConsumerOrder {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO orders (
        orderId, date, status, deliveryMode, deliveryAddress, consumerName,
        consumerPhone, paymentMode, transactionId, gatewayStatus, driverName,
        driverPhone, vehicleNumber, estimatedDelivery, total, isFavorite, rated,
        rating, feedback, itemsJson, trackingMilestonesJson
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      order.orderId,
      order.date,
      order.status,
      order.deliveryMode,
      order.deliveryAddress,
      order.consumerName,
      order.consumerPhone,
      order.paymentMode,
      order.transactionId || '',
      order.gatewayStatus || 'SUCCESS',
      order.driverName || '',
      order.driverPhone || '',
      order.vehicleNumber || '',
      order.estimatedDelivery || '',
      order.total,
      order.isFavorite ? 1 : 0,
      order.rated ? 1 : 0,
      order.rating || null,
      order.feedback || null,
      JSON.stringify(order.items || []),
      JSON.stringify(order.trackingMilestones || [])
    );

    return order;
  }

  static updateRating(orderId: string, rating: number, feedback: string): boolean {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE orders 
      SET rated = 1, rating = ?, feedback = ?
      WHERE orderId = ?
    `);
    const result = stmt.run(rating, feedback, orderId);
    return Number(result.changes) > 0;
  }
}
