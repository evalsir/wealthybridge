const axios = require('axios');
const logger = require('../utils/logger');

const API_URL = process.env.EXCHANGE_RATE_API_URL;

let cachedRates = {};
let lastFetch = 0;
const CACHE_DURATION = 3600000; // 1 hour in ms

// Get exchange rate from USD to target currency
exports.getRate = async (targetCurrency) => {
  targetCurrency = targetCurrency.toUpperCase();
  if (targetCurrency === 'USD') return 1;

  const now = Date.now();
  if (now - lastFetch > CACHE_DURATION || !cachedRates[targetCurrency]) {
    try {
      const response = await axios.get(API_URL);
      cachedRates = response.data.rates;
      lastFetch = now;
      logger.info(`Currency rates cached, base USD`);
    } catch (err) {
      logger.error(`Currency rate fetch error: ${err.message}`);
      throw new Error('Failed to fetch currency rates');
    }
  }

  const rate = cachedRates[targetCurrency];
  if (!rate) throw new Error(`No rate found for ${targetCurrency}`);
  return rate;
};