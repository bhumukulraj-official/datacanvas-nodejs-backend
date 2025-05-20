class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    return this.model.create(data);
  }

  async findById(id) {
    return this.model.findByPk(id);
  }

  async findByUuid(uuid) {
    return this.model.findOne({ where: { uuid } });
  }

  async findAll(options = {}) {
    return this.model.findAll(options);
  }

  async update(id, data) {
    const record = await this.findById(id);
    if (!record) {
      return null;
    }
    return record.update(data);
  }

  async delete(id) {
    const record = await this.findById(id);
    if (!record) {
      return null;
    }
    return record.destroy();
  }

  async paginate({ page = 1, limit = 10, where = {}, include = [], order = [] }) {
    const offset = (page - 1) * limit;
    const { count, rows } = await this.model.findAndCountAll({
      where,
      include,
      order,
      offset,
      limit,
    });
    return {
      totalItems: count,
      items: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    };
  }
}

module.exports = BaseRepository; 