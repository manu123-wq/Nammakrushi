import { getDatabase } from '../database/sqlite.ts';
import { MarketplaceProduct } from '../../types/index.ts';

export class ProductModel {
  static findAll(options?: { category?: string; farmerOnly?: boolean }): MarketplaceProduct[] {
    const db = getDatabase();
    let query = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    if (options?.category && options.category !== 'All' && options.category !== 'All Produce') {
      query += ' AND category = ?';
      params.push(options.category);
    }

    if (options?.farmerOnly) {
      query += ' AND isFarmerProduce = 1';
    }

    query += ' ORDER BY createdAt DESC';
    const rows = db.prepare(query).all(...params) as any[];

    return rows.map(r => ({
      id: r.id,
      title: r.title,
      category: r.category,
      price: Number(r.price),
      unit: r.unit || 'kg',
      availableStock: Number(r.availableStock),
      farmerName: r.farmerName,
      farmerLocation: r.farmerLocation,
      farmerPhone: r.farmerPhone,
      isVerified: Boolean(r.isVerified),
      imageUrl: r.imageUrl,
      description: r.description,
      qualityGrade: r.qualityGrade,
      rating: Number(r.rating || 5.0),
      reviewCount: Number(r.reviewCount || 0),
      isFarmerProduce: Boolean(r.isFarmerProduce),
      harvestDate: r.harvestDate,
      batchNumber: r.batchNumber
    }));
  }

  static findById(id: string): MarketplaceProduct | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      category: row.category,
      price: Number(row.price),
      unit: row.unit || 'kg',
      availableStock: Number(row.availableStock),
      farmerName: row.farmerName,
      farmerLocation: row.farmerLocation,
      farmerPhone: row.farmerPhone,
      isVerified: Boolean(row.isVerified),
      imageUrl: row.imageUrl,
      description: row.description,
      qualityGrade: row.qualityGrade,
      rating: Number(row.rating || 5.0),
      reviewCount: Number(row.reviewCount || 0),
      isFarmerProduce: Boolean(row.isFarmerProduce),
      harvestDate: row.harvestDate,
      batchNumber: row.batchNumber
    };
  }

  static create(product: MarketplaceProduct): MarketplaceProduct {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO products (
        id, title, category, price, unit, availableStock, farmerName,
        farmerLocation, farmerPhone, isVerified, imageUrl, description,
        qualityGrade, rating, reviewCount, isFarmerProduce, harvestDate, batchNumber
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      product.id,
      product.title,
      product.category,
      product.price,
      product.unit || 'kg',
      product.availableStock,
      product.farmerName,
      product.farmerLocation,
      product.farmerPhone || '',
      product.isVerified ? 1 : 0,
      product.imageUrl,
      product.description,
      product.qualityGrade,
      product.rating || 5.0,
      product.reviewCount || 0,
      product.isFarmerProduce ? 1 : 0,
      product.harvestDate || 'Harvested recently',
      product.batchNumber || `BATCH-KA-${product.id.slice(-6).toUpperCase()}`
    );

    return product;
  }
}
