'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPasswords = await Promise.all([
      bcrypt.hash('Password123!', salt),
      bcrypt.hash('AdminPass456!', salt),
      bcrypt.hash('EditorPass789!', salt),
      bcrypt.hash('UserPass321!', salt),
      bcrypt.hash('SecurePass987!', salt),
      bcrypt.hash('ContentPass654!', salt),
      bcrypt.hash('StrongPass135!', salt),
      bcrypt.hash('SafePass246!', salt)
    ]);

    return queryInterface.bulkInsert('users', [
      {
        username: 'admin_user',
        email: 'admin@example.com',
        password: hashedPasswords[0],
        password_salt: salt,
        first_name: 'Admin',
        last_name: 'User',
        bio: 'Site administrator with full access privileges',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        role: 'admin',
        status: 'active',
        is_email_verified: true,
        last_login: new Date(),
        login_attempts: 0,
        locked_until: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        username: 'editor_main',
        email: 'editor@example.com',
        password: hashedPasswords[1],
        password_salt: salt,
        first_name: 'Editor',
        last_name: 'Main',
        bio: 'Main content editor for the blog',
        avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
        role: 'editor',
        status: 'active',
        is_email_verified: true,
        last_login: new Date(),
        login_attempts: 0,
        locked_until: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        username: 'writer_one',
        email: 'writer1@example.com',
        password: hashedPasswords[2],
        password_salt: salt,
        first_name: 'Writer',
        last_name: 'One',
        bio: 'Technology content writer',
        avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
        role: 'editor',
        status: 'active',
        is_email_verified: true,
        last_login: new Date(),
        login_attempts: 0,
        locked_until: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        username: 'regular_user',
        email: 'user@example.com',
        password: hashedPasswords[3],
        password_salt: salt,
        first_name: 'Regular',
        last_name: 'User',
        bio: 'Blog reader and commenter',
        avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
        role: 'user',
        status: 'active',
        is_email_verified: true,
        last_login: new Date(),
        login_attempts: 0,
        locked_until: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        username: 'content_creator',
        email: 'creator@example.com',
        password: hashedPasswords[4],
        password_salt: salt,
        first_name: 'Content',
        last_name: 'Creator',
        bio: 'Creates lifestyle content',
        avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
        role: 'editor',
        status: 'active',
        is_email_verified: true,
        last_login: new Date(),
        login_attempts: 0,
        locked_until: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        username: 'inactive_user',
        email: 'inactive@example.com',
        password: hashedPasswords[5],
        password_salt: salt,
        first_name: 'Inactive',
        last_name: 'User',
        bio: 'This account is currently inactive',
        avatar: 'https://randomuser.me/api/portraits/women/6.jpg',
        role: 'user',
        status: 'inactive',
        is_email_verified: false,
        last_login: null,
        login_attempts: 0,
        locked_until: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        username: 'suspended_user',
        email: 'suspended@example.com',
        password: hashedPasswords[6],
        password_salt: salt,
        first_name: 'Suspended',
        last_name: 'User',
        bio: 'This account has been suspended',
        avatar: 'https://randomuser.me/api/portraits/men/7.jpg',
        role: 'user',
        status: 'suspended',
        is_email_verified: true,
        last_login: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        login_attempts: 3,
        locked_until: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        username: 'deleted_user',
        email: 'deleted@example.com',
        password: hashedPasswords[7],
        password_salt: salt,
        first_name: 'Deleted',
        last_name: 'User',
        bio: 'This account has been deleted',
        avatar: 'https://randomuser.me/api/portraits/women/8.jpg',
        role: 'user',
        status: 'banned',
        is_email_verified: true,
        last_login: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        login_attempts: 0,
        locked_until: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: new Date() // This is a soft-deleted user
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('users', null, {});
  }
}; 