/**
 * Rate limiter implementation for WebSocket connections
 * Tracks request counts within a time window and enforces rate limits
 */
class RateLimiter {
  /**
   * Create a new rate limiter
   * @param {Object} options - Configuration options
   * @param {number} options.windowMs - Time window in milliseconds
   * @param {number} options.maxRequests - Maximum requests allowed per window
   * @param {string} options.message - Message to send when rate limited
   */
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60 * 1000; // Default: 1 minute
    this.maxRequests = options.maxRequests || 100; // Default: 100 requests per minute
    this.message = options.message || 'Too many requests, please try again later';
    
    // Store client request counts: { clientId: { count, resetTime } }
    this.clients = new Map();
    
    // Clean up interval (every minute)
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
  }
  
  /**
   * Register a new client
   * @param {string} clientId - Client identifier
   */
  registerClient(clientId) {
    if (!this.clients.has(clientId)) {
      this.clients.set(clientId, {
        count: 0,
        resetTime: Date.now() + this.windowMs
      });
    }
  }
  
  /**
   * Unregister a client
   * @param {string} clientId - Client identifier
   */
  unregisterClient(clientId) {
    this.clients.delete(clientId);
  }
  
  /**
   * Track a request from a client
   * @param {string} clientId - Client identifier
   */
  trackRequest(clientId) {
    // If client doesn't exist, register them
    if (!this.clients.has(clientId)) {
      this.registerClient(clientId);
    }
    
    const client = this.clients.get(clientId);
    
    // Reset counter if window has expired
    if (Date.now() > client.resetTime) {
      client.count = 0;
      client.resetTime = Date.now() + this.windowMs;
    }
    
    // Increment request count
    client.count++;
    
    return client.count;
  }
  
  /**
   * Check if client is rate limited
   * @param {string} clientId - Client identifier
   * @returns {boolean} Whether client is rate limited
   */
  isRateLimited(clientId) {
    // If client doesn't exist, they're not rate limited
    if (!this.clients.has(clientId)) {
      return false;
    }
    
    const client = this.clients.get(clientId);
    
    // Reset counter if window has expired
    if (Date.now() > client.resetTime) {
      client.count = 0;
      client.resetTime = Date.now() + this.windowMs;
      return false;
    }
    
    // Check if client has exceeded max requests
    return client.count >= this.maxRequests;
  }
  
  /**
   * Get remaining requests for a client
   * @param {string} clientId - Client identifier
   * @returns {number} Number of remaining requests
   */
  getRemainingRequests(clientId) {
    // If client doesn't exist, they have maximum requests available
    if (!this.clients.has(clientId)) {
      return this.maxRequests;
    }
    
    const client = this.clients.get(clientId);
    
    // Reset counter if window has expired
    if (Date.now() > client.resetTime) {
      client.count = 0;
      client.resetTime = Date.now() + this.windowMs;
      return this.maxRequests;
    }
    
    // Calculate remaining requests
    return Math.max(0, this.maxRequests - client.count);
  }
  
  /**
   * Get time until reset for a client
   * @param {string} clientId - Client identifier
   * @returns {number} Time until reset in milliseconds
   */
  getTimeUntilReset(clientId) {
    // If client doesn't exist, return 0
    if (!this.clients.has(clientId)) {
      return 0;
    }
    
    const client = this.clients.get(clientId);
    
    // Calculate time until reset
    return Math.max(0, client.resetTime - Date.now());
  }
  
  /**
   * Clean up expired client records
   */
  cleanup() {
    const now = Date.now();
    
    // Remove clients whose window has expired and count is 0
    for (const [clientId, client] of this.clients.entries()) {
      if (now > client.resetTime && client.count === 0) {
        this.clients.delete(clientId);
      }
    }
  }
  
  /**
   * Stop the rate limiter and clean up resources
   */
  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.clients.clear();
  }
}

module.exports = RateLimiter; 