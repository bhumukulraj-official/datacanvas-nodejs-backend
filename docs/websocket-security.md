# WebSocket Security Implementation

This document provides an overview of the security measures implemented for WebSocket connections in the application.

## Security Features

### 1. Authentication

All WebSocket connections require a valid JWT token for authentication:

- Tokens are validated using the same JWT secret as the API
- Connections without a token are immediately rejected with a 401 status code
- Expired tokens are rejected with a specific 401 Token Expired status
- Invalid tokens are rejected with a 401 Invalid Token status

### 2. Connection Authorization

WebSockets implement connection-level authorization:

- Each user can only connect with their own valid JWT token
- Connection attempts with another user's token are rejected
- The system tracks all active connections per user
- Admins can forcibly disconnect all connections for a specific user

### 3. Channel-Based Communication

The WebSocket implementation uses a channel-based system for secure message routing:

- Users are automatically subscribed to their own user-specific channel (`user:{userId}`)
- Public announcements go to the `public:announcements` channel
- Users must explicitly request to join additional channels
- Channel access is controlled by the `authorizeChannelAccess` function
- Users can only subscribe to channels they have permission to access

### 4. Rate Limiting

To prevent abuse, WebSocket connections implement rate limiting:

- Rate limits are configurable via environment variables
- Default limits: 50 messages per minute per connection
- When rate limit is exceeded, error messages are sent
- Persistent abuse may result in connection termination

### 5. Message Validation

All incoming messages are validated:

- Messages must be valid JSON
- Messages must have a defined type and payload
- Invalid messages are rejected with appropriate error codes
- Large messages are rejected to prevent DoS attacks

### 6. Proper Connection Handling

Connections are properly managed throughout their lifecycle:

- Heartbeat checks detect and clean up dead connections
- Proper close codes and reasons are used when terminating connections
- Connections track activity status
- Resources are cleaned up on disconnection

### 7. Secure Broadcasting

Message broadcasting is implemented securely:

- Messages can only be broadcast to authorized channels
- Global broadcasts require admin privileges
- User-specific messages are only sent to connections for that user
- High-priority messages have special handling

## WebSocket Close Codes

The system uses standard WebSocket close codes and custom codes:

| Code | Name | Description |
|------|------|-------------|
| 1000 | NORMAL | Normal connection closure |
| 1001 | GOING_AWAY | Server is going down or client is navigating away |
| 1008 | POLICY_VIOLATION | Connection closed due to policy violation |
| 1011 | INTERNAL_ERROR | Server encountered an error |
| 4001 | AUTHENTICATION_FAILED | Failed to authenticate the connection |
| 4003 | AUTHORIZATION_FAILED | User is not authorized for requested action |
| 4029 | RATE_LIMITED | Too many messages in time period |
| 4400 | INVALID_MESSAGE | Message format is invalid |

## Usage Examples

### Connecting to WebSocket

```javascript
// Connect with JWT token
const token = 'your.jwt.token';
const socket = new WebSocket(`wss://api.example.com/api/v1/ws?token=${token}`);

// Handle connection events
socket.onopen = (event) => {
  console.log('Connected to WebSocket');
};

socket.onclose = (event) => {
  console.log(`Connection closed: ${event.code} - ${event.reason}`);
};

socket.onerror = (error) => {
  console.error('WebSocket error:', error);
};

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received message:', message);
};
```

### Subscribing to a Channel

```javascript
// Subscribe to a channel
socket.send(JSON.stringify({
  type: 'subscribe',
  channel: 'public:updates'
}));

// Handle subscription confirmation
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'subscribe:success') {
    console.log(`Subscribed to ${message.payload.channel}`);
  } else if (message.type === 'error') {
    console.error(`Error: ${message.payload.message}`);
  }
};
```

### Sending Messages

```javascript
// Send a message
socket.send(JSON.stringify({
  type: 'message',
  payload: {
    content: 'Hello, world!',
    timestamp: new Date().toISOString()
  }
}));
```

## Configuration

WebSocket security is configured through environment variables:

```
# WebSocket Configuration
WS_PATH=/api/v1/ws
WS_MAX_PAYLOAD_SIZE=1048576
WS_HEARTBEAT_INTERVAL=30000

# Rate Limiting
WS_RATE_LIMIT_MAX_MESSAGES=50
WS_RATE_LIMIT_WINDOW_MS=60000
```

## Implementation Details

The WebSocket security implementation is distributed across several files:

- `src/shared/websocket/server.js` - Core WebSocket server implementation
- `src/modules/websocket/services/websocket.service.js` - WebSocket service API
- `src/shared/utils/rateLimiter.js` - Rate limiting implementation 