const { Model } = require('sequelize');

module.exports = class BaseModel extends Model {
  static init(attributes, options) {
    const modelOptions = {
      ...options,
      timestamps: true,
      underscored: true,
      paranoid: options.paranoid !== false,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: options.paranoid !== false ? 'deleted_at' : undefined,
    };

    return super.init(attributes, modelOptions);
  }

  static async findByUuid(uuid) {
    return this.findOne({ where: { uuid } });
  }
}; 