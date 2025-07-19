// Main exports for the express-mcp library
export {
  createMCPMiddleware,
  registerMCPTool,
  configureMCP,
  clearMCPRegistry,
  getMCPRegistry
} from './middleware';

export { schemas } from './utils/schemas';

// Export all types for TypeScript users
export type {
  MCPRequest,
  MCPResponse,
  MCPTool,
  MCPResource,
  RouteDefinition,
  MCPConfig,
  MCPRegistry,
  ExpressRequest,
  SchemaProperty,
  ObjectSchema
} from './types'; 