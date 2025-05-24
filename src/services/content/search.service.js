const { SearchIndexRepository } = require('../../data/repositories/content');
const { ProjectRepository } = require('../../data/repositories/content');
const { CustomError } = require('../../utils/error.util');
const logger = require('../../utils/logger.util');

class SearchService {
  constructor() {
    try {
      this.searchIndexRepo = new SearchIndexRepository();
      this.projectRepo = new ProjectRepository();
      logger.info('SearchService initialized with repositories');
    } catch (error) {
      logger.error('Error initializing SearchService repositories:', error);
      throw error;
    }
  }

  async searchProjects(query) {
    try {
      logger.debug(`Searching projects for query: ${query}`);
      return await this.searchIndexRepo.search(query, ['project']);
    } catch (error) {
      logger.error('Search failed:', error);
      throw new CustomError('Search operation failed', 500);
    }
  }

  async indexProject(projectId) {
    try {
      logger.info(`Indexing project ID: ${projectId}`);
      const project = await this.projectRepo.findById(projectId, {
        include: ['tags', 'skills']
      });
      
      const searchVector = [
        project.title,
        project.description,
        project.tags.map(t => t.name).join(' '),
        project.skills.map(s => s.name).join(' ')
      ].join(' ');
      
      return this.searchIndexRepo.updateSearchVector(
        'project',
        projectId,
        searchVector,
        { category: project.category }
      );
    } catch (error) {
      logger.error('Indexing failed:', error);
      throw new CustomError('Indexing failed', 500);
    }
  }
}

module.exports = new SearchService(); 