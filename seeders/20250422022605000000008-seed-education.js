'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('education', [
      {
        user_id: 1, // admin_user
        institution: 'Stanford University',
        degree: 'Master of Science',
        field_of_study: 'Computer Science',
        start_date: '2015-09-01',
        end_date: '2017-05-30',
        is_current: false,
        grade: '3.9/4.0',
        activities: 'Artificial Intelligence Research Group, Web Development Club, Hackathons',
        description: 'Specialized in distributed systems and artificial intelligence. Thesis on scalable microservices architecture.',
        location: 'Stanford, CA',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 1, // admin_user
        institution: 'University of California, Berkeley',
        degree: 'Bachelor of Science',
        field_of_study: 'Computer Science & Engineering',
        start_date: '2011-09-01',
        end_date: '2015-05-15',
        is_current: false,
        grade: '3.8/4.0',
        activities: 'ACM Student Chapter, Programming Competitions, Chess Club',
        description: 'Core curriculum in computer science with emphasis on software engineering and data structures.',
        location: 'Berkeley, CA',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 2, // editor_main
        institution: 'Columbia University',
        degree: 'Master of Arts',
        field_of_study: 'Journalism',
        start_date: '2013-09-01',
        end_date: '2015-05-30',
        is_current: false,
        grade: 'Distinction',
        activities: 'Columbia Journalism Review, Digital Media Workshop, Writers Guild',
        description: 'Focused on digital journalism and technical writing. Thesis on effective communication of technical concepts.',
        location: 'New York, NY',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 3, // writer_one
        institution: 'Massachusetts Institute of Technology',
        degree: 'Bachelor of Science',
        field_of_study: 'Electrical Engineering & Computer Science',
        start_date: '2014-09-01',
        end_date: '2018-05-30',
        is_current: false,
        grade: '3.7/4.0',
        activities: 'EECS Club, Robotics Team, Campus Newspaper',
        description: 'Comprehensive education in electrical engineering and computer science with focus on software systems.',
        location: 'Cambridge, MA',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 4, // regular_user
        institution: 'Rhode Island School of Design',
        degree: 'Bachelor of Fine Arts',
        field_of_study: 'Graphic Design',
        start_date: '2015-09-01',
        end_date: '2019-05-15',
        is_current: false,
        grade: 'Honors',
        activities: 'Design Society, Annual Exhibition, Student Council',
        description: 'Comprehensive education in graphic design principles, typography, and digital media.',
        location: 'Providence, RI',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 5, // content_creator
        institution: 'New York University',
        degree: 'Bachelor of Arts',
        field_of_study: 'Communications',
        start_date: '2016-09-01',
        end_date: '2020-05-15',
        is_current: false,
        grade: '3.6/4.0',
        activities: 'Digital Media Club, Student Radio, Content Creation Workshop',
        description: 'Studies in mass communications, digital media production, and content marketing strategies.',
        location: 'New York, NY',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 6, // inactive_user
        institution: 'University of Chicago',
        degree: 'Master of Business Administration',
        field_of_study: 'Marketing',
        start_date: '2018-09-01',
        end_date: '2020-05-30',
        is_current: false,
        grade: '3.5/4.0',
        activities: 'Marketing Club, Case Competitions, Business Analytics Group',
        description: 'Focused on digital marketing strategies and brand management.',
        location: 'Chicago, IL',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 7, // suspended_user
        institution: 'Georgia Institute of Technology',
        degree: 'Master of Science',
        field_of_study: 'Data Science',
        start_date: '2020-09-01',
        end_date: null,
        is_current: true,
        grade: 'In Progress',
        activities: 'Data Science Association, Machine Learning Research',
        description: 'Currently pursuing advanced studies in data science and machine learning algorithms.',
        location: 'Atlanta, GA',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('education', null, {});
  }
}; 