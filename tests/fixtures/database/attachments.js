/**
 * Attachment fixtures for testing
 */
module.exports = [
  {
    id: '1',
    uuid: '123e4567-e89b-12d3-a456-c26614174800',
    message_id: '6', // Message from Regular user about CMS design
    file_name: 'cms_design_mockup.pdf',
    file_size: 2458632, // Size in bytes
    file_type: 'application/pdf',
    file_path: '/uploads/attachments/cms_design_mockup.pdf',
    thumbnail_path: '/uploads/thumbnails/cms_design_mockup.jpg',
    created_at: new Date('2023-02-10T16:45:00'),
    updated_at: new Date('2023-02-10T16:45:00'),
    is_deleted: false,
    uploaded_by: '2' // Regular user
  },
  {
    id: '2',
    uuid: '223e4567-e89b-12d3-a456-c26614174801',
    message_id: '6', // Message from Regular user about CMS design
    file_name: 'component_specs.xlsx',
    file_size: 1253698, // Size in bytes
    file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    file_path: '/uploads/attachments/component_specs.xlsx',
    thumbnail_path: null, // No thumbnail for spreadsheet
    created_at: new Date('2023-02-10T16:45:00'),
    updated_at: new Date('2023-02-10T16:45:00'),
    is_deleted: false,
    uploaded_by: '2' // Regular user
  },
  {
    id: '3',
    uuid: '323e4567-e89b-12d3-a456-c26614174802',
    message_id: '6', // Message from Regular user about CMS design
    file_name: 'design_inspiration.jpg',
    file_size: 854712, // Size in bytes
    file_type: 'image/jpeg',
    file_path: '/uploads/attachments/design_inspiration.jpg',
    thumbnail_path: '/uploads/thumbnails/design_inspiration_thumb.jpg',
    created_at: new Date('2023-02-10T16:45:00'),
    updated_at: new Date('2023-02-10T16:45:00'),
    is_deleted: false,
    uploaded_by: '2' // Regular user
  }
]; 