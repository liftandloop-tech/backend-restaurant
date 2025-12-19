 import { v4 as uuidv4 } from "uuid";
//const {v4:uuidv4}=require('uuid')
export const requestIdMiddleware = (req, res, next) => {
  // Use existing request ID from header or generate new one
  const requestId = req.headers['x-request-id'] || uuidv4();
  
  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
};
export default requestIdMiddleware
//module.exports= requestIdMiddleware;

