const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class SearchIndex extends BaseModel {
  static init(sequelize) {
    return super.init({
      entity_type: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      entity_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      search_vector: {
        type: DataTypes.TSVECTOR,
        allowNull: false
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
      }
    }, {
      sequelize,
      tableName: 'search_index',
      schema: 'content',
      timestamps: false,
      indexes: [
        { fields: ['entity_type', 'entity_id'] }
      ],
      hooks: {
        afterUpdate: (instance) => {
          // Add search index update logic here
        }
      }
    });
  }
}; 