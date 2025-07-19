// Express types - these will be available when express is installed as peer dependency
export interface ExpressRequest {
  headers: { [key: string]: string | string[] | undefined };
  params: { [key: string]: string };
  query: { [key: string]: any };
  body: any;
  [key: string]: any;
}

// MCP Protocol Types
export interface MCPRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
}

// Route Registration Types
export interface RouteDefinition {
  path: string;
  method: string;
  tool: MCPTool;
  handler?: (params: any, req: ExpressRequest) => Promise<any>;
}

export interface MCPConfig {
  serverName?: string;
  serverVersion?: string;
  basePath?: string;
  resources?: MCPResource[];
  resourceHandlers?: { [uri: string]: (params: any) => Promise<any> };
}

// Schema Helper Types
export interface SchemaProperty {
  type: string;
  description?: string;
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  enum?: any[];
  items?: SchemaProperty;
  properties?: { [key: string]: SchemaProperty };
  required?: string[];
  default?: any;
  additionalProperties?: boolean;
}

export interface ObjectSchema {
  type: 'object';
  properties: { [key: string]: SchemaProperty };
  required?: string[];
  additionalProperties?: boolean;
}

// Registry Types
export interface MCPRegistry {
  configure(config: MCPConfig): void;
  register(definition: RouteDefinition): void;
  getTools(): MCPTool[];
  getResources(): MCPResource[];
  getRoute(toolName: string): RouteDefinition | undefined;
  getConfig(): MCPConfig;
  handleResourceRead(uri: string, params?: any): Promise<any>;
  clear(): void;
} 