import { MarketRateModel } from '../models/MarketRateModel.ts';

export const MarketRateController = {
  getAll: () => {
    const rates = MarketRateModel.findAll();
    return {
      success: true,
      rates,
      lastUpdated: new Date().toLocaleTimeString('en-IN')
    };
  }
};
