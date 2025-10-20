/**
 * Stripe React Native shim for web
 * Stripe web should use Stripe.js directly, not the native module
 */

const StripeSdk = {
  getConstants() {
    return {
      // Return minimal constants to prevent crashes
      // Web should use @stripe/stripe-js instead
    };
  },

  initialise: () => {
    console.warn('Stripe native module not available on web. Use @stripe/stripe-js instead.');
    return Promise.resolve();
  },

  initPaymentSheet: () => {
    console.warn('Stripe PaymentSheet not available on web. Use Stripe Elements instead.');
    return Promise.reject(new Error('PaymentSheet not supported on web'));
  },

  presentPaymentSheet: () => {
    return Promise.reject(new Error('PaymentSheet not supported on web'));
  },

  confirmPaymentSheetPayment: () => {
    return Promise.reject(new Error('PaymentSheet not supported on web'));
  },

  createPaymentMethod: () => {
    console.warn('Use Stripe.js createPaymentMethod on web');
    return Promise.reject(new Error('Use Stripe.js on web'));
  },

  retrievePaymentIntent: () => {
    return Promise.reject(new Error('Use Stripe.js on web'));
  },

  handleNextAction: () => {
    return Promise.reject(new Error('Use Stripe.js on web'));
  },

  confirmPayment: () => {
    console.warn('Use Stripe.js confirmPayment on web');
    return Promise.reject(new Error('Use Stripe.js on web'));
  },

  isApplePaySupported: () => {
    return Promise.resolve(false);
  },

  isGooglePaySupported: () => {
    return Promise.resolve(false);
  },

  // Add any other methods that might be called
  createToken: () => Promise.reject(new Error('Use Stripe.js on web')),
  updatePaymentSheet: () => Promise.reject(new Error('Not supported on web')),
};

export default StripeSdk;
