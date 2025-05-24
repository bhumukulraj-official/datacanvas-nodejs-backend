const logger = require('../../../utils/logger.util');

const ProfileRepository = require('./ProfileRepository');
const ProjectRepository = require('./ProjectRepository');
const ProjectClientAssignmentRepository = require('./ProjectClientAssignmentRepository');
const ProjectFileRepository = require('./ProjectFileRepository');
const FileUploadRepository = require('./FileUploadRepository');
const TagRepository = require('./TagRepository');
const SkillRepository = require('./SkillRepository');
const SearchIndexRepository = require('./SearchIndexRepository');
const ProjectStatusRepository = require('./ProjectStatusRepository');
const ProjectTagRepository = require('./ProjectTagRepository');
const ProjectUpdateRepository = require('./ProjectUpdateRepository');
const ProjectVisibilityRepository = require('./ProjectVisibilityRepository');
const StorageProviderRepository = require('./StorageProviderRepository');
const ClientProjectPermissionRepository = require('./ClientProjectPermissionRepository');

logger.info('Loading content repositories...');

module.exports = {
  ProfileRepository,
  ProjectRepository,
  ProjectClientAssignmentRepository,
  ProjectFileRepository,
  FileUploadRepository,
  TagRepository,
  SkillRepository,
  SearchIndexRepository,
  ProjectStatusRepository,
  ProjectTagRepository,
  ProjectUpdateRepository,
  ProjectVisibilityRepository,
  StorageProviderRepository,
  ClientProjectPermissionRepository
};