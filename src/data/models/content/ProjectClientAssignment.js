const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class ProjectClientAssignment extends BaseModel {
  static init(sequelize) {
    return super.init({
      project_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      client_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      start_date: DataTypes.DATE,
      end_date: DataTypes.DATE,
      notes: DataTypes.TEXT,
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      custom_fields: {
        type: DataTypes.JSONB,
        defaultValue: {},
        validate: {
          isObject: (value) => {
            if (typeof value !== 'object') {
              throw new Error('Custom fields must be a JSON object');
            }
          }
        }
      }
    }, {
      sequelize,
      tableName: 'project_client_assignments',
      schema: 'content',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { 
          unique: true,
          name: 'idx_unique_active_project_client',
          fields: ['project_id', 'client_id'],
          where: { is_active: true }
        }
      ]
    });
  }

  static associate({ Project, User }) {
    this.belongsTo(Project);
    this.belongsTo(User, { as: 'client' });
  }
}; 