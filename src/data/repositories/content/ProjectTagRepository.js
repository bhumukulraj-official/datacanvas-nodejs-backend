const BaseRepository = require('../BaseRepository');
const { ProjectTag, Tag, Project } = require('../../models');

class ProjectTagRepository extends BaseRepository {
  constructor() {
    super(ProjectTag);
  }

  async getTagsByProjectId(projectId) {
    return this.model.findAll({
      where: { project_id: projectId },
      include: [{ model: Tag }]
    });
  }

  async getProjectsByTagId(tagId) {
    return this.model.findAll({
      where: { tag_id: tagId },
      include: [{ model: Project }]
    });
  }

  async addTagToProject(projectId, tagId) {
    return this.model.create({
      project_id: projectId,
      tag_id: tagId
    });
  }

  async removeTagFromProject(projectId, tagId) {
    return this.model.destroy({
      where: {
        project_id: projectId,
        tag_id: tagId
      }
    });
  }

  async syncProjectTags(projectId, tagIds) {
    await this.model.destroy({
      where: { project_id: projectId }
    });

    return Promise.all(
      tagIds.map(tagId => 
        this.model.create({ project_id: projectId, tag_id: tagId })
      )
    );
  }
}

module.exports = ProjectTagRepository; 