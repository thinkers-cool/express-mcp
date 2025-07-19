# express-mcp

[![npm version](https://badge.fury.io/js/express-mcp.svg)](https://badge.fury.io/js/express-mcp)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight TypeScript middleware that transforms Express.js REST APIs into **Model Context Protocol (MCP)** compatible endpoints while keeping REST functionality intact.

## 📦 Installation

```bash
npm install express-mcp
```

**Peer Dependencies:**
```bash
npm install express
```

## 🚀 Quick Start

```typescript
import express from 'express';
import { createMCPMiddleware, registerMCPTool, configureMCP, schemas } from 'express-mcp';

const app = express();
app.use(express.json());

// Configure MCP
configureMCP({
  serverName: 'my-api-server',
  serverVersion: '1.0.0',
  basePath: '/mcp'
});

// Your existing REST endpoint
app.get('/api/users', (req, res) => {
  const users = [{ id: 1, name: 'John' }];
  res.json({ users });
});

// Register it as an MCP tool
registerMCPTool({
  path: '/api/users',
  method: 'GET',
  tool: {
    name: 'list_users',
    description: 'Get all users',
    inputSchema: schemas.pagination
  }
});

// Add MCP middleware (after all route registrations)
app.use(createMCPMiddleware());

app.listen(3000);
```

**Test it:**
```bash
# REST API
curl http://localhost:3000/api/users

# MCP Protocol
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.
