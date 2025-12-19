// import rateLimit, { ipKeyGenerator } from "express-rate-limit";
// import { ENV } from "../config/env.js";

// // const rateLimit=require('express-rate-limit')
// // const {ENV}=require('../config/env.js')

// // const ipKeyGenerator= (req) => req.ip

// // export const createRateLimit = (windowMs = 60000, max = 50, message = "Too many requests, please try again later") => {
// //   return rateLimit({
// //     windowMs,
// //     max,
// //     message: {
// //       success: false,
// //       message
// //     },
// //     standardHeaders: true,
// //     legacyHeaders: false,
// //     skip: (req) => req.method === 'OPTIONS'  // Skip CORS preflight
// //   });
// // };
// export const createRateLimit = (windowMs = 60000, max = 50, message = "Too many requests, please try again later") =>{
//   return rateLimit({
//     windowMs,
//     max,
//     message:{
//       success:false,
//       message },
//       standardHeaders:true,
//       legacyHeaders:false,
//       skip:(req) => req.method === "OPTIONS"
    
//   })
// }


// // General rate limiter
//  export const generalLimiter = rateLimit({
//   windowMs: ENV.RATE_LIMIT_WINDOW_MS,
//   max: ENV.RATE_LIMIT_MAX_REQUESTS,
//   message: {
//     success: false,
//     message: "Too many requests from this IP, please try again later"
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
//   skip: (req) => {
//     // Skip rate limiting for OPTIONS requests (CORS preflight)
//     return req.method === 'OPTIONS';
//   }
// });

// // Strict rate limiter for auth endpoints
// export const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // 5 attempts
//   message: {
//     success: false,
//     message: "Too many login attempts, please try again after 15 minutes"
//   },
//   skipSuccessfulRequests: true,
//   skip: (req) => {
//     // Skip rate limiting for OPTIONS requests (CORS preflight)
//     return req.method === 'OPTIONS';
//   }
// });

// // Payment endpoint rate limiter
// export const paymentLimiter = rateLimit({
//   windowMs: 60 * 1000, // 1 minute
//   max: 10, // 10 requests per minute
//   message: {
//     success: false,
//     message: "Too many payment requests, please slow down"
//   }
// });

// // Per-user rate limiter (requires authMiddleware first)
// export const userLimiter = rateLimit({
//   windowMs: ENV.RATE_LIMIT_WINDOW_MS,
//   max: ENV.RATE_LIMIT_MAX_REQUESTS,
//   keyGenerator: (req) => {
//     // Use user ID if authenticated, otherwise use IP with proper IPv6 handling
//     return req.user ? req.user.userId.toString() : ipKeyGenerator(req);
//   },
//   message: {
//     success: false,
//     message: "Too many requests, please try again later"
//   }
// });

// export default generalLimiter;
// //module.exports={ generalLimiter,authLimiter,userLimiter,paymentLimiter}
