/**
 * API 类型定义
 *
 * 定义与后端 API 交互所需的所有 TypeScript 类型
 */

// ========== API 统一响应体 ==========

/**
 * 后端 API 统一响应格式
 * @template T - 响应数据类型
 */
export interface ApiResponse<T> {
  /** 响应码："0000" 表示成功 */
  code: string;
  /** 人类可读的消息 */
  info: string;
  /** 数据载荷（可能为 null） */
  data: T;
}

// ========== 对话相关 ==========

/**
 * 对话请求参数
 */
export interface ChatRequest {
  /** 智能体 ID */
  agentId: string;
  /** 用户 ID */
  userId: string;
  /** 会话 ID */
  sessionId: string;
  /** 用户消息内容 */
  message: string;
}

/**
 * 智能体配置
 */
export interface AgentConfig {
  /** 智能体 ID */
  agentId: string;
  /** 智能体名称 */
  agentName: string;
  /** 智能体描述（可选） */
  agentDesc?: string;
}

/**
 * 创建会话请求
 */
export interface CreateSessionRequest {
  /** 智能体 ID */
  agentId: string;
  /** 用户 ID */
  userId: string;
}

/**
 * 创建会话响应
 */
export interface CreateSessionResponse {
  /** 会话 ID */
  sessionId: string;
}

// ========== 文档相关 ==========

/**
 * 文档信息
 */
export interface DocumentDTO {
  /** 文档 ID */
  documentId: string;
  /** 文件名 */
  fileName: string;
  /** 文件扩展名 */
  fileExtension: string;
  /** 文件大小（字节） */
  fileSize: number;
  /** MIME 类型 */
  mimeType: string;
  /** 总字符数（可选） */
  totalChars?: number;
  /** 总分块数（可选） */
  totalChunks?: number;
  /** 分段数量（可选） */
  sectionCount?: number;
  /** 处理状态 */
  processingStatus: "success" | "processing" | "failed";
  /** 错误信息（可选） */
  errorMessage?: string;
  /** 用户 ID */
  userId: string;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
}

// ========== 检索相关 ==========

/**
 * 检索测试请求
 */
export interface SearchTestRequest {
  /** 查询内容 */
  query: string;
  /** 返回结果数量 */
  topK: number;
}

/**
 * 检索结果项
 */
export interface SearchResultItem {
  /** 内容片段 */
  content: string;
  /** 相似度分数 */
  score: number;
  /** 来源文档（可选） */
  source?: string;
  /** 块索引（可选） */
  chunkIndex?: number;
  /** 模态类型 */
  modalityType?: "TEXT" | "IMAGE";
  /** 图片URL（多模态结果） */
  imageUrl?: string;
  /** 实体类型（图谱结果） */
  entityType?: string;
  /** 关系类型（图谱结果） */
  relationType?: string;
}

/**
 * 检索测试结果
 */
export interface SearchTestResult {
  /** 查询内容 */
  query: string;
  /** 向量检索结果 */
  vectorResults: SearchResultItem[];
  /** BM25 检索结果 */
  bm25Results: SearchResultItem[];
  /** 混合检索结果 */
  hybridResults: SearchResultItem[];
  /** 图谱检索结果 */
  graphResults?: SearchResultItem[];
  /** 多模态检索结果 */
  multimodalResults?: CrossModalSearchResult[];
}

// ========== 对话历史相关 ==========

/**
 * 对话历史记录
 */
export interface ChatHistoryDTO {
  /** 记录 ID */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 智能体 ID */
  agentId: string;
  /** 智能体名称 */
  agentName: string;
  /** 会话 ID */
  sessionId: string;
  /** 用户问题 */
  question: string;
  /** AI 回答 */
  answer: string;
  /** 创建时间 */
  createTime: string;
  /** 会话标题（可选） */
  sessionTitle?: string;
}

/**
 * 保存对话历史请求
 */
export interface SaveChatHistoryRequest {
  /** 用户 ID */
  userId: string;
  /** 智能体 ID */
  agentId: string;
  /** 智能体名称 */
  agentName: string;
  /** 会话 ID */
  sessionId: string;
  /** 用户问题 */
  question: string;
  /** AI 回答 */
  answer: string;
}

// ========== AIOps 相关 ==========

/**
 * AIOps 分析请求
 */
export interface AiOpsRequest {
  /** 智能体 ID */
  agentId: string;
  /** 用户 ID */
  userId: string;
  /** 会话 ID（可选） */
  sessionId?: string;
  /** 告警描述 */
  alertDescription: string;
}

/**
 * 告警信息
 */
