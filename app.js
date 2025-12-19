import express from "express";
import cors from "cors";
import morgan from "morgan";
import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./utils/errorHandler.js";
import { sanitize } from "./utils/sanitizer.js";
import { requestIdMiddleware } from "./middlewares/request-id.js";
//import { generalLimiter } from "./middlewares/rate-limit.js";
import { idempotencyMiddleware } from "./utils/idempotency.js";

// const express = require('express')
// const cors = require('cors')
// const morgan= require('morgan')
// const {ENV}= require('./config/env.js')
// const {connectDB}= require('./config/db.js')
// const errorHandler= require('./utils/errorHandler.js')
// const {sanitize}= require('./utils/sanitizer.js')
// const {requestIdMiddleware}= require('./middlewares/request-id.js')
// const {generalLimiter}= require('./middlewares/rate-limit.js')
// const {idempotencyMiddleware}= require('./utils/idempotency.js')

// Routes
import userRoutes from "./routes/user.routes.js";
//import staffRoutes from "./routes/staff.routes.js";
import orderRoutes from "./routes/order.routes.js";
import kotRoutes from "./routes/kot.routes.js";
import billRoutes from "./routes/bill.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import menuRoutes from "./routes/menu.routes.js";
import tableRoutes from "./routes/table.routes.js";
import reservationRoutes from "./routes/reservation.routes.js";
import offerRoutes from "./routes/offer.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import reportRoutes from "./routes/report.routes.js";
import staffRoutes from "./routes/staff.routes.js";
import restaurantRoutes from "./routes/restaurant.routes.js";


// const userRoutes = require('./routes/user.routes.js')
// const orderRoutes = require('./routes/order.routes.js')
// const kotRoutes= require('./routes/kot.routes.js')
// const billRoutes= require('./routes/bill.routes.js')
// const dashboardRoutes= require('./routes/dashboard.routes.js')
// const webhookRoutes= require('./routes/webhook.routes.js')
// const menuRoutes= require('./routes/menu.routes.js')
// const tableRoutes= require('./routes/table.routes.js')
// const reservationRoutes= require('./routes/reservation.routes.js')
// const offerRoutes= require('./routes/offer.routes.js')
// const customerRoutes= require('./routes/customer.routes.js')
// const reportRoutes= require('./routes/report.routes.js')
// const inventoryRoutes= require('./routes/inventory.routes.js')


// Initialize database
connectDB();

const app = express();

// Security middleware
//app.use(helmet());

// CORS configuration - MUST be before other middleware
// Build allowed origins list
const getAllowedOrigins = () => {
  // Default allowed origins for development
  const defaultOrigins = ['http://localhost:5174', 'http://localhost:5173', 'http://localhost:3000'];
  
  // If CORS_ORIGIN is '*', return true (allow all)
  if (ENV.CORS_ORIGIN === '*') {
    return true;
  }
  
  // If CORS_ORIGIN is set, split and combine with defaults
  if (ENV.CORS_ORIGIN) {
    const envOrigins = ENV.CORS_ORIGIN.split(',').map(o => o.trim()).filter(o => o);
    return [...new Set([...defaultOrigins, ...envOrigins])]; // Remove duplicates
  }
  
  // Default to localhost origins
  return defaultOrigins;
};

const corsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Idempotency-Key', 'Accept'],
  exposedHeaders: ['X-Request-ID'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Explicit OPTIONS handler middleware for all routes (before other middleware)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    const allowedOrigins = getAllowedOrigins();
    
    // Check if origin is allowed
    if (allowedOrigins === true || (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin))) {
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-Idempotency-Key, Accept');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400'); // 24 hours
      return res.sendStatus(200);
    }
  }
  next();
});

// Request ID middleware (must be early)
app.use(requestIdMiddleware);

// Logging
if (ENV.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB sanitization (prevent NoSQL injection)
app.use(sanitize);


// Rate limiting
//app.use(generalLimiter);

// Idempotency middleware (for payment endpoints)
app.use(idempotencyMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'ok',
    timestamp: new Date().toISOString(),
    requestId: req.id
  });
});

// API Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/kots", kotRoutes);
app.use("/api/v1/bills", billRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/menu", menuRoutes);
app.use("/api/v1/tables", tableRoutes);
app.use("/api/v1/reservations", reservationRoutes);
app.use("/api/v1/offers", offerRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/staff", staffRoutes);
app.use("/api/v1/restaurants", restaurantRoutes);


// Webhook routes (before error handler, needs raw body)
app.use("/api/webhooks", webhookRoutes);

// Swagger docs (if enabled) - Loaded dynamically to avoid import errors
if (ENV.NODE_ENV === 'development') {
  Promise.all([
    import('swagger-ui-express'),
    import('./docs/swagger.js')
  ]).then(([swaggerUi, swaggerModule]) => {
    const swaggerSpec = swaggerModule.default;
    app.use('/api-docs', swaggerUi.default.serve, swaggerUi.default.setup(swaggerSpec));
    console.log('Swagger docs available at /api-docs');
  }).catch((error) => {
    console.warn('Swagger not configured:', error.message);
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    requestId: req.id
  });
});

// Error handling (must be last)
app.use(errorHandler);

export default app;
//module.exports= app;
