const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

class ApiKeyUsage extends Model {}

ApiKeyUsage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    api_key_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'api_keys',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    endpoint: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    method: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    status_code: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    response_time_ms: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    request_body: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'ApiKeyUsage',
    tableName: 'api_key_usage',
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at',
    indexes: [
      {
        name: 'idx_api_key_usage_api_key_id',
        fields: ['api_key_id'],
      },
      {
        name: 'idx_api_key_usage_created_at',
        fields: ['created_at'],
      },
      {
        name: 'idx_api_key_usage_endpoint_method',
        fields: ['endpoint', 'method'],
      },
    ],
  }
);

ApiKeyUsage.associate = (models) => {
  ApiKeyUsage.belongsTo(models.ApiKey, {
    foreignKey: 'api_key_id',
    as: 'apiKey'
  });
};

module.exports = ApiKeyUsage; 