import { ProductModel } from '../models/ProductModel.ts';
import { MarketplaceProduct } from '../../types/index.ts';

export const ProductController = {
  getAll: (options?: { category?: string; farmerOnly?: boolean }) => {
    return {
      success: true,
      products: ProductModel.findAll(options)
    };
  },

  getById: (id: string) => {
    const product = ProductModel.findById(id);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }
    return { success: true, product };
  },

  create: (data: Partial<MarketplaceProduct>) => {
    if (!data.title || !data.price) {
      return { success: false, error: 'Title and price are required' };
    }

    const newProduct: MarketplaceProduct = {
      id: data.id || `prod-${Date.now()}`,
      title: data.title.trim(),
      category: data.category || 'Vegetables',
      price: Number(data.price),
      unit: data.unit || 'kg',
      availableStock: Number(data.availableStock || 100),
      farmerName: data.farmerName || 'Manish S.B. (Verified Farmer)',
      farmerLocation: data.farmerLocation || 'Varur, Dharwad',
      farmerPhone: data.farmerPhone || '9845987654',
      isVerified: true,
      imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
      description: data.description || 'Direct from farm, verified harvest inspection.',
      qualityGrade: data.qualityGrade || 'Grade A',
      rating: 5.0,
      reviewCount: 1,
      isFarmerProduce: data.isFarmerProduce !== undefined ? data.isFarmerProduce : true,
      harvestDate: data.harvestDate || 'Harvested today',
      batchNumber: `BATCH-KA-${Date.now().toString().slice(-6)}`
    };

    const saved = ProductModel.create(newProduct);
    return { success: true, product: saved };
  }
};
