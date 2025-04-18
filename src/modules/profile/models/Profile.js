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
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    avatar_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    social_links: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    resume_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Profile',
    tableName: 'profiles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
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