const { Model, DataTypes } = require('sequelize');

class BlogPost extends Model {
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
        slug: {
          type: DataTypes.STRING(200),
          allowNull: false,
          unique: true,
          validate: {
            notEmpty: true
          }
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
          validate: {
            notEmpty: true
          }
        },
        excerpt: {
          type: DataTypes.STRING(500),
          allowNull: true
        },
        featuredImage: {
          type: DataTypes.STRING,
          allowNull: true,
          validate: {
            isUrl: true
          }
        },
        status: {
          type: DataTypes.ENUM('draft', 'published'),
          defaultValue: 'draft'
        },
        tags: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          defaultValue: []
        },
        categoryId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'blog_categories',
            key: 'id'
          }
        },
        authorId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        publishedAt: {
          type: DataTypes.DATE,
          allowNull: true
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false
        },
        searchVector: {
          type: DataTypes.TSVECTOR,
          allowNull: true
        }
      },
      {
        sequelize,
        modelName: 'BlogPost',
        tableName: 'blog_posts',
        indexes: [
          {
            name: 'blog_posts_slug_idx',
            unique: true,
            fields: ['slug']
          },
          {
            name: 'blog_posts_category_id_idx',
            fields: ['categoryId']
          },
          {
            name: 'blog_posts_author_id_idx',
            fields: ['authorId']
          },
          {
            name: 'blog_posts_status_idx',
            fields: ['status']
          },
          {
            name: 'blog_posts_published_at_idx',
            fields: ['publishedAt']
          },
          {
            name: 'blog_posts_tags_idx',
            fields: ['tags'],
            using: 'gin'
          },
          {
            name: 'blog_posts_search_idx',
            fields: ['searchVector'],
            using: 'gin'
          }
        ],
        hooks: {
          beforeSave: async (post) => {
            // Auto-generate publishedAt timestamp when status changes to published
            if (post.changed('status') && post.status === 'published' && !post.publishedAt) {
              post.publishedAt = new Date();
            }
          }
        }
      }
    );
    return this;
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'authorId', as: 'author' });
    this.belongsTo(models.BlogCategory, { foreignKey: 'categoryId', as: 'category' });
  }
}

module.exports = BlogPost; 