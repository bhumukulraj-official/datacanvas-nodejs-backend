require('dotenv').config();
const http = require('http');
const app = require('./app');
const { setupWebSocketServer } = require('./shared/websocket/server');

const port = process.env.PORT || 3000;
const server = http.createServer(app);

// Setup WebSocket server
setupWebSocketServer(server);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 