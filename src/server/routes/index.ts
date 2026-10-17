/**
 * NammaKrushi MERN / MVC API Router
 * Dispatches structured HTTP routes to Controllers backed by SQLite models.
 */

import type { IncomingMessage, ServerResponse } from 'http';
import { ProductController } from '../controllers/productController.ts';
import { OrderController } from '../controllers/orderController.ts';
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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

export async function handleMvcRoutes(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const method = req.method || 'GET';
  const rawUrl = req.url || '';
  const urlObj = new URL(rawUrl, 'http://localhost');
  const pathname = urlObj.pathname;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return true;
  }

  // --- 0. SYSTEM & DATABASE HEALTH ---
  if (pathname === '/api/health' && method === 'GET') {
    sendJson(res, 200, {
      status: 'healthy',
      engine: 'SQLite native DatabaseSync + SQLAlchemy ORM layer',
      database: 'nammakrushi.sqlite',
      architecture: 'MERN Stack + MVC Pattern',
      routes: [
        '/api/health',
        '/api/products',
        '/api/products/:id',
        '/api/orders',
        '/api/orders/:id',
        '/api/orders/rate',
        '/api/traceability/:productId',
        '/api/market_rates',
        '/api/weather',
        '/api/climate_smart_chat',
        '/api/predict_crop'
      ],
      timestamp: new Date().toISOString()
    });
    return true;
  }

  // --- 1. PRODUCT ROUTES ---
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

  // POST /api/products
  if (pathname === '/api/products' && method === 'POST') {
    const body = await parseBody(req);
    const result = ProductController.create(body);
    sendJson(res, result.success ? 201 : 400, result);
    return true;
  }

  // --- 2. ORDER ROUTES ---
  // GET /api/orders
  if (pathname === '/api/orders' && method === 'GET') {
    const result = OrderController.getAll();
    sendJson(res, 200, result);
    return true;
  }

  // GET /api/orders/:id
  if (pathname.startsWith('/api/orders/') && method === 'GET') {
    const orderId = pathname.replace('/api/orders/', '');
    const result = OrderController.getById(orderId);
    sendJson(res, result.success ? 200 : 404, result);
    return true;
  }

  // POST /api/orders
  if (pathname === '/api/orders' && method === 'POST') {
    const body = await parseBody(req);
    const result = OrderController.create(body);
    sendJson(res, 201, result);
    return true;
  }

  // POST /api/orders/rate
  if (pathname === '/api/orders/rate' && method === 'POST') {
    const body = await parseBody(req);
    const result = OrderController.submitRating(body.orderId, body.rating, body.feedback);
    sendJson(res, result.success ? 200 : 400, result);
    return true;
  }

  // --- 3. FARM-TO-TABLE TRACEABILITY & QR ROUTES ---
  // GET /api/traceability/:productId
  if (pathname.startsWith('/api/traceability/') && method === 'GET') {
    const productId = pathname.replace('/api/traceability/', '');
    const result = TraceabilityController.getByProductId(productId);
    sendJson(res, 200, result);
    return true;
  }

  // POST /api/traceability/verify
  if (pathname === '/api/traceability/verify' && method === 'POST') {
    const body = await parseBody(req);
    const result = TraceabilityController.verifyPassport(body.hash || '');
    sendJson(res, 200, result);
    return true;
  }

  // --- 4. MARKET RATES ROUTES ---
  // GET /api/market_rates
  if (pathname === '/api/market_rates' && method === 'GET') {
    const result = MarketRateController.getAll();
    sendJson(res, 200, result);
    return true;
  }

  return false;
}
