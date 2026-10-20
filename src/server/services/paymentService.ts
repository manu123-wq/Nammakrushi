/**
 * Payment Service Interface & Mock Provider Implementation
 * Standardized payment gateway layer for Cash on Delivery (COD) and UPI
 * Easily pluggable with Razorpay / Cashfree / PayU UPI Collect APIs
 */

export interface PaymentRequest {
  orderId: string;
  amount: number;
  upiId: string;
  consumerName: string;
}

export interface PaymentResult {
  paymentId: string;
  transactionRef: string;
  status: 'pending' | 'success' | 'failed';
  maskedUpiId: string;
  message: string;
  createdAt: string;
}

export interface IPaymentService {
  requestUpi(req: PaymentRequest): Promise<PaymentResult>;
  getStatus(paymentId: string): Promise<PaymentResult | null>;
  simulateStatus(paymentId: string, targetStatus: 'success' | 'failed'): Promise<PaymentResult | null>;
}

// In-memory or SQLite payment store for active gateway requests
const activePayments = new Map<string, PaymentResult>();

export class MockUpiPaymentService implements IPaymentService {
  /**
   * Masks a UPI ID (e.g., ananya.sharma@okaxis -> an***a@okaxis)
   */
  public static maskUpi(upiId: string): string {
    const parts = upiId.split('@');
    if (parts.length !== 2) return '***@upi';
    const handle = parts[0];
    const bank = parts[1];
    if (handle.length <= 2) {
      return `${handle[0]}*@${bank}`;
    }
    return `${handle.slice(0, 2)}***${handle.slice(-1)}@${bank}`;
  }

  async requestUpi(req: PaymentRequest): Promise<PaymentResult> {
    const paymentId = `PAY-UPI-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const transactionRef = `UPI/RR-${Date.now()}/${Math.floor(100000 + Math.random() * 900000)}`;
    const masked = MockUpiPaymentService.maskUpi(req.upiId);

    const result: PaymentResult = {
      paymentId,
      transactionRef,
      status: 'pending',
      maskedUpiId: masked,
      message: `Collect request initiated to ${masked}. Please approve on your UPI app.`,
      createdAt: new Date().toISOString()
    };

    activePayments.set(paymentId, result);
    return result;
  }

  async getStatus(paymentId: string): Promise<PaymentResult | null> {
    return activePayments.get(paymentId) || null;
  }

  async simulateStatus(paymentId: string, targetStatus: 'success' | 'failed'): Promise<PaymentResult | null> {
    const existing = activePayments.get(paymentId);
    if (!existing) return null;
    existing.status = targetStatus;
    existing.message = targetStatus === 'success' 
      ? 'Payment received and verified by UPI banking network.' 
      : 'Payment declined by customer or bank server timed out.';
    activePayments.set(paymentId, existing);
    return existing;
  }
}

export const paymentService = new MockUpiPaymentService();
