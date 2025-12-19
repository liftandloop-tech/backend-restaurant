<!-- eb55f58f-077e-4a22-9ced-9e248c922f66 1a9e426d-328b-4c6e-aa5f-a0a31836b062 -->
# Restaurant POS MVP — Backend API Plan (Node.js + Express + MongoDB)

### Scope (Core MVP)

- Table management (layout, status, merge/split, waiter assignment)
- Order management (dine-in, takeaway, delivery), modifiers
- KOT workflow (create, queue, status, real-time via WebSocket), printing
- Billing (tax, discount, split payments), receipts
- Menu management (categories, items, availability)
- Inventory (ingredients stock-in/out, alerts)
- Basic reports (sales, items, tables, staff, payments)
- Auth, roles, permissions, settings (tax, printers)

### Tech Stack and Versions

- Runtime: Node.js 18 LTS or 20 LTS
- Web framework: express@4.19.2
- Database: MongoDB 6.x (Replica Set enabled in prod) + mongoose@8.6.x
- Realtime: socket.io@4.7.x
- Auth: jsonwebtoken@9.0.x, bcrypt@5.1.x (or bcryptjs@2.4.3 if no native build)
- Validation: joi@17.12.x, celebrate@15.x (optional)
- Security: helmet@7.x, cors@2.8.x, express-rate-limit@7.x, hpp@0.2.x, express-mongo-sanitize@2.2.x, validator@13.x
- Logging: morgan@1.10.x, winston@3.11.x, uuid@9.x (request-id)
- Docs: swagger-ui-express@5.x, swagger-jsdoc@6.x
- Printing (ESC/POS): node-thermal-printer@5.3.x (with network printers) or escpos@3.x + escpos-network@3.x
- File upload (optional images): multer@1.4.5-lts.1, sharp@0.33.x
- Payments: razorpay@2.9.x (optional), stripe@14.x (optional)
- Misc: compression@1.7.x, dotenv@16.4.x, dayjs@1.11.x
- Process manager: pm2@5.3.x

Compatibility notes:

- Mongoose 8.x requires Node >=16.20; tested with Node 18/20
- Helmet 7 requires Node >=16
- Socket.io 4.7 compatible Node >=10

### High-Level Architecture

- REST API (Express) + WebSocket (Socket.io)
- MongoDB with collections per module (users, roles, tables, menu, orders, kots, bills, payments, inventory, settings)
- KOT pipeline: order → KOT doc → Socket.io event to kitchen → status updates → ready
- Printing: server connects to network thermal printers (configurable via settings)
- Payment gateways: optional server-side SDK + webhooks (signature verified)

### Folder Structure

```
src/
  app.js               // express bootstrap, middlewares
  server.js            // HTTP + Socket.io init
  config/              // env, db, printers, payments
  middlewares/         // auth, roles, validation, rate-limit, request-id
  routes/              // modular routers (v1)
  controllers/         // request handlers
  services/            // business logic (orders, kot, billing, inventory)
  models/              // mongoose schemas
  sockets/             // socket channels (kitchen, waiter, cashier)
  utils/               // helpers (errors, idempotency, sanitizer)
  printers/            // escpos/node-thermal-printer wrappers
  webhooks/            // payment gateway webhooks
  docs/                // swagger spec
```

### Security Checklist (MVP)

- JWT access (15m) + refresh (7d) tokens; rotation and blacklist on logout
- Hash passwords with bcrypt (saltRounds=12+)
- Role-based authorization (Owner/Admin/Manager/Cashier/Waiter/Kitchen)
- Input validation (Joi) and sanitize (express-mongo-sanitize)
- Rate-limiting (per IP + per user), HPP, Helmet, CORS allowlist
- Request ID correlation; structured logging; mask PII and tokens
- WebSocket auth via token in handshake; room scoping per role/station
- Verify payment webhooks (HMAC/secret); idempotency keys for payments/refunds
- Escape/sanitize print strings to avoid ESC/POS injection
- Backups (daily), Mongo indices (orders.status, createdAt; bills.createdAt; payments.mode)
- Enable transactions for atomic bill/payments (Mongo session, Replica Set)

### API Standards

- Base path: /api/v1
- JSON only; UTC timestamps; ISO-8601
- Errors: { success:false, error:{ code, message, details? } }
- Success: { success:true, data, meta? }
- Pagination: ?page, ?limit (default 1, 20)
- Sorting: ?sort=field,-field
- Filtering: query params; server-side validation

---

### API Catalog (Core MVP)

#### Auth & Users

1) POST /api/v1/auth/register (admin bootstrap)

- body:
```json
{ "name":"Owner", "email":"owner@r.com", "password":"Secret123!" }
```

- 201 data.user, tokens

2) POST /api/v1/auth/login

```json
{ "email":"owner@r.com", "password":"Secret123!" }
```

- 200 data:{ accessToken, refreshToken, user }

3) POST /api/v1/auth/refresh

