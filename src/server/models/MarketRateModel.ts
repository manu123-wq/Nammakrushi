import { getDatabase } from '../database/sqlite.ts';
import { MarketRate } from '../../types/index.ts';

export class MarketRateModel {
  static findAll(): MarketRate[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM market_rates ORDER BY id ASC').all() as any[];

    return rows.map(r => ({
      crop: r.crop,
      mandi: r.mandi,
      minPrice: Number(r.minPrice),
      maxPrice: Number(r.maxPrice),
      modalPrice: Number(r.modalPrice),
      unit: r.unit,
      trend: r.trend as 'up' | 'down' | 'steady',
      change: r.change,
      arrivals: r.arrivals
    }));
  }
}
