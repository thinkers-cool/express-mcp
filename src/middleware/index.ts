// Node.js global types
declare const process: {
  env: { [key: string]: string | undefined };
};

// Express types - using declaration merging to avoid direct dependency
declare global {
  namespace Express {
    interface Request {
      headers: { [key: string]: string | string[] | undefined };
      params: { [key: string]: string };
      query: { [key: string]: any };
      body: any;
      path: string;
      method: string;
    }
    interface Response {
      json(body: any): void;
      status(code: number): Response;
      end(): void;
    }
    interface NextFunction {
      (): void;
    }
  }
}

type Request = Express.Request;
type Response = Express.Response;
type NextFunction = Express.NextFunction;

import type {
  MCPRequest,
  MCPResponse,
  MCPTool,
  MCPResource,
  MCPPrompt,
  RouteDefinition,
  MCPConfig,
  MCPRegistry as IMCPRegistry
} from '../types';

/**
 * MCP Registry Implementation
 */
class MCPRegistryImpl implements IMCPRegistry {
  private routes: Map<string, RouteDefinition> = new Map();
  private config: MCPConfig = {};

  configure(config: MCPConfig) {
    this.config = { ...this.config, ...config };
  }

  register(definition: RouteDefinition) {
    const key = `${definition.method}:${definition.path}`;
    this.routes.set(key, definition);
  }

  getTools(): MCPTool[] {
    return Array.from(this.routes.values()).map(route => route.tool);
  }

  getResources(): MCPResource[] {
    return this.config.resources || [];
  }

  getPrompts(): MCPPrompt[] {
    return this.config.prompts || [];
  }

  getRoute(toolName: string): RouteDefinition | undefined {
    return Array.from(this.routes.values()).find(route => route.tool.name === toolName);
  }

  getConfig(): MCPConfig {
    return this.config;
  }

  async handleResourceRead(uri: string, params: any = {}): Promise<any> {
    const handler = this.config.resourceHandlers?.[uri];
    if (handler) {
      return await handler(params);
    }
    throw new Error(`No handler for resource: ${uri}`);
  }

  async handlePromptGet(name: string, args: any = {}): Promise<any> {
    const handler = this.config.promptHandlers?.[name];
    if (handler) {
      return await handler(args);
    }
    throw new Error(`No handler for prompt: ${name}`);
  }

  clear() {
    this.routes.clear();
  }
}

// Global registry instance
const registry = new MCPRegistryImpl();

/**
 * Register an MCP tool that maps to a REST endpoint
 */
export function registerMCPTool(definition: RouteDefinition) {
  registry.register(definition);
}

/**
 * Configure the MCP server
 */
export function configureMCP(config: MCPConfig) {
  registry.configure(config);
}

/**
 * Clear all registered tools (useful for testing)
 */
export function clearMCPRegistry() {
  registry.clear();
}

/**
 * Get the registry instance for advanced usage
 */
export function getMCPRegistry(): IMCPRegistry {
  return registry;
}

/**
 * Main MCP middleware factory
 */
export function createMCPMiddleware(config: MCPConfig = {}) {
  // Configure the registry
  registry.configure(config);

  return (req: Request, res: Response, next: NextFunction) => {
    const basePath = config.basePath || '/mcp';
    
    // Only handle MCP requests
    if (req.path !== basePath || req.method !== 'POST') {
      return next();
    }

    try {
      const mcpRequest: MCPRequest = req.body;
      
      // Handle notifications (these don't require responses)
      if (mcpRequest.method.startsWith('notifications/')) {
        return handleNotification(mcpRequest, res);
      }
      
      switch (mcpRequest.method) {
        case 'initialize':
          return handleInitialize(mcpRequest, res);
        case 'tools/list':
          return handleToolsList(mcpRequest, res);
        case 'tools/call':
          return handleToolCall(mcpRequest, req, res);
        case 'resources/list':
          return handleResourcesList(mcpRequest, res);
        case 'resources/read':
          return handleResourceRead(mcpRequest, res);
        case 'prompts/list':
          return handlePromptsList(mcpRequest, res);
        case 'prompts/get':
          return handlePromptsGet(mcpRequest, res);
        default:
          return sendMCPError(res, mcpRequest.id, -32601, `Method not found: ${mcpRequest.method}`);
      }
    } catch (error: any) {
      console.error('MCP middleware error:', error);
      return sendMCPError(res, 0, -32603, 'Internal error');
    }
  };
}

// MCP Protocol Handlers
function handleInitialize(request: MCPRequest, res: Response) {
  const config = registry.getConfig();
  
  const response: MCPResponse = {
    jsonrpc: '2.0',
    id: request.id,
    result: {
      protocolVersion: '2025-06-18',
      capabilities: {
        tools: {},
        resources: config.resources && config.resources.length > 0 ? {} : undefined,
        prompts: config.prompts && config.prompts.length > 0 ? {} : undefined,
      },
      serverInfo: {
        name: config.serverName || 'express-mcp-server',
        version: config.serverVersion || '1.0.0',
      },
    },
  };
  
  res.json(response);
}

