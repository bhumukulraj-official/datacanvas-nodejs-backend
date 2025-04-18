'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get the admin user ID
    const [adminUser] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1;`
    );
    
    if (!adminUser || !adminUser.length) return;
    const adminId = adminUser[0].id;

    // Create sample blog posts
    const blogPosts = [
      {
        user_id: adminId,
        title: 'Getting Started with React Hooks',
        slug: 'getting-started-with-react-hooks',
        summary: 'A comprehensive guide to understand and implement React Hooks in your applications',
        content: `
          <h2>Introduction to React Hooks</h2>
          <p>React Hooks were introduced in React 16.8 as a way to use state and other React features without writing a class. They enable functional components to have access to stateful logic that was previously only possible in class components.</p>
          
          <h3>Why Hooks?</h3>
          <p>Before Hooks, components that needed to manage state had to be written as classes. This led to several issues:</p>
          <ul>
            <li>Complex components became unwieldy</li>
            <li>Logic was difficult to reuse between components</li>
            <li>Classes can be confusing with 'this' binding</li>
            <li>Wrapper hell from higher-order components and render props</li>
          </ul>
          
          <h3>Basic Hooks</h3>
          <p>Let's look at the three basic hooks:</p>
          
          <h4>1. useState</h4>
          <pre><code>
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    &lt;div&gt;
      &lt;p&gt;You clicked {count} times&lt;/p&gt;
      &lt;button onClick={() => setCount(count + 1)}&gt;
        Click me
      &lt;/button&gt;
    &lt;/div&gt;
  );
}
          </code></pre>
          
          <h4>2. useEffect</h4>
          <pre><code>
import React, { useState, useEffect } from 'react';

