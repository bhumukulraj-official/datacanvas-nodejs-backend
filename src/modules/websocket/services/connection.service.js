/**
 * WebSocket Connection Service
 * 
 * Manages and tracks active WebSocket connections with features for:
 * - Connection registration and tracking
 * - User-to-connection mapping
 * - Connection metadata and statistics
 */
const { v4: uuidv4 } = require('uuid');
const logger = require('../../../shared/utils/logger');

// In-memory storage for connections
const connections = new Map();
const userConnections = new Map();

/**
 * Register a new WebSocket connection
 * 
 * @param {string} connectionId - Connection identifier
 * @param {string} userId - User identifier
 * @param {Object} metadata - Connection metadata
 * @returns {boolean} Success status
 */
function registerConnection(connectionId, userId, metadata = {}) {
  try {
    if (!connectionId) {
      throw new Error('Connection ID is required');
    }
    
    // Create connection object
    const connection = {
      id: connectionId,
      userId: userId || null,
      isAuthenticated: !!userId,
      connectedAt: new Date(),
      lastActivityAt: new Date(),
      metadata: {
        ip: metadata.ip || null,
        userAgent: metadata.userAgent || null,
        sessionId: metadata.sessionId || null,
        ...metadata
      }
    };
    
    // Store connection
    connections.set(connectionId, connection);
    
    // If user is authenticated, add to user connections
    if (userId) {
      if (!userConnections.has(userId)) {
        userConnections.set(userId, new Map());
      }
      userConnections.get(userId).set(connectionId, connection);
    }
    
    logger.debug(`Registered WebSocket connection: ${connectionId}`, {
      userId,
      metadata
    });
    
    return true;
  } catch (error) {
    logger.error(`Failed to register connection: ${error.message}`, {
      connectionId,
      userId,
      error
    });
    return false;
  }
}

/**
 * Update a connection with a WebSocket instance
 * 
 * @param {string} connectionId - Connection identifier
 * @param {WebSocket} ws - WebSocket instance
 * @returns {boolean} Success status
 */
function updateConnectionSocket(connectionId, ws) {
  try {
    if (!connectionId || !connections.has(connectionId)) {
      return false;
    }
    
    const connection = connections.get(connectionId);
    connection.ws = ws;
    connection.lastActivityAt = new Date();
    
    return true;
  } catch (error) {
    logger.error(`Failed to update connection socket: ${error.message}`, {
      connectionId,
      error
    });
    return false;
  }
}

/**
 * Update connection metadata
 * 
 * @param {string} connectionId - Connection identifier
 * @param {Object} metadata - Connection metadata to update
 * @returns {boolean} Success status
 */
function updateConnectionMetadata(connectionId, metadata = {}) {
  try {
    if (!connectionId || !connections.has(connectionId)) {
      return false;
    }
    
    const connection = connections.get(connectionId);
    connection.metadata = {
      ...connection.metadata,
      ...metadata
    };
    connection.lastActivityAt = new Date();
    
    return true;
  } catch (error) {
    logger.error(`Failed to update connection metadata: ${error.message}`, {
      connectionId,
      error
    });
    return false;
  }
}

/**
 * Get connection by ID
 * 
 * @param {string} connectionId - Connection identifier
 * @returns {Object|null} Connection object or null if not found
 */
function getConnection(connectionId) {
  return connections.has(connectionId) ? connections.get(connectionId) : null;
}

/**
 * Remove a connection
 * 
 * @param {string} connectionId - Connection identifier
 * @returns {boolean} Success status
 */
function removeConnection(connectionId) {
  try {
    if (!connectionId || !connections.has(connectionId)) {
      return false;
    }
    
    const connection = connections.get(connectionId);
    
    // Remove from connections map
    connections.delete(connectionId);
    
    // If there's a userId, remove from user connections as well
    if (connection.userId && userConnections.has(connection.userId)) {
      const userConnectionMap = userConnections.get(connection.userId);
      userConnectionMap.delete(connectionId);
      
      // If no more connections for user, remove the map
      if (userConnectionMap.size === 0) {
        userConnections.delete(connection.userId);
      }
    }
    
    logger.debug(`Removed WebSocket connection: ${connectionId}`, {
      userId: connection.userId
    });
    
    return true;
  } catch (error) {
    logger.error(`Failed to remove connection: ${error.message}`, {
      connectionId,
      error
    });
    return false;
  }
}

/**
 * Get all connections for a user
 * 
 * @param {string} userId - User identifier
 * @returns {Array} Array of connection objects
 */
function getUserConnections(userId) {
  if (!userId || !userConnections.has(userId)) {
    return [];
  }
  
  return Array.from(userConnections.get(userId).values());
}

/**
 * Count connections for a user
 * 
 * @param {string} userId - User identifier
 * @returns {number} Number of connections
 */
function countUserConnections(userId) {
  if (!userId || !userConnections.has(userId)) {
    return 0;
  }
  
  return userConnections.get(userId).size;
}

/**
 * Check if a user has any active connections
 * 
 * @param {string} userId - User identifier
 * @returns {boolean} True if user has active connections
 */
function isUserConnected(userId) {
  return countUserConnections(userId) > 0;
}

/**
 * Remove all connections for a user
 * 
 * @param {string} userId - User identifier
 * @returns {number} Number of connections removed
 */
function removeUserConnections(userId) {
  if (!userId || !userConnections.has(userId)) {
    return 0;
  }
  
  const userConnectionMap = userConnections.get(userId);
  const connectionIds = Array.from(userConnectionMap.keys());
  let removedCount = 0;
  
  // Remove each connection
  for (const connectionId of connectionIds) {
    // Only remove from main connections map, we'll remove from user map after
    if (connections.has(connectionId)) {
      connections.delete(connectionId);
      removedCount++;
    }
  }
  
  // Remove user from user connections map
  userConnections.delete(userId);
  
  logger.debug(`Removed all connections for user: ${userId}`, {
    count: removedCount
  });
  
  return removedCount;
}

/**
 * Get connection statistics
 * 
 * @returns {Object} Connection statistics
 */
function getConnectionStats() {
  // Count authenticated vs unauthenticated connections
  let authenticatedCount = 0;
  let unauthenticatedCount = 0;
  
  connections.forEach(conn => {
    if (conn.isAuthenticated) {
      authenticatedCount++;
    } else {
      unauthenticatedCount++;
    }
  });
  
  return {
    total: connections.size,
    authenticated: authenticatedCount,
    unauthenticated: unauthenticatedCount,
    userCount: userConnections.size,
    timestamp: new Date()
  };
}

/**
 * Clean up inactive connections
 * 
 * @param {number} maxInactiveTime - Maximum inactive time in milliseconds
 * @returns {number} Number of connections removed
 */
function cleanupInactiveConnections(maxInactiveTime = 3600000) { // Default: 1 hour
  const now = new Date();
  let removedCount = 0;
  
  connections.forEach((connection, connectionId) => {
    const inactiveTime = now - connection.lastActivityAt;
    
    if (inactiveTime > maxInactiveTime) {
      if (removeConnection(connectionId)) {
        removedCount++;
      }
    }
  });
  
  if (removedCount > 0) {
    logger.info(`Cleaned up ${removedCount} inactive connections`);
  }
  
  return removedCount;
}

module.exports = {
  registerConnection,
  updateConnectionSocket,
  updateConnectionMetadata,
  getConnection,
  removeConnection,
  getUserConnections,
  countUserConnections,
  isUserConnected,
  removeUserConnections,
  getConnectionStats,
  cleanupInactiveConnections
};