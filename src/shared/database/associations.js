// Import all models
const User = require('../../modules/auth/models/User');
const RefreshToken = require('../../modules/auth/models/RefreshToken');
const EmailVerificationToken = require('../../modules/auth/models/EmailVerificationToken');
const PasswordResetToken = require('../../modules/auth/models/PasswordResetToken');
const Profile = require('../../modules/profile/models/Profile');
const Project = require('../../modules/projects/models/Project');
const Skill = require('../../modules/profile/models/Skill');
const Experience = require('../../modules/profile/models/Experience');
const Education = require('../../modules/profile/models/Education');
const Testimonial = require('../../modules/profile/models/Testimonial');
const Media = require('../../modules/media/models/Media');
const BlogCategory = require('../../modules/blog/models/BlogCategory');
const BlogTag = require('../../modules/blog/models/BlogTag');
const BlogPost = require('../../modules/blog/models/BlogPost');
const BlogPostTag = require('../../modules/blog/models/BlogPostTag');
const ContactSubmission = require('../../modules/contact/models/ContactSubmission');
const Setting = require('../../modules/settings/models/Setting');
const Notification = require('../../modules/notifications/models/Notification');
const AuditLog = require('../../modules/security/models/AuditLog');
const ApiKey = require('../../modules/security/models/ApiKey');
const RateLimit = require('../../modules/security/models/RateLimit');
const WebSocketConnection = require('../../modules/websocket/models/WebSocketConnection');
const WebSocketMessage = require('../../modules/websocket/models/WebSocketMessage');

const setupAssociations = () => {
  // User associations
  User.hasOne(Profile, { foreignKey: 'user_id', as: 'profile' });
  User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens' });
  User.hasMany(EmailVerificationToken, { foreignKey: 'user_id', as: 'emailVerificationTokens' });
  User.hasMany(PasswordResetToken, { foreignKey: 'user_id', as: 'passwordResetTokens' });
  User.hasMany(Project, { foreignKey: 'user_id', as: 'projects' });
  User.hasMany(Skill, { foreignKey: 'user_id', as: 'skills' });
  User.hasMany(Experience, { foreignKey: 'user_id', as: 'experiences' });
  User.hasMany(Education, { foreignKey: 'user_id', as: 'education' });
  User.hasMany(Testimonial, { foreignKey: 'user_id', as: 'testimonials' });
  User.hasMany(Media, { foreignKey: 'user_id', as: 'media' });
  User.hasMany(BlogPost, { foreignKey: 'author_id', as: 'blogPosts' });
  User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
  User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
  User.hasMany(RateLimit, { foreignKey: 'user_id', as: 'rateLimits' });
  User.hasMany(WebSocketConnection, { foreignKey: 'user_id', as: 'webSocketConnections' });
  User.hasMany(ContactSubmission, { foreignKey: 'assigned_to', as: 'assignedContactSubmissions' });

  // Profile associations
  Profile.belongsTo(User, { foreignKey: 'user_id' });

  // Project associations
  Project.belongsTo(User, { foreignKey: 'user_id' });

  // Skill associations
  Skill.belongsTo(User, { foreignKey: 'user_id' });

  // Experience associations
  Experience.belongsTo(User, { foreignKey: 'user_id' });

  // Education associations
  Education.belongsTo(User, { foreignKey: 'user_id' });

  // Testimonial associations
  Testimonial.belongsTo(User, { foreignKey: 'user_id' });

  // Media associations
  Media.belongsTo(User, { foreignKey: 'user_id' });

  // Blog associations
  BlogPost.belongsTo(User, { foreignKey: 'author_id', as: 'author' });
  BlogPost.belongsTo(BlogCategory, { foreignKey: 'category_id', as: 'category' });
  BlogPost.belongsToMany(BlogTag, { through: BlogPostTag, foreignKey: 'post_id', otherKey: 'tag_id', as: 'tags' });
  BlogTag.belongsToMany(BlogPost, { through: BlogPostTag, foreignKey: 'tag_id', otherKey: 'post_id', as: 'posts' });
  BlogCategory.hasMany(BlogPost, { foreignKey: 'category_id', as: 'posts' });

  // Contact associations
  ContactSubmission.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignedUser' });

  // Notification associations
  Notification.belongsTo(User, { foreignKey: 'user_id' });

  // Audit Log associations
  AuditLog.belongsTo(User, { foreignKey: 'user_id' });

  // Rate Limit associations
  RateLimit.belongsTo(User, { foreignKey: 'user_id' });

  // WebSocket associations
  WebSocketConnection.belongsTo(User, { foreignKey: 'user_id' });
  WebSocketMessage.belongsTo(User, { foreignKey: 'user_id' });
  WebSocketMessage.belongsTo(WebSocketConnection, { foreignKey: 'connection_id', targetKey: 'connection_id' });
  WebSocketConnection.hasMany(WebSocketMessage, { foreignKey: 'connection_id', sourceKey: 'connection_id', as: 'messages' });

  // Authentication associations
  RefreshToken.belongsTo(User, { foreignKey: 'user_id' });
  EmailVerificationToken.belongsTo(User, { foreignKey: 'user_id' });
  PasswordResetToken.belongsTo(User, { foreignKey: 'user_id' });
};

module.exports = setupAssociations; 