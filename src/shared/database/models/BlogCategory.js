const { Model, DataTypes } = require('sequelize');

class BlogCategory extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
          validate: {
            notEmpty: true,
            len: [1, 100]
          }
        },
        slug: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
          validate: {
            notEmpty: true,
            len: [1, 100]
          }
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true
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
        modelName: 'BlogCategory',
        tableName: 'blog_categories',
        indexes: [
          {
            name: 'blog_categories_slug_idx',
            unique: true,
            fields: ['slug']
          }
        ]
      }
    );
    return this;
  }

  static associate(models) {
    this.hasMany(models.BlogPost, { foreignKey: 'categoryId', as: 'posts' });
  }
}

module.exports = BlogCategory; 