export interface AlertDTO {
  /** 告警ID */
  id: string;
  /** 严重程度: critical, warning, info */
  severity: "critical" | "warning" | "info";
  /** 告警名称 */
  name: string;
  /** 告警摘要 */
  summary: string;
  /** 来源主机 */
  host: string;
  /** 告警时间 */
  time: string;
  /** 告警状态: active, acknowledged, resolved */
  status: "active" | "acknowledged" | "resolved";
  /** 告警来源 */
  source?: string;
  /** 告警指标 */
  metrics?: Record<string, any>;
  /** 告警标签 */
  labels?: Record<string, string>;
  /** 告警描述 */
  description?: string;
}

/**
 * 告警列表响应
 */
export interface AlertListResponse {
  /** 告警列表 */
  alerts: AlertDTO[];
  /** 总数 */
  total: number;
  /** 各状态告警数量 */
  counts: {
    critical: number;
    warning: number;
    info: number;
    total: number;
  };
}

// ========== 认证相关 ==========

/** 注册请求 */
export interface RegisterRequest {
  username: string;
  password: string;
  phone: string;
  email?: string;
  nickname?: string;
}

/** 登录请求 */
export interface LoginRequest {
  username: string;
  password: string;
}

/** 用户信息 */
export interface UserInfoDTO {
  id: number;
  username: string;
  nickname: string;
  email: string;
  avatar: string;
  role: string;
  status: number;
  createTime: string;
}

/** 用户列表响应 */
export interface UserListResponse {
  list: UserInfoDTO[];
  total: number;
  page: number;
  pageSize: number;
}

/** 更新用户信息请求 */
export interface UpdateUserRequest {
  nickname?: string;
  email?: string;
  avatar?: string;
}

/** 修改密码请求 */
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

/** 更新用户状态请求 */
export interface UpdateStatusRequest {
  status: number;
}

/** 更新用户角色请求 */
export interface UpdateRoleRequest {
  role: string;
}

// ========== 会话状态相关 ==========

/**
 * 消息类型（用于会话缓存）
 */
export interface Message {
  /** 消息 ID */
  id: string;
  /** 消息角色 */
  role: "user" | "assistant";
  /** 消息内容 */
  content: string;
  /** 是否正在流式输出 */
  isStreaming?: boolean;
}

/**
 * 会话视图模式
 */
export type HistoryViewMode = "all" | "by-agent";

/**
 * 会话缓存数据
 */
export interface SessionCacheData {
  /** 会话 ID */
  sessionId: string;
  /** 智能体 ID */
  agentId: string;
  /** 智能体名称 */
  agentName: string;
  /** 会话消息列表 */
  messages: Message[];
  /** 最后更新时间 */
  lastUpdateTime: number;
}

/**
 * 会话状态
 */
export interface SessionState {
  /** 当前会话 ID */
  currentSessionId: string | null;
  /** 当前智能体 ID */
  currentAgentId: string | null;
  /** 是否有未保存的更改 */
  hasUnsavedChanges: boolean;
  /** 是否正在切换会话 */
  isSwitching: boolean;
}

// ========== 知识图谱相关 ==========

/** 实体类型 */
export type EntityType = "CONCEPT" | "PERSON" | "ORGANIZATION" | "TECHNOLOGY" | "PRODUCT" | "EVENT";

/** 关系类型 */
export type RelationType = "RELATED_TO" | "PART_OF" | "DEPENDS_ON" | "BELONGS_TO" | "USES" | "LOCATED_IN";

/** 图谱实体 */
export interface GraphEntity {
  entityId: string;
  entityName: string;
  entityType: EntityType;
  description?: string;
  properties?: Record<string, unknown>;
  sourceDocumentId?: string;
}

/** 图谱关系 */
export interface GraphRelation {
  relationId: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationType: RelationType;
  description?: string;
  confidence?: number;
}

/** 图谱统计 */
export interface GraphStatistics {
  entityCount: number;
  relationCount: number;
  entityTypeDistribution: Record<string, number>;
  relationTypeDistribution: Record<string, number>;
}

/** 图谱节点（可视化用） */
export interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties?: Record<string, unknown>;
  score?: number;
}

/** 图谱边（可视化用） */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: string;
  properties?: Record<string, unknown>;
}

/** 子图数据（可视化用） */
export interface GraphSubgraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ========== 多模态相关 ==========

/** 图片信息 */
export interface ImageDTO {
  imageId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  description?: string;
  imageUrl: string;
  createdAt: string;
}

/** 跨模态检索结果 */
export interface CrossModalSearchResult {
  itemId: string;
  modalityType: "TEXT" | "IMAGE";
  content: string;
  imageUrl?: string;
  score: number;
  metadata?: Record<string, unknown>;
}
