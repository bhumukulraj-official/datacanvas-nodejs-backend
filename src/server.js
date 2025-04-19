require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initDatabase } = require('./shared/database');
const websocketService = require('./modules/websocket/services/websocket.service');
const logger = require('./shared/utils/logger');

const port = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialize the server
const startServer = async () => {
  try {
    // Initialize database and models
    const dbResult = await initDatabase();
    if (!dbResult.success) {
      logger.error('Failed to initialize database:', { error: dbResult.error });
      process.exit(1);
    }
    
    // Setup WebSocket server
    websocketService.initialize(server);
    logger.info('WebSocket server initialized');
    
    // Start HTTP server
    server.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error.message });
    process.exit(1);
  }
};

// Start the server
startServer(); 