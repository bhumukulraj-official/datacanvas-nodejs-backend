const { DataTypes, Model } = require('sequelize');
const { sequelize, redisPublish } = require('../../../shared/database');

class Profile extends Model {}

Profile.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [0, 100],
      },
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    avatar_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true,
        is: /^https?:\/\/[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=]*$/,
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: /^[+]?[0-9]{10,15}$/,
      },
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [0, 100],
      },
    },
    social_links: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    resume_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true,
        is: /^https?:\/\/[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=]*$/,
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Profile',
    tableName: 'profiles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
    indexes: [
      {
        name: 'idx_profiles_user_id',
        fields: ['user_id'],
      },
    ],
    hooks: {
      afterUpdate: async (profile) => {
        try {
          await redisPublish('cache_invalidate', `profiles:${profile.user_id}`);
        } catch (error) {
          console.error('Cache invalidation error:', error);
        }
      },
      afterCreate: async (profile) => {
        try {
          await redisPublish('cache_invalidate', `profiles:${profile.user_id}`);
        } catch (error) {
          console.error('Cache invalidation error:', error);
        }
      },
      afterDestroy: async (profile) => {
        try {
          await redisPublish('cache_invalidate', `profiles:${profile.user_id}`);
        } catch (error) {
          console.error('Cache invalidation error:', error);
        }
      },
    },
  }
);

module.exports = Profile; 