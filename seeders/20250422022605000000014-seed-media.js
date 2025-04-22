'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('media', [
      {
        user_id: 1,
        url: 'https://example.com/uploads/images/portfolio-project-1.jpg',
        storage_provider: 's3',
        storage_bucket: 'datacanvas-media',
        storage_path: 'users/1/images/portfolio-project-1.jpg',
        type: 'image',
        mime_type: 'image/jpeg',
        file_extension: 'jpg',
        size: 1024000, // 1MB
        filename: 'portfolio-project-1.jpg',
        description: 'Portfolio project screenshot showing homepage design',
        visibility: 'public',
        metadata: JSON.stringify({
          width: 1920,
          height: 1080,
          dpi: 72,
          color_space: 'RGB',
          camera: 'Screen Capture'
        }),
        status: 'ready',
        optimized_url: 'https://example.com/uploads/images/optimized/portfolio-project-1.jpg',
        optimized_size: 512000, // 500KB
        optimization_metadata: JSON.stringify({
          width: 1280,
          height: 720,
          quality: 80,
          format: 'jpeg'
        }),
        thumbnail_url: 'https://example.com/uploads/images/thumbnails/portfolio-project-1.jpg',
        uploaded_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        user_id: 2,
        url: 'https://example.com/uploads/documents/project-proposal.pdf',
        storage_provider: 's3',
        storage_bucket: 'datacanvas-media',
        storage_path: 'users/2/documents/project-proposal.pdf',
        type: 'document',
        mime_type: 'application/pdf',
        file_extension: 'pdf',
        size: 2048000, // 2MB
        filename: 'project-proposal.pdf',
        description: 'Project proposal document for client review',
        visibility: 'private',
        metadata: JSON.stringify({
          pages: 12,
          author: 'Jane Smith',
          created: '2023-05-15T14:30:00Z',
          software: 'Adobe Acrobat'
        }),
        status: 'ready',
        optimized_url: null,
        optimized_size: null,
        optimization_metadata: JSON.stringify({}),
        thumbnail_url: 'https://example.com/uploads/documents/thumbnails/project-proposal.jpg',
        uploaded_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        deleted_at: null
      },
      {
        user_id: 3,
        url: 'https://example.com/uploads/video/product-demo.mp4',
        storage_provider: 'cloudinary',
        storage_bucket: 'datacanvas-videos',
        storage_path: 'users/3/videos/product-demo.mp4',
        type: 'video',
        mime_type: 'video/mp4',
        file_extension: 'mp4',
        size: 25600000, // 25MB
        filename: 'product-demo.mp4',
        description: 'Product demonstration video for marketing',
        visibility: 'public',
        metadata: JSON.stringify({
          duration: 180, // 3 minutes
          width: 1920,
          height: 1080,
          fps: 30,
          codec: 'h264'
        }),
        status: 'ready',
        optimized_url: 'https://example.com/uploads/video/optimized/product-demo.mp4',
        optimized_size: 12800000, // 12.5MB
        optimization_metadata: JSON.stringify({
          duration: 180,
          width: 1280,
          height: 720,
          fps: 30,
          codec: 'h264',
          bitrate: '2Mbps'
        }),
        thumbnail_url: 'https://example.com/uploads/video/thumbnails/product-demo.jpg',
        uploaded_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        deleted_at: null
      },
      {
        user_id: 1,
        url: 'https://example.com/uploads/images/logo-design.png',
        storage_provider: 's3',
        storage_bucket: 'datacanvas-media',
        storage_path: 'users/1/images/logo-design.png',
        type: 'image',
        mime_type: 'image/png',
        file_extension: 'png',
        size: 512000, // 500KB
        filename: 'logo-design.png',
        description: 'Company logo design with transparent background',
        visibility: 'public',
        metadata: JSON.stringify({
          width: 800,
          height: 600,
          dpi: 300,
          color_space: 'RGB',
          has_transparency: true
        }),
        status: 'ready',
        optimized_url: 'https://example.com/uploads/images/optimized/logo-design.png',
        optimized_size: 256000, // 250KB
        optimization_metadata: JSON.stringify({
          width: 800,
          height: 600,
          quality: 90,
          format: 'png',
          compression_level: 9
        }),
        thumbnail_url: 'https://example.com/uploads/images/thumbnails/logo-design.jpg',
        uploaded_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        updated_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        deleted_at: null
      },
      {
        user_id: 4,
        url: 'https://example.com/uploads/audio/podcast-episode.mp3',
        storage_provider: 's3',
        storage_bucket: 'datacanvas-media',
        storage_path: 'users/4/audio/podcast-episode.mp3',
        type: 'audio',
        mime_type: 'audio/mpeg',
        file_extension: 'mp3',
        size: 10240000, // 10MB
        filename: 'podcast-episode.mp3',
        description: 'Tech podcast episode about web development',
        visibility: 'public',
        metadata: JSON.stringify({
          duration: 1800, // 30 minutes
          bitrate: '192kbps',
          channels: 2,
          sample_rate: 44100
        }),
        status: 'ready',
        optimized_url: 'https://example.com/uploads/audio/optimized/podcast-episode.mp3',
        optimized_size: 5120000, // 5MB
        optimization_metadata: JSON.stringify({
          duration: 1800,
          bitrate: '96kbps',
          channels: 2,
          sample_rate: 44100
        }),
        thumbnail_url: 'https://example.com/uploads/audio/thumbnails/podcast-episode.jpg',
        uploaded_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        deleted_at: null
      },
      {
        user_id: 5,
        url: 'https://example.com/uploads/archives/project-source.zip',
        storage_provider: 'local',
        storage_bucket: null,
        storage_path: 'uploads/users/5/archives/project-source.zip',
        type: 'document',
        mime_type: 'application/zip',
        file_extension: 'zip',
        size: 15360000, // 15MB
        filename: 'project-source.zip',
        description: 'Source code archive for project',
        visibility: 'private',
        metadata: JSON.stringify({
          files: 42,
          compressed_ratio: 0.65,
          password_protected: false
        }),
        status: 'ready',
        optimized_url: null,
        optimized_size: null,
        optimization_metadata: JSON.stringify({}),
        thumbnail_url: 'https://example.com/uploads/archives/thumbnails/zip-icon.png',
        uploaded_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        deleted_at: null
      },
      {
        user_id: 2,
        url: 'https://example.com/uploads/images/blog-featured-image.jpg',
        storage_provider: 'cloudinary',
        storage_bucket: 'datacanvas-images',
        storage_path: 'users/2/images/blog-featured-image.jpg',
        type: 'image',
        mime_type: 'image/jpeg',
        file_extension: 'jpg',
        size: 2048000, // 2MB
        filename: 'blog-featured-image.jpg',
        description: 'Featured image for blog post about UX design',
        visibility: 'public',
        metadata: JSON.stringify({
          width: 2400,
          height: 1600,
          dpi: 300,
          color_space: 'RGB',
          camera: 'Canon EOS R5',
          exposure: '1/125s',
          aperture: 'f/2.8',
          iso: 100
        }),
        status: 'ready',
        optimized_url: 'https://example.com/uploads/images/optimized/blog-featured-image.jpg',
        optimized_size: 1024000, // 1MB
        optimization_metadata: JSON.stringify({
          width: 1200,
          height: 800,
          quality: 85,
          format: 'jpeg'
        }),
        thumbnail_url: 'https://example.com/uploads/images/thumbnails/blog-featured-image.jpg',
        uploaded_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        deleted_at: null
      },
      {
        user_id: 3,
        url: 'https://example.com/uploads/documents/user-manual.docx',
        storage_provider: 's3',
        storage_bucket: 'datacanvas-media',
        storage_path: 'users/3/documents/user-manual.docx',
        type: 'document',
        mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        file_extension: 'docx',
        size: 3072000, // 3MB
        filename: 'user-manual.docx',
        description: 'User manual for software application',
        visibility: 'public',
        metadata: JSON.stringify({
          pages: 45,
          words: 12500,
          author: 'John Doe',
          created: '2023-06-20T10:15:00Z',
          software: 'Microsoft Word'
        }),
        status: 'processing',
        optimized_url: null,
        optimized_size: null,
        optimization_metadata: JSON.stringify({}),
        thumbnail_url: null,
        uploaded_at: new Date(), // Today
        created_at: new Date(), // Today
        updated_at: new Date(), // Today
        deleted_at: null
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('media', null, {});
  }
}; 