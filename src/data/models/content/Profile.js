const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class Profile extends BaseModel {
  static init(sequelize) {
    return super.init({
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
      },
      title: DataTypes.STRING(200),
      bio: DataTypes.TEXT,
      avatar_url: DataTypes.STRING(255),
      phone: DataTypes.STRING(20),
      location: DataTypes.STRING(100),
      social_links: DataTypes.JSONB,
      resume_url: DataTypes.STRING(255),
      metadata: DataTypes.JSONB,
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      sequelize,
      tableName: 'profiles',
      schema: 'content',
      paranoid: true,
      indexes: [
        { fields: ['user_id'] },
        { fields: ['is_deleted'] },
        { 
          name: 'idx_profiles_social_links',
          fields: ['social_links'],
          using: 'gin'
        }
      ]
    });
  }

  static associate({ User }) {
    this.belongsTo(User, { foreignKey: 'user_id', unique: true });
  }
}; 