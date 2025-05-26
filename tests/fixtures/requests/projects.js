/**
 * Project request fixtures for testing
 */
module.exports = {
  // Create project requests
  create: {
    valid: {
      title: 'CRM System',
      description: 'A customer relationship management system with advanced reporting features.',
      client_id: '3', // Client user ID
      start_date: '2023-06-01',
      estimated_end_date: '2023-09-30',
      budget: 15000.00,
      status: 'PLANNING',
      is_public: false,
      skills: ['React', 'Node.js', 'PostgreSQL'],
      team_members: ['1', '2'], // Admin and Regular user IDs
      custom_fields: {
        industry: 'SaaS',
        priority: 'High'
      }
    },
    missingRequiredFields: {
      description: 'A customer relationship management system with advanced reporting features.',
      client_id: '3', // Client user ID
      start_date: '2023-06-01'
      // Missing title and other required fields
    },
    invalidDates: {
      title: 'CRM System',
      description: 'A customer relationship management system with advanced reporting features.',
      client_id: '3', // Client user ID
      start_date: '2023-10-01', // Start date after estimated end date
      estimated_end_date: '2023-09-30',
      budget: 15000.00,
      status: 'PLANNING',
      is_public: false
    },
    invalidStatus: {
      title: 'CRM System',
      description: 'A customer relationship management system with advanced reporting features.',
      client_id: '3', // Client user ID
      start_date: '2023-06-01',
      estimated_end_date: '2023-09-30',
      budget: 15000.00,
      status: 'INVALID_STATUS', // Invalid status
      is_public: false
    },
    invalidTeamMembers: {
      title: 'CRM System',
      description: 'A customer relationship management system with advanced reporting features.',
      client_id: '3', // Client user ID
      start_date: '2023-06-01',
      estimated_end_date: '2023-09-30',
      budget: 15000.00,
      status: 'PLANNING',
      is_public: false,
      team_members: ['99', '100'] // Non-existent user IDs
    }
  },

  // Update project requests
  update: {
    valid: {
      id: '1', // E-commerce website project
      title: 'E-commerce Website Platform',
      description: 'Updated description with additional features for the e-commerce website.',
      estimated_end_date: '2023-08-15', // Extended deadline
      budget: 12000.00, // Increased budget
      status: 'IN_PROGRESS',
      team_members: ['1', '2', '4'] // Added another team member
    },
    statusChange: {
      id: '1',
      status: 'COMPLETED',
      completion_date: '2023-07-30'
    },
    invalidStatusTransition: {
      id: '1',
      status: 'PLANNING' // Cannot go back from IN_PROGRESS to PLANNING
    },
    inconsistentCompletionDate: {
      id: '1',
      status: 'COMPLETED',
      completion_date: null // Completed status should have a completion date
    }
  },

  // Project query parameters
  query: {
    allProjects: {},
    filterByClient: {
      client_id: '3' // Client user ID
    },
    filterByStatus: {
      status: 'IN_PROGRESS'
    },
    filterByDateRange: {
      start_date_from: '2023-01-01',
      start_date_to: '2023-06-30'
    },
    filterByTeamMember: {
      team_member_id: '2' // Regular user ID
    },
    filterBySkill: {
      skills: ['React', 'Node.js']
    },
    pagination: {
      page: 1,
      limit: 10
    },
    sorting: {
      sort_by: 'start_date',
      sort_direction: 'desc'
    },
    complexFilter: {
      client_id: '3',
      status: 'IN_PROGRESS',
      start_date_from: '2023-01-01',
      team_member_id: '1',
      skills: ['React'],
      page: 1,
      limit: 10,
      sort_by: 'budget',
      sort_direction: 'desc'
    },
    publicProjects: {
      is_public: true
    }
  },

  // Project metrics requests
  metrics: {
    valid: {
      id: '1', // E-commerce website project
      start_date: '2023-01-01',
      end_date: '2023-06-30',
      metrics: ['revenue', 'hours_logged', 'milestone_completion']
    },
    invalidDateRange: {
      id: '1',
      start_date: '2023-06-30', // Start date after end date
      end_date: '2023-01-01',
      metrics: ['revenue']
    },
    invalidMetrics: {
      id: '1',
      start_date: '2023-01-01',
      end_date: '2023-06-30',
      metrics: ['invalid_metric'] // Invalid metric type
    }
  },

  // Project task requests
  tasks: {
    create: {
      valid: {
        project_id: '1', // E-commerce website project
        title: 'Implement shopping cart functionality',
        description: 'Create shopping cart with add, remove, and update quantity features',
        assigned_to: '2', // Regular user ID
        due_date: '2023-07-15',
        priority: 'HIGH',
        status: 'TO_DO',
        estimated_hours: 16
      },
      missingTitle: {
        project_id: '1',
        description: 'Create shopping cart with add, remove, and update quantity features',
        assigned_to: '2',
        due_date: '2023-07-15',
        priority: 'HIGH',
        status: 'TO_DO'
      },
      invalidPriority: {
        project_id: '1',
        title: 'Implement shopping cart functionality',
        description: 'Create shopping cart with add, remove, and update quantity features',
        assigned_to: '2',
        due_date: '2023-07-15',
        priority: 'INVALID_PRIORITY', // Invalid priority
        status: 'TO_DO'
      }
    },
    update: {
      valid: {
        id: '5', // Existing task ID
        status: 'IN_PROGRESS',
        actual_hours: 4.5,
        comments: 'Started implementation of the shopping cart component'
      },
      complete: {
        id: '5',
        status: 'COMPLETED',
        actual_hours: 18.5,
        completion_date: '2023-07-14'
      }
    }
  },

  // Project milestone requests
  milestones: {
    create: {
      valid: {
        project_id: '1', // E-commerce website project
        title: 'Backend API Completion',
        description: 'All REST APIs for the e-commerce platform are completed and documented',
        due_date: '2023-07-30',
        status: 'PENDING',
        is_billable: true,
        amount: 3000.00
      }
    },
    update: {
      valid: {
        id: '3', // Existing milestone ID
        status: 'COMPLETED',
        completion_date: '2023-07-25',
        comments: 'All APIs completed and documented with Swagger'
      }
    }
  }
}; 