const BaseRepository = require('../BaseRepository');
const ValidationRule = require('../../models/public/ValidationRule');

class ValidationRuleRepository extends BaseRepository {
  constructor() {
    super(ValidationRule);
  }

  async findByEntityType(entityType) {
    return this.model.findAll({
      where: { entity_type: entityType },
      order: [['field_name', 'ASC'], ['rule_type', 'ASC']]
    });
  }

  async findByEntityTypeAndField(entityType, fieldName) {
    return this.model.findAll({
      where: { 
        entity_type: entityType,
        field_name: fieldName
      },
      order: [['rule_type', 'ASC']]
    });
  }

  async findByEntityTypeFieldAndRule(entityType, fieldName, ruleType) {
    return this.model.findOne({
      where: {
        entity_type: entityType,
        field_name: fieldName,
        rule_type: ruleType
      }
    });
  }
}

module.exports = new ValidationRuleRepository(); 