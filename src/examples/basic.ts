/**
 * Basic example of using express-mcp
 * This shows the minimal setup to add MCP support to an Express API
 */

import express from 'express';
import { createMCPMiddleware, registerMCPTool, configureMCP, schemas } from '../index';

const app = express();
app.use(express.json());

// Configure MCP
configureMCP({
  serverName: 'basic-example-server',
  serverVersion: '1.0.0',
  basePath: '/mcp'
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
  
  console.log('\n📋 Example MCP requests:');
  console.log('1. List tools:');
  console.log(`   curl -X POST http://localhost:${PORT}/mcp \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log('     -d \'{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}\'');
  
  console.log('\n2. Call a tool:');
  console.log(`   curl -X POST http://localhost:${PORT}/mcp \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log('     -d \'{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "list_users", "arguments": {"limit": 5}}}\'');
});

export { app }; 