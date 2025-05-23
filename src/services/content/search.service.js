const { SearchIndexRepository } = require('../../../data/repositories/content');
const { ProjectRepository } = require('../../../data/repositories/content');

class SearchService {
  constructor() {
    this.searchRepo = new SearchIndexRepository();
    this.projectRepo = new ProjectRepository();
  }

  async searchProjects(query) {
    return this.searchRepo.search(query, ['project']);
  }

  async indexProject(projectId) {
    const project = await this.projectRepo.findById(projectId, {
      include: ['tags', 'skills']
    });
    
    const searchVector = [
      project.title,
      project.description,
      project.tags.map(t => t.name).join(' '),
      project.skills.map(s => s.name).join(' ')
    ].join(' ');
    
    return this.searchRepo.updateSearchVector(
      'project',
      projectId,
      searchVector,
      { category: project.category }
    );
  }
}

module.exports = new SearchService(); 