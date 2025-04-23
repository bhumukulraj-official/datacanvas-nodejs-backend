/**
 * IP Address utilities for accurate client IP detection and handling
 * Supports various proxy configurations
 */

/**
 * Get client IP address with proxy support
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
exports.getClientIp = (req) => {
  // Try multiple request properties to find the client IP
  const forwarded = req.headers['x-forwarded-for'];
  
  if (forwarded) {
    // Get the first IP if x-forwarded-for contains a comma-separated list
    return forwarded.split(',')[0].trim();
  }
  
  // Try alternative sources in order of reliability
  return (
    req.headers['cf-connecting-ip'] ||  // Cloudflare
    req.headers['x-real-ip'] ||         // Nginx
    req.headers['x-client-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    '0.0.0.0'                          // Fallback
  );
};

/**
 * Clean an IP address to handle IPv4/IPv6 formats
 * @param {string} ip - IP address string
 * @returns {string} Cleaned IP address
 */
exports.cleanIpAddress = (ip) => {
  if (!ip) return '0.0.0.0';
  
  // Handle IPv4-mapped IPv6 addresses
  if (ip.includes('::ffff:')) {
    return ip.replace('::ffff:', '');
  }
  
  // Handle local IPv6 addresses
  if (ip === '::1') {
    return '127.0.0.1';
  }
  
  return ip;
};

/**
 * Anonymize IP address for privacy while maintaining uniqueness
 * @param {string} ip - IP address to anonymize
 * @returns {string} Anonymized IP for storage
 */
exports.anonymizeIp = (ip) => {
  if (!ip) return '0.0.0.0';
  
  // For IPv4, remove the last octet
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }
  
  // For IPv6, truncate to network prefix
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length > 4) {
      return `${parts[0]}:${parts[1]}:${parts[2]}:${parts[3]}:0:0:0:0`;
    }
  }
  
  return ip;
}; 