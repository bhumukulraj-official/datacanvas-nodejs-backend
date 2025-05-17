require('dotenv').config();
const http = require('http');
const app = require('./app');

const PORT = process.env.PORT || 8000;

// Create HTTP server
const server = http.createServer(app);

// Start server
async function startServer() {
  try {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  try {
    server.close(() => {
      console.log('Server shut down successfully');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

startServer(); 