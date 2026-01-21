const swaggerJsdoc = require("swagger-jsdoc");
const { ENV } = require("../config/env.js");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Restaurant POS API",
      version: "1.0.0",
      description: "RESTful API for Restaurant Point of Sale System with JWT authentication, role-based access control, and real-time updates via Socket.io",
      contact: {
        name: "API Support"
      }
    },
    servers: [
      {
        url: `http://localhost:${ENV.PORT}`,
        description: "Development server"
      },
      {
        url: "https://api.example.com",
        description: "Production server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            role: {
              type: "string",
              enum: ["Owner", "Admin", "Manager", "Cashier", "Waiter", "Kitchen"]
            },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" }
          }
        },
        Order: {
          type: "object",
          properties: {
            _id: { type: "string" },
            orderNumber: { type: "string" },
            tableNumber: { type: "number" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  qty: { type: "number" },
                  price: { type: "number" },
                  specialInstructions: { type: "string" }
                }
              }
            },
            subtotal: { type: "number" },
            tax: { type: "number" },
            total: { type: "number" },
            status: {
              type: "string",
              enum: ["pending", "confirmed", "preparing", "ready", "served", "cancelled"]
            },
            waiterId: { type: "string" },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        KOT: {
          type: "object",
          properties: {
            _id: { type: "string" },
            kotNumber: { type: "string" },
            orderId: { type: "string" },
            station: {
              type: "string",
              enum: ["kitchen", "bar", "beverage"]
            },
            items: { type: "array" },
            status: {
              type: "string",
              enum: ["pending", "preparing", "ready", "sent"]
            },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        Bill: {
          type: "object",
          properties: {
            _id: { type: "string" },
            billNumber: { type: "string" },
            orderId: { type: "string" },
            subtotal: { type: "number" },
            tax: { type: "number" },
            total: { type: "number" },
            paymentMethod: {
              type: "string",
              enum: ["cash", "card", "upi", "wallet"]
            },
            paid: { type: "boolean" },
            paidAt: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
            errors: { type: "array", items: { type: "object" } },
            requestId: { type: "string" }
          }
        }
      }
    },
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Users", description: "User management" },
      { name: "Orders", description: "Order management" },
      { name: "KOTs", description: "Kitchen Order Ticket management" },
      { name: "Bills", description: "Billing and payment" },
      { name: "Webhooks", description: "Payment webhook handlers" }
    ]
  },
  apis: ["./routes/*.js", "./controllers/*.js"]
};

const swaggerSpec = swaggerJsdoc(options);

// export default swaggerSpec;

module.exports = swaggerSpec;