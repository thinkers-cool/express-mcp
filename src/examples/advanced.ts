/**
 * Advanced example of using express-mcp
 * This shows more sophisticated features like resources, custom handlers, and organization patterns
 */

import express from 'express';
import { registerMCPTool, configureMCP, schemas, getMCPRegistry, createMCPMiddleware } from '../index';

// Advanced configuration with resources and prompts
configureMCP({
  serverName: 'advanced-api-server',
  serverVersion: '1.0.0',
  basePath: '/mcp',
  resources: [
    {
      uri: 'config://server-info',
      name: 'Server Information',
      description: 'Current server configuration and status',
      mimeType: 'application/json'
    },
    {
      uri: 'data://user-stats',
      name: 'User Statistics',
      description: 'Live user statistics and metrics',
      mimeType: 'application/json'
    },
    {
      uri: 'schema://api-docs',
      name: 'API Documentation',
      description: 'OpenAPI schema for the REST endpoints',
      mimeType: 'application/json'
    }
  ],
  prompts: [
    {
      name: 'code_review_prompt',
      description: 'Generate a comprehensive code review prompt with best practices',
      arguments: [
        {
          name: 'language',
          description: 'Programming language of the code to review',
          required: true
        },
        {
          name: 'focus_areas',
          description: 'Specific areas to focus on (security, performance, maintainability)',
          required: false
        }
      ]
    },
    {
      name: 'api_documentation_prompt',
      description: 'Create documentation prompt for API endpoints',
      arguments: [
        {
          name: 'endpoint_path',
          description: 'The API endpoint path to document',
          required: true
        },
        {
          name: 'http_method',
          description: 'HTTP method (GET, POST, PUT, DELETE)',
          required: true
        }
      ]
    },
    {
      name: 'user_story_prompt',
      description: 'Generate user story creation prompt with acceptance criteria',
      arguments: [
        {
          name: 'feature_type',
          description: 'Type of feature (authentication, reporting, data-entry)',
          required: true
        },
        {
          name: 'user_role',
          description: 'Target user role (admin, user, guest)',
          required: false
        }
      ]
    }
  ],
  resourceHandlers: {
    'config://server-info': async () => ({
      name: 'Advanced API Server',
      version: '1.0.0',
      environment: 'development',
      features: ['REST', 'MCP', 'Resources', 'Custom Handlers'],
      uptime: 12345,
      started_at: new Date().toISOString()
    }),
    
    'data://user-stats': async (params) => {
      // Simulate fetching live stats
      return {
        total_users: 1250,
        active_users: 856,
        new_today: 23,
        filter: params.filter || 'all',
        last_updated: new Date().toISOString()
      };
    },
    
    'schema://api-docs': async () => ({
      openapi: '3.0.0',
      info: {
        title: 'Advanced API',
        version: '1.0.0'
      },
      paths: {
        '/api/users': {
          get: { summary: 'List users' },
          post: { summary: 'Create user' }
        },
        '/api/posts': {
          get: { summary: 'List posts' },
          post: { summary: 'Create post' }
        }
      }
    })
  },
  promptHandlers: {
    'code_review_prompt': async (args) => {
      const { language, focus_areas } = args;
      const focusAreas = focus_areas ? focus_areas.split(',').map((area: string) => area.trim()) : ['security', 'performance', 'maintainability'];
      
      return `## Code Review Prompt for ${language.toUpperCase()}

Please conduct a comprehensive code review focusing on the following areas:
${focusAreas.map((area: string) => `- **${area.charAt(0).toUpperCase() + area.slice(1)}**: Analyze for ${area} best practices`).join('\n')}

### Review Checklist:
1. **Code Quality**: Check for clean, readable, and maintainable code
2. **Best Practices**: Ensure adherence to ${language} conventions
3. **Error Handling**: Verify proper error handling and edge cases
4. **Performance**: Look for potential performance bottlenecks
5. **Security**: Check for security vulnerabilities and data validation
6. **Documentation**: Ensure code is properly documented

Please provide specific, actionable feedback with examples where applicable.`;
    },

    'api_documentation_prompt': async (args) => {
      const { endpoint_path, http_method } = args;
      
      return `## API Documentation Prompt

Generate comprehensive documentation for the following API endpoint:

**Endpoint**: \`${http_method.toUpperCase()} ${endpoint_path}\`

### Documentation Requirements:
1. **Description**: Clear explanation of what this endpoint does
2. **Parameters**: 
   - Path parameters (if any)
   - Query parameters (if any)
   - Request body schema (for POST/PUT/PATCH)
3. **Responses**: 
   - Success response (200/201) with example
   - Error responses (400, 401, 404, 500) with descriptions
4. **Authentication**: Required authentication method
5. **Rate Limiting**: Any rate limiting considerations
6. **Example Request**: Complete curl example
7. **Example Response**: JSON response example

Please follow OpenAPI 3.0 specification format where applicable.`;
    },

    'user_story_prompt': async (args) => {
      const { feature_type, user_role = 'user' } = args;
      
      return `## User Story Creation Prompt

Create a well-structured user story for a ${feature_type} feature:

### User Story Template:
**As a** ${user_role}
**I want** [to be defined based on ${feature_type}]
**So that** [business value to be defined]

### Requirements:
1. **Acceptance Criteria**: Define clear, testable criteria using Given/When/Then format
2. **Definition of Done**: Technical and quality requirements
3. **Dependencies**: Any dependencies on other features or systems
4. **Estimation**: Story point estimation with justification
5. **Wireframes/Mockups**: If UI changes are involved
6. **Technical Considerations**: Any technical constraints or requirements

### Questions to Address:
- What specific problem does this solve for the ${user_role}?
- How does this ${feature_type} feature integrate with existing functionality?
- What edge cases need to be considered?
- What are the performance requirements?
- What security considerations apply?

Please create a comprehensive user story following agile best practices.`;
    }
  }
});

