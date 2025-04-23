/**
 * Tag Utilities
 * 
 * These utilities help manage tags for skills using the existing description field.
 * Tags are stored in a special format within the description: [tag1,tag2,tag3]
 * The rest of the description is preserved for actual text content.
 */

/**
 * Extract tags from a skill description
 * @param {string} description - The skill description text
 * @returns {string[]} Array of tags
 */
exports.extractTags = (description) => {
  if (!description) return [];
  
  // Look for tag format [tag1,tag2,tag3] at the end of the description
  const tagMatch = description.match(/\[([\w\s,-]+)\]$/);
  if (!tagMatch) return [];
  
  // Split the matched tag string into individual tags and trim them
  return tagMatch[1].split(',').map(tag => tag.trim()).filter(tag => tag);
};

/**
 * Get the description text without the tags
 * @param {string} description - The skill description text
 * @returns {string} Description without the tag section
 */
exports.getDescriptionWithoutTags = (description) => {
  if (!description) return '';
  
  // Remove tag format [tag1,tag2,tag3] from the end of the description
  return description.replace(/\s*\[[\w\s,-]+\]$/, '').trim();
};

/**
 * Add tags to a description
 * @param {string} description - The existing description
 * @param {string[]} tags - Array of tags to add
 * @returns {string} Description with tags added
 */
exports.addTagsToDescription = (description, tags) => {
  if (!tags || tags.length === 0) return description || '';
  
  // Get the description without any existing tags
  const cleanDescription = exports.getDescriptionWithoutTags(description || '');
  
  // Add the new tags
  const tagString = `[${tags.join(',')}]`;
  return cleanDescription ? `${cleanDescription} ${tagString}` : tagString;
};

/**
 * Format skill object to expose tags
 * @param {Object} skill - The skill object from the database
 * @returns {Object} Skill with tags extracted as a property
 */
exports.formatSkillWithTags = (skill) => {
  if (!skill) return null;
  
  // Convert to plain object if it's a Sequelize model
  const plainSkill = skill.toJSON ? skill.toJSON() : { ...skill };
  
  // Extract tags and clean description
  const tags = exports.extractTags(plainSkill.description);
  const description = exports.getDescriptionWithoutTags(plainSkill.description);
  
  return {
    ...plainSkill,
    description,
    tags
  };
};

/**
 * Search for skills matching specific tags
 * @param {Array} skills - Array of skill objects
 * @param {Array} searchTags - Tags to search for
 * @param {boolean} matchAll - Whether to require all tags to match (AND) or any tag (OR)
 * @returns {Array} Filtered skills matching the tag criteria
 */
exports.filterSkillsByTags = (skills, searchTags, matchAll = false) => {
  if (!searchTags || searchTags.length === 0) return skills;
  
  // Convert search tags to lowercase for case-insensitive matching
  const normalizedSearchTags = searchTags.map(tag => tag.toLowerCase());
  
  return skills.filter(skill => {
    const skillTags = exports.extractTags(skill.description)
      .map(tag => tag.toLowerCase());
    
    if (matchAll) {
      // All search tags must be present (AND logic)
      return normalizedSearchTags.every(searchTag => 
        skillTags.includes(searchTag)
      );
    } else {
      // Any search tag may be present (OR logic)
      return normalizedSearchTags.some(searchTag => 
        skillTags.includes(searchTag)
      );
    }
  });
}; 