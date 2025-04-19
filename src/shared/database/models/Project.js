const { Model, DataTypes } = require('sequelize');

class Project extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        title: {
          type: DataTypes.STRING(200),
          allowNull: false,
          validate: {
            notEmpty: true,
            len: [1, 200]
          }
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false,
          validate: {
            notEmpty: true
          }
        },
        thumbnail: {
          type: DataTypes.STRING,
          allowNull: true
        },
        tags: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          defaultValue: []
        },
        technologies: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          defaultValue: []
        },
        githubUrl: {
          type: DataTypes.STRING,
          allowNull: true,
          validate: {
            isUrl: true
          }
        },
        liveUrl: {
          type: DataTypes.STRING,
          allowNull: true,
          validate: {
            isUrl: true
          }
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false
        }
      },
      {
        sequelize,
        modelName: 'Project',
        tableName: 'projects',
        indexes: [
          {
            name: 'projects_user_id_idx',
            fields: ['userId']
          },
          {
            name: 'projects_created_at_idx',
            fields: ['createdAt']
          },
          {
            name: 'projects_tags_idx',
            fields: ['tags'],
            using: 'gin'
          }
        ]
      }
    );
    return this;
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'userId', as: 'author' });
  }
}

module.exports = Project; 