// User management tools
function registerUserTools() {
  registerMCPTool({
    path: '/api/users',
    method: 'GET',
    tool: {
      name: 'list_users',
      description: 'List users with advanced filtering and pagination',
      inputSchema: {
        type: 'object',
        properties: {
          ...schemas.pagination.properties,
          filter: schemas.enum(['all', 'active', 'inactive', 'recent'], 'User filter'),
          search: schemas.string({ description: 'Search by name or email' }),
          sort: schemas.enum(['name', 'created_at', 'last_login'], 'Sort field')
        }
      }
    }
  });

  registerMCPTool({
    path: '/api/users',
    method: 'POST',
    tool: {
      name: 'create_user',
      description: 'Create a new user with validation',
      inputSchema: schemas.objectBody({
        name: schemas.string({ minLength: 1, maxLength: 100 }),
        email: schemas.string({ format: 'email' }),
        role: schemas.enum(['user', 'admin', 'moderator'], 'User role'),
        preferences: {
          type: 'object',
          properties: {
            theme: schemas.enum(['light', 'dark'], 'UI theme'),
            notifications: schemas.boolean('Email notifications enabled')
          }
        }
      }, ['name', 'email', 'role'])
    }
  });

  registerMCPTool({
    path: '/api/users/:id/profile',
    method: 'PUT',
    tool: {
      name: 'update_user_profile',
      description: 'Update user profile information',
      inputSchema: schemas.objectBody({
        id: schemas.string({ pattern: '^[0-9]+$' }),
        name: schemas.string({ minLength: 1, maxLength: 100 }),
        bio: schemas.string({ maxLength: 500 }),
        avatar_url: schemas.string({ format: 'uri' })
      }, ['id'])
    }
  });
}