function handleToolsList(request: MCPRequest, res: Response) {
  const tools = registry.getTools();

  const response: MCPResponse = {
    jsonrpc: '2.0',
    id: request.id,
    result: { tools },
  };
  
  res.json(response);
}

async function handleToolCall(request: MCPRequest, req: Request, res: Response) {
  const { name, arguments: args } = request.params;

  try {
    const routeDefinition = registry.getRoute(name);
    
    if (!routeDefinition) {
      const availableTools = registry.getTools().map(t => t.name).join(', ');
      return sendMCPError(res, request.id, -32602, 
        `Unknown tool: ${name}. Available tools: ${availableTools}`);
    }

    let result: any;

    // Use custom handler if provided, otherwise call the REST endpoint
    if (routeDefinition.handler) {
      result = await routeDefinition.handler(args, req);
    } else {
      result = await callRESTEndpoint(req, routeDefinition, args);
    }

    const response: MCPResponse = {
      jsonrpc: '2.0',
      id: request.id,
      result: { 
        content: [{ 
          type: 'text', 
          text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) 
        }] 
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error(`Error calling tool ${name}:`, error);
    return sendMCPError(res, request.id, -32603, error.message || 'Tool execution failed');
  }
}

function handleResourcesList(request: MCPRequest, res: Response) {
  const resources = registry.getResources();

  const response: MCPResponse = {
    jsonrpc: '2.0',
    id: request.id,
    result: { resources },
  };
  
  res.json(response);
}

async function handleResourceRead(request: MCPRequest, res: Response) {
  const { uri } = request.params;

  try {
    const content = await registry.handleResourceRead(uri, request.params);

    const response: MCPResponse = {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
          },
        ],
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error(`Error reading resource ${uri}:`, error);
    return sendMCPError(res, request.id, -32603, error.message || 'Resource read failed');
  }
}

function handlePromptsList(request: MCPRequest, res: Response) {
  const prompts = registry.getPrompts();

  const response: MCPResponse = {
    jsonrpc: '2.0',
    id: request.id,
    result: { prompts },
  };
  
  res.json(response);
}

async function handlePromptsGet(request: MCPRequest, res: Response) {
  const { name } = request.params;

  try {
    const content = await registry.handlePromptGet(name, request.params.arguments || {});

    const response: MCPResponse = {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
            },
          },
        ],
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error(`Error getting prompt ${name}:`, error);
    return sendMCPError(res, request.id, -32603, error.message || 'Prompt get failed');
  }
}

function handleNotification(request: MCPRequest, res: Response) {
  // Handle MCP notifications
  switch (request.method) {
    case 'notifications/initialized':
      // Client has finished initialization - no response required
      console.log('MCP client initialized successfully');
      break;
    case 'notifications/cancelled':
      // Request was cancelled - no response required
      console.log('MCP request cancelled:', request.params);
      break;
    case 'notifications/progress':
      // Progress update - no response required
      console.log('MCP progress update:', request.params);
      break;
    default:
      console.log(`Unknown notification: ${request.method}`, request.params);
  }
  
  // Notifications don't require responses, just send 200 OK
  res.status(200).end();
}

async function callRESTEndpoint(req: Request, routeDefinition: RouteDefinition, data: any): Promise<any> {
  const { path, method } = routeDefinition;
  
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || `localhost:${process.env.PORT || 3000}`;
  const baseURL = `${protocol}://${host}`;
  
  // Replace path parameters
  let finalPath = path;
  if (data && typeof data === 'object') {
    Object.keys(data).forEach(key => {
      finalPath = finalPath.replace(`:${key}`, String(data[key]));
    });
  }
  
  let url = `${baseURL}${finalPath}`;

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'MCP-Client/1.0',
      // Forward relevant headers
      ...(req.headers.authorization && { 'Authorization': req.headers.authorization as string }),
    },
  };

  // Handle request body and query parameters
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    // Filter out path parameters from body
    const bodyData = { ...data };
    const pathParamRegex = /:(\w+)/g;
    let match;
    while ((match = pathParamRegex.exec(path)) !== null) {
      if (match[1]) {
        delete bodyData[match[1]];
      }
    }
    options.body = JSON.stringify(bodyData);
  } else if (method === 'GET' && data) {
    // Convert to query parameters
    const queryParams = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && !path.includes(`:${key}`)) {
        queryParams.append(key, String(value));
      }
    });
    const queryString = queryParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await response.json();
  } else {
    return await response.text();
  }
}

function sendMCPError(res: Response, id: number | string, code: number, message: string) {
  const response: MCPResponse = {
    jsonrpc: '2.0',
    id,
    error: { code, message },
  };
  res.json(response);
} 