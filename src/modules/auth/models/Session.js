/**
 * Session model for tracking active user sessions
 * Uses existing database schema without modifications
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../shared/database');
const User = require('./User');

/**
 * Session model - leverages the refresh_tokens table
 * Rather than creating a new table, we use the existing table
 * and add new functionality through this model
 */
const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [32, 255],
    },
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isAfterCreation(value) {
        if (this.created_at && new Date(value) <= new Date(this.created_at)) {
          throw new Error('Expiration date must be after creation date');
        }
      },
    },
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  device_info: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_revoked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  last_used_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'refresh_tokens',
  timestamps: true,
  underscored: true,
  // Use createdAt/updatedAt mapping to match DB
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  // Add computed properties
  getterMethods: {
    is_active() {
      return !this.is_revoked && new Date(this.expires_at) > new Date();
    },
    device_name() {
      if (!this.user_agent) return 'Unknown Device';
      
      // Extract device info from user agent string
      const isMobile = /Mobile|Android|iPhone|iPad/.test(this.user_agent);
      const browser = this.user_agent.match(/(Chrome|Firefox|Safari|Edge|MSIE|Trident)\/?\s*(\d+)/i);
      const os = this.user_agent.match(/(Windows|Mac|Linux|Android|iOS|iPhone|iPad)[\s\/_]*([\d._]+)?/i);
      
      const browserName = browser ? browser[1] : 'Unknown Browser';
      const osName = os ? os[1] : 'Unknown OS';
      
      return `${isMobile ? 'Mobile' : 'Desktop'} - ${browserName} on ${osName}`;
    },
    location() {
      // This would ideally use GeoIP data, but we'll use a placeholder for now
      return 'Unknown Location';
    }
  },
});

// Associate with User model
Session.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Session, { foreignKey: 'user_id', as: 'sessions' });

/**
 * Find active sessions for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Active sessions
 */
Session.findActiveSessionsForUser = async function(userId) {
  return this.findAll({
    where: {
      user_id: userId,
      is_revoked: false,
      expires_at: {
        [sequelize.Sequelize.Op.gt]: new Date()
      }
    },
    order: [['last_used_at', 'DESC'], ['created_at', 'DESC']],
  });
};

/**
 * Revoke a specific session
 * @param {number} userId - User ID
 * @param {string} sessionId - Session/token ID
 * @returns {Promise<boolean>} Success
 */
Session.revokeSession = async function(userId, sessionId) {
  const result = await this.update(
    { is_revoked: true },
    { 
      where: { 
        id: sessionId,
        user_id: userId
      }
    }
  );
  
  return result[0] > 0;
};

/**
 * Revoke all sessions for a user except the current one
 * @param {number} userId - User ID
 * @param {string} currentSessionId - Current session ID to preserve
 * @returns {Promise<number>} Number of revoked sessions
 */
Session.revokeAllSessionsExceptCurrent = async function(userId, currentSessionId) {
  const result = await this.update(
    { is_revoked: true },
    { 
      where: { 
        user_id: userId,
        id: {
          [sequelize.Sequelize.Op.ne]: currentSessionId
        },
        is_revoked: false
      }
    }
  );
  
  return result[0];
};

/**
 * Update last used timestamp for a session
 * @param {number} sessionId - Session ID
 * @returns {Promise<boolean>} Success
 */
Session.updateLastUsed = async function(sessionId) {
  const result = await this.update(
    { 
      last_used_at: new Date(),
      updated_at: new Date()
    },
    { where: { id: sessionId } }
  );
  
  return result[0] > 0;
};

module.exports = Session; 