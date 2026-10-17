/**
 * NammaKrushi SQLite Database Engine & SQLAlchemy-inspired ORM Layer
 * Powered by Node.js 22 built-in native SQLite engine (node:sqlite DatabaseSync)
 * Provides zero-dependency, crash-resilient relational database storage.
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { INITIAL_PRODUCTS, INITIAL_CONSUMER_ORDERS, INITIAL_MARKET_RATES } from '../../utils/mockData.ts';
import { INITIAL_TRACEABILITY_DATA } from '../../utils/traceabilityData.ts';

// Resolve database storage path in project root
const dbFilePath = path.resolve(process.cwd(), 'nammakrushi.sqlite');

let databaseInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!databaseInstance) {
    databaseInstance = new DatabaseSync(dbFilePath);
    initSchema(databaseInstance);
  }
  return databaseInstance;
}

/**
 * Initializes relational database tables (SQLAlchemy-style schema definition)
 */
function initSchema(db: DatabaseSync) {
  // 1. Products Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'kg',
      availableStock REAL NOT NULL,
      farmerName TEXT NOT NULL,
      farmerLocation TEXT NOT NULL,
      farmerPhone TEXT,
      isVerified INTEGER DEFAULT 1,
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
  `);

  // 2. Orders Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      orderId TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Confirmed',
      deliveryMode TEXT DEFAULT 'doorstep',
      deliveryAddress TEXT NOT NULL,
      consumerName TEXT NOT NULL,
      consumerPhone TEXT NOT NULL,
      paymentMode TEXT NOT NULL,
      transactionId TEXT,
      gatewayStatus TEXT DEFAULT 'SUCCESS',
      driverName TEXT,
      driverPhone TEXT,
      vehicleNumber TEXT,
      estimatedDelivery TEXT,
      total REAL NOT NULL,
      isFavorite INTEGER DEFAULT 0,
      rated INTEGER DEFAULT 0,
      rating INTEGER,
      feedback TEXT,
      itemsJson TEXT NOT NULL,
      trackingMilestonesJson TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Farm-to-Table Traceability Table
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

  // 4. Market Rates Table (APMC Mandi Benchmarks)
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

  // Seed default data if tables are empty
  seedInitialData(db);
}

function seedInitialData(db: DatabaseSync) {
  // Check products count
  const countRow = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (countRow.count === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO products (
        id, title, category, price, unit, availableStock, farmerName, 
        farmerLocation, farmerPhone, isVerified, imageUrl, description, 
        qualityGrade, rating, reviewCount, isFarmerProduce, harvestDate, batchNumber
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of INITIAL_PRODUCTS) {
      insertProduct.run(
        p.id,
        p.title,
        p.category,
        p.price,
        p.unit || 'kg',
        p.availableStock,
        p.farmerName,
        p.farmerLocation,
        p.farmerPhone || '',
        p.isVerified ? 1 : 0,
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

  // Check orders count
  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number };
  if (orderCount.count === 0) {
    const insertOrder = db.prepare(`
      INSERT INTO orders (
        orderId, date, status, deliveryMode, deliveryAddress, consumerName,
        consumerPhone, paymentMode, transactionId, gatewayStatus, driverName,
        driverPhone, vehicleNumber, estimatedDelivery, total, isFavorite, rated,
        rating, feedback, itemsJson, trackingMilestonesJson
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const o of INITIAL_CONSUMER_ORDERS) {
      insertOrder.run(
        o.orderId,
        o.date,
        o.status,
        o.deliveryMode,
        o.deliveryAddress,
        o.consumerName,
        o.consumerPhone,
        o.paymentMode,
        o.transactionId || '',
        o.gatewayStatus || 'SUCCESS',
        o.driverName || '',
        o.driverPhone || '',
        o.vehicleNumber || '',
        o.estimatedDelivery || '',
        o.total,
        o.isFavorite ? 1 : 0,
        o.rated ? 1 : 0,
        o.rating || null,
        o.feedback || null,
        JSON.stringify(o.items || []),
        JSON.stringify(o.trackingMilestones || [])
      );
    }
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
