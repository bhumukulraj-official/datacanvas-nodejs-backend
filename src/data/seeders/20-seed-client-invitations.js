'use strict';
const crypto = require('crypto');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Get admin user ID for the sender
      const [admins] = await queryInterface.sequelize.query(
        "SELECT id FROM auth.users WHERE role = 'admin'",
        { transaction: t }
      );

      // Get client user ID for accepted invitations
      const [clients] = await queryInterface.sequelize.query(
        "SELECT id FROM auth.users WHERE role = 'client'",
        { transaction: t }
      );

      if (admins.length === 0) {
        console.log('No admin users found for client invitations');
        return;
      }
      
      const adminId = admins[0].id;
      // Generate invitation tokens
      const invitationTokens = [
        crypto.randomBytes(32).toString('hex'),
        crypto.randomBytes(32).toString('hex'),
        crypto.randomBytes(32).toString('hex'),
        crypto.randomBytes(32).toString('hex')
      ];

      // Insert client invitations
      await queryInterface.sequelize.query(`
        INSERT INTO auth.client_invitations (
          uuid, email, name, invitation_token, custom_message, sender_id, 
          is_accepted, accepted_at, accepted_by_user_id, expires_at, metadata, 
          is_revoked, max_uses, used_count, created_at
        ) VALUES
          (uuid_generate_v4(), 'potential1@example.com', 'Potential Client 1', 
          '${invitationTokens[0]}', 
          'We would love to work with you on your project. Please join our platform.', 
          ${adminId}, false, NULL, NULL, 
          NOW() + INTERVAL '7 days', 
          '{"source": "contact_form", "project_interest": "Website Redesign"}', 
          false, 1, 0, NOW() - INTERVAL '2 days'),
          
          (uuid_generate_v4(), 'potential2@example.com', 'Potential Client 2', 
          '${invitationTokens[1]}', 
          'Following up on our discussion, here is your invitation to our platform.', 
          ${adminId}, false, NULL, NULL, 
          NOW() + INTERVAL '14 days', 
          '{"source": "referral", "referred_by": "Existing Client"}', 
          false, 1, 0, NOW() - INTERVAL '5 days'),
          
          (uuid_generate_v4(), '${clients[0].email || 'client1@example.com'}', '${clients[0].name || 'Client One'}', 
          '${invitationTokens[2]}', 
          'Please join our platform to collaborate on your project.', 
          ${adminId}, true, NOW() - INTERVAL '10 days', ${clients[0].id}, 
          NOW() - INTERVAL '3 days', 
          '{"source": "direct_contact"}', 
          false, 1, 1, NOW() - INTERVAL '20 days'),
          
          (uuid_generate_v4(), 'potential3@example.com', 'Potential Client 3', 
          '${invitationTokens[3]}', 
          'Invitation to collaborate on your e-commerce project.', 
          ${adminId}, false, NULL, NULL, 
          NOW() - INTERVAL '1 day', 
          '{"source": "sales_call", "project_type": "e-commerce"}', 
          true, 1, 0, NOW() - INTERVAL '15 days');
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM auth.client_invitations 
        WHERE email IN (
          'potential1@example.com', 
          'potential2@example.com', 
          'potential3@example.com'
        ) OR email IN (
          SELECT email FROM auth.users WHERE role = 'client' LIMIT 1
        );
      `, { transaction: t });
    });
  }
}; 