function Example() {
  const [count, setCount] = useState(0);
  
  // Similar to componentDidMount and componentDidUpdate
  useEffect(() => {
    document.title = \`You clicked \${count} times\`;
    
    // Similar to componentWillUnmount
    return () => {
      document.title = 'React App';
    };
  }, [count]); // Only re-run if count changes
  
  return (
    &lt;div&gt;
      &lt;p&gt;You clicked {count} times&lt;/p&gt;
      &lt;button onClick={() => setCount(count + 1)}&gt;
        Click me
      &lt;/button&gt;
    &lt;/div&gt;
  );
}
          </code></pre>
          
          <h4>3. useContext</h4>
          <pre><code>
import React, { useContext } from 'react';

const ThemeContext = React.createContext('light');

function ThemedButton() {
  const theme = useContext(ThemeContext);
  
  return &lt;button className={theme}&gt;Themed Button&lt;/button&gt;;
}
          </code></pre>
          
          <h3>Additional Hooks</h3>
          <p>React provides several additional hooks for specific use cases:</p>
          <ul>
            <li><strong>useReducer</strong> - An alternative to useState for complex state logic</li>
            <li><strong>useCallback</strong> - Returns a memoized callback to optimize child components</li>
            <li><strong>useMemo</strong> - Memoizes expensive calculations so they only run when dependencies change</li>
            <li><strong>useRef</strong> - Creates a mutable reference that persists across renders</li>
            <li><strong>useLayoutEffect</strong> - Similar to useEffect, but fires synchronously after DOM mutations</li>
            <li><strong>useImperativeHandle</strong> - Customizes the instance value exposed when using ref</li>
          </ul>
          
          <h3>Creating Custom Hooks</h3>
          <p>Custom hooks let you extract component logic into reusable functions. They always start with "use" and can call other hooks.</p>
          
          <pre><code>
import { useState, useEffect } from 'react';

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return width;
}

// Usage in a component
function ResponsiveComponent() {
  const width = useWindowWidth();
  return &lt;p&gt;Window width: {width}&lt;/p&gt;;
}
          </code></pre>
          
          <h3>Conclusion</h3>
          <p>React Hooks provide a more direct API to React concepts you already know: props, state, context, refs, and lifecycle. They offer a powerful way to compose behavior in your components and simplify complex components.</p>
          
          <p>As you begin working with Hooks, remember these guidelines:</p>
          <ul>
            <li>Only call Hooks at the top level, not inside loops, conditions, or nested functions</li>
            <li>Only call Hooks from React function components or custom Hooks</li>
            <li>Use multiple useState calls for separate state variables</li>
            <li>Pass an empty array to useEffect when you only want it to run once (like componentDidMount)</li>
          </ul>
          
          <p>Happy coding with React Hooks!</p>
        `,
        thumbnail: '/uploads/blog/react-hooks-thumbnail.jpg',
        banner: '/uploads/blog/react-hooks-banner.jpg',
        status: 'published',
        featured: true,
        allow_comments: true,
        meta_title: 'Getting Started with React Hooks | Complete Guide',
        meta_description: 'Learn how to use React Hooks to manage state and side effects in functional components, with practical examples and best practices.',
        tags: JSON.stringify(['React', 'JavaScript', 'Hooks', 'Frontend', 'Web Development']),
        published_at: new Date('2023-07-15'),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: adminId,
        title: 'Building RESTful APIs with Node.js and Express',
        slug: 'building-restful-apis-with-nodejs-and-express',
        summary: 'Learn how to create scalable and maintainable RESTful APIs using Node.js and Express',
        content: `
          <h2>Introduction to RESTful APIs</h2>
          <p>RESTful APIs (Representational State Transfer) have become the standard for web services due to their simplicity, scalability, and ease of use. In this article, we'll explore how to build a robust RESTful API using Node.js and Express.</p>
          
          <h3>Setting Up the Environment</h3>
          <p>First, let's set up our project:</p>
          
          <pre><code>
mkdir api-project
cd api-project
npm init -y
npm install express mongoose cors helmet morgan dotenv
npm install --save-dev nodemon
          </code></pre>
          
          <p>Create a basic server.js file:</p>
          
          <pre><code>
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
          </code></pre>
          
          <h3>RESTful API Structure</h3>
          <p>A well-structured API follows these principles:</p>
          <ul>
            <li>Resources are identified by URLs</li>
            <li>HTTP methods define actions (GET, POST, PUT, DELETE)</li>
            <li>Response status codes indicate results</li>
            <li>Data is typically exchanged in JSON format</li>
          </ul>
          
          <h3>Connecting to MongoDB</h3>
          <pre><code>
// In server.js
const mongoose = require('mongoose');

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));
          </code></pre>
          
          <h3>Creating Models</h3>
          <p>Let's create a simple User model:</p>
          
          <pre><code>
// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);
          </code></pre>
          
          <h3>Creating Routes</h3>
          <p>Now, let's create RESTful routes for our User resource:</p>
          
          <pre><code>
// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single user
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new user
router.post('/', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    
    if (user) return res.status(400).json({ message: 'User already exists' });
    
    user = new User({
      name,
      email,
      password, // In a real app, hash this password!
    });
    
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
          </code></pre>
          
          <p>And register these routes in server.js:</p>
          
          <pre><code>
// In server.js
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);
          </code></pre>
          
          <h3>Middleware for Route Protection</h3>
          <p>To protect certain routes, we can create authentication middleware:</p>
          
          <pre><code>
// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');
  
  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  
  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
          </code></pre>
          
          <h3>Error Handling</h3>
          <p>Create a central error handler:</p>
          
          <pre><code>
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error'
  });
};

module.exports = errorHandler;
          </code></pre>
          
          <p>Add it to server.js:</p>
          
          <pre><code>
// In server.js
const errorHandler = require('./middleware/errorHandler');
// Add this after all routes
app.use(errorHandler);
          </code></pre>
          
          <h3>API Documentation</h3>
          <p>Document your API using tools like Swagger or Postman. For Swagger, install:</p>
          
          <pre><code>
npm install swagger-jsdoc swagger-ui-express
          </code></pre>
          
          <h3>Conclusion</h3>
          <p>We've built a basic RESTful API with Node.js and Express. In a production environment, you would want to add:</p>
          <ul>
            <li>Input validation with libraries like Joi or express-validator</li>
            <li>Rate limiting to prevent abuse</li>
            <li>Comprehensive test suite</li>
            <li>CI/CD pipeline</li>
            <li>Monitoring and logging</li>
          </ul>
          
          <p>RESTful APIs built with Node.js and Express provide a powerful, flexible foundation for your backend services. By following these principles, you'll create maintainable, scalable APIs that other developers will love to use.</p>
        `,
        thumbnail: '/uploads/blog/nodejs-api-thumbnail.jpg',
        banner: '/uploads/blog/nodejs-api-banner.jpg',
        status: 'published',
        featured: true,
        allow_comments: true,
        meta_title: 'Building RESTful APIs with Node.js and Express | Complete Guide',
        meta_description: 'Learn how to create robust, scalable RESTful APIs using Node.js and Express with MongoDB integration and best practices for authentication.',
        tags: JSON.stringify(['Node.js', 'Express', 'API', 'REST', 'Backend', 'MongoDB']),
        published_at: new Date('2023-06-20'),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: adminId,
        title: 'Essential CSS Grid Techniques for Modern Layouts',
        slug: 'essential-css-grid-techniques-for-modern-layouts',
        summary: 'Explore powerful CSS Grid techniques to create responsive, complex layouts with minimal code',
        content: `
          <h2>Introduction to CSS Grid</h2>
          <p>CSS Grid Layout is a two-dimensional layout system designed specifically for the web. It allows you to organize content into rows and columns and has transformed how we create web layouts.</p>
          
          <h3>Why CSS Grid?</h3>
          <p>Before Grid, we relied on float-based layouts, then flexbox came along which improved things for one-dimensional layouts. CSS Grid takes it further by offering true two-dimensional control:</p>
          <ul>
            <li>Create complex layouts with less HTML</li>
            <li>Precise control over rows and columns simultaneously</li>
            <li>Ability to place items exactly where you want them</li>
            <li>Better source order independence</li>
            <li>Simplified responsive design</li>
          </ul>
          
          <h3>Basic Grid Setup</h3>
          <p>To create a grid container, you simply set <code>display: grid</code> on the parent element:</p>
          
          <pre><code>
.container {
  display: grid;
  grid-template-columns: 200px 1fr 1fr;
  grid-template-rows: auto 300px auto;
  gap: 20px;
}
          </code></pre>
          
          <p>This creates a three-column grid where the first column is 200px wide and the other two share the remaining space equally. It also creates three rows where the middle row is fixed at 300px and the others adjust to their content. The gap property adds 20px spacing between all grid items.</p>
          
          <h3>The fr Unit</h3>
          <p>The <code>fr</code> unit is one of the most powerful features of Grid. It represents a fraction of the available space:</p>
          
          <pre><code>
.container {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 20px;
}
          </code></pre>
          
          <p>This creates a three-column layout where the middle column takes up twice as much space as the others.</p>
          
          <h3>Repeat Function</h3>
          <p>For repeated values, use the <code>repeat()</code> function:</p>
          
          <pre><code>
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  /* Same as: grid-template-columns: 1fr 1fr 1fr; */
}
          </code></pre>
          
          <p>You can mix it with other values:</p>
          
          <pre><code>
.container {
  display: grid;
  grid-template-columns: 200px repeat(2, 1fr) 200px;
  /* Creates 4 columns: 200px 1fr 1fr 200px */
}
          </code></pre>
          
          <h3>Minmax Function</h3>
          <p>The <code>minmax()</code> function sets a minimum and maximum size:</p>
          
          <pre><code>
.container {
  display: grid;
  grid-template-columns: repeat(3, minmax(200px, 1fr));
  /* Each column will be at least 200px, but will expand to share available space */
}
          </code></pre>
          
          <h3>Auto-Fit and Auto-Fill</h3>
          <p>Create responsive grids without media queries:</p>
          
          <pre><code>
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}
          </code></pre>
          
          <p>This creates as many columns as can fit in the container, each at least 250px wide. The difference between auto-fit and auto-fill:</p>
          <ul>
            <li><strong>auto-fit</strong>: Expands items to fill the available space</li>
            <li><strong>auto-fill</strong>: Keeps creating empty tracks even if items don't fill them</li>
          </ul>
          
          <h3>Grid Areas</h3>
          <p>Name areas of your grid for intuitive layout:</p>
          
          <pre><code>
.container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header header header"
    "sidebar content content content"
    "footer footer footer footer";
  gap: 20px;
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.content { grid-area: content; }
.footer { grid-area: footer; }
          </code></pre>
          
          <p>This creates a typical website layout with a full-width header and footer, and a sidebar with main content.</p>
          
          <h3>Responsive Grid Layouts</h3>
          <p>Easily change your layout at different breakpoints:</p>
          
          <pre><code>
.container {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-areas:
    "header"
    "content"
    "sidebar"
    "footer";
  gap: 20px;
}

@media (min-width: 768px) {
  .container {
    grid-template-columns: 250px 1fr;
    grid-template-areas:
      "header header"
      "sidebar content"
      "footer footer";
  }
}

@media (min-width: 1200px) {
  .container {
    grid-template-columns: 300px 1fr 250px;
    grid-template-areas:
      "header header header"
      "sidebar content related"
      "footer footer footer";
  }
}
          </code></pre>
          
          <h3>Grid Alignment</h3>
          <p>Control how items align within their grid areas:</p>
          
          <pre><code>
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 100px);
  
  /* Align all items within their grid cells */
  justify-items: center; /* horizontal alignment */
  align-items: center;   /* vertical alignment */
  
  /* Align the entire grid within the container */
  justify-content: center; /* horizontal alignment */
  align-content: center;   /* vertical alignment */
}

/* Individual item alignment */
.item-3 {
  justify-self: end;   /* horizontal alignment */
  align-self: start;   /* vertical alignment */
}
          </code></pre>
          
          <h3>Grid Item Placement</h3>
          <p>Position items precisely:</p>
          
          <pre><code>
.item {
  /* Span from column line 1 to line 3 */
  grid-column: 1 / 3;  
  
  /* Span from row line 2 to line 4 */
  grid-row: 2 / 4;
  
  /* Alternative syntax: span X tracks */
  grid-column: 1 / span 2;  /* Start at line 1 and span 2 tracks */
  grid-row: 2 / span 2;     /* Start at line 2 and span 2 tracks */
}
          </code></pre>
          
          <h3>Advanced Layout Example</h3>
          <p>Let's build a photo gallery:</p>
          
          <pre><code>
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  grid-auto-rows: 200px;
  gap: 20px;
}

.gallery img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Make some images span multiple cells */
.gallery img:nth-child(4n+1) {
  grid-column: span 2;
  grid-row: span 2;
}

.gallery img:nth-child(8n+3) {
  grid-column: span 2;
}

.gallery img:nth-child(12n+8) {
  grid-row: span 2;
}
          </code></pre>
          
          <h3>Support and Fallbacks</h3>
          <p>CSS Grid is supported in all modern browsers. For older browsers, consider:</p>
          <ul>
            <li>Feature detection with <code>@supports</code></li>
            <li>Simple fallback layouts with flexbox or floats</li>
          </ul>
          
          <pre><code>
.container {
  /* Fallback for older browsers */
  display: flex;
  flex-wrap: wrap;
}

.item {
  flex: 1 1 300px;
  margin: 10px;
}

@supports (display: grid) {
  .container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin: 0;
  }
  
  .item {
    margin: 0;
  }
}
          </code></pre>
          
          <h3>Conclusion</h3>
          <p>CSS Grid is a powerful layout tool that has revolutionized web design. By mastering its properties, you can create complex layouts that were previously difficult or impossible without resorting to hacky solutions. Combined with Flexbox for UI components, modern CSS gives you unprecedented control over your layouts.</p>
          
          <p>As you experiment with Grid, remember that it excels at page-level layout while Flexbox is often better for component-level layout. Using both together gives you the best of both worlds.</p>
        `,
        thumbnail: '/uploads/blog/css-grid-thumbnail.jpg',
        banner: '/uploads/blog/css-grid-banner.jpg',
        status: 'published',
        featured: false,
        allow_comments: true,
        meta_title: 'Essential CSS Grid Techniques for Modern Layouts | Complete Guide',
        meta_description: 'Master CSS Grid techniques to build responsive, complex web layouts with minimal code. Learn about grid templates, areas, alignment, and responsive design without media queries.',
        tags: JSON.stringify(['CSS', 'CSS Grid', 'Web Design', 'Frontend', 'Responsive Design']),
        published_at: new Date('2023-05-18'),
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('blog_posts', blogPosts, {});

    // Add blog post categories
    const [postIds] = await queryInterface.sequelize.query(
      `SELECT id FROM blog_posts WHERE user_id = '${adminId}';`
    );

    if (postIds && postIds.length > 0) {
      // Create blog categories first
      await queryInterface.bulkInsert('blog_categories', [
        { name: 'Web Development', slug: 'web-development', created_at: new Date(), updated_at: new Date() },
        { name: 'JavaScript', slug: 'javascript', created_at: new Date(), updated_at: new Date() },
        { name: 'React', slug: 'react', created_at: new Date(), updated_at: new Date() },
        { name: 'Node.js', slug: 'nodejs', created_at: new Date(), updated_at: new Date() },
        { name: 'CSS', slug: 'css', created_at: new Date(), updated_at: new Date() },
        { name: 'Frontend', slug: 'frontend', created_at: new Date(), updated_at: new Date() },
        { name: 'Backend', slug: 'backend', created_at: new Date(), updated_at: new Date() },
        { name: 'Tutorials', slug: 'tutorials', created_at: new Date(), updated_at: new Date() }
      ], {});

      // Get category IDs
      const [categories] = await queryInterface.sequelize.query(
        `SELECT id, name FROM blog_categories;`
      );

      // Create blog_post_categories relationships
      if (categories && categories.length > 0) {
        const postCategoriesRelations = [];
        
        // React Hooks: React, JavaScript, Frontend, Tutorials
        const reactPost = postIds.find(p => p.slug === 'getting-started-with-react-hooks');
        if (reactPost) {
          ['React', 'JavaScript', 'Frontend', 'Tutorials'].forEach(catName => {
            const category = categories.find(c => c.name === catName);
            if (category) {
              postCategoriesRelations.push({
                post_id: reactPost.id,
                category_id: category.id,
                created_at: new Date(),
                updated_at: new Date()
              });
            }
          });
        }
        
        // Node.js API: Node.js, Backend, Web Development, Tutorials
        const nodePost = postIds.find(p => p.slug === 'building-restful-apis-with-nodejs-and-express');
        if (nodePost) {
          ['Node.js', 'Backend', 'Web Development', 'Tutorials'].forEach(catName => {
            const category = categories.find(c => c.name === catName);
            if (category) {
              postCategoriesRelations.push({
                post_id: nodePost.id,
                category_id: category.id,
                created_at: new Date(),
                updated_at: new Date()
              });
            }
          });
        }
        
        // CSS Grid: CSS, Frontend, Web Development, Tutorials
        const cssPost = postIds.find(p => p.slug === 'essential-css-grid-techniques-for-modern-layouts');
        if (cssPost) {
          ['CSS', 'Frontend', 'Web Development', 'Tutorials'].forEach(catName => {
            const category = categories.find(c => c.name === catName);
            if (category) {
              postCategoriesRelations.push({
                post_id: cssPost.id,
                category_id: category.id,
                created_at: new Date(),
                updated_at: new Date()
              });
            }
          });
        }
        
        if (postCategoriesRelations.length > 0) {
          await queryInterface.bulkInsert('blog_post_categories', postCategoriesRelations, {});
        }
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Get the admin user ID
    const [adminUser] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1;`
    );
    
    if (adminUser && adminUser.length > 0) {
      const adminId = adminUser[0].id;
      
      // Get posts to delete related records
      const [posts] = await queryInterface.sequelize.query(
        `SELECT id FROM blog_posts WHERE user_id = '${adminId}';`
      );
      
      if (posts && posts.length > 0) {
        // Delete blog post categories relationships
        for (const post of posts) {
          await queryInterface.bulkDelete('blog_post_categories', { post_id: post.id }, {});
        }
      }
      
      // Delete blog posts
      await queryInterface.bulkDelete('blog_posts', { user_id: adminId }, {});
    }
    
    // Delete blog categories (optional, as they might be shared with other users' posts)
    // await queryInterface.bulkDelete('blog_categories', null, {});
  }
}; 