/**
 * NammaKrushi Full REST API Router (MERN Stack + SQLite + RBAC)
 * Handles Auth (JWT), Farmer Verification, Admin Dashboard, Cart & UPI/COD Payments,
 * Task Schedule Alerts, and Farm Traceability.
 */

import type { IncomingMessage, ServerResponse } from 'http';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../database/sqlite.ts';
import { generateToken, extractAuthUser, requireAuth, requireRole, requireVerifiedFarmer } from '../middleware/auth.ts';
import { paymentService } from '../services/paymentService.ts';
import { ProductController } from '../controllers/productController.ts';
import { TraceabilityController } from '../controllers/traceabilityController.ts';
import { MarketRateController } from '../controllers/marketRateController.ts';

async function parseBody(req: IncomingMessage): Promise<any> {
  if ((req as any).body) {
    if (typeof (req as any).body === 'string') {
      try { return JSON.parse((req as any).body); } catch { return {}; }
    }
    return (req as any).body;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const text = Buffer.concat(chunks).toString('utf-8');
  try {
    return JSON.parse(text || '{}');
  } catch {
    return {};
  }
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

export async function handleMvcRoutes(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const method = req.method || 'GET';
  const rawUrl = req.url || '';
  const urlObj = new URL(rawUrl, 'http://localhost');
  const pathname = urlObj.pathname;
  const db = getDatabase();

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return true;
  }

  // --- 0. SYSTEM HEALTH ---
  if (pathname === '/api/health' && method === 'GET') {
    sendJson(res, 200, {
      status: 'healthy',
      engine: 'SQLite native DatabaseSync (node:sqlite)',
      database: 'nammakrushi.sqlite',
      auth: 'JWT with RBAC (farmer, consumer, admin)',
      scheduler: 'Active (node-cron auto-alerts enabled)',
      timestamp: new Date().toISOString()
    });
    return true;
  }

  // ==========================================
  // --- 1. AUTHENTICATION (JWT & RBAC) ---
  // ==========================================

  // POST /api/auth/register
  if (pathname === '/api/auth/register' && method === 'POST') {
    const body = await parseBody(req);
    const { email, password, name, role, phone, district, farmAcres, deliveryAddress } = body;

    if (!email || !password || !name || !role) {
      sendJson(res, 400, { success: false, error: 'Name, email, password, and role are required' });
      return true;
    }

    if (!['farmer', 'consumer'].includes(role)) {
      sendJson(res, 400, { success: false, error: 'Registration allowed for farmer or consumer roles only. Admin is provisioned via seed.' });
      return true;
    }

    // Check existing email
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      sendJson(res, 409, { success: false, error: 'Account with this email already exists' });
      return true;
    }

    const userId = `usr-${role}-${Date.now()}`;
    const passwordHash = bcrypt.hashSync(password, 10);

    try {
      db.exec('BEGIN TRANSACTION;');

      db.prepare(`
        INSERT INTO users (id, email, phone, password_hash, name, role, is_blocked, district)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?)
      `).run(userId, email.toLowerCase().trim(), phone || '', passwordHash, name.trim(), role, district || 'Dharwad');

      if (role === 'farmer') {
        db.prepare(`
          INSERT INTO farmer_profiles (user_id, verification_status, farm_acres, district)
          VALUES (?, 'unverified', ?, ?)
        `).run(userId, Number(farmAcres) || 0, district || 'Dharwad');
      }

      db.exec('COMMIT;');

      const token = generateToken({
        id: userId,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        role,
        district: district || 'Dharwad',
        verificationStatus: role === 'farmer' ? 'unverified' : undefined
      });

      sendJson(res, 201, {
        success: true,
        token,
        user: {
          id: userId,
          email: email.toLowerCase().trim(),
          name: name.trim(),
          role,
          district: district || 'Dharwad',
          verificationStatus: role === 'farmer' ? 'unverified' : undefined
        }
      });
    } catch (err: any) {
      db.exec('ROLLBACK;');
      sendJson(res, 500, { success: false, error: err.message });
    }
    return true;
  }

  // POST /api/auth/login
  if (pathname === '/api/auth/login' && method === 'POST') {
    const body = await parseBody(req);
    const { identifier, password } = body;

    if (!identifier || !password) {
      sendJson(res, 400, { success: false, error: 'Email/phone and password are required' });
      return true;
    }

    const trimmed = identifier.trim().toLowerCase();
    const userRow = db.prepare(`
      SELECT * FROM users WHERE email = ? OR phone = ?
    `).get(trimmed, trimmed) as any;

    if (!userRow) {
      sendJson(res, 401, { success: false, error: 'Invalid credentials. User not found.' });
      return true;
    }

    if (userRow.is_blocked) {
      sendJson(res, 403, { success: false, error: 'Your account has been suspended by administration. Please contact support.' });
      return true;
    }

    const passwordMatch = bcrypt.compareSync(password, userRow.password_hash);
    if (!passwordMatch) {
      sendJson(res, 401, { success: false, error: 'Incorrect password.' });
      return true;
    }

    let verificationStatus: string | undefined = undefined;
    if (userRow.role === 'farmer') {
      const profile = db.prepare('SELECT verification_status FROM farmer_profiles WHERE user_id = ?').get(userRow.id) as any;
      verificationStatus = profile?.verification_status || 'unverified';
    }

    const authUser = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      role: userRow.role as 'farmer' | 'consumer' | 'admin',
      district: userRow.district,
      verificationStatus: verificationStatus as any
    };

    const token = generateToken(authUser);

    sendJson(res, 200, {
      success: true,
      token,
      user: authUser
    });
    return true;
  }

  // GET /api/auth/me
  if (pathname === '/api/auth/me' && method === 'GET') {
    const authUser = requireAuth(req, res);
    if (!authUser) return true;

    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(authUser.id) as any;
    if (!userRow) {
      sendJson(res, 404, { success: false, error: 'User not found' });
      return true;
    }

    let verificationStatus: string | undefined = undefined;
    let farmerProfile: any = null;
    if (userRow.role === 'farmer') {
      farmerProfile = db.prepare('SELECT * FROM farmer_profiles WHERE user_id = ?').get(userRow.id);
      verificationStatus = farmerProfile?.verification_status || 'unverified';
    }

    sendJson(res, 200, {
      success: true,
      user: {
        id: userRow.id,
        email: userRow.email,
        name: userRow.name,
        role: userRow.role,
        district: userRow.district,
        verificationStatus,
        farmerProfile
      }
    });
    return true;
  }

  // ==========================================
  // --- 2. FARMER VERIFICATION (RTC/PAHANI) ---
  // ==========================================

  // POST /api/farmers/verification (Submit RTC/Pahani verification application)
  if (pathname === '/api/farmers/verification' && method === 'POST') {
    const authUser = requireRole(req, res, 'farmer', 'admin');
    if (!authUser) return true;

    const body = await parseBody(req);
    const {
      fullName,
      phone,
      surveyNumber,
      hissaNumber,
      village,
      hobli,
      taluk,
      district,
      state,
      totalAcres,
      cropTypes,
      ownershipType,
      rtcDocumentUrl,
      rtcFileName
    } = body;

    // Validate all mandatory fields
    if (!fullName || !phone || !surveyNumber || !hissaNumber || !village || !hobli || !taluk || !district || !totalAcres || !cropTypes || !ownershipType || !rtcDocumentUrl) {
      sendJson(res, 400, { success: false, error: 'All land revenue and RTC document fields are mandatory for farmer verification.' });
      return true;
    }

    const verifId = `verif-${Date.now()}`;

    try {
      db.exec('BEGIN TRANSACTION;');

      // 1. Insert into farmer_verifications
      db.prepare(`
        INSERT INTO farmer_verifications (
          id, user_id, full_name, phone, survey_number, hissa_number, village,
          hobli, taluk, district, state, total_acres, crop_types, ownership_type,
          rtc_document_url, rtc_file_name, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
      `).run(
        verifId,
        authUser.id,
        fullName.trim(),
        phone.trim(),
        surveyNumber.trim(),
        hissaNumber.trim(),
        village.trim(),
        hobli.trim(),
        taluk.trim(),
        district.trim(),
        state || 'Karnataka',
        Number(totalAcres),
        cropTypes.trim(),
        ownershipType,
        rtcDocumentUrl,
        rtcFileName || 'RTC_Document.pdf'
      );

      // 2. Update farmer_profiles status = 'pending'
      db.prepare(`
        UPDATE farmer_profiles 
        SET verification_status = 'pending',
            survey_number = ?,
            village = ?,
            taluk = ?,
            district = ?,
            farm_acres = ?,
            crop_types = ?
        WHERE user_id = ?
      `).run(
        surveyNumber.trim(),
        village.trim(),
        taluk.trim(),
        district.trim(),
        Number(totalAcres),
        cropTypes.trim(),
        authUser.id
      );

      // 3. Write audit log
      db.prepare(`
        INSERT INTO verification_audit_log (id, verification_id, action, admin_id, admin_name, reason, created_at)
        VALUES (?, ?, 'submitted', NULL, NULL, 'Farmer submitted RTC/Pahani land record verification', CURRENT_TIMESTAMP)
      `).run(`audit-${Date.now()}`, verifId);

      // 4. Create in-app notification for farmer
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, read, actionTab, created_at)
        VALUES (?, ?, ?, ?, 'system', 0, 'marketplace', CURRENT_TIMESTAMP)
      `).run(
        `notif-${Date.now()}`,
        authUser.id,
        '📑 RTC Verification Application Submitted',
        `Your land record verification for Survey No. ${surveyNumber}/${hissaNumber} in ${village} is pending admin review. You will be notified upon verification approval.`
      );

      db.exec('COMMIT;');

      sendJson(res, 201, {
        success: true,
        verificationId: verifId,
        status: 'pending',
        message: 'Land verification application submitted successfully. Verification pending admin review.'
      });
    } catch (err: any) {
      db.exec('ROLLBACK;');
      sendJson(res, 500, { success: false, error: err.message });
    }
    return true;
  }

  // GET /api/farmers/verification/me
  if (pathname === '/api/farmers/verification/me' && method === 'GET') {
    const authUser = requireAuth(req, res);
    if (!authUser) return true;

    const profile = db.prepare('SELECT * FROM farmer_profiles WHERE user_id = ?').get(authUser.id) as any;
    const latestVerif = db.prepare(`
      SELECT * FROM farmer_verifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get(authUser.id) as any;

    sendJson(res, 200, {
      success: true,
      verificationStatus: profile?.verification_status || 'unverified',
      verification: latestVerif || null
    });
    return true;
  }

  // ==========================================
  // --- 3. PRODUCTS & FARMER SELLING ---
  // ==========================================

  // GET /api/products
  if (pathname === '/api/products' && method === 'GET') {
    const category = urlObj.searchParams.get('category') || undefined;
    const farmerOnly = urlObj.searchParams.get('farmerOnly') === 'true';
    const result = ProductController.getAll({ category, farmerOnly });
    sendJson(res, 200, result);
    return true;
  }

  // GET /api/products/:id
  if (pathname.startsWith('/api/products/') && method === 'GET') {
    const id = pathname.replace('/api/products/', '');
    const result = ProductController.getById(id);
    sendJson(res, result.success ? 200 : 404, result);
    return true;
  }

  // POST /api/products (Enforces approved farmer verification status via requireVerifiedFarmer middleware!)
  if (pathname === '/api/products' && method === 'POST') {
    const authUser = requireVerifiedFarmer(req, res);
    if (!authUser) return true;

    const body = await parseBody(req);
    body.seller_id = authUser.id;
    body.farmerName = authUser.name;
    const result = ProductController.create(body);
    sendJson(res, result.success ? 201 : 400, result);
    return true;
  }

  // ==========================================
  // --- 4. CART & ORDERS & PAYMENTS ---
  // ==========================================

  // POST /api/payments/upi/request (Initiate UPI Collect)
  if (pathname === '/api/payments/upi/request' && method === 'POST') {
    const body = await parseBody(req);
    const { orderId, amount, upiId, consumerName } = body;

    if (!amount || !upiId) {
      sendJson(res, 400, { success: false, error: 'Amount and UPI ID are required' });
      return true;
    }

    // Validate UPI ID format: handle@bank
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,49}$/;
    if (!upiRegex.test(upiId.trim())) {
      sendJson(res, 400, { success: false, error: 'Invalid UPI format. Please provide a valid VPA (e.g. name@bank).' });
      return true;
    }

    const paymentResult = await paymentService.requestUpi({
      orderId: orderId || `ORD-${Date.now()}`,
      amount: Number(amount),
      upiId: upiId.trim(),
      consumerName: consumerName || 'Valued Customer'
    });

    sendJson(res, 200, { success: true, payment: paymentResult });
    return true;
  }

  // GET /api/payments/:id/status
  if (pathname.startsWith('/api/payments/') && pathname.endsWith('/status') && method === 'GET') {
    const paymentId = pathname.replace('/api/payments/', '').replace('/status', '');
    const payment = await paymentService.getStatus(paymentId);
    if (!payment) {
      sendJson(res, 404, { success: false, error: 'Payment request not found' });
      return true;
    }
    sendJson(res, 200, { success: true, payment });
    return true;
  }

  // POST /api/payments/:id/simulate (Simulate approve / decline for testing)
  if (pathname.startsWith('/api/payments/') && pathname.endsWith('/simulate') && method === 'POST') {
    const paymentId = pathname.replace('/api/payments/', '').replace('/simulate', '');
    const body = await parseBody(req);
    const targetStatus = body.status === 'failed' ? 'failed' : 'success';

    const updated = await paymentService.simulateStatus(paymentId, targetStatus);
    if (!updated) {
      sendJson(res, 404, { success: false, error: 'Payment record not found' });
      return true;
    }
    sendJson(res, 200, { success: true, payment: updated });
    return true;
  }

  // Helper: Build Flipkart-style 7-stage progress timeline
  function buildFlipkartTrackingTimeline(currentStatus: string, dateStr: string, shipment?: any, rejectionReason?: string) {
    const stageOrder = [
      'placed',
      'confirmed',
      'preparing',
      'ready_for_pickup',
      'in_transit',
      'out_for_delivery',
      'delivered'
    ];

    let normalized = (currentStatus || 'placed').toLowerCase();
    if (normalized === 'packed') normalized = 'preparing';
    if (normalized === 'shipped') normalized = 'in_transit';

    const isRejected = normalized === 'rejected';
    const isCancelled = normalized === 'cancelled';
    const currentIndex = stageOrder.indexOf(normalized);

    const definitions = [
      {
        code: 'placed',
        stage: 'Order Placed',
        title: 'Order Placed & Payment Authorized',
        description: 'Customer order placed securely. Automatic farmer assignment registered.'
      },
      {
        code: 'confirmed',
        stage: 'Confirmed by Farmer',
        title: 'Order Accepted by Grower Farmer',
        description: 'Farmer has accepted the order and reserved harvested stock for fulfillment.'
      },
      {
        code: 'preparing',
        stage: 'Preparing Produce',
        title: 'Harvest Quality Sorting & Packaging',
        description: 'Produce harvested at farmgate, quality graded, and sealed in breathable organic packaging.'
      },
      {
        code: 'ready_for_pickup',
        stage: 'Ready for Pickup',
        title: 'Ready at Farmgate Dispatch Point',
        description: 'Weighed, labeled with QR farmgate pass, and staged for cold-chain carrier pickup.'
      },
      {
        code: 'in_transit',
        stage: 'Picked Up / In Transit',
        title: 'Picked Up by Cold-Chain Transport',
        description: shipment?.carrier_name
          ? `In transit via ${shipment.carrier_name} (${shipment.vehicle_number || 'Agri Express'}). Tracking: ${shipment.tracking_id || 'TRK-KA'}.`
          : 'Produce loaded onto regional cold-chain transport vehicle.'
      },
      {
        code: 'out_for_delivery',
        stage: 'Out for Delivery',
        title: 'Out with Local Delivery Partner',
        description: shipment?.driver_name
          ? `Courier ${shipment.driver_name} (${shipment.driver_phone || 'Contact Assigned'}) is en route to doorstep.`
          : 'Delivery partner has left local hub and is en route to delivery address.'
      },
      {
        code: 'delivered',
        stage: 'Delivered',
        title: 'Fresh Farm Produce Delivered',
        description: 'Produce successfully handed over and verified by customer.'
      }
    ];

    return definitions.map((def, idx) => {
      let completed = false;
      let current = false;

      if (!isRejected && !isCancelled) {
        if (currentIndex >= idx) completed = true;
        if (currentIndex === idx) current = true;
      } else if (idx === 0) {
        completed = true;
      }

      let timestamp = 'Upcoming';
      if (idx === 0) {
        timestamp = dateStr || 'Just now';
      } else if (completed && !current) {
        timestamp = 'Completed';
      } else if (current) {
        timestamp = 'In Progress';
      }

      return {
        stage: def.stage,
        code: def.code,
        title: def.title,
        description: isRejected && current ? `Order rejected: ${rejectionReason || 'Produce unavailable'}` : def.description,
        timestamp,
        completed,
        current: isRejected || isCancelled ? false : current
      };
    });
  }

  // POST /api/orders/checkout or POST /api/orders (Atomic Multi-Farmer Order Creation)
  if ((pathname === '/api/orders/checkout' || pathname === '/api/orders') && method === 'POST') {
    const authUser = extractAuthUser(req);
    const body = await parseBody(req);
    const {
      items,
      paymentMode = 'cod', // 'cod' | 'upi' | 'card' | 'netbanking'
      consumerName,
      consumerPhone,
      deliveryAddress,
      deliveryMode = 'doorstep',
      upiPaymentId,
      total,
      deliveryCharge = 40
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      sendJson(res, 400, { success: false, error: 'Cart is empty. Products are required to place an order.' });
      return true;
    }

    const customerId = authUser?.id || 'usr-consumer-01';
    const cleanCustomerName = consumerName || authUser?.name || 'Customer Direct';
    const cleanCustomerPhone = consumerPhone || (authUser as any)?.phone || '9876543210';
    const cleanDeliveryAddress = deliveryAddress || '#104, Indiranagar, Bengaluru, Karnataka';

    // Verify UPI if paymentMode is UPI
    if (paymentMode.toLowerCase() === 'upi' && upiPaymentId) {
      const paymentCheck = await paymentService.getStatus(upiPaymentId);
      if (paymentCheck && paymentCheck.status !== 'success') {
        sendJson(res, 400, { 
          success: false, 
          error: 'UPI payment has not been confirmed. Status: ' + paymentCheck.status 
        });
        return true;
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const expectedDelivery = new Date();
    expectedDelivery.setDate(expectedDelivery.getDate() + 3);
    const expectedDeliveryStr = expectedDelivery.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const isCod = paymentMode.toLowerCase().includes('cod');
    const initialStatus = 'placed';
    const initialPaymentStatus = isCod ? 'pending_cod' : 'success';

    try {
      db.exec('BEGIN TRANSACTION;');

      // 1. Group items by farmer (seller_id) and check stock atomically
      const farmerItemsMap = new Map<string, any[]>();

      for (const item of items) {
        const prodId = item.product?.id || item.productId;
        const requestedQty = Number(item.quantity) || 1;

        const prod = db.prepare('SELECT id, seller_id, title, price, availableStock, farmerName, farmerLocation FROM products WHERE id = ?').get(prodId) as any;
        if (!prod) {
          throw new Error(`Product ID "${prodId}" does not exist in inventory.`);
        }
        if (prod.availableStock < requestedQty) {
          throw new Error(`Insufficient stock for "${prod.title}". Available: ${prod.availableStock} kg, Requested: ${requestedQty} kg.`);
        }

        // Deduct stock atomically
        db.prepare('UPDATE products SET availableStock = availableStock - ? WHERE id = ?').run(requestedQty, prodId);

        const sellerId = prod.seller_id || item.product?.seller_id || 'usr-farmer-01';
        if (!farmerItemsMap.has(sellerId)) {
          farmerItemsMap.set(sellerId, []);
        }

        farmerItemsMap.get(sellerId)!.push({
          ...item,
          product: {
            ...item.product,
            id: prod.id,
            title: prod.title,
            price: prod.price,
            seller_id: sellerId,
            farmerName: prod.farmerName,
            farmerLocation: prod.farmerLocation
          },
          quantity: requestedQty,
          price: prod.price,
          subtotal: prod.price * requestedQty
        });
      }

      const farmerIds = Array.from(farmerItemsMap.keys());
      const isMultiFarmer = farmerIds.length > 1;
      const mainOrderId = `NK-${Math.floor(1000 + Math.random() * 9000)}`;

      // Calculate totals
      let calculatedSubtotal = 0;
      farmerItemsMap.forEach(fItems => {
        fItems.forEach(it => { calculatedSubtotal += it.subtotal; });
      });
      const calcDeliveryCharge = deliveryMode === 'doorstep' ? (calculatedSubtotal >= 500 ? 0 : Number(deliveryCharge) || 40) : 0;
      const calculatedGrandTotal = Number(total) || (calculatedSubtotal + calcDeliveryCharge);

      // 2. Create Order(s)
      const childOrderIds: string[] = [];

      if (isMultiFarmer) {
        // Multi-farmer: Create Master / Parent Order for Customer
        const initialMilestones = buildFlipkartTrackingTimeline(initialStatus, today);
        db.prepare(`
          INSERT INTO orders (
            orderId, user_id, parent_order_id, farmer_id, date, status, deliveryMode, deliveryAddress,
            consumerName, consumerPhone, paymentMode, paymentStatus, transactionId,
            expectedDeliveryDate, total, delivery_charge, itemsJson, trackingMilestonesJson, createdAt
          ) VALUES (?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(
          mainOrderId,
          customerId,
          today,
          initialStatus,
          deliveryMode,
          cleanDeliveryAddress,
          cleanCustomerName,
          cleanCustomerPhone,
          paymentMode.toLowerCase(),
          initialPaymentStatus,
          isCod ? `COD-${Date.now().toString().slice(-6)}` : `UPI-${Date.now().toString().slice(-8)}`,
          expectedDeliveryStr,
          calculatedGrandTotal,
          calcDeliveryCharge,
          JSON.stringify(items),
          JSON.stringify(initialMilestones)
        );

        // Record master order status history
        db.prepare(`
          INSERT INTO order_status_history (id, order_id, status, note, updated_by, created_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(`osh-${Date.now()}-master`, mainOrderId, initialStatus, `Order placed across ${farmerIds.length} grower farms`, cleanCustomerName);

        // Now create a child fulfilment order for each farmer
        let fIndex = 1;
        for (const [farmerId, fItems] of farmerItemsMap.entries()) {
          const childOrderId = `${mainOrderId}-F${fIndex}`;
          fIndex++;
          childOrderIds.push(childOrderId);

          const farmerSubtotal = fItems.reduce((acc, it) => acc + it.subtotal, 0);
          const childMilestones = buildFlipkartTrackingTimeline(initialStatus, today);

          db.prepare(`
            INSERT INTO orders (
              orderId, user_id, parent_order_id, farmer_id, date, status, deliveryMode, deliveryAddress,
              consumerName, consumerPhone, paymentMode, paymentStatus, transactionId,
              expectedDeliveryDate, total, delivery_charge, itemsJson, trackingMilestonesJson, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, CURRENT_TIMESTAMP)
          `).run(
            childOrderId,
            customerId,
            mainOrderId,
            farmerId,
            today,
            initialStatus,
            deliveryMode,
            cleanDeliveryAddress,
            cleanCustomerName,
            cleanCustomerPhone,
            paymentMode.toLowerCase(),
            initialPaymentStatus,
            `SUB-${childOrderId}`,
            expectedDeliveryStr,
            farmerSubtotal,
            JSON.stringify(fItems),
            JSON.stringify(childMilestones)
          );

          // Insert order items for child order
          const insertItem = db.prepare(`
            INSERT INTO order_items (id, order_id, product_id, product_title, seller_id, quantity, price, subtotal)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);
          for (const it of fItems) {
            insertItem.run(
              `oi-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              childOrderId,
              it.product.id,
              it.product.title,
              farmerId,
              it.quantity,
              it.price,
              it.subtotal
            );
          }

          // Insert child order status history
          db.prepare(`
            INSERT INTO order_status_history (id, order_id, status, note, updated_by, created_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `).run(`osh-${Date.now()}-${childOrderId}`, childOrderId, initialStatus, 'Fulfilment order assigned to farmer', cleanCustomerName);

          // Insert shipment record for child order
          const trkId = `TRK-${childOrderId}`;
          db.prepare(`
            INSERT INTO shipments (id, order_id, tracking_id, carrier_name, vehicle_number, driver_name, driver_phone, status, current_location_note, delivery_confirmation_code, created_at)
            VALUES (?, ?, ?, 'NammaKrushi Rural Cold-Chain Logistics', 'KA-25-EA-8842', 'Manjunath K.', '9448123988', 'pending', 'Awaiting farmer acceptance & produce packaging', ?, CURRENT_TIMESTAMP)
          `).run(`shp-${Date.now()}-${childOrderId}`, childOrderId, trkId, Math.floor(1000 + Math.random() * 9000).toString());

          // Also insert order_logistics for backwards compatibility
          db.prepare(`
            INSERT INTO order_logistics (id, order_id, courier_name, tracking_number, driver_name, driver_phone, vehicle_number, expected_delivery)
            VALUES (?, ?, 'NammaKrushi Direct Rural Logistics', ?, 'Manjunath K.', '9448123988', 'KA-25-EA-8842', ?)
          `).run(`log-${Date.now()}-${childOrderId}`, childOrderId, trkId, expectedDeliveryStr);

          // Dispatched notification to this specific farmer
          db.prepare(`
            INSERT INTO notifications (id, user_id, title, message, type, read, actionTab, created_at)
            VALUES (?, ?, ?, ?, 'order', 0, 'purchase-history', CURRENT_TIMESTAMP)
          `).run(
            `notif-${Date.now()}-${farmerId}`,
            farmerId,
            `📦 New Produce Sale: Order #${childOrderId}`,
            `You received a new direct purchase order #${childOrderId} (${fItems.length} items, ₹${farmerSubtotal.toLocaleString()}). Please open your Farmer Dashboard to accept and prepare harvest dispatch.`
          );
        }
      } else {
        // Single Farmer Order
        const singleFarmerId = farmerIds[0] || 'usr-farmer-01';
        const initialMilestones = buildFlipkartTrackingTimeline(initialStatus, today);

        db.prepare(`
          INSERT INTO orders (
            orderId, user_id, parent_order_id, farmer_id, date, status, deliveryMode, deliveryAddress,
            consumerName, consumerPhone, paymentMode, paymentStatus, transactionId,
            expectedDeliveryDate, total, delivery_charge, itemsJson, trackingMilestonesJson, createdAt
          ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(
          mainOrderId,
          customerId,
          singleFarmerId,
          today,
          initialStatus,
          deliveryMode,
          cleanDeliveryAddress,
          cleanCustomerName,
          cleanCustomerPhone,
          paymentMode.toLowerCase(),
          initialPaymentStatus,
          isCod ? `COD-${Date.now().toString().slice(-6)}` : `UPI-${Date.now().toString().slice(-8)}`,
          expectedDeliveryStr,
          calculatedGrandTotal,
          calcDeliveryCharge,
          JSON.stringify(items),
          JSON.stringify(initialMilestones)
        );

        // Insert order items
        const insertItem = db.prepare(`
          INSERT INTO order_items (id, order_id, product_id, product_title, seller_id, quantity, price, subtotal)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const it of items) {
          insertItem.run(
            `oi-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            mainOrderId,
            it.product.id,
            it.product.title,
            singleFarmerId,
            it.quantity,
            it.product.price,
            it.product.price * it.quantity
          );
        }

        // Insert order status history
        db.prepare(`
          INSERT INTO order_status_history (id, order_id, status, note, updated_by, created_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(`osh-${Date.now()}`, mainOrderId, initialStatus, isCod ? 'Order placed via Cash on Delivery' : 'Order placed and paid via UPI Collect', cleanCustomerName);

        // Insert shipment record
        const trkId = `TRK-${mainOrderId}`;
        db.prepare(`
          INSERT INTO shipments (id, order_id, tracking_id, carrier_name, vehicle_number, driver_name, driver_phone, status, current_location_note, delivery_confirmation_code, created_at)
          VALUES (?, ?, ?, 'NammaKrushi Rural Cold-Chain Logistics', 'KA-25-EA-8842', 'Manjunath K.', '9448123988', 'pending', 'Awaiting farmer acceptance & produce packaging', ?, CURRENT_TIMESTAMP)
        `).run(`shp-${Date.now()}`, mainOrderId, trkId, Math.floor(1000 + Math.random() * 9000).toString());

        db.prepare(`
          INSERT INTO order_logistics (id, order_id, courier_name, tracking_number, driver_name, driver_phone, vehicle_number, expected_delivery)
          VALUES (?, ?, 'NammaKrushi Direct Rural Logistics', ?, 'Manjunath K.', '9448123988', 'KA-25-EA-8842', ?)
        `).run(`log-${Date.now()}`, mainOrderId, trkId, expectedDeliveryStr);

        // Notification to farmer
        db.prepare(`
          INSERT INTO notifications (id, user_id, title, message, type, read, actionTab, created_at)
          VALUES (?, ?, ?, ?, 'order', 0, 'purchase-history', CURRENT_TIMESTAMP)
        `).run(
          `notif-${Date.now()}-${singleFarmerId}`,
          singleFarmerId,
          `📦 New Produce Sale: Order #${mainOrderId}`,
          `You received a new direct purchase order #${mainOrderId} for ₹${calculatedGrandTotal.toLocaleString()}. Please open your Farmer Dashboard to accept and prepare harvest dispatch.`
        );
      }

      // 3. Record in payments ledger
      db.prepare(`
        INSERT INTO payments (id, order_id, method, upi_id_masked, amount, status, transaction_ref, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        `pay-${Date.now()}`,
        mainOrderId,
        paymentMode.toLowerCase(),
        paymentMode.toLowerCase() === 'upi' ? 'an***a@okaxis' : null,
        calculatedGrandTotal,
        initialPaymentStatus,
        isCod ? `COD-REF-${mainOrderId}` : `UPI-REF-${mainOrderId}`
      );

      // 4. Notification to Buyer
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, read, actionTab, created_at)
        VALUES (?, ?, ?, ?, 'order', 0, 'purchase-history', CURRENT_TIMESTAMP)
      `).run(
        `notif-${Date.now()}-buyer`,
        customerId,
        `🎉 Order #${mainOrderId} Placed!`,
        isMultiFarmer
          ? `Your produce order #${mainOrderId} (₹${calculatedGrandTotal.toLocaleString()}) was successfully placed across ${farmerIds.length} grower farms. Expected Delivery: ${expectedDeliveryStr}.`
          : `Your produce order #${mainOrderId} (₹${calculatedGrandTotal.toLocaleString()}) has been placed with the grower. Expected Delivery: ${expectedDeliveryStr}.`
      );

      db.exec('COMMIT;');

      sendJson(res, 201, {
        success: true,
        orderId: mainOrderId,
        isMultiFarmer,
        childOrders: childOrderIds,
        expectedDeliveryDate: expectedDeliveryStr,
        status: initialStatus,
        paymentStatus: initialPaymentStatus,
        total: calculatedGrandTotal,
        deliveryCharge: calcDeliveryCharge,
        message: isMultiFarmer
          ? `Order #${mainOrderId} placed across ${farmerIds.length} local farms! Sub-orders created for grower fulfillment.`
          : `Order #${mainOrderId} placed successfully! Grower farmer notified.`
      });
    } catch (err: any) {
      db.exec('ROLLBACK;');
      console.error('[Checkout Error]:', err);
      sendJson(res, 400, { success: false, error: err.message });
    }
    return true;
  }

  // GET /api/orders (Listing for consumer, farmer, or admin)
  if (pathname === '/api/orders' && method === 'GET') {
    const authUser = extractAuthUser(req);
    const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const filterRole = urlObj.searchParams.get('role') || authUser?.role || 'consumer';

    let orders: any[] = [];
    if (filterRole === 'farmer' && authUser?.id) {
      // Farmer only sees orders assigned to them
      orders = db.prepare(`
        SELECT o.*, u.name as customer_name, u.phone as customer_phone_user,
               shp.carrier_name, shp.tracking_id, shp.vehicle_number, shp.driver_name, shp.driver_phone, shp.current_location_note, shp.delivery_confirmation_code
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN shipments shp ON o.orderId = shp.order_id
        WHERE o.farmer_id = ?
        ORDER BY o.createdAt DESC
      `).all(authUser.id) as any[];
    } else if (filterRole === 'admin') {
      orders = db.prepare(`
        SELECT o.*, u.name as customer_name,
               shp.carrier_name, shp.tracking_id, shp.vehicle_number, shp.driver_name, shp.driver_phone, shp.current_location_note, shp.delivery_confirmation_code
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN shipments shp ON o.orderId = shp.order_id
        ORDER BY o.createdAt DESC
      `).all() as any[];
    } else {
      // Consumer: only sees their own orders, show top-level or single orders
      const custId = authUser?.id || 'usr-consumer-01';
      orders = db.prepare(`
        SELECT o.*,
               f.name as farmer_name, f.district as farmer_district,
               shp.carrier_name, shp.tracking_id, shp.vehicle_number, shp.driver_name, shp.driver_phone, shp.current_location_note, shp.delivery_confirmation_code
        FROM orders o
        LEFT JOIN users f ON o.farmer_id = f.id
        LEFT JOIN shipments shp ON o.orderId = shp.order_id
        WHERE o.user_id = ?
        ORDER BY o.createdAt DESC
      `).all(custId) as any[];
    }

    const formatted = orders.map(r => {
      // If master order, query child orders if any
      let childOrders: any[] = [];
      if (!r.farmer_id && !r.parent_order_id) {
        childOrders = db.prepare(`
          SELECT co.*, f.name as farmer_name, f.district as farmer_district,
                 shp.carrier_name, shp.tracking_id, shp.vehicle_number, shp.driver_name, shp.driver_phone, shp.current_location_note
          FROM orders co
          LEFT JOIN users f ON co.farmer_id = f.id
          LEFT JOIN shipments shp ON co.orderId = shp.order_id
          WHERE co.parent_order_id = ?
        `).all(r.orderId) as any[];
      }

      return {
        orderId: r.orderId,
        parent_order_id: r.parent_order_id,
        farmer_id: r.farmer_id,
        farmerName: r.farmer_name,
        farmerLocation: r.farmer_district ? `${r.farmer_district}, Karnataka` : 'Karnataka Farmgate',
        date: r.date,
        status: r.status,
        rejectionReason: r.rejection_reason,
        deliveryMode: r.deliveryMode,
        deliveryAddress: r.deliveryAddress,
        consumerName: r.consumerName,
        consumerPhone: r.consumerPhone,
        paymentMode: r.paymentMode,
        paymentStatus: r.paymentStatus,
        transactionId: r.transactionId,
        expectedDelivery: r.expectedDeliveryDate,
        total: Number(r.total),
        deliveryCharge: Number(r.delivery_charge || 0),
        isFavorite: Boolean(r.isFavorite),
        rated: Boolean(r.rated),
        rating: r.rating,
        feedback: r.feedback,
        items: JSON.parse(r.itemsJson || '[]'),
        trackingMilestones: buildFlipkartTrackingTimeline(r.status, r.date, r, r.rejection_reason),
        carrierName: r.carrier_name,
        trackingNumber: r.tracking_id,
        vehicleNumber: r.vehicle_number,
        driverName: r.driver_name,
        driverPhone: r.driver_phone,
        createdAt: r.createdAt,
        childOrders: childOrders.map(co => ({
          orderId: co.orderId,
          farmer_id: co.farmer_id,
          farmerName: co.farmer_name,
          farmerLocation: co.farmer_district ? `${co.farmer_district}, Karnataka` : 'Karnataka Farmgate',
          status: co.status,
          total: Number(co.total),
          items: JSON.parse(co.itemsJson || '[]'),
          trackingNumber: co.tracking_id,
          carrierName: co.carrier_name,
          driverName: co.driver_name,
          driverPhone: co.driver_phone
        }))
      };
    });

    sendJson(res, 200, { success: true, orders: formatted });
    return true;
  }

  // GET /api/farmer/orders (Order Management for Logged-In Farmer)
  if (pathname === '/api/farmer/orders' && method === 'GET') {
    const authUser = extractAuthUser(req);
    // Allow if farmer or admin
    const farmerId = (authUser?.role === 'farmer' ? authUser.id : null) || 'usr-farmer-01';

    const urlObj = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const statusFilter = urlObj.searchParams.get('status') || 'all';

    let query = `
      SELECT o.*, u.name as customer_name, u.phone as customer_phone_user,
             shp.carrier_name, shp.tracking_id, shp.vehicle_number, shp.driver_name, shp.driver_phone, shp.current_location_note, shp.status as shipment_status
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN shipments shp ON o.orderId = shp.order_id
      WHERE o.farmer_id = ?
    `;
    const params: any[] = [farmerId];

    if (statusFilter === 'new') {
      query += ` AND o.status = 'placed'`;
    } else if (statusFilter === 'accepted') {
      query += ` AND o.status = 'confirmed'`;
    } else if (statusFilter === 'preparing') {
      query += ` AND (o.status = 'preparing' OR o.status = 'packed')`;
    } else if (statusFilter === 'ready_for_pickup') {
      query += ` AND o.status = 'ready_for_pickup'`;
    } else if (statusFilter === 'completed') {
      query += ` AND o.status = 'delivered'`;
    } else if (statusFilter === 'rejected') {
      query += ` AND (o.status = 'rejected' OR o.status = 'cancelled')`;
    }

    query += ` ORDER BY o.createdAt DESC`;

    const orders = db.prepare(query).all(...params) as any[];

    // Calculate status breakdown counts for the farmer
    const counts = db.prepare(`
      SELECT 
        COUNT(*) as totalCount,
        SUM(CASE WHEN status = 'placed' THEN 1 ELSE 0 END) as newCount,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as acceptedCount,
        SUM(CASE WHEN status IN ('preparing', 'packed') THEN 1 ELSE 0 END) as preparingCount,
        SUM(CASE WHEN status = 'ready_for_pickup' THEN 1 ELSE 0 END) as readyForPickupCount,
        SUM(CASE WHEN status IN ('in_transit', 'shipped', 'out_for_delivery') THEN 1 ELSE 0 END) as inTransitCount,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as completedCount,
        SUM(CASE WHEN status IN ('rejected', 'cancelled') THEN 1 ELSE 0 END) as rejectedCount
      FROM orders
      WHERE farmer_id = ?
    `).get(farmerId) as any;

    const formatted = orders.map(r => ({
      orderId: r.orderId,
      parent_order_id: r.parent_order_id,
      farmer_id: r.farmer_id,
      date: r.date,
      status: r.status,
      rejectionReason: r.rejection_reason,
      deliveryMode: r.deliveryMode,
      deliveryAddress: r.deliveryAddress,
      consumerName: r.consumerName,
      consumerPhone: r.consumerPhone,
      paymentMode: r.paymentMode,
      paymentStatus: r.paymentStatus,
      transactionId: r.transactionId,
      expectedDelivery: r.expectedDeliveryDate,
      total: Number(r.total),
      items: JSON.parse(r.itemsJson || '[]'),
      carrierName: r.carrier_name,
      trackingNumber: r.tracking_id,
      vehicleNumber: r.vehicle_number,
      driverName: r.driver_name,
      driverPhone: r.driver_phone,
      shipmentStatus: r.shipment_status,
      currentLocationNote: r.current_location_note,
      createdAt: r.createdAt
    }));

    sendJson(res, 200, {
      success: true,
      counts: {
        total: counts?.totalCount || 0,
        new: counts?.newCount || 0,
        accepted: counts?.acceptedCount || 0,
        preparing: counts?.preparingCount || 0,
        ready_for_pickup: counts?.readyForPickupCount || 0,
        in_transit: counts?.inTransitCount || 0,
        completed: counts?.completedCount || 0,
        rejected: counts?.rejectedCount || 0
      },
      orders: formatted
    });
    return true;
  }

  // PATCH /api/farmer/orders/:orderId/status or PATCH /api/orders/:orderId/status
  const isStatusPatchRoute = (pathname.startsWith('/api/farmer/orders/') || pathname.startsWith('/api/orders/')) && pathname.endsWith('/status');
  if (isStatusPatchRoute && (method === 'PATCH' || method === 'POST')) {
    const authUser = extractAuthUser(req);
    const orderId = pathname.replace('/api/farmer/orders/', '').replace('/api/orders/', '').replace('/status', '');
    const body = await parseBody(req);
    const { status, note, rejectionReason } = body;

    const validStatuses = ['placed', 'confirmed', 'preparing', 'ready_for_pickup', 'in_transit', 'out_for_delivery', 'delivered', 'rejected', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      sendJson(res, 400, { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return true;
    }

    const order = db.prepare('SELECT * FROM orders WHERE orderId = ?').get(orderId) as any;
    if (!order) {
      sendJson(res, 404, { success: false, error: `Order #${orderId} not found.` });
      return true;
    }

    // Role-based authorization: only assigned farmer or admin can update status
    if (authUser && authUser.role === 'farmer' && order.farmer_id && order.farmer_id !== authUser.id) {
      sendJson(res, 403, { success: false, error: 'Forbidden: You are not authorized to update another farmer’s private orders.' });
      return true;
    }

    // Validate status transitions for farmers
    const current = (order.status || 'placed').toLowerCase();
    const target = status.toLowerCase();

    if (authUser?.role !== 'admin') {
      const allowedTransitions: Record<string, string[]> = {
        placed: ['confirmed', 'rejected'],
        confirmed: ['preparing', 'rejected', 'cancelled'],
        preparing: ['ready_for_pickup', 'rejected', 'cancelled'],
        packed: ['ready_for_pickup'],
        ready_for_pickup: ['in_transit', 'cancelled'],
        in_transit: ['out_for_delivery'],
        shipped: ['out_for_delivery'],
        out_for_delivery: ['delivered'],
        delivered: [],
        rejected: [],
        cancelled: []
      };

      const allowed = allowedTransitions[current] || [];
      if (!allowed.includes(target) && current !== target) {
        sendJson(res, 400, { 
          success: false, 
          error: `Invalid status transition from "${current}" to "${target}". Allowed next states: ${allowed.length ? allowed.join(', ') : 'none (terminal state)'}.` 
        });
        return true;
      }
    }

    if (target === 'rejected' && (!rejectionReason || !rejectionReason.trim())) {
      sendJson(res, 400, { success: false, error: 'A valid rejection reason is mandatory when rejecting an order.' });
      return true;
    }

    try {
      db.exec('BEGIN TRANSACTION;');

      // 1. Update order status and rejection reason
      db.prepare(`
        UPDATE orders 
        SET status = ?, rejection_reason = ? 
        WHERE orderId = ?
      `).run(target, target === 'rejected' ? rejectionReason.trim() : order.rejection_reason, orderId);

      // 2. Audit in order_status_history
      const historyNote = note || (
        target === 'confirmed' ? 'Order accepted by grower farmer' :
        target === 'preparing' ? 'Produce harvested and quality packaging started' :
        target === 'ready_for_pickup' ? 'Produce packed and ready for cold-chain transport pickup' :
        target === 'in_transit' ? 'Picked up by rural logistics carrier' :
        target === 'out_for_delivery' ? 'Out with local delivery partner' :
        target === 'delivered' ? 'Produce delivered fresh to customer doorstep' :
        target === 'rejected' ? `Rejected by farmer: ${rejectionReason}` : `Status updated to ${target}`
      );

      db.prepare(`
        INSERT INTO order_status_history (id, order_id, status, note, updated_by, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(`osh-${Date.now()}`, orderId, target, historyNote, authUser?.name || 'Assigned Farmer');

      // 3. Update shipments timestamp
      if (target === 'ready_for_pickup') {
        db.prepare('UPDATE shipments SET status = ?, pickup_timestamp = CURRENT_TIMESTAMP WHERE order_id = ?').run('assigned', orderId);
      } else if (target === 'in_transit') {
        db.prepare('UPDATE shipments SET status = ?, transit_timestamp = CURRENT_TIMESTAMP WHERE order_id = ?').run('in_transit', orderId);
      } else if (target === 'out_for_delivery') {
        db.prepare('UPDATE shipments SET status = ?, out_for_delivery_timestamp = CURRENT_TIMESTAMP WHERE order_id = ?').run('out_for_delivery', orderId);
      } else if (target === 'delivered') {
        db.prepare('UPDATE shipments SET status = ?, delivery_timestamp = CURRENT_TIMESTAMP WHERE order_id = ?').run('delivered', orderId);
      }

      // 4. If this is a child order, rollup status to parent order if appropriate
      if (order.parent_order_id) {
        const siblings = db.prepare('SELECT status FROM orders WHERE parent_order_id = ?').all(order.parent_order_id) as any[];
        const siblingStatuses = siblings.map(s => s.status.toLowerCase());
        const allDelivered = siblingStatuses.every(s => s === 'delivered');
        const allConfirmed = siblingStatuses.every(s => ['confirmed', 'preparing', 'ready_for_pickup', 'in_transit', 'out_for_delivery', 'delivered'].includes(s));

        if (allDelivered) {
          db.prepare('UPDATE orders SET status = "delivered" WHERE orderId = ?').run(order.parent_order_id);
        } else if (allConfirmed && target === 'confirmed') {
          db.prepare('UPDATE orders SET status = "confirmed" WHERE orderId = ?').run(order.parent_order_id);
        }
      }

      // 5. In-App Notification for Customer
      const statusTitles: Record<string, string> = {
        confirmed: '✅ Order Accepted by Farmer',
        preparing: '🌾 Produce Harvesting & Packing',
        ready_for_pickup: '📦 Staged for Logistics Carrier',
        in_transit: '🚚 Picked Up & In Transit',
        out_for_delivery: '🛵 Out for Delivery',
        delivered: '🎉 Fresh Produce Delivered!',
        rejected: '⚠️ Order Rejected by Farmer'
      };

      const title = statusTitles[target] || `🚚 Order #${orderId} Updated`;
      const message = target === 'rejected'
        ? `Your order #${orderId} was rejected by the farmer. Reason: ${rejectionReason}`
        : `Your order #${orderId} status has changed to "${target.replace(/_/g, ' ')}". ${note || ''}`;

      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, read, actionTab, created_at)
        VALUES (?, ?, ?, ?, 'order', 0, 'purchase-history', CURRENT_TIMESTAMP)
      `).run(`notif-${Date.now()}-status`, order.user_id || 'usr-consumer-01', title, message);

      db.exec('COMMIT;');

      sendJson(res, 200, {
        success: true,
        orderId,
        status: target,
        message: `Order #${orderId} transitioned to "${target}". Customer notified.`
      });
    } catch (err: any) {
      db.exec('ROLLBACK;');
      console.error('[Status Update Error]:', err);
      sendJson(res, 500, { success: false, error: err.message });
    }
    return true;
  }

  // GET /api/orders/:orderId/tracking (Flipkart-Style 7-Stage Timeline & Logistics)
  if (pathname.startsWith('/api/orders/') && pathname.endsWith('/tracking') && method === 'GET') {
    const orderId = pathname.replace('/api/orders/', '').replace('/tracking', '');

    const order = db.prepare(`
      SELECT o.*, u.name as customer_name, u.phone as customer_phone,
             f.name as farmer_name, f.district as farmer_district, f.phone as farmer_phone,
             fp.verification_status as farmer_verification, fp.village as farmer_village, fp.farm_acres,
             shp.id as shipment_id, shp.carrier_name, shp.tracking_id, shp.vehicle_number,
             shp.driver_name, shp.driver_phone, shp.current_location_note, shp.delivery_confirmation_code,
             shp.status as shipment_status, shp.pickup_timestamp, shp.transit_timestamp, shp.out_for_delivery_timestamp, shp.delivery_timestamp
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN users f ON o.farmer_id = f.id
      LEFT JOIN farmer_profiles fp ON o.farmer_id = fp.user_id
      LEFT JOIN shipments shp ON o.orderId = shp.order_id
      WHERE o.orderId = ?
    `).get(orderId) as any;

    if (!order) {
      sendJson(res, 404, { success: false, error: `Order #${orderId} not found.` });
      return true;
    }

    // Get timestamped status history
    const history = db.prepare(`
      SELECT id, order_id, status, note, updated_by, created_at
      FROM order_status_history
      WHERE order_id = ?
      ORDER BY created_at ASC
    `).all(orderId) as any[];

    // Build timeline milestones
    const timeline = buildFlipkartTrackingTimeline(
      order.status,
      order.date,
      order,
      order.rejection_reason
    );

    // If master order, check for sub-orders
    let childOrders: any[] = [];
    if (!order.farmer_id && !order.parent_order_id) {
      childOrders = db.prepare(`
        SELECT co.orderId, co.farmer_id, co.status, co.total, f.name as farmer_name, f.district as farmer_district,
               shp.carrier_name, shp.tracking_id, shp.driver_name, shp.driver_phone
        FROM orders co
        LEFT JOIN users f ON co.farmer_id = f.id
        LEFT JOIN shipments shp ON co.orderId = shp.order_id
        WHERE co.parent_order_id = ?
      `).all(orderId) as any[];
    }

    sendJson(res, 200, {
      success: true,
      tracking: {
        orderId: order.orderId,
        parentOrderId: order.parent_order_id,
        currentStatus: order.status,
        isRejected: order.status === 'rejected',
        rejectionReason: order.rejection_reason,
        isCancelled: order.status === 'cancelled',
        date: order.date,
        expectedDelivery: order.expectedDeliveryDate,
        total: Number(order.total),
        deliveryCharge: Number(order.delivery_charge || 0),
        deliveryMode: order.deliveryMode,
        deliveryAddress: order.deliveryAddress,
        consumerName: order.consumerName,
        consumerPhone: order.consumerPhone,
        paymentMode: order.paymentMode,
        paymentStatus: order.paymentStatus,
        transactionId: order.transactionId,
        items: JSON.parse(order.itemsJson || '[]'),
        farmer: {
          id: order.farmer_id || 'usr-farmer-01',
          name: order.farmer_name || 'Manish S.B. (Raitha Bandhu)',
          location: order.farmer_village ? `${order.farmer_village}, ${order.farmer_district || 'Dharwad'}` : (order.farmer_district ? `${order.farmer_district}, Karnataka` : 'Navalgund, Dharwad'),
          phone: order.farmer_phone || '9876543210',
          acres: order.farm_acres || 4.5,
          isVerified: order.farmer_verification === 'approved'
        },
        shipment: {
          id: order.shipment_id,
          trackingId: order.tracking_id || `TRK-${order.orderId}`,
          carrierName: order.carrier_name || 'NammaKrushi Rural Cold-Chain Logistics',
          vehicleNumber: order.vehicle_number || 'KA-25-EA-8842',
          driverName: order.driver_name || 'Manjunath K.',
          driverPhone: order.driver_phone || '9448123988',
          status: order.shipment_status || 'pending',
          currentLocationNote: order.current_location_note || 'Awaiting dispatch at farm collection center',
          deliveryConfirmationCode: order.delivery_confirmation_code || '4892',
          pickupTimestamp: order.pickup_timestamp,
          transitTimestamp: order.transit_timestamp,
          outForDeliveryTimestamp: order.out_for_delivery_timestamp,
          deliveryTimestamp: order.delivery_timestamp
        },
        timeline,
        statusHistory: history,
        childOrders
      }
    });
    return true;
  }

  // GET /api/orders/:orderId (Single Order Details)
  if (pathname.startsWith('/api/orders/') && !pathname.includes('/tracking') && !pathname.includes('/shipment') && !pathname.includes('/confirm-delivery') && method === 'GET') {
    const orderId = pathname.replace('/api/orders/', '');

    const order = db.prepare(`
      SELECT o.*, u.name as customer_name,
             f.name as farmer_name, f.district as farmer_district, f.phone as farmer_phone,
             fp.verification_status as farmer_verification, fp.village as farmer_village,
             shp.carrier_name, shp.tracking_id, shp.vehicle_number, shp.driver_name, shp.driver_phone, shp.current_location_note, shp.delivery_confirmation_code
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN users f ON o.farmer_id = f.id
      LEFT JOIN farmer_profiles fp ON o.farmer_id = fp.user_id
      LEFT JOIN shipments shp ON o.orderId = shp.order_id
      WHERE o.orderId = ?
    `).get(orderId) as any;

    if (!order) {
      sendJson(res, 404, { success: false, error: `Order #${orderId} not found.` });
      return true;
    }

    const history = db.prepare(`
      SELECT id, order_id, status, note, updated_by, created_at
      FROM order_status_history
      WHERE order_id = ?
      ORDER BY created_at ASC
    `).all(orderId) as any[];

    sendJson(res, 200, {
      success: true,
      order: {
        orderId: order.orderId,
        parent_order_id: order.parent_order_id,
        farmer_id: order.farmer_id,
        farmerName: order.farmer_name,
        farmerLocation: order.farmer_district ? `${order.farmer_district}, Karnataka` : 'Karnataka Farmgate',
        farmerPhone: order.farmer_phone,
        isFarmerVerified: order.farmer_verification === 'approved',
        date: order.date,
        status: order.status,
        rejectionReason: order.rejection_reason,
        deliveryMode: order.deliveryMode,
        deliveryAddress: order.deliveryAddress,
        consumerName: order.consumerName,
        consumerPhone: order.consumerPhone,
        paymentMode: order.paymentMode,
        paymentStatus: order.paymentStatus,
        transactionId: order.transactionId,
        expectedDelivery: order.expectedDeliveryDate,
        total: Number(order.total),
        deliveryCharge: Number(order.delivery_charge || 0),
        items: JSON.parse(order.itemsJson || '[]'),
        trackingMilestones: buildFlipkartTrackingTimeline(order.status, order.date, order, order.rejection_reason),
        statusHistory: history,
        shipment: {
          trackingId: order.tracking_id,
          carrierName: order.carrier_name,
          vehicleNumber: order.vehicle_number,
          driverName: order.driver_name,
          driverPhone: order.driver_phone,
          currentLocationNote: order.current_location_note,
          deliveryConfirmationCode: order.delivery_confirmation_code
        }
      }
    });
    return true;
  }

  // POST /api/orders/:orderId/shipment (Assign/Update Logistics & Delivery Partner)
  if (pathname.startsWith('/api/orders/') && pathname.endsWith('/shipment') && method === 'POST') {
    const authUser = extractAuthUser(req);
    const orderId = pathname.replace('/api/orders/', '').replace('/shipment', '');
    const body = await parseBody(req);
    const { carrierName, trackingNumber, vehicleNumber, driverName, driverPhone, currentLocationNote, notes } = body;

    const order = db.prepare('SELECT * FROM orders WHERE orderId = ?').get(orderId) as any;
    if (!order) {
      sendJson(res, 404, { success: false, error: `Order #${orderId} not found.` });
      return true;
    }

    try {
      db.exec('BEGIN TRANSACTION;');

      const existingShp = db.prepare('SELECT id FROM shipments WHERE order_id = ?').get(orderId) as any;
      const trkId = trackingNumber || `TRK-KA-${orderId}`;

      if (existingShp) {
        db.prepare(`
          UPDATE shipments
          SET carrier_name = COALESCE(?, carrier_name),
              tracking_id = COALESCE(?, tracking_id),
              vehicle_number = COALESCE(?, vehicle_number),
              driver_name = COALESCE(?, driver_name),
              driver_phone = COALESCE(?, driver_phone),
              current_location_note = COALESCE(?, current_location_note),
              notes = COALESCE(?, notes),
              status = 'in_transit',
              transit_timestamp = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE order_id = ?
        `).run(carrierName, trkId, vehicleNumber, driverName, driverPhone, currentLocationNote, notes, orderId);
      } else {
        db.prepare(`
          INSERT INTO shipments (
            id, order_id, tracking_id, carrier_name, vehicle_number, driver_name, driver_phone,
            status, current_location_note, notes, transit_timestamp, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'in_transit', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).run(
          `shp-${Date.now()}`,
          orderId,
          trkId,
          carrierName || 'NammaKrushi Rural Cold-Chain Logistics',
          vehicleNumber || 'KA-25-EA-8842',
          driverName || 'Manjunath K.',
          driverPhone || '9448123988',
          currentLocationNote || 'Dispatched from farmgate hub',
          notes || 'Cold-chain agri produce consignment'
        );
      }

      // Also update orders status to in_transit if it was ready_for_pickup or preparing
      if (['ready_for_pickup', 'preparing', 'confirmed'].includes(order.status.toLowerCase())) {
        db.prepare('UPDATE orders SET status = "in_transit" WHERE orderId = ?').run(orderId);
      }

      // Add to status history
      db.prepare(`
        INSERT INTO order_status_history (id, order_id, status, note, updated_by, created_at)
        VALUES (?, ?, 'in_transit', ?, ?, CURRENT_TIMESTAMP)
      `).run(`osh-${Date.now()}`, orderId, `Logistics assigned: ${carrierName || 'Agri Express'} (${vehicleNumber || 'KA-25-EA-8842'}). Driver: ${driverName || 'Courier'}.`, authUser?.name || 'Logistics Coordinator');

      // Notify customer
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, read, actionTab, created_at)
        VALUES (?, ?, ?, ?, 'order', 0, 'purchase-history', CURRENT_TIMESTAMP)
      `).run(
        `notif-${Date.now()}-shp`,
        order.user_id || 'usr-consumer-01',
        `🚚 Order #${orderId} Dispatched in Transit!`,
        `Your produce has been dispatched with ${carrierName || 'Agri Express'} (${vehicleNumber || 'KA-25-EA-8842'}). Driver: ${driverName || 'Manjunath'} (${driverPhone || '9448123988'}). Tracking ID: ${trkId}.`
      );

      db.exec('COMMIT;');

      sendJson(res, 200, {
        success: true,
        message: 'Delivery partner details updated and logistics dispatched.',
        trackingNumber: trkId
      });
    } catch (err: any) {
      db.exec('ROLLBACK;');
      sendJson(res, 500, { success: false, error: err.message });
    }
    return true;
  }

  // POST /api/orders/:orderId/confirm-delivery (Confirm Handover & Produce Inspection)
  if (pathname.startsWith('/api/orders/') && pathname.endsWith('/confirm-delivery') && method === 'POST') {
    const authUser = extractAuthUser(req);
    const orderId = pathname.replace('/api/orders/', '').replace('/confirm-delivery', '');

    const order = db.prepare('SELECT * FROM orders WHERE orderId = ?').get(orderId) as any;
    if (!order) {
      sendJson(res, 404, { success: false, error: `Order #${orderId} not found.` });
      return true;
    }

    try {
      db.exec('BEGIN TRANSACTION;');

      db.prepare('UPDATE orders SET status = "delivered" WHERE orderId = ?').run(orderId);
      db.prepare('UPDATE shipments SET status = "delivered", delivery_timestamp = CURRENT_TIMESTAMP WHERE order_id = ?').run(orderId);

      // Status history
      db.prepare(`
        INSERT INTO order_status_history (id, order_id, status, note, updated_by, created_at)
        VALUES (?, ?, 'delivered', 'Produce delivery confirmed & verified by recipient', ?, CURRENT_TIMESTAMP)
      `).run(`osh-${Date.now()}`, orderId, authUser?.name || 'Customer Handover');

      // Notification
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, read, actionTab, created_at)
        VALUES (?, ?, '🎉 Produce Delivered!', ?, 'order', 0, 'purchase-history', CURRENT_TIMESTAMP)
      `).run(
        `notif-${Date.now()}-deliv`,
        order.user_id || 'usr-consumer-01',
        `Order #${orderId} delivery has been confirmed. Thank you for supporting local farmers directly!`
      );

      db.exec('COMMIT;');

      sendJson(res, 200, { success: true, message: `Order #${orderId} delivery confirmed successfully.` });
    } catch (err: any) {
      db.exec('ROLLBACK;');
      sendJson(res, 500, { success: false, error: err.message });
    }
    return true;
  }

  // ==========================================
  // --- 5. NOTIFICATIONS ---
  // ==========================================

  // GET /api/notifications
  if (pathname === '/api/notifications' && method === 'GET') {
    const authUser = extractAuthUser(req);
    const userId = authUser?.id || 'usr-farmer-01';

    const notifs = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(userId) as any[];

    sendJson(res, 200, {
      success: true,
      notifications: notifs.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        read: Boolean(n.read),
        actionTab: n.actionTab,
        timestamp: n.created_at
      }))
    });
    return true;
  }

  // PATCH /api/notifications/:id/read
  if (pathname.startsWith('/api/notifications/') && pathname.endsWith('/read') && method === 'PATCH') {
    const notifId = pathname.replace('/api/notifications/', '').replace('/read', '');
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(notifId);
    sendJson(res, 200, { success: true, message: 'Notification marked as read' });
    return true;
  }

  // ==========================================
  // --- 6. ADMIN DASHBOARD MODULES (/api/admin/*) ---
  // ==========================================

  // GET /api/admin/overview
  if (pathname === '/api/admin/overview' && method === 'GET') {
    const adminUser = requireRole(req, res, 'admin');
    if (!adminUser) return true;

    const consumerCount = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'consumer'").get() as any).count;
    const farmerCount = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'farmer'").get() as any).count;
    const pendingVerifs = (db.prepare("SELECT COUNT(*) as count FROM farmer_verifications WHERE status = 'pending'").get() as any).count;
    const approvedVerifs = (db.prepare("SELECT COUNT(*) as count FROM farmer_verifications WHERE status = 'approved'").get() as any).count;
    const rejectedVerifs = (db.prepare("SELECT COUNT(*) as count FROM farmer_verifications WHERE status = 'rejected'").get() as any).count;
    
    const ordersByStatus = db.prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status').all();
    const revenueRow = db.prepare("SELECT SUM(total) as revenue FROM orders WHERE status != 'cancelled'").get() as any;
    const totalPayments = (db.prepare('SELECT COUNT(*) as count FROM payments').get() as any).count;

    const recentActivity = db.prepare(`
      SELECT 'order' as type, orderId as ref, consumerName as title, ('₹' || total) as subtitle, status, createdAt as time
      FROM orders
      UNION ALL
      SELECT 'verification' as type, id as ref, full_name as title, (survey_number || ' - ' || village) as subtitle, status, created_at as time
      FROM farmer_verifications
      ORDER BY time DESC LIMIT 8
    `).all();

    sendJson(res, 200, {
      success: true,
      stats: {
        totalConsumers: consumerCount,
        totalFarmers: farmerCount,
        pendingVerifications: pendingVerifs,
        approvedVerifications: approvedVerifs,
        rejectedVerifications: rejectedVerifs,
        totalRevenue: revenueRow?.revenue || 0,
        totalPayments
      },
      ordersByStatus,
      recentActivity
    });
    return true;
  }

  // GET /api/admin/verifications (Farmer Verification Queue)
  if (pathname === '/api/admin/verifications' && method === 'GET') {
    const adminUser = requireRole(req, res, 'admin');
    if (!adminUser) return true;

    const statusFilter = urlObj.searchParams.get('status');
    let query = 'SELECT * FROM farmer_verifications';
    const params: any[] = [];
    if (statusFilter && ['pending', 'approved', 'rejected'].includes(statusFilter)) {
      query += ' WHERE status = ?';
      params.push(statusFilter);
    }
    query += ' ORDER BY created_at DESC';

    const list = db.prepare(query).all(...params);
    sendJson(res, 200, { success: true, verifications: list });
    return true;
  }

  // POST /api/admin/verifications/:id/review (Approve or Reject with MANDATORY reason)
  if (pathname.startsWith('/api/admin/verifications/') && pathname.endsWith('/review') && method === 'POST') {
    const adminUser = requireRole(req, res, 'admin');
    if (!adminUser) return true;

    const verifId = pathname.replace('/api/admin/verifications/', '').replace('/review', '');
    const body = await parseBody(req);
    const { action, reason } = body; // action: 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      sendJson(res, 400, { success: false, error: "Action must be 'approve' or 'reject'" });
      return true;
    }

    // MANDATORY rejection reason enforcement
    if (action === 'reject' && (!reason || !reason.trim())) {
      sendJson(res, 400, { success: false, error: 'Rejection reason is mandatory when rejecting a farmer RTC verification.' });
      return true;
    }

    const verif = db.prepare('SELECT * FROM farmer_verifications WHERE id = ?').get(verifId) as any;
    if (!verif) {
      sendJson(res, 404, { success: false, error: 'Verification request not found' });
      return true;
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    try {
      db.exec('BEGIN TRANSACTION;');

      // 1. Update farmer_verifications
      db.prepare(`
        UPDATE farmer_verifications
        SET status = ?, rejection_reason = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newStatus, action === 'reject' ? reason.trim() : null, adminUser.id, verifId);

      // 2. Update farmer_profiles
      db.prepare(`
        UPDATE farmer_profiles
        SET verification_status = ?, approved_by = ?, approved_at = ?
        WHERE user_id = ?
      `).run(
        newStatus,
        action === 'approve' ? adminUser.id : null,
        action === 'approve' ? new Date().toISOString() : null,
        verif.user_id
      );

      // 3. Write audit log
      db.prepare(`
        INSERT INTO verification_audit_log (id, verification_id, action, admin_id, admin_name, reason, created_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        `audit-${Date.now()}`,
        verifId,
        newStatus,
        adminUser.id,
        adminUser.name,
        action === 'reject' ? reason.trim() : 'Approved by administrative review'
      );

      // 4. Notify the farmer
      const notifTitle = action === 'approve' 
        ? '🎉 Land Verification Approved!' 
        : '⚠️ Land Verification Rejected';
      const notifMessage = action === 'approve'
        ? `Congratulations! Your RTC land record for Survey No. ${verif.survey_number}/${verif.hissa_number} has been approved. You can now publish fresh farm produce on the marketplace.`
        : `Your RTC land verification was rejected by admin. Reason: "${reason.trim()}". You may correct details and re-submit.`;

      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, read, actionTab, created_at)
        VALUES (?, ?, ?, ?, 'system', 0, 'marketplace', CURRENT_TIMESTAMP)
      `).run(`notif-${Date.now()}`, verif.user_id, notifTitle, notifMessage);

      db.exec('COMMIT;');

      sendJson(res, 200, {
        success: true,
        status: newStatus,
        message: `Farmer verification successfully ${newStatus}.`
      });
    } catch (err: any) {
      db.exec('ROLLBACK;');
      sendJson(res, 500, { success: false, error: err.message });
    }
    return true;
  }

  // GET /api/admin/farmers
  if (pathname === '/api/admin/farmers' && method === 'GET') {
    const adminUser = requireRole(req, res, 'admin');
    if (!adminUser) return true;

    const farmers = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.district, u.is_blocked, u.created_at,
             fp.verification_status, fp.farm_acres, fp.crop_types, fp.survey_number,
             (SELECT COUNT(*) FROM products WHERE seller_id = u.id) as product_count
      FROM users u
      LEFT JOIN farmer_profiles fp ON u.id = fp.user_id
      WHERE u.role = 'farmer'
      ORDER BY u.created_at DESC
    `).all();

    sendJson(res, 200, { success: true, farmers });
    return true;
  }

  // PATCH /api/admin/farmers/:id/status (Suspend / Reactivate)
  if (pathname.startsWith('/api/admin/farmers/') && pathname.endsWith('/status') && method === 'PATCH') {
    const adminUser = requireRole(req, res, 'admin');
    if (!adminUser) return true;

    const farmerId = pathname.replace('/api/admin/farmers/', '').replace('/status', '');
    const body = await parseBody(req);
    const isBlocked = body.isBlocked ? 1 : 0;

    db.prepare('UPDATE users SET is_blocked = ? WHERE id = ?').run(isBlocked, farmerId);
    sendJson(res, 200, { success: true, message: `Farmer account ${isBlocked ? 'suspended' : 'reactivated'}.` });
    return true;
  }

  // GET /api/admin/consumers
  if (pathname === '/api/admin/consumers' && method === 'GET') {
    const adminUser = requireRole(req, res, 'admin');
    if (!adminUser) return true;

    const consumers = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.district, u.is_blocked, u.created_at,
             (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count,
             (SELECT COALESCE(SUM(total), 0) FROM orders WHERE user_id = u.id) as total_spent
      FROM users u
      WHERE u.role = 'consumer'
      ORDER BY u.created_at DESC
    `).all();

    sendJson(res, 200, { success: true, consumers });
    return true;
  }

  // PATCH /api/admin/consumers/:id/status (Block / Unblock)
  if (pathname.startsWith('/api/admin/consumers/') && pathname.endsWith('/status') && method === 'PATCH') {
    const adminUser = requireRole(req, res, 'admin');
    if (!adminUser) return true;

    const consumerId = pathname.replace('/api/admin/consumers/', '').replace('/status', '');
    const body = await parseBody(req);
    const isBlocked = body.isBlocked ? 1 : 0;

    db.prepare('UPDATE users SET is_blocked = ? WHERE id = ?').run(isBlocked, consumerId);
    sendJson(res, 200, { success: true, message: `Consumer account ${isBlocked ? 'blocked' : 'unblocked'}.` });
    return true;
  }

  // GET /api/admin/orders
  if (pathname === '/api/admin/orders' && method === 'GET') {
    const adminUser = requireRole(req, res, 'admin');
    if (!adminUser) return true;

    const statusFilter = urlObj.searchParams.get('status');
    let query = `
      SELECT o.*, ol.courier_name, ol.tracking_number, ol.vehicle_number, ol.driver_name, ol.driver_phone
      FROM orders o
      LEFT JOIN order_logistics ol ON o.orderId = ol.order_id
    `;
    const params: any[] = [];
    if (statusFilter && statusFilter !== 'All') {
      query += ' WHERE o.status = ?';
      params.push(statusFilter);
    }
    query += ' ORDER BY o.createdAt DESC';

    const orders = db.prepare(query).all(...params) as any[];

    sendJson(res, 200, {
      success: true,
      orders: orders.map(o => ({
        ...o,
        items: JSON.parse(o.itemsJson || '[]'),
        trackingMilestones: JSON.parse(o.trackingMilestonesJson || '[]')
      }))
    });
    return true;
  }

  // POST /api/admin/orders/:id/status (Update Order Status & Notify Buyer/Seller)
  if (pathname.startsWith('/api/admin/orders/') && pathname.endsWith('/status') && method === 'POST') {
    const adminUser = requireRole(req, res, 'admin');
    if (!adminUser) return true;

    const orderId = pathname.replace('/api/admin/orders/', '').replace('/status', '');
    const body = await parseBody(req);
    const { status, note } = body;

    const validStatuses = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      sendJson(res, 400, { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return true;
    }

    const order = db.prepare('SELECT * FROM orders WHERE orderId = ?').get(orderId) as any;
    if (!order) {
      sendJson(res, 404, { success: false, error: 'Order not found' });
      return true;
    }

    try {
      db.exec('BEGIN TRANSACTION;');

      // 1. Update order
      db.prepare('UPDATE orders SET status = ? WHERE orderId = ?').run(status, orderId);

      // 2. Audit history
      db.prepare(`
        INSERT INTO order_status_history (id, order_id, status, note, updated_by, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(`osh-${Date.now()}`, orderId, status, note || `Status updated to ${status} by admin`, adminUser.name);

      // 3. Notify Buyer
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, read, actionTab, created_at)
        VALUES (?, ?, ?, ?, 'order', 0, 'purchase-history', CURRENT_TIMESTAMP)
      `).run(
        `notif-${Date.now()}-buyer-status`,
        order.user_id || 'usr-consumer-01',
        `🚚 Order #${orderId} Updated: ${status.toUpperCase().replace(/_/g, ' ')}`,
        `Your order #${orderId} status has been updated to "${status}". ${note ? 'Note: ' + note : ''}`
      );

      // 4. Notify Seller (Farmer)
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, read, actionTab, created_at)
        VALUES (?, ?, ?, ?, 'order', 0, 'purchase-history', CURRENT_TIMESTAMP)
      `).run(
        `notif-${Date.now()}-seller-status`,
        'usr-farmer-01',
        `📦 Order #${orderId} Status Updated: ${status}`,
        `Administrative update: Order #${orderId} has been moved to stage "${status}".`
      );

      db.exec('COMMIT;');

      sendJson(res, 200, { success: true, message: `Order #${orderId} updated to ${status}. Buyer and seller notified.` });
    } catch (err: any) {
      db.exec('ROLLBACK;');
      sendJson(res, 500, { success: false, error: err.message });
    }
    return true;
  }

  // POST /api/admin/orders/:id/logistics (Update courier/vehicle/driver info)
  if (pathname.startsWith('/api/admin/orders/') && pathname.endsWith('/logistics') && method === 'POST') {
    const adminUser = requireRole(req, res, 'admin');
    if (!adminUser) return true;

    const orderId = pathname.replace('/api/admin/orders/', '').replace('/logistics', '');
    const body = await parseBody(req);
    const { courierName, trackingNumber, vehicleNumber, driverName, driverPhone, expectedDelivery } = body;

    const existingLog = db.prepare('SELECT id FROM order_logistics WHERE order_id = ?').get(orderId);
    if (existingLog) {
      db.prepare(`
        UPDATE order_logistics
        SET courier_name = ?, tracking_number = ?, vehicle_number = ?, driver_name = ?, driver_phone = ?, expected_delivery = ?, updated_at = CURRENT_TIMESTAMP
        WHERE order_id = ?
      `).run(courierName, trackingNumber, vehicleNumber, driverName, driverPhone, expectedDelivery, orderId);
    } else {
      db.prepare(`
        INSERT INTO order_logistics (id, order_id, courier_name, tracking_number, vehicle_number, driver_name, driver_phone, expected_delivery)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(`log-${Date.now()}`, orderId, courierName, trackingNumber, vehicleNumber, driverName, driverPhone, expectedDelivery);
    }

    sendJson(res, 200, { success: true, message: 'Logistics details updated successfully.' });
    return true;
  }

  // GET /api/admin/payments
  if (pathname === '/api/admin/payments' && method === 'GET') {
    const adminUser = requireRole(req, res, 'admin');
    if (!adminUser) return true;

    const payments = db.prepare(`
      SELECT p.*, o.consumerName, o.consumerPhone, o.status as order_status
      FROM payments p
      JOIN orders o ON p.order_id = o.orderId
      ORDER BY p.created_at DESC
    `).all();

    sendJson(res, 200, { success: true, payments });
    return true;
  }

  // GET /api/admin/products
  if (pathname === '/api/admin/products' && method === 'GET') {
    const adminUser = requireRole(req, res, 'admin');
    if (!adminUser) return true;

    const products = db.prepare(`
      SELECT p.*, u.name as seller_name, fp.verification_status as seller_verification
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN farmer_profiles fp ON p.seller_id = fp.user_id
      ORDER BY p.createdAt DESC
    `).all();

    sendJson(res, 200, { success: true, products });
    return true;
  }

  // PATCH /api/admin/products/:id/publish
  if (pathname.startsWith('/api/admin/products/') && pathname.endsWith('/publish') && method === 'PATCH') {
    const adminUser = requireRole(req, res, 'admin');
    if (!adminUser) return true;

    const prodId = pathname.replace('/api/admin/products/', '').replace('/publish', '');
    const body = await parseBody(req);
    const isPublished = body.isPublished ? 1 : 0;

    db.prepare('UPDATE products SET isPublished = ? WHERE id = ?').run(isPublished, prodId);
    sendJson(res, 200, { success: true, message: `Product ${isPublished ? 'published' : 'unpublished'}.` });
    return true;
  }

  // ==========================================
  // --- 7. TASKS & AUTOMATIC ALERTS API ---
  // ==========================================

  // GET /api/tasks
  if (pathname === '/api/tasks' && method === 'GET') {
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY dueDate ASC').all();
    sendJson(res, 200, { success: true, tasks });
    return true;
  }

  // POST /api/tasks
  if (pathname === '/api/tasks' && method === 'POST') {
    const body = await parseBody(req);
    const { title, category, dueDate, priority, fieldSector, assignedTo, notes } = body;

    if (!title || !dueDate) {
      sendJson(res, 400, { success: false, error: 'Title and due date are required' });
      return true;
    }

    const taskId = body.id || `task-${Date.now()}`;
    db.prepare(`
      INSERT INTO tasks (id, user_id, title, category, dueDate, priority, status, fieldSector, assignedTo, notes)
      VALUES (?, 'usr-farmer-01', ?, ?, ?, ?, 'Pending', ?, ?, ?)
    `).run(
      taskId,
      title.trim(),
      category || 'General',
      dueDate,
      priority || 'Medium',
      fieldSector || 'General Field',
      assignedTo || 'Farm Team',
      notes || ''
    );

    sendJson(res, 201, { success: true, taskId });
    return true;
  }

  // PATCH /api/tasks/:id
  if (pathname.startsWith('/api/tasks/') && method === 'PATCH') {
    const taskId = pathname.replace('/api/tasks/', '');
    const body = await parseBody(req);
    const { status } = body;

    if (status) {
      db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(status, taskId);
    }
    sendJson(res, 200, { success: true, message: 'Task updated' });
    return true;
  }

  // DELETE /api/tasks/:id
  if (pathname.startsWith('/api/tasks/') && method === 'DELETE') {
    const taskId = pathname.replace('/api/tasks/', '');
    db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
    sendJson(res, 200, { success: true, message: 'Task deleted' });
    return true;
  }

  // --- TRACEABILITY & MARKET RATES ---
  if (pathname.startsWith('/api/traceability/') && method === 'GET') {
    const productId = pathname.replace('/api/traceability/', '');
    const result = TraceabilityController.getByProductId(productId);
    sendJson(res, 200, result);
    return true;
  }

  if (pathname === '/api/market_rates' && method === 'GET') {
    const result = MarketRateController.getAll();
    sendJson(res, 200, result);
    return true;
  }

  return false;
}
