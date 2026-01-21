const  http =require( "http");
const { Server   } =require("socket.io");
const app  =require("./app.js");
const { ENV   } =require( "./config/env.js");
const  { connectDB   } =require("./config/db.js");
const { kitchenSocket   } =require( "./sockets/kitchen.js");
const { waiterSocket   } =require("./sockets/waiter.js");
const { cashierSocket   } =require( "./sockets/cashier.js");
const { initializePrinters   } =require ("./config/printer.js");
const { logger   } =require( "./utils/logger.js");

// Connect to database
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: ENV.CORS_ORIGIN === '*' ? '*' : ENV.CORS_ORIGIN.split(','),
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Socket.io connection handler with authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    // Token verification will be done in individual socket handlers
    // This is just a basic check
    next();
  } catch (error) {
    next(new Error("Authentication failed"));
  }
});

// Socket.io connection
io.on("connection", (socket) => {
  logger.info("New client connected", {
    socketId: socket.id,
    address: socket.handshake.address
  });

  // Initialize socket channels
  kitchenSocket(io, socket);
  waiterSocket(io, socket);
  cashierSocket(io, socket);

  socket.on("disconnect", (reason) => {
    logger.info("Client disconnected", {
      socketId: socket.id,
      reason
    });
  });
});

// Initialize printers
initializePrinters().catch(error => {
  logger.error("Failed to initialize printers", error);
});

// Helper function to check and kill process on a specific port (Windows)
async function killProcessOnPort(port) {
  try {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    // Find process using the port
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    const lines = stdout.split('\n').filter(line => line.includes('LISTENING'));

    if (lines.length > 0) {
      const pids = new Set();
      lines.forEach(line => {
        const match = line.match(/LISTENING\s+(\d+)/);
        if (match) {
          pids.add(match[1]);
        }
      });

      // Kill each process
      for (const pid of pids) {
        try {
          await execAsync(`taskkill /PID ${pid} /F`);
          console.log(` Killed process ${pid} using port ${port}`);
        } catch (error) {
          // Process might already be dead, ignore
        }
      }
      // Wait a moment for port to be released
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

// Helper function to check if port is in use
async function isPortInUse(port) {
  try {
    const { exec  } = await import("child_process");
    const { promisify  } = await import("util");
    const execAsync = promisify(exec);

    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    return stdout.includes('LISTENING');
  } catch (error) {
    return false;
  }
}

// Start server
const PORT = parseInt(ENV.PORT) || 3000;

// Check and free port before starting server
const startServer = async () => {
  try {
    // Check if port is in use before attempting to listen
    if (await isPortInUse(PORT)) {
      console.log(` Port ${PORT} is already in use. Attempting to free it...`);
      const killed = await killProcessOnPort(PORT);

      if (!killed) {
        logger.error(`Port ${PORT} is already in use and could not be freed automatically.`);
        console.error(`\n Error: Port ${PORT} is already in use and could not be freed automatically.`);
        console.error(`Please do one of the following:`);
        console.error(`1. Stop the process using port ${PORT}`);
        console.error(`2. Change the PORT in your .env file`);
        console.error(`3. Kill the process manually: netstat -ano | findstr :${PORT} (then kill the PID)\n`);
        process.exit(1);
      }
    }

    // Start the server
    server.listen(PORT, () => {
      console.log(` Server running on http://localhost:${PORT}`);
      logger.info(`Server running on localhost:${PORT}`, {
        environment: ENV.NODE_ENV,
        port: PORT,
        timestamp: new Date().toISOString()

      });

      if (ENV.NODE_ENV === 'development') {
        console.log(` API Docs: http://localhost:${PORT}/api-docs`);
      }
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Please stop the other process or use a different port.`);
        console.error(`\n Error: Port ${PORT} is already in use.`);
        console.error(`Please do one of the following:`);
        console.error(`1. Stop the process using port ${PORT}`);
        console.error(`2. Change the PORT in your .env file`);
        console.error(`3. Kill the process: netstat -ano | findstr :${PORT} (then kill the PID)\n`);
        process.exit(1);
      } else {
        logger.error('Server error:', err);
        throw err;
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// export { io };
module.exports ={io};