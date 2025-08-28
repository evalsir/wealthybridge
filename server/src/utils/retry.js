// src/utils/retry.js
const logger = require('./logger');

async function retryOperation(operation, maxAttempts = process.env.RETRY_MAX_ATTEMPTS || 3, initialDelay = process.env.RETRY_INITIAL_DELAY_MS || 1000) {
  let attempt = 1;
  while (attempt <= maxAttempts) {
    try {
      return await operation();
    } catch (err) {
      if (attempt === maxAttempts) {
        logger.error(`Retry failed after ${maxAttempts} attempts: ${err.message}`);
        throw err;
      }
      const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff
      logger.warn(`Retry attempt ${attempt} failed: ${err.message}. Retrying in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }
}

module.exports = { retryOperation };