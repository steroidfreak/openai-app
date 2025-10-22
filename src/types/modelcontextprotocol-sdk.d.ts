declare module '@modelcontextprotocol/sdk' {
  import type { Router } from 'express';

  export interface McpToolInvocation {
    name?: string;
    metadata?: Record<string, unknown>;
  }

  export interface McpToolResultContent {
    type: string;
    [key: string]: unknown;
  }

  export interface McpToolResult {
    content: McpToolResultContent[];
  }

  export class McpError extends Error {}

  export interface ToolSchema {
    description?: string;
    inputSchema?: Record<string, unknown>;
  }

  export class McpServer {
    constructor(info: { name: string; version: string });
    tool(
      name: string,
      schema: ToolSchema,
      handler: (context: McpToolInvocation, input: Record<string, unknown>) => Promise<McpToolResult> | McpToolResult
    ): void;
    createExpressRouter(options?: { path?: string }): Router;
  }
}
