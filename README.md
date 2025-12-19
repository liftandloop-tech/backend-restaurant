# Restaurant POS System

A comprehensive Point of Sale (POS) system for restaurants with real-time order management, billing, and role-based access control.

## Features

- 🔐 **JWT Authentication** - Access (15m) and refresh (7d) tokens with rotation and blacklist
- 🔒 **Role-Based Authorization** - Owner/Admin/Manager/Cashier/Waiter/Kitchen roles
- 🛡️ **Security** - Input validation, sanitization, rate limiting, CORS, Helmet
- 📊 **Real-time Updates** - Socket.io channels for kitchen, waiter, and cashier
- 🧾 **Order Management** - Orders, KOTs (Kitchen Order Tickets), and Bills
- 💳 **Payment Processing** - Multiple payment methods with webhook verification
- 🖨️ **Printer Support** - ESC/POS compatible with injection prevention
- 📝 **API Documentation** - Swagger/OpenAPI documentation
- 🔄 **Idempotency** - Prevents duplicate payments/refunds
- 📈 **Transactions** - Atomic operations for billing and payments

## Project Structure

```
├── app.js                    # Express bootstrap, middlewares
├── server.js                 # HTTP + Socket.io init
├── config/                   # Configuration files
│   ├── env.js               # Environment variables
│   ├── db.js                # Database connection
│   ├── printer.js           # Printer configuration
│   └── payment.js           # Payment gateway config
├── middlewares/              # Express middlewares
│   ├── auth.js              # JWT authentication
│   ├── roles.js             # Role-based authorization
│   ├── validation.js        # Joi validation
│   ├── rate-limit.js        # Rate limiting
│   └── request-id.js        # Request ID correlation
├── routes/                   # API routes (v1)
│   ├── user.routes.js
│   ├── order.routes.js
│   ├── kot.routes.js
│   ├── bill.routes.js
│   └── webhook.routes.js
├── controllers/              # Request handlers
│   ├── userController.js
│   ├── orderController.js
│   ├── kotController.js
│   └── billController.js
├── services/                 # Business logic
│   ├── userService.js
│   ├── orderService.js
│   ├── kotService.js
│   └── billingService.js
├── models/                   # Mongoose schemas
│   ├── user.js
│   ├── order.js
│   ├── KOT.js
│   ├── bill.js
│   └── payment.js
├── sockets/                  # Socket.io channels
│   ├── kitchen.js           # Kitchen station socket
│   ├── waiter.js            # Waiter socket
│   └── cashier.js           # Cashier socket
├── utils/                    # Helper utilities
│   ├── errorHandler.js
│   ├── response.js
│   ├── sanitizer.js
│   ├── idempotency.js
│   └── logger.js
├── printers/                 # Printer wrappers
│   ├── kotPrinter.js
│   └── billPrinter.js
├── webhooks/                 # Payment webhooks
│   └── paymentWebhook.js
└── docs/                     # Documentation
    ├── swagger.js
    └── swagger.yaml
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/pos-restaurant
JWT_SECRET=your-secret-key-change-in-production
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
CORS_ORIGIN=*
BCRYPT_SALT_ROUNDS=12
PAYMENT_WEBHOOK_SECRET=your-webhook-secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

3. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - Login user
- `POST /api/v1/users/refresh-token` - Refresh access token
- `POST /api/v1/users/logout` - Logout user

### Users
- `GET /api/v1/users` - Get all users (Owner/Admin/Manager)
- `GET /api/v1/users/:id` - Get user by ID

### Orders
- `POST /api/v1/orders` - Create order (Waiter+)
- `GET /api/v1/orders` - Get all orders
- `GET /api/v1/orders/:id` - Get order by ID
- `PUT /api/v1/orders/:id` - Update order (Waiter+)
- `PATCH /api/v1/orders/:id/status` - Update order status
- `POST /api/v1/orders/:id/cancel` - Cancel order

### KOTs
- `POST /api/v1/kots` - Create KOT (Waiter+)
- `GET /api/v1/kots` - Get all KOTs
- `GET /api/v1/kots/:id` - Get KOT by ID
- `PATCH /api/v1/kots/:id/status` - Update KOT status (Kitchen+)

### Bills
- `POST /api/v1/bills/order/:orderId` - Create bill (Cashier+)
- `POST /api/v1/bills/:billId/payment` - Process payment (Cashier+)
- `GET /api/v1/bills` - Get all bills (Cashier+)
- `GET /api/v1/bills/:id` - Get bill by ID
- `POST /api/v1/bills/:billId/refund` - Process refund (Manager+)

### Webhooks
- `POST /api/webhooks/razorpay` - Razorpay webhook
- `POST /api/webhooks/stripe` - Stripe webhook

## Security Features

- ✅ JWT access (15m) + refresh (7d) tokens with rotation and blacklist
- ✅ Bcrypt password hashing (saltRounds=12+)
- ✅ Role-based authorization (6 roles)
- ✅ Input validation (Joi)
- ✅ MongoDB sanitization (express-mongo-sanitize)
- ✅ Rate limiting (per IP + per user)
- ✅ Helmet security headers
- ✅ CORS allowlist
- ✅ Request ID correlation
- ✅ Structured logging with PII masking
- ✅ WebSocket authentication
- ✅ Payment webhook HMAC verification
- ✅ Idempotency keys for payments
- ✅ ESC/POS injection prevention

## Database Indices

- `orders.status` + `orders.createdAt`
- `orders.createdAt`
- `bills.createdAt`
- `bills.paymentMethod` + `bills.createdAt`
- `payments.mode` + `payments.createdAt`

## Socket.io Channels

### Kitchen Socket
- Authenticate with JWT token
- Join `kitchen` room
- Events: `kot:get-pending`, `kot:update-status`, `order:new`

### Waiter Socket
- Authenticate with JWT token
- Join `waiter` room
- Events: `order:placed`, `order:update-status`, `table:assistance`

### Cashier Socket
- Authenticate with JWT token
- Join `cashier` room
- Events: `bill:created`, `bill:payment-processed`, `cashier:daily-summary`

## Roles

- **Owner** - Full access
- **Admin** - Full access (except owner settings)
- **Manager** - Operations management
- **Cashier** - Billing and payments
- **Waiter** - Order management
- **Kitchen** - KOT management

## Development

API documentation available at: `http://localhost:3000/api-docs` (development mode)

## Production Checklist

- [ ] Set strong JWT_SECRET
- [ ] Configure MongoDB replica set for transactions
- [ ] Set up Redis for token blacklist
- [ ] Configure CORS_ORIGIN properly
- [ ] Set up payment gateway credentials
- [ ] Configure printer hardware
- [ ] Enable daily backups
- [ ] Set up monitoring and logging
- [ ] Configure rate limits appropriately
- [ ] Review and test all security features

## License

ISC

