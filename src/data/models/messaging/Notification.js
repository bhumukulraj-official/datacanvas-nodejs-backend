const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class Notification extends BaseModel {
  static init(sequelize) {
    return super.init({
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      link: DataTypes.STRING(255),
      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      read_at: DataTypes.DATE,
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      digital_signature: DataTypes.STRING(512)
    }, {
      sequelize,
      tableName: 'notifications',
      schema: 'messaging',
      paranoid: true,
      deletedAt: 'deleted_at',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['user_id'] },
        { fields: ['type'] },
        { fields: ['is_read'] },
        { fields: ['created_at'] },
        { fields: ['is_deleted'] },
        { fields: ['metadata'], using: 'gin' }
      ]
    });
  }

  static associate({ User }) {
    this.belongsTo(User, { foreignKey: 'user_id' });
  }
}; 