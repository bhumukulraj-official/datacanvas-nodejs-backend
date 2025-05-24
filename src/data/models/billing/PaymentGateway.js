const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class PaymentGateway extends BaseModel {
  static init(sequelize) {
    return super.init({
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      provider: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      config: {
        type: DataTypes.JSONB,
        allowNull: false
      },
      distributed_xid: {
        type: DataTypes.STRING(100),
        comment: 'Distributed transaction ID'
      }
    }, {
      sequelize,
      tableName: 'payment_gateways',
      schema: 'billing',
      indexes: [
        { fields: ['provider'] },
        { fields: ['is_active'] }
      ]
    });
  }

  static associate({ PaymentProvider }) {
    this.belongsTo(PaymentProvider, { 
      foreignKey: 'provider', 
      targetKey: 'code'  // Match provider code
    });
  }
}; 