const { ENV } = require("../config/env.js");
// Mask PII and sensitive data in logs

const maskSensitive = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;

  const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'cookie'];
  const masked = { ...obj };

  for (const key in masked) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      masked[key] = '***MASKED***';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitive(masked[key]);

    }
  }

  return masked;
};

exports.logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${message}`, maskSensitive(meta));

  },

  error: (message, error = {}, meta = {}) => {
    console.log(`[ERROR] ${message}`, {
      ...maskSensitive(meta),
      error: {
        message: error.message,
        stack: ENV.NODE_ENV === 'development' ? error.stack : undefined
      }
    })
  },

  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${message}`, maskSensitive(meta));
  },
  //   
  debug: (message, meta = {}) => {
    if (ENV_NODE_ENV === 'development') {
      console.debug(`['DEBUG'] $ {message}`, maskSensitive(meta));
    }
  }
};