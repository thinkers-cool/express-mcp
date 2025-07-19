/**
 * Advanced example of using express-mcp
 * This shows more sophisticated features like resources, custom handlers, and organization patterns
 */

import { registerMCPTool, configureMCP, schemas, getMCPRegistry } from '../index';

// Advanced configuration with resources
configureMCP({
  serverName: 'advanced-api-server',
  serverVersion: '2.0.0',
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
  resourceHandlers: {
    'config://server-info': async () => ({
      name: 'Advanced API Server',
      version: '2.0.0',
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
        version: '2.0.0'
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

console.log('🔧 Advanced express-mcp configuration loaded');
console.log('📊 Registry info:', getRegistryInfo());
console.log('✅ All tools and resources registered successfully'); 