```json
{ "refreshToken":"<token>" }
```

- 200 data:{ accessToken }

4) POST /api/v1/auth/logout

- header: Authorization Bearer
- 200 message

5) GET /api/v1/users/me (auth)

- 200 data.user

6) Users CRUD (admin/manager)

- GET /api/v1/users?role=waiter
- POST /api/v1/users
```json
{ "name":"John", "email":"j@r.com", "role":"waiter", "password":"..." }
```

- GET/PUT/DELETE /api/v1/users/:id

#### Roles (static seed)

- GET /api/v1/roles (admin)
- 200 data:["admin","manager","cashier","waiter","kitchen"]

#### Tables & Layout

1) GET /api/v1/tables

- 200 data:[{ id, name, capacity, status, zone, currentOrderId, waiterId }]

2) POST /api/v1/tables (admin)

```json
{ "name":"T5","capacity":4,"zone":"Main" }
```

3) PUT /api/v1/tables/:id

```json
{ "name":"T5","capacity":6,"status":"reserved","waiterId":"..." }
```

4) DELETE /api/v1/tables/:id (admin)

5) POST /api/v1/tables/:id/merge

```json
{ "withTableIds":["t6","t7"] }
```

6) POST /api/v1/tables/:id/split

- 200 mergedTables restored

7) POST /api/v1/tables/:id/status

```json
{ "status":"occupied" }
```

#### Menu (Categories & Items)

1) GET /api/v1/menu/categories

2) POST /api/v1/menu/categories

```json
{ "name":"Beverages","sort":1 }
```

3) PUT/DELETE /api/v1/menu/categories/:id

4) GET /api/v1/menu/items?active=true&categoryId=...

5) POST /api/v1/menu/items

```json
{ "name":"Margherita Pizza","categoryId":"...","price":299,
  "taxRate":18, "modifiers":[{"name":"Extra Cheese","price":40}],
  "active":true }
```

6) GET /api/v1/menu/items/:id

7) PUT /api/v1/menu/items/:id

8) DELETE /api/v1/menu/items/:id

9) PUT /api/v1/menu/items/:id/availability

```json
{ "active": false }
```

#### Orders

Statuses: new → confirmed → in_kitchen → ready → served → completed/cancelled

1) POST /api/v1/orders

```json
{ "type":"dine_in", "tableId":"t5", "customerNote":"no onion",
  "items":[ {"itemId":"it1","qty":2,"modifiers":["mod1"],"note":""} ],
  "waiterId":"u123" }
```

- 201 data:{ orderId, kotIds[] }

2) GET /api/v1/orders?status=in_kitchen&type=dine_in&tableId=t5

3) GET /api/v1/orders/:id

4) PUT /api/v1/orders/:id (editable only if not in_kitchen)

```json
{ "items":[{"itemId":"it2","qty":1}] }
```

5) POST /api/v1/orders/:id/items

```json
{ "itemId":"it3","qty":1,"modifiers":[] }
```

6) PUT /api/v1/orders/:id/items/:itemId

```json
{ "qty":3, "modifiers":["mod2"] }
```

7) DELETE /api/v1/orders/:id/items/:itemId

8) POST /api/v1/orders/:id/confirm (sends KOT)

- 200 data:{ kotIds }

9) POST /api/v1/orders/:id/cancel (role: manager)

```json
{ "reason":"customer left" }
```

#### KOT (Kitchen Order Tickets)

1) GET /api/v1/kots?status=new&station=main

- 200 data:[{ id, orderId, items:[{name,qty,mods}], status, station, createdAt }]

2) GET /api/v1/kots/:id

3) POST /api/v1/kots/:id/status (kitchen)

```json
{ "status":"preparing" }
```

- allowed: new→preparing→ready→served

4) POST /api/v1/kots/:id/print (optional)

- 200 message

WebSocket channels:

- kitchen: "kot:new", "kot:update"
- waiter: "order:ready"

#### Billing & Payments

1) POST /api/v1/bills

```json
{ "orderId":"o123", "serviceChargePct":5, "discount":{ "type":"percent","value":10 } }
```

- 201 data:{ billId, totals:{ subtotal, discount, tax, service, grandTotal, roundOff } }

2) GET /api/v1/bills/:id

3) PUT /api/v1/bills/:id/discount (manager)

```json
{ "type":"flat","value":100 }
```

4) POST /api/v1/bills/:id/payments

```json
{ "mode":"upi", "amount":1215.45, "txnRef":"TXN123" }
```

- supports split: call multiple times until paid

5) GET /api/v1/payments?date=2025-10-30

6) POST /api/v1/bills/:id/print (cashier)

7) POST /api/v1/bills/:id/receipt (email/sms/whatsapp optional)

```json
{ "channel":"whatsapp","to":"+9198..." }
```

#### Payments — Gateway (optional)

1) POST /api/v1/payments/pg/razorpay/order

