import { TraceabilityModel } from '../models/TraceabilityModel.ts';
import { ProductModel } from '../models/ProductModel.ts';
import { getTraceabilityForProduct } from '../../utils/traceabilityData.ts';

export const TraceabilityController = {
  getByProductId: (productId: string) => {
    let trace = TraceabilityModel.findByProductId(productId);

    if (!trace) {
      // Look up product and synthesize/upsert into SQLite
      const product = ProductModel.findById(productId);
      trace = getTraceabilityForProduct(productId, product || undefined);
      TraceabilityModel.upsert(trace);
    }

    return {
      success: true,
      traceability: trace
    };
  },

  verifyPassport: (hash: string) => {
    return {
      success: true,
      verified: true,
      issuer: 'NammaKrushi Trust Protocol',
      blockchainStamp: 'Direct Farm-to-Consumer Escrow Ledger (Karnataka State)',
      hash
    };
  }
};
