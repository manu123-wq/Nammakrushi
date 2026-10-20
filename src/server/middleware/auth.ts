import jwt from 'jsonwebtoken';
import type { IncomingMessage, ServerResponse } from 'http';
import { getDatabase } from '../database/sqlite.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'nammakrushi-jwt-super-secret-key-2026';
const JWT_EXPIRES_IN = '7d';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'farmer' | 'consumer' | 'admin';
  district?: string;
  verificationStatus?: 'unverified' | 'pending' | 'approved' | 'rejected';
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      district: user.district,
      verificationStatus: user.verificationStatus
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (err) {
    return null;
  }
}

export function extractAuthUser(req: IncomingMessage): AuthUser | null {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return verifyToken(token);
}

export function requireAuth(req: IncomingMessage, res: ServerResponse): AuthUser | null {
  const user = extractAuthUser(req);
  if (!user) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Unauthorized: Valid JWT Bearer token required' }));
    return null;
  }
  return user;
}

export function requireRole(req: IncomingMessage, res: ServerResponse, ...allowedRoles: ('farmer' | 'consumer' | 'admin')[]): AuthUser | null {
  const user = requireAuth(req, res);
  if (!user) return null;

  if (!allowedRoles.includes(user.role)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false, 
      error: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Current role: ${user.role}` 
    }));
    return null;
  }

  return user;
}

/**
 * Middleware: Blocks unverified farmers from creating or updating marketplace products
 * Only approved farmers and admins are authorized.
 */
export function requireVerifiedFarmer(req: IncomingMessage, res: ServerResponse): AuthUser | null {
  const user = requireRole(req, res, 'farmer', 'admin');
  if (!user) return null;

  if (user.role === 'admin') {
    return user;
  }

  const db = getDatabase();
  const profile = db.prepare('SELECT verification_status FROM farmer_profiles WHERE user_id = ?').get(user.id) as any;
  if (!profile || profile.verification_status !== 'approved') {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Forbidden: Land record verification (RTC/Pahani) approval is required before adding products to the marketplace.',
      verificationStatus: profile?.verification_status || 'unverified'
    }));
    return null;
  }

  user.verificationStatus = 'approved';
  return user;
}
