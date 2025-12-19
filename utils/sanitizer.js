// MongoDB sanitization middleware - Express 5 compatible
// Prevents NoSQL injection by removing MongoDB operators from objects

// List of dangerous MongoDB operators
const MONGO_OPERATORS = [
  '$gt', '$gte', '$lt', '$lte', '$ne', '$in', '$nin', '$exists', '$regex',
  '$or', '$and', '$nor', '$not', '$type', '$mod', '$size', '$all', '$elemMatch',
  '$where', '$text', '$search', '$meta', '$slice', '$bitsAllSet', '$bitsAnySet',
  '$bitsAllClear', '$bitsAnyClear', '$expr', '$jsonSchema', '$comment',
  '$geoWithin', '$geoIntersects', '$near', '$nearSphere'
];

// Recursively sanitize an object by removing MongoDB operators
function sanitizeObject(obj, path = '') {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item, index) => sanitizeObject(item, `${path}[${index}]`));
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Check if key is a MongoDB operator
      if (MONGO_OPERATORS.includes(key)) {
        console.warn(`[Sanitize] Removed forbidden MongoDB operator from ${path || 'request'}: ${key}`);
        continue; // Skip this key
      }
      
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeObject(value, path ? `${path}.${key}` : key);
    }
    
    return sanitized;
  }

  return obj;
}

// Express 5 compatible sanitization middleware
// Creates sanitized copies instead of mutating req properties
export const sanitize = (req, res, next) => {
  // Skip sanitization for OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.sanitizedQuery = sanitizeObject(req.query);
  } else {
    req.sanitizedQuery = req.query;
  }

  // Sanitize body parameters
  if (req.body && typeof req.body === 'object') {
    req.sanitizedBody = sanitizeObject(req.body);
    // Also replace body for convenience (Express 5 allows this)
    req.body = req.sanitizedBody;
  }

  // Sanitize params
  if (req.params && typeof req.params === 'object') {
    req.sanitizedParams = sanitizeObject(req.params);
  } else {
    req.sanitizedParams = req.params;
  }

  next();
};

// Additional string sanitization for print data
export const sanitizeForPrint = (str) => {
  if (typeof str !== 'string') return '';
  
  // Remove ESC/POS command sequences to prevent injection
  // ESC/POS commands start with ESC (0x1B) or GS (0x1D)
  return str
    .replace(/[\x1B\x1D]/g, '') // Remove ESC and GS characters
    .replace(/\[ESC\]/gi, '')
    .replace(/\[GS\]/gi, '')
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[^\x20-\x7E]/g, '') // Keep only printable ASCII
    .trim()
    .substring(0, 1000); // Limit length
};

// Sanitize object recursively for printing
export const  sanitizeObjectForPrint = (obj) => {
  if (typeof obj === 'string') {
    return sanitizeForPrint(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectForPrint(item));
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeForPrint(key)] = sanitizeObjectForPrint(value);
    }
    return sanitized;
  }
  
  return obj;
};

export default sanitize;
//module.exports ={sanitize};
