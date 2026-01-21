const { v4: uuidv4 } = require("uuid");

const generateIdempotencyKey = () => {
  return uuidv4();
};
// In0memory idempotency store (use redis in production)
const idempotencyStore = new Map();

// Clean up expired keys (older than 24 hours)

setInterval(() => {
  const now = Date.now();
  for (const [key, data] of idempotencyStore.entries()) {
    if (now - data.timestamp > 24 * 60 * 1000) {
      idempotencyStore.delete(key);
    }

  }

}, 60 * 60 * 1000);// Run every hour

const checkIdempotency = (key) => {
  const record = idempotencyStore.get(key);
  if (!record) {
    return null;
  }

  // Check if key expired (24 hours)
  if (Date.now() - record.timestamp > 24 * 60 * 60 * 1000) {
    idempotencyStore.delete(key);
    return null;
  }
  return record.response;
};
const storeIdempotency = (key, response) => {
  idempotencyStore.set(key, {
    response,
    timestamp: Date.now()
  });
};

const idempotencyMiddleware = (req, res, next) => {
  // Skip idempotency check for options requests
  if (req.method === 'OPTIONS') {
    return next();

  }
  // const idempotencyKey = req.headers['idempotency-key'] || req.body?.idempotencyKey;
  const idempotencyKey = req.headers['idempotency-key'] || req.body?.idempotencyKey;
  if (!idempotencyKey) {
    return next();
  }

  // Check if key expired (24 hours)
  const cachedResponse = checkIdempotency(idempotencyKey);
  if (cachedResponse) {
    return res.status(cachedResponse.status).json(cachedResponse.body);
  }
  // Store original status method
  const originalJson = res.json.bind(res);

  // Override json to cache  response
  res.json = function (body) {
    if (res.statusCode >= 200 && res.statusCode <= 300) {
      storeIdempotency(idempotencyKey, {
        status: res.statusCode,
        body
      })
    }
    return originalJson(body);
  };

  next();
};
module.exports = { idempotencyStore, generateIdempotencyKey, checkIdempotency, storeIdempotency, idempotencyMiddleware };