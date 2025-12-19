import dotenv from "dotenv";
//const dotenv=require('dotenv')

dotenv.config();

 export const ENV = {
//   NODE_ENV: process.env.NODE_ENV || 'development',
//   PORT: process.env.PORT || 3000,
//   MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://your-username:your-password@cluster0.mongodb.net/restaurant_db?retryWrites=true&w=majority',
//   JWT_SECRET: process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_this_in_production',
//   JWT_ACCESS_EXPIRE: process.env.JWT_ACCESS_EXPIRE || '15m',
//   JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d',
//   CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5174',
//   RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
//   RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
//   BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
//   PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET || 'your_payment_webhook_secret',
//   PRINTER_TIMEOUT: parseInt(process.env.PRINTER_TIMEOUT) || 5000
// };
NODE_ENV: process.env.NODE_ENV,
PORT: process.env.PORT,
MONGODB_URI: process.env.MONGODB_URI,
JWT_SECRET: process.env.JWT_SECRET,
JWT_ACCESS_EXPIRE: process.env.JWT_ACCESS_EXPIRE,
JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE,
CORS_ORIGIN: process.env.CORS_ORIGIN,
RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS),
BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS),
PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET,
PRINTER_TIMEOUT: parseInt(process.env.PRINTER_TIMEOUT)
 }
export default ENV;
//module.exports={ENV};