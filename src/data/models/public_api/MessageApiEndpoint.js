const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class MessageApiEndpoint extends BaseModel {
  static init(sequelize) {
    return super.init({
      endpoint: {
        type: DataTypes.STRING(100),
        primaryKey: true
      },
      description: DataTypes.TEXT,
      method: {
        type: DataTypes.STRING(10),
        validate: {
          isIn: [['GET', 'POST', 'PUT', 'PATCH', 'DELETE']]
        }
      },
      schema_name: DataTypes.STRING(50),
      table_name: DataTypes.STRING(50)
    }, {
      sequelize,
      tableName: 'message_endpoints',
      schema: 'public_api',
      timestamps: false
    });
  }
}; 