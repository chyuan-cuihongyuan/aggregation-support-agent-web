/**
 * 插件相关类型定义
 */

/** 插件类型 */
export type PluginType = "builtin" | "mcp" | "custom";

/** 基础插件配置 */
export interface BasePluginConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  available: boolean;
  icon?: string;
}

/** 内置插件配置 */
export interface BuiltInPluginConfig extends BasePluginConfig {
  type: "builtin";
  configurable: boolean;
  settings?: Record<string, any>;
}

/** MCP 工具 */
export interface MCPTool {
  name: string;
  description: string;
}

/** MCP 传输配置 */
export interface MCPConfig {
  transport: "stdio" | "sse";
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

/** MCP 服务器配置 */
export interface MCPServerConfig extends BasePluginConfig {
  type: "mcp";
  connected: boolean;
  connecting?: boolean;
  tools: MCPTool[];
  config: MCPConfig;
}

/** 工具配置 */
export interface ToolConfig {
  apiUrl?: string;
  apiMethod?: "GET" | "POST" | "PUT" | "DELETE";
  apiHeaders?: Record<string, string>;
  webhookUrl?: string;
  scriptPath?: string;
}

/** 工具测试结果 */
export interface ToolTestResult {
  success: boolean;
  timestamp: string;
  responseTime?: number;
  error?: string;
}

/** 自定义工具配置 */
export interface CustomToolConfig extends BasePluginConfig {
  type: "custom";
  toolType: "api" | "webhook" | "script";
  config: ToolConfig;
  lastTest?: ToolTestResult;
}

/** 插件状态响应 */
export interface PluginStatusResponse {
  builtIn: Record<string, { available: boolean; enabled: boolean }>;
  mcpServers: MCPServerConfig[];
  customTools: CustomToolConfig[];
}

/** 统一插件类型 */
export type PluginConfig = BuiltInPluginConfig | MCPServerConfig | CustomToolConfig;
