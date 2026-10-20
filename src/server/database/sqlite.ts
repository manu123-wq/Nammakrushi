/**
 * NammaKrushi Full-Stack SQLite Relational Database Engine
 * Powered by Node.js native DatabaseSync (node:sqlite)
 * Full RBAC Schema: Users, Farmer Verifications, Products, Orders, Payments, Tasks & Notifications
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import bcrypt from 'bcryptjs';
import { INITIAL_PRODUCTS, INITIAL_CONSUMER_ORDERS, INITIAL_MARKET_RATES } from '../../utils/mockData.ts';
import { INITIAL_TRACEABILITY_DATA } from '../../utils/traceabilityData.ts';

const dbFilePath = path.resolve(process.cwd(), 'nammakrushi.sqlite');

let databaseInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!databaseInstance) {
    databaseInstance = new DatabaseSync(dbFilePath);
    // Enforce foreign key constraints
    databaseInstance.exec('PRAGMA foreign_keys = ON;');
    initSchema(databaseInstance);
  }
  return databaseInstance;
}

/**
 * Initializes and migrates all relational database tables
 */
function initSchema(db: DatabaseSync) {
  // 1. Users Table (RBAC: farmer, consumer, admin)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('farmer', 'consumer', 'admin')),
      is_blocked INTEGER DEFAULT 0,
      district TEXT DEFAULT 'Dharwad',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  `);

  // 2. Farmer Profiles Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS farmer_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK(verification_status IN ('unverified', 'pending', 'approved', 'rejected')),
      approved_by TEXT REFERENCES users(id),
      approved_at DATETIME,
      farm_acres REAL DEFAULT 0,
      crop_types TEXT,
      survey_number TEXT,
      village TEXT,
      taluk TEXT,
      district TEXT DEFAULT 'Dharwad'
    );
  `);

  // 3. Farmer Verifications Queue (RTC / Pahani document submissions)
  db.exec(`
    CREATE TABLE IF NOT EXISTS farmer_verifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      survey_number TEXT NOT NULL,
      hissa_number TEXT NOT NULL,
      village TEXT NOT NULL,
      hobli TEXT NOT NULL,
      taluk TEXT NOT NULL,
      district TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'Karnataka',
      total_acres REAL NOT NULL,
      crop_types TEXT NOT NULL,
      ownership_type TEXT NOT NULL CHECK(ownership_type IN ('owned', 'leased')),
      rtc_document_url TEXT NOT NULL,
      rtc_file_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      rejection_reason TEXT,
      reviewed_by TEXT REFERENCES users(id),
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_verifications_status ON farmer_verifications(status);
    CREATE INDEX IF NOT EXISTS idx_verifications_user ON farmer_verifications(user_id);
  `);

  // 4. Verification Audit Log
  db.exec(`
    CREATE TABLE IF NOT EXISTS verification_audit_log (
      id TEXT PRIMARY KEY,
      verification_id TEXT NOT NULL REFERENCES farmer_verifications(id) ON DELETE CASCADE,
      action TEXT NOT NULL CHECK(action IN ('submitted', 'approved', 'rejected', 'resubmitted')),
      admin_id TEXT REFERENCES users(id),
      admin_name TEXT,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. Products Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      seller_id TEXT REFERENCES users(id),
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'kg',
      availableStock REAL NOT NULL,
      farmerName TEXT NOT NULL,
      farmerLocation TEXT NOT NULL,
      farmerPhone TEXT,
      isVerified INTEGER DEFAULT 1,
      isPublished INTEGER DEFAULT 1,
      imageUrl TEXT,
      description TEXT,
      qualityGrade TEXT DEFAULT 'Grade A',
      rating REAL DEFAULT 5.0,
      reviewCount INTEGER DEFAULT 0,
      isFarmerProduce INTEGER DEFAULT 1,
      harvestDate TEXT,
      batchNumber TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
  `);

  // 6. Orders Table (with multi-farmer assignment and Flipkart 7-stage timeline support)
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      orderId TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      parent_order_id TEXT,
      farmer_id TEXT REFERENCES users(id),
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'placed' CHECK(status IN ('placed', 'confirmed', 'preparing', 'packed', 'ready_for_pickup', 'in_transit', 'shipped', 'out_for_delivery', 'delivered', 'rejected', 'cancelled')),
      deliveryMode TEXT DEFAULT 'doorstep',
      deliveryAddress TEXT NOT NULL,
      consumerName TEXT NOT NULL,
      consumerPhone TEXT NOT NULL,
      paymentMode TEXT NOT NULL CHECK(paymentMode IN ('cod', 'upi', 'card', 'netbanking')),
      paymentStatus TEXT NOT NULL DEFAULT 'pending' CHECK(paymentStatus IN ('pending', 'pending_cod', 'success', 'failed')),
      transactionId TEXT,
      expectedDeliveryDate TEXT NOT NULL,
      total REAL NOT NULL,
      delivery_charge REAL DEFAULT 0,
      rejection_reason TEXT,
      isFavorite INTEGER DEFAULT 0,
      rated INTEGER DEFAULT 0,
      rating INTEGER,
      feedback TEXT,
      itemsJson TEXT NOT NULL,
      trackingMilestonesJson TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_farmer ON orders(farmer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_parent ON orders(parent_order_id);
  `);

  // Migrate existing orders table if needed
  try {
    const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='orders'").get() as { sql?: string } | undefined;
    if (tableInfo?.sql && (!tableInfo.sql.includes('preparing') || !tableInfo.sql.includes('farmer_id') || !tableInfo.sql.includes('parent_order_id'))) {
      db.exec(`
        CREATE TABLE orders_migrated (
          orderId TEXT PRIMARY KEY,
          user_id TEXT REFERENCES users(id),
          parent_order_id TEXT,
          farmer_id TEXT REFERENCES users(id),
          date TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'placed',
          deliveryMode TEXT DEFAULT 'doorstep',
          deliveryAddress TEXT NOT NULL,
          consumerName TEXT NOT NULL,
          consumerPhone TEXT NOT NULL,
          paymentMode TEXT NOT NULL,
          paymentStatus TEXT NOT NULL DEFAULT 'pending',
          transactionId TEXT,
          expectedDeliveryDate TEXT NOT NULL,
          total REAL NOT NULL,
          delivery_charge REAL DEFAULT 0,
          rejection_reason TEXT,
          isFavorite INTEGER DEFAULT 0,
          rated INTEGER DEFAULT 0,
          rating INTEGER,
          feedback TEXT,
          itemsJson TEXT NOT NULL,
          trackingMilestonesJson TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        INSERT OR IGNORE INTO orders_migrated (
          orderId, user_id, date, status, deliveryMode, deliveryAddress, consumerName,
          consumerPhone, paymentMode, paymentStatus, transactionId, expectedDeliveryDate,
          total, isFavorite, rated, rating, feedback, itemsJson, trackingMilestonesJson, createdAt
        )
        SELECT 
          orderId, user_id, date, status, deliveryMode, deliveryAddress, consumerName,
          consumerPhone, paymentMode, paymentStatus, transactionId, expectedDeliveryDate,
          total, isFavorite, rated, rating, feedback, itemsJson, trackingMilestonesJson, createdAt
        FROM orders;
        DROP TABLE orders;
        ALTER TABLE orders_migrated RENAME TO orders;
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
        CREATE INDEX IF NOT EXISTS idx_orders_farmer ON orders(farmer_id);
        CREATE INDEX IF NOT EXISTS idx_orders_parent ON orders(parent_order_id);
      `);
    }
  } catch (migErr) {
    console.warn('Orders migration check note:', migErr);
  }

  // 7. Order Items Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(orderId) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      product_title TEXT NOT NULL,
      seller_id TEXT REFERENCES users(id),
      quantity REAL NOT NULL,
      price REAL NOT NULL,
      subtotal REAL NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_seller ON order_items(seller_id);
  `);

  // 8. Order Status History (Audit trail of fulfillment)
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_status_history (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(orderId) ON DELETE CASCADE,
      status TEXT NOT NULL,
      note TEXT,
      updated_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_status_history_order ON order_status_history(order_id);
  `);

  // 9. Shipments Table (Logistics, tracking number, carrier, driver, timestamps)
  db.exec(`
    CREATE TABLE IF NOT EXISTS shipments (
      id TEXT PRIMARY KEY,
      order_id TEXT UNIQUE NOT NULL REFERENCES orders(orderId) ON DELETE CASCADE,
      tracking_id TEXT UNIQUE NOT NULL,
      carrier_name TEXT NOT NULL DEFAULT 'NammaKrushi Rural Cold-Chain Logistics',
      vehicle_number TEXT,
      driver_name TEXT,
      driver_phone TEXT,
      pickup_timestamp DATETIME,
      transit_timestamp DATETIME,
      out_for_delivery_timestamp DATETIME,
      delivery_timestamp DATETIME,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'assigned', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'cancelled')),
      current_location_note TEXT,
      delivery_confirmation_code TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);
    CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_id);
  `);

  // 9b. Order Logistics Table (for backwards compatibility)
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_logistics (
      id TEXT PRIMARY KEY,
      order_id TEXT UNIQUE NOT NULL REFERENCES orders(orderId) ON DELETE CASCADE,
      courier_name TEXT,
      tracking_number TEXT,
      vehicle_number TEXT,
      driver_name TEXT,
      driver_phone TEXT,
      expected_delivery TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 10. Payments Ledger Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(orderId) ON DELETE CASCADE,
      method TEXT NOT NULL CHECK(method IN ('cod', 'upi', 'card', 'netbanking')),
      upi_id_masked TEXT,
      amount REAL NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'pending_cod', 'success', 'failed')),
      transaction_ref TEXT NOT NULL,
      provider_response TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
  `);

  // 11. Farm Tasks Table (with Automated Scheduler Alert Tracking Columns)
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Completed')),
      fieldSector TEXT NOT NULL,
      assignedTo TEXT,
      notes TEXT,
      alert_before_sent INTEGER DEFAULT 0,
      overdue_alert_count INTEGER DEFAULT 0,
      last_alert_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(dueDate);
  `);

  // 12. In-App Notifications Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'system',
      read INTEGER DEFAULT 0,
      actionTab TEXT,
      metadata_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, read);
  `);

  // 13. Farm-to-Table Traceability Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS traceability (
      productId TEXT PRIMARY KEY,
      productTitle TEXT NOT NULL,
      batchNumber TEXT NOT NULL,
      harvestDate TEXT NOT NULL,
      harvestTimestamp TEXT,
      farmLocationJson TEXT NOT NULL,
      farmerDetailsJson TEXT NOT NULL,
      qualityMetricsJson TEXT NOT NULL,
      transportLogsJson TEXT NOT NULL,
      verificationHash TEXT NOT NULL,
      qrPayload TEXT NOT NULL,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 14. Market Rates / Mandi Prices Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS market_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crop TEXT NOT NULL,
      mandi TEXT NOT NULL,
      minPrice REAL NOT NULL,
      maxPrice REAL NOT NULL,
      modalPrice REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'Quintal',
      trend TEXT DEFAULT 'steady',
      change TEXT,
      arrivals TEXT,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default data if database is empty
  seedInitialData(db);
}

