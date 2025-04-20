/**
 * API Version Middleware
 * 
 * This middleware handles API versioning functionality including:
 * - Version validation
 * - Version headers
 * - Deprecation warnings
 */
const { AppError } = require('../errors');

// Supported API versions
const SUPPORTED_VERSIONS = ['v1'];
const LATEST_VERSION = 'v1';
const DEFAULT_VERSION = 'v1';

// Version deprecation timeline
const VERSION_DEPRECATION = {
  // Add versions with their deprecation dates when needed
  // 'v1': '2025-01-01'
};

/**
 * Version validation middleware
 * Validates that the requested API version is supported
 */
const validateVersion = (req, res, next) => {
  // Extract version from URL or accept header
  const urlVersion = req.params.version;
  const headerVersion = req.get('Accept-Version');
  
  // Determine which version to use (URL takes precedence over header)
  let requestedVersion = urlVersion || headerVersion || DEFAULT_VERSION;
  
  // Strip 'v' prefix if not present for consistency
  if (!requestedVersion.startsWith('v')) {
    requestedVersion = `v${requestedVersion}`;
  }
  
  // Check if version is supported
  if (!SUPPORTED_VERSIONS.includes(requestedVersion)) {
    return next(new AppError(
      `API version ${requestedVersion} is not supported. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`,
      400,
      'API_001'
    ));
  }
  
  // Store version on the request object for later use
  req.apiVersion = requestedVersion;
  
  next();
};

/**
 * Version header middleware
 * Adds appropriate API version headers to responses
 */
const addVersionHeaders = (req, res, next) => {
  // Add version headers to response
  res.setHeader('X-API-Version', req.apiVersion || DEFAULT_VERSION);
  res.setHeader('X-API-Latest-Version', LATEST_VERSION);
  
  // Add deprecation notice if applicable
  const deprecationDate = VERSION_DEPRECATION[req.apiVersion];
  if (deprecationDate) {
    const isDeprecated = new Date(deprecationDate) <= new Date();
    
    if (isDeprecated) {
      res.setHeader('X-API-Deprecated', 'true');
      res.setHeader('X-API-Deprecation-Date', deprecationDate);
      res.setHeader('X-API-Replacement-Version', LATEST_VERSION);
    } else {
      res.setHeader('X-API-Deprecation-Date', deprecationDate);
    }
  }
  
  next();
};

/**
 * Middleware to add deprecation warning to response body
 */
const addDeprecationWarning = (req, res, next) => {
  const deprecationDate = VERSION_DEPRECATION[req.apiVersion];
  
  if (deprecationDate) {
    const originalJson = res.json;
    
    res.json = function(obj) {
      if (obj && !obj.error) {
        // Add deprecation warning to response
        obj.warning = {
          message: `API version ${req.apiVersion} will be deprecated on ${deprecationDate}. Please upgrade to ${LATEST_VERSION}.`,
          deprecationDate,
          replacementVersion: LATEST_VERSION
        };
      }
      
      return originalJson.call(this, obj);
    };
  }
  
  next();
};

module.exports = {
  validateVersion,
  addVersionHeaders,
  addDeprecationWarning,
  SUPPORTED_VERSIONS,
  LATEST_VERSION,
  DEFAULT_VERSION
}; 