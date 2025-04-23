/**
 * Search Log Model
 * Tracks user search queries for analytics purposes
 */
const { Model, DataTypes } = require('sequelize');

class SearchLog extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        query: {
          type: DataTypes.TEXT,
          allowNull: false,
          comment: 'The search query text'
        },
        userId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'user_id',
          comment: 'ID of the user who performed the search, if authenticated'
        },
        sessionId: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'session_id',
          comment: 'Session ID for anonymous users'
        },
        contentType: {
          type: DataTypes.STRING(50),
          allowNull: true,
          field: 'content_type',
          comment: 'The specific content type being searched, if applicable'
        },
        resultCount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: 'result_count',
          comment: 'Number of results returned by the search'
        },
        filters: {
          type: DataTypes.JSONB,
          allowNull: true,
          comment: 'Any filters applied to the search'
        },
        queryTime: {
          type: DataTypes.FLOAT,
          allowNull: true,
          field: 'query_time',
          comment: 'Time in milliseconds to execute the search query'
        },
        userAgent: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: 'user_agent',
          comment: 'User agent information'
        },
        ipAddress: {
          type: DataTypes.STRING,
          allowNull: true,
          field: 'ip_address',
          comment: 'IP address of the user'
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          field: 'created_at'
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
          field: 'updated_at'
        }
      },
      {
        sequelize,
        modelName: 'SearchLog',
        tableName: 'search_logs',
        timestamps: true,
        indexes: [
          {
            name: 'search_logs_query_idx',
            fields: ['query'],
            using: 'gin',
            operator: 'gin_trgm_ops'
          },
          {
            name: 'search_logs_user_id_idx',
            fields: ['user_id']
          },
          {
            name: 'search_logs_content_type_idx',
            fields: ['content_type']
          },
          {
            name: 'search_logs_created_at_idx',
            fields: ['created_at']
          }
        ]
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  }
}

module.exports = SearchLog; 