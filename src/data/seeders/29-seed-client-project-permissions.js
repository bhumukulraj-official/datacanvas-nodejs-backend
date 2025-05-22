'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Get project client assignments
      const [assignments] = await queryInterface.sequelize.query(
        "SELECT id, project_id, client_id FROM content.project_client_assignments",
        { transaction: t }
      );

      if (assignments.length === 0) {
        console.log('No project client assignments found. Skipping permissions creation.');
        return;
      }

      // Create permissions for each assignment with varying levels of access
      for (let i = 0; i < assignments.length; i++) {
        const assignment = assignments[i];
        
        // Define different permission sets based on the assignment index
        let canViewFiles = true;
        let canViewUpdates = true;
        let canDownload = true;
        let canMessage = true;
        let canViewInvoices = i % 2 === 0; // Every other client can view invoices
        let canMakePayments = i % 3 === 0; // Every third client can make payments
        let canInviteCollaborators = i % 4 === 0; // Every fourth client can invite collaborators
        
        // Define custom permissions based on client
        let customPermissions = {};
        
        if (i % 5 === 0) {
          customPermissions = { canExportReports: true, canProvideTestimonial: true };
        } else if (i % 4 === 0) {
          customPermissions = { canViewAnalytics: true };
        } else if (i % 3 === 0) {
          customPermissions = { canRequestRevisions: true, maxRevisions: 3 };
        } else if (i % 2 === 0) {
          customPermissions = { canViewSourceCode: false };
        }

        // Insert permissions for this assignment
        await queryInterface.sequelize.query(`
          INSERT INTO content.client_project_permissions (
            assignment_id, can_view_files, can_view_updates, can_download, 
            can_message, can_view_invoices, can_make_payments, 
            can_invite_collaborators, custom_permissions
          ) VALUES (
            ${assignment.id}, 
            ${canViewFiles}, 
            ${canViewUpdates}, 
            ${canDownload}, 
            ${canMessage}, 
            ${canViewInvoices}, 
            ${canMakePayments}, 
            ${canInviteCollaborators}, 
            '${JSON.stringify(customPermissions)}'
          );
        `, { transaction: t });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM content.client_project_permissions;
      `, { transaction: t });
    });
  }
}; 