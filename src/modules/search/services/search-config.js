/**
 * Search Configuration
 * Centralized configuration for search services
 */
const { Project } = require('../../projects/models');
const { BlogPost } = require('../../blog/models');
const { Skill } = require('../../skills/models');
const { Experience } = require('../../experience/models');
const { Education } = require('../../education/models');
const { Testimonial } = require('../../testimonials/models');

/**
 * Map of content types to their respective models, searchable fields, and search configuration
 */
exports.CONTENT_TYPE_MAP = {
  projects: {
    model: Project,
    fields: ['title', 'description', 'tech_stack', 'keywords'],
    titleField: 'title',
    dateField: 'created_at',
    // Fields for full-text search with weights
    tsFields: {
      title: 'A',
      description: 'B',
      tech_stack: 'C',
      keywords: 'C'
    },
    statusField: 'status',
    validStatus: 'published'
  },
  blog: {
    model: BlogPost,
    fields: ['title', 'content', 'summary', 'tags'],
    titleField: 'title',
    dateField: 'published_at',
    // Use searchVector directly for blog posts
    hasSearchVector: true,
    tsFields: {
      title: 'A',
      summary: 'B',
      content: 'C'
    },
    statusField: 'status',
    validStatus: 'published'
  },
  skills: {
    model: Skill,
    fields: ['name', 'description', 'category'],
    titleField: 'name',
    dateField: 'created_at',
    tsFields: {
      name: 'A',
      category: 'B',
      description: 'C'
    }
  },
  experience: {
    model: Experience,
    fields: ['title', 'company', 'description', 'technologies'],
    titleField: 'title',
    dateField: 'start_date',
    tsFields: {
      title: 'A',
      company: 'A',
      description: 'B',
      technologies: 'C'
    }
  },
  education: {
    model: Education,
    fields: ['institution', 'degree', 'field_of_study', 'description'],
    titleField: 'institution',
    dateField: 'start_date',
    tsFields: {
      institution: 'A',
      degree: 'A',
      field_of_study: 'B',
      description: 'C'
    }
  },
  testimonials: {
    model: Testimonial,
    fields: ['author_name', 'company', 'content'],
    titleField: 'author_name',
    dateField: 'created_at',
    tsFields: {
      author_name: 'A',
      company: 'B',
      content: 'C'
    },
    statusField: 'status',
    validStatus: 'approved'
  }
};

/**
 * Cache key prefix for search results
 */
exports.SEARCH_CACHE_KEY_PREFIX = 'search:';

/**
 * Get content type priority for search results
 * Lower numbers appear higher in results
 */
exports.getContentTypePriority = (contentType) => {
  const priorities = {
    blog: 1,
    projects: 2,
    experience: 3,
    skills: 4,
    education: 5,
    testimonials: 6
  };
  
  return priorities[contentType] || 10;
}; 