function seedInitialData(db: DatabaseSync) {
  // Check users count
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, email, phone, password_hash, name, role, is_blocked, district)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertFarmerProfile = db.prepare(`
      INSERT INTO farmer_profiles (user_id, verification_status, approved_by, approved_at, farm_acres, crop_types, survey_number, village, taluk, district)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 1. Admin Seed (admin@nammakrushi.in / Admin@NammaKrushi2026)
    const adminId = 'usr-admin-01';
    const adminPassHash = bcrypt.hashSync('Admin@NammaKrushi2026', 10);
    insertUser.run(
      adminId,
      'admin@nammakrushi.in',
      '9900112233',
      adminPassHash,
      'NammaKrushi Chief Agricultural Admin',
      'admin',
      0,
      'Bengaluru'
    );

    // 2. Approved Farmer Seed (farmer@nammakrushi.in / Farmer@NammaKrushi2026)
    const farmerId = 'usr-farmer-01';
    const farmerPassHash = bcrypt.hashSync('Farmer@NammaKrushi2026', 10);
    insertUser.run(
      farmerId,
      'farmer@nammakrushi.in',
      '9876543210',
      farmerPassHash,
      'Manish S.B. (Raitha Bandhu)',
      'farmer',
      0,
      'Dharwad'
    );

    insertFarmerProfile.run(
      farmerId,
      'approved',
      adminId,
      new Date().toISOString(),
      4.5,
      'Bt Cotton, Byadgi Chillies, Maldandi Jowar',
      '142/2A',
      'Navalgund',
      'Navalgund Taluk',
      'Dharwad'
    );

    // 3. Approved Farmer Seed 2 (basavaraj@nammakrushi.in / Farmer@NammaKrushi2026)
    const farmer2Id = 'usr-farmer-02';
    const farmer2PassHash = bcrypt.hashSync('Farmer@NammaKrushi2026', 10);
    insertUser.run(
      farmer2Id,
      'basavaraj@nammakrushi.in',
      '9845123456',
      farmer2PassHash,
      'Basavaraj Patil (Organic Malaprabha)',
      'farmer',
      0,
      'Belagavi'
    );

    insertFarmerProfile.run(
      farmer2Id,
      'approved',
      adminId,
      new Date().toISOString(),
      6.2,
      'Sharbati Wheat, Sona Masoori Rice, Organic Jaggery',
      '88/3B',
      'Bailhongal',
      'Bailhongal Taluk',
      'Belagavi'
    );

    // 4. Consumer Seed (consumer@nammakrushi.in / Consumer@NammaKrushi2026)
    const consumerId = 'usr-consumer-01';
    const consumerPassHash = bcrypt.hashSync('Consumer@NammaKrushi2026', 10);
    insertUser.run(
      consumerId,
      'consumer@nammakrushi.in',
      '9123456789',
      consumerPassHash,
      'Ananya Sharma (City Buyer)',
      'consumer',
      0,
      'Bengaluru'
    );

    // 5. Sample Pending Verification Request (for testing admin queue)
    const insertVerif = db.prepare(`
      INSERT INTO farmer_verifications (
        id, user_id, full_name, phone, survey_number, hissa_number, village,
        hobli, taluk, district, state, total_acres, crop_types, ownership_type,
        rtc_document_url, rtc_file_name, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertVerif.run(
      'verif-sample-01',
      farmerId,
      'Manish S.B.',
      '9876543210',
      '142',
      '2A',
      'Navalgund',
      'Navalgund Hobli',
      'Navalgund',
      'Dharwad',
      'Karnataka',
      4.5,
      'Bt Cotton, Byadgi Chillies',
      'owned',
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      'RTC_Pahani_Survey_142_2A.pdf',
      'approved',
      new Date().toISOString()
    );
  }

  // Ensure usr-farmer-02 exists if DB was already seeded
  try {
    const hasFarmer2 = db.prepare('SELECT id FROM users WHERE id = ?').get('usr-farmer-02');
    if (!hasFarmer2) {
      const farmer2PassHash = bcrypt.hashSync('Farmer@NammaKrushi2026', 10);
      db.prepare(`
        INSERT OR IGNORE INTO users (id, email, phone, password_hash, name, role, is_blocked, district)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run('usr-farmer-02', 'basavaraj@nammakrushi.in', '9845123456', farmer2PassHash, 'Basavaraj Patil (Organic Malaprabha)', 'farmer', 0, 'Belagavi');
      db.prepare(`
        INSERT OR IGNORE INTO farmer_profiles (user_id, verification_status, approved_by, approved_at, farm_acres, crop_types, survey_number, village, taluk, district)
        VALUES (?, 'approved', 'usr-admin-01', CURRENT_TIMESTAMP, 6.2, 'Sharbati Wheat, Sona Masoori Rice, Organic Jaggery', '88/3B', 'Bailhongal', 'Bailhongal Taluk', 'Belagavi')
      `).run('usr-farmer-02');
    }
  } catch (err) {
    console.warn('Farmer 2 migration note:', err);
  }

  // Check products count
  const countRow = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (countRow.count === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO products (
        id, seller_id, title, category, price, unit, availableStock, farmerName, 
        farmerLocation, farmerPhone, isVerified, isPublished, imageUrl, description, 
        qualityGrade, rating, reviewCount, isFarmerProduce, harvestDate, batchNumber
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of INITIAL_PRODUCTS) {
      const isFarmer2 = p.id === 'prod-2' || p.id === 'prod-4' || p.id === 'prod-6';
      const sellerId = isFarmer2 ? 'usr-farmer-02' : 'usr-farmer-01';
      const fName = isFarmer2 ? 'Basavaraj Patil (Organic Malaprabha)' : p.farmerName;
      const fLoc = isFarmer2 ? 'Bailhongal, Belagavi' : p.farmerLocation;
      insertProduct.run(
        p.id,
        sellerId,
        p.title,
        p.category,
        p.price,
        p.unit || 'kg',
        p.availableStock,
        fName,
        fLoc,
        p.farmerPhone || '',
        p.isVerified ? 1 : 0,
        1,
        p.imageUrl,
        p.description,
        p.qualityGrade,
        p.rating || 5.0,
        p.reviewCount || 0,
        p.isFarmerProduce ? 1 : 0,
        p.harvestDate || 'Harvested 3 days ago',
        p.batchNumber || `BATCH-KA-${p.id.toUpperCase()}`
      );
    }
  }

  // Update product seller assignments if already seeded
  try {
    db.prepare(`
      UPDATE products 
      SET seller_id = 'usr-farmer-02', 
          farmerName = 'Basavaraj Patil (Organic Malaprabha)', 
          farmerLocation = 'Bailhongal, Belagavi' 
      WHERE id IN ('prod-2', 'prod-4', 'prod-6')
    `).run();
    db.prepare(`
      UPDATE products 
      SET seller_id = 'usr-farmer-01' 
      WHERE seller_id IS NULL OR seller_id = ''
    `).run();

    // Ensure fruit products are present
    const hasP10 = db.prepare('SELECT id FROM products WHERE id = ?').get('prod-10');
    if (!hasP10) {
      db.prepare(`
        INSERT OR IGNORE INTO products (
          id, seller_id, title, category, price, unit, availableStock, farmerName, 
          farmerLocation, farmerPhone, isVerified, isPublished, imageUrl, description, 
          qualityGrade, rating, reviewCount, isFarmerProduce, harvestDate, batchNumber
        ) VALUES (
          'prod-10', 'usr-farmer-02', 'Fresh Farm Bhagawa Pomegranates (GI Tagged)', 'Fruits', 130, 'kg', 800,
          'Basavaraj Patil (Organic Malaprabha)', 'Bailhongal, Belagavi', '9845123456', 1, 1,
          'https://images.unsplash.com/photo-1541344999736-83eca872f240?auto=format&fit=crop&w=600&q=80',
          'Juicy ruby-red Bhagawa variety pomegranates plucked directly from the orchard.', 'Grade A (Export Quality)', 4.9, 24, 1, 'Picked 2 days ago', 'BATCH-KA-PROD-10'
        )
      `).run();
    }
    const hasP11 = db.prepare('SELECT id FROM products WHERE id = ?').get('prod-11');
    if (!hasP11) {
      db.prepare(`
        INSERT OR IGNORE INTO products (
          id, seller_id, title, category, price, unit, availableStock, farmerName, 
          farmerLocation, farmerPhone, isVerified, isPublished, imageUrl, description, 
          qualityGrade, rating, reviewCount, isFarmerProduce, harvestDate, batchNumber
        ) VALUES (
          'prod-11', 'usr-farmer-01', 'Organic Robusta Farm Bananas (Tree Ripened)', 'Fruits', 40, 'kg', 650,
          'Manish S.B. (Raitha Bandhu)', 'Navalgund, Dharwad', '9876543210', 1, 1,
          'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
          'Naturally tree-ripened Robusta bananas without chemical carbide.', 'Grade A (Organic)', 4.8, 18, 1, 'Harvested yesterday', 'BATCH-KA-PROD-11'
        )
      `).run();
    }
  } catch (err) {
    console.warn('Product seller update note:', err);
  }

  // Check orders count
  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number };
  if (orderCount.count === 0) {
    const insertOrder = db.prepare(`
      INSERT INTO orders (
        orderId, user_id, date, status, deliveryMode, deliveryAddress, consumerName,
        consumerPhone, paymentMode, paymentStatus, transactionId, expectedDeliveryDate,
        total, isFavorite, rated, rating, feedback, itemsJson, trackingMilestonesJson
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertPayment = db.prepare(`
      INSERT INTO payments (
        id, order_id, method, upi_id_masked, amount, status, transaction_ref, provider_response
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const o of INITIAL_CONSUMER_ORDERS) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + 3);
      const expDateStr = expDate.toISOString().split('T')[0];

      insertOrder.run(
        o.orderId,
        'usr-consumer-01',
        o.date,
        'confirmed',
        o.deliveryMode,
        o.deliveryAddress,
        o.consumerName,
        o.consumerPhone,
        o.paymentMode.toLowerCase().includes('upi') ? 'upi' : 'cod',
        'success',
        o.transactionId || `TXN-${Date.now()}`,
        expDateStr,
        o.total,
        o.isFavorite ? 1 : 0,
        o.rated ? 1 : 0,
        o.rating || null,
        o.feedback || null,
        JSON.stringify(o.items || []),
        JSON.stringify(o.trackingMilestones || [])
      );

      insertPayment.run(
        `PAY-${o.orderId}`,
        o.orderId,
        o.paymentMode.toLowerCase().includes('upi') ? 'upi' : 'cod',
        o.paymentMode.toLowerCase().includes('upi') ? 'an***a@okaxis' : null,
        o.total,
        'success',
        o.transactionId || `REF-${o.orderId}`,
        'Initial mock payment verified'
      );
    }
  }

  // Check tasks count
  const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };
  if (taskCount.count === 0) {
    const insertTask = db.prepare(`
      INSERT INTO tasks (
        id, user_id, title, category, dueDate, priority, status, fieldSector, assignedTo, notes,
        alert_before_sent, overdue_alert_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    insertTask.run(
      'task-init-01',
      'usr-farmer-01',
      'Irrigate Sector A (Bt Cotton)',
      'Irrigation',
      todayStr,
      'High',
      'Pending',
      'Sector A (North Field)',
      'Manish S.B.',
      'Calibrated to 40m drip cycle based on weather forecast',
      0,
      0
    );

    insertTask.run(
      'task-init-02',
      'usr-farmer-01',
      'Foliar Micronutrient Zinc Spray',
      'Fertilization',
      tomorrowStr,
      'Medium',
      'Pending',
      'Sector B (Byadgi Chillies)',
      'Field Crew 1',
      'Spray before 10:30 AM to avoid midday evaporation',
      0,
      0
    );

    insertTask.run(
      'task-init-03',
      'usr-farmer-01',
      'Clean Drip Line Emitters & Flush Filter',
      'Equipment Maintenance',
      yesterdayStr,
      'High',
      'Pending',
      'Sector C (South Terraces)',
      'Pump Operator',
      'Overdue check: Flush sand filter and disc valves',
      1,
      1
    );
  }

  // Check traceability count
  const traceCount = db.prepare('SELECT COUNT(*) as count FROM traceability').get() as { count: number };
  if (traceCount.count === 0) {
    const insertTrace = db.prepare(`
      INSERT INTO traceability (
        productId, productTitle, batchNumber, harvestDate, harvestTimestamp,
        farmLocationJson, farmerDetailsJson, qualityMetricsJson, transportLogsJson,
        verificationHash, qrPayload
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const [pId, trace] of Object.entries(INITIAL_TRACEABILITY_DATA)) {
      insertTrace.run(
        pId,
        trace.productTitle,
        trace.batchNumber,
        trace.harvestDate,
        trace.harvestTimestamp,
        JSON.stringify(trace.farmLocation),
        JSON.stringify(trace.farmerDetails),
        JSON.stringify(trace.qualityMetrics),
        JSON.stringify(trace.transportLogs),
        trace.verificationHash,
        trace.qrPayload
      );
    }
  }

  // Check market rates count
  const rateCount = db.prepare('SELECT COUNT(*) as count FROM market_rates').get() as { count: number };
  if (rateCount.count === 0) {
    const insertRate = db.prepare(`
      INSERT INTO market_rates (
        crop, mandi, minPrice, maxPrice, modalPrice, unit, trend, change, arrivals
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const r of INITIAL_MARKET_RATES) {
      insertRate.run(
        r.crop,
        r.mandi,
        r.minPrice,
        r.maxPrice,
        r.modalPrice,
        r.unit,
        r.trend,
        r.change,
        r.arrivals
      );
    }
  }
}
