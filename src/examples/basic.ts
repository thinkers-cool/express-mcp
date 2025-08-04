/**
 * Basic example of using express-mcp
 * This shows the minimal setup to add MCP support to an Express API
 */

import express from 'express';
import { createMCPMiddleware, registerMCPTool, configureMCP, schemas } from '../index';

const app = express();
app.use(express.json());

// Configure MCP with basic prompts
configureMCP({
  serverName: 'basic-example-server',
  serverVersion: '1.0.0',
  basePath: '/mcp',
  prompts: [
    {
      name: 'user_validation_prompt',
      description: 'Generate a prompt for validating user input data',
      arguments: [
        {
          name: 'field_name',
          description: 'The name of the field to validate',
          required: true
        },
        {
          name: 'validation_type',
          description: 'Type of validation (email, name, age)',
          required: false
        }
      ]
    },
    {
      name: 'api_response_prompt',
      description: 'Create a standardized API response format prompt',
      arguments: [
        {
          name: 'endpoint_name',
          description: 'Name of the API endpoint',
          required: true
        }
      ]
    }
  ],
  promptHandlers: {
    'user_validation_prompt': async (args) => {
      const { field_name, validation_type = 'general' } = args;
      
      return `## User Input Validation Prompt

Validate the following user input field: **${field_name}**

### Validation Type: ${validation_type}

Please check the following criteria:
${validation_type === 'email' ? `
- Valid email format (contains @, proper domain)
- No dangerous characters or scripts
- Maximum length: 254 characters` : ''}
${validation_type === 'name' ? `
- Contains only letters, spaces, and common punctuation
- Length between 1-100 characters
- No numbers or special characters` : ''}
${validation_type === 'age' ? `
- Must be a positive integer
- Reasonable range (0-120)
- No decimal places` : ''}
${validation_type === 'general' ? `
- No SQL injection patterns
- No XSS attempts (script tags, javascript:)
- Appropriate length for field type
- Required field validation` : ''}

Provide specific feedback on what needs to be corrected if validation fails.`;
    },

    'api_response_prompt': async (args) => {
      const { endpoint_name } = args;
      
      return `## API Response Format Prompt for ${endpoint_name}

Generate a consistent API response following this structure:

### Success Response Format:
\`\`\`json
{
  "success": true,
  "data": {
    // Your actual response data here
  },
  "message": "Operation completed successfully",
  "timestamp": "ISO-8601 timestamp",
  "metadata": {
    "endpoint": "${endpoint_name}",
    "version": "1.0.0"
  }
}
\`\`\`

### Error Response Format:
\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error context"
  },
  "timestamp": "ISO-8601 timestamp",
  "metadata": {
    "endpoint": "${endpoint_name}",
    "version": "1.0.0"
  }
}
\`\`\`

Ensure all responses follow this consistent format for better API usability.`;
    }
  }
});

// Example REST endpoints
app.get('/api/users', (req, res) => {
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];
  res.json({ users, total: users.length });
});

app.post('/api/users', (req, res) => {
  const newUser = { 
    id: Date.now(), 
    ...req.body, 
    createdAt: new Date().toISOString() 
  };
  res.status(201).json({ user: newUser, message: 'User created successfully' });
});

app.get('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = { id: userId, name: `User ${userId}`, email: `user${userId}@example.com` };
  res.json({ user });
});

// Register MCP tools for the REST endpoints
registerMCPTool({
  path: '/api/users',
  method: 'GET',
  tool: {
    name: 'list_users',
    description: 'Retrieve a list of all users in the system',
    inputSchema: schemas.pagination
  }
});

registerMCPTool({
  path: '/api/users',
  method: 'POST',
  tool: {
    name: 'create_user',
    description: 'Create a new user with name and email',
    inputSchema: schemas.objectBody({
      name: schemas.string({ minLength: 1, maxLength: 100 }),
      email: schemas.string({ format: 'email' }),
      age: schemas.number({ minimum: 18, maximum: 120 })
    }, ['name', 'email'])
  }
});

registerMCPTool({
  path: '/api/users/:id',
  method: 'GET',
  tool: {
    name: 'get_user_by_id',
    description: 'Retrieve a specific user by their ID',
    inputSchema: schemas.objectBody({
      id: schemas.string({ pattern: '^[0-9]+$', description: 'User ID (numeric)' })
    }, ['id'])
  }
});

// Add MCP middleware (after all route registrations)
app.use(createMCPMiddleware());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 REST API: http://localhost:${PORT}/api/`);
  console.log(`🔌 MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`🎯 MCP Protocol: 2025-06-18 (latest)`);
  
  console.log('\n📋 Example MCP requests:');
  console.log('1. Initialize with new protocol:');
  console.log(`   curl -X POST http://localhost:${PORT}/mcp \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log('     -d \'{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2025-06-18", "capabilities": {}, "clientInfo": {"name": "test-client", "version": "1.0.0"}}}\'');
  
  console.log('\n2. List tools:');
  console.log(`   curl -X POST http://localhost:${PORT}/mcp \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log('     -d \'{"jsonrpc": "2.0", "id": 2, "method": "tools/list"}\'');
  
  console.log('\n3. List prompts (NEW):');
  console.log(`   curl -X POST http://localhost:${PORT}/mcp \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log('     -d \'{"jsonrpc": "2.0", "id": 3, "method": "prompts/list"}\'');
  
  console.log('\n4. Get validation prompt (NEW):');
  console.log(`   curl -X POST http://localhost:${PORT}/mcp \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log('     -d \'{"jsonrpc": "2.0", "id": 4, "method": "prompts/get", "params": {"name": "user_validation_prompt", "arguments": {"field_name": "email", "validation_type": "email"}}}\'');
  
  console.log('\n5. Call a tool:');
  console.log(`   curl -X POST http://localhost:${PORT}/mcp \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log('     -d \'{"jsonrpc": "2.0", "id": 5, "method": "tools/call", "params": {"name": "list_users", "arguments": {"limit": 5}}}\'');
});

export { app }; 