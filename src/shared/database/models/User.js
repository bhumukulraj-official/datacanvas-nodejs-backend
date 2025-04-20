const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

class User extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
            notEmpty: true
          }
        },
        password_hash: {
          type: DataTypes.STRING,
          allowNull: false
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: true
          }
        },
        role: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: 'user',
          validate: {
            isIn: [['user', 'admin', 'moderator']]
          }
        },
        email_verified: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        password_updated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        },
        password_history: {
          type: DataTypes.JSON,
          defaultValue: []
        },
        failed_login_attempts: {
          type: DataTypes.INTEGER,
          defaultValue: 0
        },
        locked_until: {
          type: DataTypes.DATE,
          allowNull: true
        },
        last_login_at: {
          type: DataTypes.DATE,
          allowNull: true
        },
        last_login_ip: {
          type: DataTypes.STRING,
          allowNull: true
        },
        active_sessions: {
          type: DataTypes.JSON,
          defaultValue: []
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'created_at'
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'updated_at'
        }
      },
      {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        indexes: [
          {
            name: 'idx_users_email',
            unique: true,
            fields: ['email']
          },
          {
            name: 'idx_users_role',
            fields: ['role']
          }
        ]
      }
    );

    return this;
  }

  /**
   * Define model associations
   * @param {Object} models - DB models
   */
  static associate(models) {
    this.hasOne(models.Profile, { foreignKey: 'userId', as: 'profile' });
    this.hasMany(models.Project, { foreignKey: 'userId', as: 'projects' });
    this.hasMany(models.RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
    this.hasMany(models.EmailVerificationToken, { foreignKey: 'userId', as: 'emailVerificationTokens' });
    this.hasMany(models.PasswordResetToken, { foreignKey: 'userId', as: 'passwordResetTokens' });
    this.hasMany(models.Notification, { foreignKey: 'userId', as: 'notifications' });
    this.hasMany(models.AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
    this.hasMany(models.Skill, { foreignKey: 'userId', as: 'skills' });
    this.hasMany(models.Education, { foreignKey: 'userId', as: 'education' });
    this.hasMany(models.Experience, { foreignKey: 'userId', as: 'experience' });
    this.hasMany(models.Media, { foreignKey: 'userId', as: 'media' });
    this.hasMany(models.BlogPost, { foreignKey: 'authorId', as: 'blogPosts' });
    this.hasMany(models.WebsocketConnection, { foreignKey: 'userId', as: 'websocketConnections' });
  }

  /**
   * Compare entered password with stored hash
   * @param {string} candidatePassword - Password to check
   * @returns {Promise<boolean>} Whether password matches
   */
  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password_hash);
  }

  /**
   * Hash a password
   * @param {string} password - Password to hash
   * @returns {Promise<string>} Hashed password
   */
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  /**
   * Check if password has been used before
   * @param {string} candidatePassword - Password to check
   * @returns {Promise<boolean>} Whether password has been used before
   */
  async isPasswordInHistory(candidatePassword) {
    if (!this.password_history || !Array.isArray(this.password_history)) {
      return false;
    }

    // Check each password in history
    for (const hash of this.password_history) {
      const isMatch = await bcrypt.compare(candidatePassword, hash);
      if (isMatch) return true;
    }
    
    return false;
  }

  /**
   * Add current password hash to history
   * @param {string} hash - Password hash to add
   * @param {number} limit - Max number of passwords to keep in history (default 5)
   */
  addPasswordToHistory(hash, limit = 5) {
    if (!this.password_history) {
      this.password_history = [];
    }
    
    // Add new hash to beginning
    this.password_history.unshift(hash);
    
    // Trim history to limit
    if (this.password_history.length > limit) {
      this.password_history = this.password_history.slice(0, limit);
    }
  }

  /**
   * Check if account is locked
   * @returns {boolean} Whether account is locked
   */
  isAccountLocked() {
    return this.locked_until && new Date(this.locked_until) > new Date();
  }

  /**
   * Remove sensitive information before JSON conversion
   * @returns {Object} User object without sensitive data
   */
  toJSON() {
    const values = { ...this.get() };
    delete values.password_hash;
    delete values.password_history;
    return values;
  }
}

module.exports = User; 