// Content management tools
function registerContentTools() {
  registerMCPTool({
    path: '/api/posts',
    method: 'POST',
    tool: {
      name: 'create_post',
      description: 'Create a new blog post with content validation',
      inputSchema: schemas.objectBody({
        title: schemas.string({ minLength: 1, maxLength: 200 }),
        content: schemas.string({ minLength: 10, maxLength: 50000 }),
        tags: schemas.array(schemas.string(), { maxItems: 10 }),
        category: schemas.enum(['tech', 'lifestyle', 'business', 'other']),
        published: schemas.boolean('Publish immediately'),
        scheduled_for: schemas.string({ format: 'date-time', description: 'Schedule publication' })
      }, ['title', 'content', 'category'])
    },
    // Custom handler with enhanced functionality
    handler: async (params, req) => {
      // Add MCP-specific enhancements
      const enhancedPost = {
        ...params,
        source: 'mcp-client',
        created_via: 'express-mcp',
        client_ip: req.headers['x-forwarded-for'] || 'unknown',
        user_agent: req.headers['user-agent'] || 'MCP-Client',
        timestamp: new Date().toISOString(),
        
        // Auto-generate slug from title
        slug: params.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
        
        // Estimate reading time
        reading_time: Math.ceil(params.content.split(' ').length / 200),
        
        // Extract hashtags from content
        hashtags: (params.content.match(/#\w+/g) || []).map((tag: string) => tag.slice(1))
      };

      return {
        success: true,
        message: 'Post created successfully via MCP',
        post: enhancedPost,
        processing_time: Date.now()
      };
    }
  });

  registerMCPTool({
    path: '/api/posts/search',
    method: 'GET',
    tool: {
      name: 'search_posts',
      description: 'Advanced post search with multiple criteria',
      inputSchema: {
        type: 'object',
        properties: {
          q: schemas.string({ minLength: 1, description: 'Search query' }),
          category: schemas.enum(['tech', 'lifestyle', 'business', 'other']),
          tags: schemas.array(schemas.string()),
          author_id: schemas.string(),
          date_from: schemas.string({ format: 'date' }),
          date_to: schemas.string({ format: 'date' }),
          published_only: schemas.boolean('Only published posts'),
          ...schemas.pagination.properties
        },
        required: ['q']
      }
    }
  });
}

// Analytics and reporting tools
function registerAnalyticsTools() {
  registerMCPTool({
    path: '/api/analytics/report',
    method: 'POST',
    tool: {
      name: 'generate_analytics_report',
      description: 'Generate comprehensive analytics reports',
      inputSchema: schemas.objectBody({
        report_type: schemas.enum(['users', 'content', 'engagement', 'performance']),
        date_range: {
          type: 'object',
          properties: {
            start: schemas.string({ format: 'date' }),
            end: schemas.string({ format: 'date' })
          },
          required: ['start', 'end']
        },
        format: schemas.enum(['json', 'csv', 'pdf'], 'Report format'),
        include_charts: schemas.boolean('Include visual charts'),
        filters: {
          type: 'object',
          properties: {
            user_segments: schemas.array(schemas.string()),
            content_categories: schemas.array(schemas.string())
          }
        }
      }, ['report_type', 'date_range'])
    },
    handler: async (params, req) => {
      // Custom analytics processing
      const reportData = {
        id: `report_${Date.now()}`,
        type: params.report_type,
        generated_at: new Date().toISOString(),
        period: params.date_range,
        format: params.format || 'json',
        
        // Simulated analytics data
        summary: {
          total_records: 15420,
          growth_rate: 12.5,
          top_performing: ['tech', 'lifestyle'],
          engagement_score: 8.7
        },
        
        // Processing metadata
        processing_time_ms: Math.floor(Math.random() * 5000) + 1000,
        data_freshness: 'real-time',
        client_context: {
          source: 'mcp',
          requested_by: req.headers['user-agent'] || 'unknown'
        }
      };

      return {
        success: true,
        report: reportData,
        download_url: params.format !== 'json' 
          ? `/api/downloads/reports/${reportData.id}.${params.format}`
          : null
      };
    }
  });
}

// Register all tools
registerUserTools();
registerContentTools();
registerAnalyticsTools();

// Utility function to get current registry state
export function getRegistryInfo() {
  const registry = getMCPRegistry();
  return {
    tools: registry.getTools(),
    resources: registry.getResources(),
    config: registry.getConfig(),
    summary: {
      total_tools: registry.getTools().length,
      total_resources: registry.getResources().length,
      server_name: registry.getConfig().serverName
    }
  };
}

// Example function to demonstrate custom validation
export function validateToolRegistration(toolName: string): boolean {
  const registry = getMCPRegistry();
  const tool = registry.getRoute(toolName);
  return tool !== undefined;
}

// Create and configure Express app
const app = express();
app.use(express.json());

// Add some example REST endpoints to demonstrate the full API
app.get('/api/users', (req, res) => {
  const { page = 1, limit = 10, filter = 'all' } = req.query;
  const users = Array.from({ length: parseInt(limit as string) }, (_, i) => ({
    id: (parseInt(page as string) - 1) * parseInt(limit as string) + i + 1,
    name: `User ${(parseInt(page as string) - 1) * parseInt(limit as string) + i + 1}`,
    email: `user${(parseInt(page as string) - 1) * parseInt(limit as string) + i + 1}@example.com`,
    role: ['user', 'admin', 'moderator'][i % 3],
    status: filter === 'all' ? ['active', 'inactive'][i % 2] : filter,
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
  }));
  
  res.json({ 
    users, 
    pagination: { page: parseInt(page as string), limit: parseInt(limit as string), total: 1250 },
    filter 
  });
});

app.post('/api/users', (req, res) => {
  const newUser = { 
    id: Date.now(), 
    ...req.body, 
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  res.status(201).json({ 
    success: true,
    message: 'User created successfully', 
    user: newUser 
  });
});

app.put('/api/users/:id/profile', (req, res) => {
  const userId = req.params.id;
  const updatedProfile = {
    id: userId,
    ...req.body,
    updated_at: new Date().toISOString()
  };
  res.json({
    success: true,
    message: 'Profile updated successfully',
    profile: updatedProfile
  });
});

app.post('/api/posts', (req, res) => {
  // This endpoint will use the custom handler registered above
  res.json({
    success: true,
    message: 'This endpoint handled by Express, but MCP tool uses custom handler',
    received: req.body
  });
});

app.get('/api/posts/search', (req, res) => {
  const { q, category, tags = [], published_only = true } = req.query;
  const mockPosts = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    title: `${q} related post ${i + 1}`,
    content: `This is a sample post about ${q}...`,
    category,
    tags: Array.isArray(tags) ? tags : [tags].filter(Boolean),
    published: published_only === 'true' ? true : Math.random() > 0.5,
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  }));

  res.json({
    posts: mockPosts,
    query: { q, category, tags, published_only },
    total: mockPosts.length
  });
});

