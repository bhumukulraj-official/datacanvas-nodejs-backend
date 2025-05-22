const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

/**
 * WebhookHandler Model
 * 
 * NOTE: This model does not have a corresponding migration file.
 * A migration should be created to add the webhook_handlers table
 * to the messaging schema before using this model.
 */
module.exports = class WebhookHandler extends BaseModel {
  static init() {
    return super.init({
      event_type: {
        type: DataTypes.STRING(50),
        primaryKey: true
      },
      handler_function: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      config: {
        type: DataTypes.JSONB,
        defaultValue: {}
      },
      description: DataTypes.TEXT,
      priority: {
        type: DataTypes.INTEGER,
        defaultValue: 10
      }
    }, {
      sequelize,
      tableName: 'webhook_handlers',
      schema: 'messaging',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['event_type'] },
        { fields: ['is_active'] }
      ]
    });
  }
}; 