/**
 * Export skills module
 */
const { skillRoutes } = require('./routes');
const { Skill } = require('./models');

module.exports = {
  skillRoutes,
  SkillModel: Skill
}; 