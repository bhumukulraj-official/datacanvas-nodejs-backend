require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initDatabase } = require('./shared/database');
const { setupWebSocketServer } = require('./shared/websocket/server');

const port = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialize the server
const startServer = async () => {
  try {
    // Initialize database and models
    const dbResult = await initDatabase();
    if (!dbResult.success) {
      console.error('Failed to initialize database:', dbResult.error);
      process.exit(1);
    }
    
    // Setup WebSocket server
    setupWebSocketServer(server);
    
    // Start HTTP server
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer(); 