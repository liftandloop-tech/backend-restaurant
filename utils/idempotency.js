import { v4 as uuidv4 } from "uuid";
//const { v4: uuidv4 }=require('uuid')
// In-memory idempotency store (use Redis in production)
export const idempotencyStore = new Map();

// Clean up expired keys (older than 24 hours)
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of idempotencyStore.entries()) {
    if (now - data.timestamp > 24 * 60 * 60 * 1000) {
      idempotencyStore.delete(key);
    }
  }
}, 60 * 60 * 1000); // Run every hour

export const generateIdempotencyKey = () => {
  return uuidv4();
};

export const checkIdempotency = (key) => {
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

export const storeIdempotency = (key, response) => {
  idempotencyStore.set(key, {
    response,
    timestamp: Date.now()
  });
};

 export const idempotencyMiddleware = (req, res, next) => {
  // Skip idempotency check for OPTIONS requests
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  const idempotencyKey = req.headers['idempotency-key'] || req.body?.idempotencyKey;
  
  if (!idempotencyKey) {
    return next();
  }
  
  // Check if we've seen this key before
  const cachedResponse = checkIdempotency(idempotencyKey);
  
  if (cachedResponse) {
    return res.status(cachedResponse.status).json(cachedResponse.body);
  }
  
  // Store original json method
  const originalJson = res.json.bind(res);
  
  // Override json to cache response
  res.json = function(body) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      storeIdempotency(idempotencyKey, {
        status: res.statusCode,
        body
      });
    }
    return originalJson(body);
  };
  
  next();
};

export default idempotencyMiddleware;
//module.exports = {idempotencyStore,idempotencyMiddleware};
