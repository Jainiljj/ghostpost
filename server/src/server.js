// Load environment variables
require('dotenv').config();

const { execSync } = require('child_process');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = parseInt(process.env.PORT, 10) || 5000;

// Connect to Database
connectDB();

// Helper to kill any lingering zombie process on the target port (Windows & Unix)
const freePortIfOccupied = (port) => {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      const lines = output.trim().split('\n');
      const pids = new Set();
      lines.forEach((line) => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && parseInt(pid, 10) > 0 && parseInt(pid, 10) !== process.pid) {
          pids.add(pid);
        }
      });
      pids.forEach((pid) => {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          console.log(`[Auto-Clean] Released occupied port ${port} by terminating PID ${pid}`);
        } catch (e) {}
      });
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
    }
  } catch (e) {
    // Port not occupied or command failed gracefully
  }
};

// Start Express Server with EADDRINUSE resilience
const startServer = () => {
  const server = app.listen(PORT, () => {
    console.log(`🚀 GhostPost Server is running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Port Conflict] Port ${PORT} is busy. Automatically releasing port and retrying...`);
      freePortIfOccupied(PORT);
      setTimeout(() => {
        server.close();
        startServer();
      }, 1000);
    } else {
      console.error(`Server Error: ${err.message}`);
      process.exit(1);
    }
  });

  // Graceful shutdown handlers
  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection Error: ${err.message}`);
    server.close(() => process.exit(1));
  });

  return server;
};

startServer();

