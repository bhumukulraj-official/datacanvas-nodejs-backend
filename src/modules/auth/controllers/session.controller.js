/**
 * Session management controller
 * Allows users to view and manage their active sessions
 */
const Session = require('../models/Session');
const { AppResponse } = require('../../../shared/utils/appResponse');
const { auditSecurityEvent } = require('../../../shared/middleware/audit.middleware');
const geoip = require('geoip-lite');

/**
 * Get all active sessions for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getActiveSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get active sessions
    const sessions = await Session.findActiveSessionsForUser(userId);
    
    // Enhance session data with location info
    const enhancedSessions = sessions.map(session => {
      const sessionData = session.toJSON();
      
      // Add device name
      sessionData.device_name = session.device_name;
      
      // Add active status
      sessionData.is_active = session.is_active;
      
      // Add location data based on IP if available
      if (session.ip_address) {
        const geo = geoip.lookup(session.ip_address);
        sessionData.location = geo 
          ? `${geo.city || ''}, ${geo.country || 'Unknown'}`
          : 'Unknown Location';
      } else {
        sessionData.location = 'Unknown Location';
      }
      
      // Add current session indicator
      sessionData.is_current = req.token && 
        session.token && 
        session.token.substring(0, 10) === req.refreshToken?.substring(0, 10);
      
      // Don't return the actual token
      delete sessionData.token;
      
      return sessionData;
    });
    
    return AppResponse.success(res, enhancedSessions, 'Active sessions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke a specific session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.revokeSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    
    // Get current session ID if this is the current session
    const currentSessionId = req.sessionId;
    
    // Check if user is trying to revoke their current session
    if (sessionId === currentSessionId) {
      return AppResponse.error(res, 'Cannot revoke your current session. Use logout instead.', 400);
    }
    
    // Revoke the session
    const success = await Session.revokeSession(userId, sessionId);
    
    if (!success) {
      return AppResponse.error(res, 'Session not found or already revoked', 404);
    }
    
    // Audit the session revocation
    await auditSecurityEvent(
      userId,
      'SESSION_REVOKE',
      'session',
      sessionId,
      'User revoked a session',
      { sessionId, revokedBy: 'user' },
      req.ip,
      req.get('User-Agent')
    );
    
    return AppResponse.success(res, null, 'Session revoked successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke all sessions except the current one
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.revokeAllSessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const currentSessionId = req.sessionId;
    
    // Revoke all other sessions
    const revokedCount = await Session.revokeAllSessionsExceptCurrent(userId, currentSessionId);
    
    // Audit the mass session revocation
    await auditSecurityEvent(
      userId,
      'SESSION_REVOKE_ALL',
      'user',
      userId,
      'User revoked all other sessions',
      { revokedCount, sparedSessionId: currentSessionId },
      req.ip,
      req.get('User-Agent')
    );
    
    return AppResponse.success(res, { revokedCount }, `Revoked ${revokedCount} sessions`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed information about a specific session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getSessionDetails = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    
    // Get session details
    const session = await Session.findOne({
      where: {
        id: sessionId,
        user_id: userId
      }
    });
    
    if (!session) {
      return AppResponse.error(res, 'Session not found', 404);
    }
    
    // Format the session data
    const sessionData = session.toJSON();
    sessionData.device_name = session.device_name;
    sessionData.is_active = session.is_active;
    
    // Add location data
    if (session.ip_address) {
      const geo = geoip.lookup(session.ip_address);
      if (geo) {
        sessionData.geo = {
          country: geo.country,
          region: geo.region,
          city: geo.city,
          timezone: geo.timezone,
          ll: geo.ll // Latitude, longitude
        };
      }
    }
    
    // Add current session indicator
    sessionData.is_current = req.token && 
      session.token && 
      session.token.substring(0, 10) === req.refreshToken?.substring(0, 10);
    
    // Don't return the actual token
    delete sessionData.token;
    
    return AppResponse.success(res, sessionData, 'Session details retrieved successfully');
  } catch (error) {
    next(error);
  }
}; 