'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create contact submission status enum if not exists
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE contact_submission_status AS ENUM ('new', 'read', 'replied', 'spam', 'archived');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.createTable('contact_submissions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      subject: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: 'contact_submission_status',
        defaultValue: 'new',
        allowNull: false,
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      recaptcha_token: {
        type: Sequelize.STRING(1000),
        allowNull: true,
      },
      recaptcha_score: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
      },
      assigned_to: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      replied_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      reply_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      }
    });

    // Add indexes
    await queryInterface.addIndex('contact_submissions', ["status"], { 
      name: 'idx_contact_submissions_status',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('contact_submissions', ["email"], { 
      name: 'idx_contact_submissions_email',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('contact_submissions', ["assigned_to"], { 
      name: 'idx_contact_submissions_assigned_to',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('contact_submissions', ["created_at"], { 
      name: 'idx_contact_submissions_created_at',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('contact_submissions', ["replied_at"], { 
      name: 'idx_contact_submissions_replied_at',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('contact_submissions', ["deleted_at"], { 
      name: 'idx_contact_submissions_deleted_at' 
    });

    // Add constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE contact_submissions
      ADD CONSTRAINT check_name_length
      CHECK (char_length(name) >= 2 AND char_length(name) <= 100);
      
      ALTER TABLE contact_submissions
      ADD CONSTRAINT check_email_format
      CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$');
      
      ALTER TABLE contact_submissions
      ADD CONSTRAINT check_subject_length
      CHECK (char_length(subject) >= 3 AND char_length(subject) <= 200);
      
      ALTER TABLE contact_submissions
      ADD CONSTRAINT check_message_length
      CHECK (char_length(message) >= 10);
      
      ALTER TABLE contact_submissions
      ADD CONSTRAINT check_recaptcha_score
      CHECK (recaptcha_score IS NULL OR (recaptcha_score >= 0.0 AND recaptcha_score <= 1.0));
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('contact_submissions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS contact_submission_status;');
  }
};