app.post('/api/analytics/report', (req, res) => {
  // This will use the custom handler registered above
  res.json({
    success: true,
    message: 'Analytics endpoint - see MCP handler for enhanced functionality',
    received: req.body
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    server: 'advanced-api-server',
    version: '1.0.0'
  });
});

// Add MCP middleware (after all route registrations)
app.use(createMCPMiddleware());

console.log('🔧 Advanced express-mcp configuration loaded');
console.log('📊 Registry info:', getRegistryInfo());
console.log('✅ All tools, resources, and prompts registered successfully');

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 Advanced API Server running on port ${PORT}`);
  console.log(`📡 REST API: http://localhost:${PORT}/api/`);
  console.log(`🔌 MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 Resources available: ${getMCPRegistry().getResources().length}`);
  console.log(`🎯 Prompts available: ${getMCPRegistry().getPrompts().length}`);
  
  console.log('\n📋 Example MCP requests:');
  console.log('1. Initialize (updated protocol):');
  console.log(`   curl -X POST http://localhost:${PORT}/mcp \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log('     -d \'{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2025-06-18", "capabilities": {}, "clientInfo": {"name": "test-client", "version": "1.0.0"}}}\'');
  
  console.log('\n2. List tools:');
  console.log(`   curl -X POST http://localhost:${PORT}/mcp \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log('     -d \'{"jsonrpc": "2.0", "id": 2, "method": "tools/list"}\'');
  
  console.log('\n3. List resources:');
  console.log(`   curl -X POST http://localhost:${PORT}/mcp \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log('     -d \'{"jsonrpc": "2.0", "id": 3, "method": "resources/list"}\'');
  
  console.log('\n4. List prompts (NEW):');
  console.log(`   curl -X POST http://localhost:${PORT}/mcp \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log('     -d \'{"jsonrpc": "2.0", "id": 4, "method": "prompts/list"}\'');
  
  console.log('\n5. Get code review prompt (NEW):');
  console.log(`   curl -X POST http://localhost:${PORT}/mcp \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log('     -d \'{"jsonrpc": "2.0", "id": 5, "method": "prompts/get", "params": {"name": "code_review_prompt", "arguments": {"language": "javascript", "focus_areas": "security,performance"}}}\'');
  
  console.log('\n6. Get resource:');
  console.log(`   curl -X POST http://localhost:${PORT}/mcp \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log('     -d \'{"jsonrpc": "2.0", "id": 6, "method": "resources/read", "params": {"uri": "config://server-info"}}\'');
  
  console.log('\n7. Call advanced tool:');
  console.log(`   curl -X POST http://localhost:${PORT}/mcp \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log('     -d \'{"jsonrpc": "2.0", "id": 7, "method": "tools/call", "params": {"name": "create_post", "arguments": {"title": "My First Post", "content": "This is an amazing post about #technology", "category": "tech", "published": true}}}\'');
});

export { app };

