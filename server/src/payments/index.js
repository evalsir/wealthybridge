const airtelMoney = require('./gateways/airtelMoney');
const americanExpress = require('./gateways/americanExpress');
const flutterwave = require('./gateways/flutterwave');
const mastercard = require('./gateways/mastercard');
const mpesa = require('./gateways/mpesa');
const mtn = require('./gateways/mtn');
const paypal = require('./gateways/paypal');
const skrill = require('./gateways/skrill');
const tigoPesa = require('./gateways/tigoPesa');

// Central gateway map
const gateways = {
  airtelMoney,
  americanExpress,
  flutterwave,
  mastercard,
  mpesa,
  mtn,
  paypal,
  skrill,
  tigoPesa,
};


module.exports = {
  processPayment: async (options) => gateways[options.gateway].processPayment(options),
  processRefund: async (options) => gateways[options.gateway].processRefund(options),
  processWithdrawal: async (options) => gateways[options.gateway].processWithdrawal(options),
  handleCallback: async (gateway, payload) => gateways[gateway].handleCallback(payload),
  capturePayment: async (gateway, transactionId, userId, paymentId) =>
    gateways[gateway].capturePayment(transactionId, userId, paymentId),
  cleanup: () => {
    Object.values(gateways).forEach(gateway => gateway.cleanup && gateway.cleanup());
  },
};