```json
{ "amount":121545, "currency":"INR", "receipt":"BILL-0001" }
```

- 200 data:{ orderId, keyId }

2) POST /api/v1/payments/pg/razorpay/verify

```json
{ "orderId":"...","paymentId":"...","signature":"..." }
```

3) POST /api/v1/webhooks/razorpay (no auth)

- header signature verification; 200 on success

#### Inventory (Ingredients)

1) GET /api/v1/inventory/items?lowStock=true

2) POST /api/v1/inventory/items

```json
{ "name":"Mozzarella","unit":"kg","sku":"CHEESE001",
  "reorderLevel":5, "stock":10, "costPrice":380 }
```

3) PUT /api/v1/inventory/items/:id

4) DELETE /api/v1/inventory/items/:id

5) POST /api/v1/inventory/items/:id/stock-in

```json
{ "qty":5, "note":"supplier ABC" }
```

6) POST /api/v1/inventory/items/:id/stock-out

```json
{ "qty":2, "note":"wastage" }
```

7) GET /api/v1/inventory/alerts (low stock, expiry soon)

#### Reports

1) GET /api/v1/reports/sales?from=2025-10-01&to=2025-10-31&groupBy=daily

- 200 data:{ total, count, series:[{ date, total, orders }] }

2) GET /api/v1/reports/items?from=...&to=...

- 200 data:[{ item, qty, revenue }]

3) GET /api/v1/reports/tables?from=...&to=...

- 200 data:[{ table, orders, revenue, avgTime }]

4) GET /api/v1/reports/staff?from=...&to=...

- 200 data:[{ staff, orders, revenue }]

5) GET /api/v1/reports/payments?from=...&to=...

- 200 data:{ upi, cash, card, wallet }

#### Settings

1) GET/PUT /api/v1/settings/tax

```json
{ "cgst":9, "sgst":9, "serviceChargePct":5, "rounding":"nearest" }
```

2) GET/PUT /api/v1/settings/printers

```json
{ "bill": { "type":"network","ip":"192.168.1.50","width":80 },
  "kot": { "type":"network","ip":"192.168.1.51","width":58 } }
```

3) GET/PUT /api/v1/settings/restaurant

```json
{ "name":"My Resto","gstin":"27AAAA...","address":"..." }
```

#### Health

- GET /health → 200 { status:"ok", time }

---

### Data Modeling (Mongoose, brief)

- users(name, email, passwordHash, role, active, createdAt)
- tables(name, capacity, zone, status, mergedWith[], currentOrderId, waiterId)
- menu_categories(name, sort, active)
- menu_items(name, categoryId, price, taxRate, modifiers[], active)
- orders(type, tableId, items[{ itemId, name, price, qty, modifiers[], note }], status, waiterId, notes, timestamps)
- kots(orderId, items[], station, status, timestamps)
- bills(orderId, items[], subtotal, discount, tax, service, grandTotal, roundOff, status)
- payments(billId, mode, amount, txnRef, gateway, createdAt)
- inventory_items(name, unit, sku, stock, reorderLevel, costPrice, batches[])
- settings(tax, printers, restaurant)

### Performance Considerations

- Indexes: orders(status, createdAt), kots(status, createdAt), bills(createdAt), payments(createdAt), menu_items(active, categoryId)
- In-memory queue for KOT prints; emit Socket.io events on order confirm
- Use lean() queries and projection; paginate lists; avoid N+1

### Observability

- Winston JSON logs; request-id in each log; error boundaries
- 4xx/5xx alerting hooks (later)

### Documentation & Testing

- Swagger docs auto-generated from JSDoc
- Minimal unit tests (totals calc, discounts, tax), API smoke tests with supertest

### Deployment

- PM2 cluster mode, 2+ instances; sticky sessions for Socket.io
- Reverse proxy (Nginx), HTTPS TLS termination
- Environment: NODE_ENV, JWT_SECRET, MONGO_URI (replica set), PRINTER_IPS, PG_KEYS

### To-dos

- [ ] Bootstrap Express app, Mongo connection, JWT auth, role middleware
- [ ] Implement users CRUD and seed roles (admin, manager, cashier, waiter, kitchen)
- [ ] Implement tables CRUD, status update, merge/split, waiter assignment APIs
- [ ] Implement menu categories and items with modifiers and availability APIs
- [ ] Implement orders lifecycle, KOT creation, Socket.io channels, status updates
- [ ] Implement bills, totals calc, discounts, split payments, receipts, printing APIs
- [ ] Implement inventory items CRUD, stock-in/out, alerts APIs
- [ ] Implement sales, items, tables, staff, payments report endpoints
- [ ] Add ESC/POS network printing wrappers and settings APIs
- [ ] Add Razorpay order/create verify APIs and webhook with signature checks
- [ ] Add validation, sanitize, rate limits, HPP, CORS allowlist, audit logs
- [ ] Add Swagger docs and smoke tests for critical flows