/**
 * Advanced security middleware for the application
 * Implements best practices for security headers and CORS
 */
const helmet = require('helmet');
const cors = require('cors');

/**
 * Enhanced security headers configuration
 * @returns {Function} Express middleware
 */
exports.securityHeaders = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: false },
    expectCt: {
      enforce: true,
      maxAge: 30,
    },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: {
      maxAge: 15552000, // 180 days
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  });
};

/**
 * Advanced CORS configuration
 * @returns {Function} Express middleware
 */
exports.corsConfig = () => {
  const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      // If specific origins are defined, use them
      if (allowedOrigins.length > 0) {
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
          return callback(null, true);
        } else {
          return callback(new Error('CORS policy violation'), false);
        }
      }
      
      // Default - allow all in development, specific in production
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error('CORS policy violation'), false);
      }
      
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Authorization', 
      'Content-Type', 
      'X-Requested-With', 
      'Accept', 
      'Origin', 
      'X-API-Key',
      'X-Device-ID'
    ],
    exposedHeaders: ['Content-Disposition', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400, // 24 hours
  });
};

/**
 * CSRF protection middleware
 * @returns {Function} Express middleware
 */
exports.csrfProtection = (req, res, next) => {
  // Check if the request is a mutation (not GET, HEAD, OPTIONS)
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  
  if (isMutation) {
    // Check Origin and Referer headers to help prevent CSRF
    const origin = req.get('Origin') || '';
    const referer = req.get('Referer') || '';
    
    // Get host from request
    const host = req.get('Host');
    
    // Skip check for non-browser clients that don't send Origin/Referer
    if (!origin && !referer) {
      return next();
    }
    
    // Check if Origin or Referer match our domain
    const originMatches = origin.includes(host);
    const refererMatches = referer.includes(host);
    
    if (!originMatches && !refererMatches) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_001',
          message: 'Invalid cross-site request',
        }
      });
    }
  }
  
  next();
};

/**
 * Security headers for authentication routes
 * Extra protection for sensitive routes
 * @returns {Function} Express middleware
 */
exports.authSecurityHeaders = () => {
  return (req, res, next) => {
    // Add extra security headers for auth routes
    res.set('Cache-Control', 'no-store, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');
    
    next();
  };
}; 