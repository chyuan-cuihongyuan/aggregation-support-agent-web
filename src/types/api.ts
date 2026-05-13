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
