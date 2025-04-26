/**
 * Blog controllers index file
 * Exports blog controllers
 */

const postController = require('./post.controller');
const commentController = require('./comment.controller');
const tagController = require('./tag.controller');
const categoryController = require('./category.controller');

module.exports = {
  postController,
  commentController,
  tagController,
  categoryController
}; 