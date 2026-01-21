const dotenv =require("dotenv");

dotenv.config();

 exports. ENV = {

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