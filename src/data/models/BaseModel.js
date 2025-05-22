const { Model } = require('sequelize');

module.exports = class BaseModel extends Model {
  static init(attributes, options) {
    // Don't override explicit timestamp settings
    const hasExplicitTimestamps = Object.prototype.hasOwnProperty.call(options, 'timestamps');
    
    const modelOptions = {
      ...options,
      timestamps: hasExplicitTimestamps ? options.timestamps : true,
      underscored: options.underscored !== false,
      paranoid: options.paranoid !== false && options.timestamps !== false,
      createdAt: options.timestamps === false ? undefined : (options.createdAt || 'created_at'),
      updatedAt: options.timestamps === false ? undefined : (options.updatedAt || 'updated_at'),
      deletedAt: (options.paranoid !== false && options.timestamps !== false) ? (options.deletedAt || 'deleted_at') : undefined,
    };

    return super.init(attributes, modelOptions);
  }

  static async findByUuid(uuid) {
    return this.findOne({ where: { uuid } });
  }
}; 