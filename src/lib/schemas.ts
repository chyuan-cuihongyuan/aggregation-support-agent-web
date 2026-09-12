import { z } from "zod";

/**
 * AUTOLOOP al-07 / 工单 1007：API 响应边界校验 schema（借鉴 colinhacks/zod，
 * 模式承 obs-web al-04）。
 *
 * 设计原则（宽容式校验）：
 * - 良性漂移放行：可选字段缺失（.nullish()）、多余字段（passthrough）
 * - 结构性拦截：核心字段类型错误（主键字符串、计数数值、分页结构）立即失败
 * - TS 类型源仍是 src/types/api.ts；本文件只做运行时边界校验
 */

/** 智能体配置（chat 页）：agentId/agentName 必须 */
export const agentConfigSchema = z
  .object({
    agentId: z.string(),
    agentName: z.string(),
    agentDesc: z.string().nullish(),
  })
  .passthrough();
export const agentConfigListSchema = z.array(agentConfigSchema);

/** 知识库（knowledge 页）：knowledgeBaseId/name 必须，计数可选容忍 null */
export const knowledgeBaseSchema = z
  .object({
    knowledgeBaseId: z.string(),
    tenantId: z.string().nullish(),
    ownerUserId: z.string().nullish(),
    name: z.string(),
    description: z.string().nullish(),
    icon: z.string().nullish(),
    color: z.string().nullish(),
    documentCount: z.number().nullish(),
    createTime: z.string().nullish(),
    updateTime: z.string().nullish(),
  })
  .passthrough();
export const knowledgeBaseListSchema = z.array(knowledgeBaseSchema);

/** 文档（knowledge 页）：ID/文件名/大小/状态必须 */
export const documentSchema = z
  .object({
    documentId: z.string(),
    knowledgeBaseId: z.string().nullish(),
    knowledgeBaseName: z.string().nullish(),
    fileName: z.string(),
    fileExtension: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
    totalChars: z.number().nullish(),
    totalChunks: z.number().nullish(),
    sectionCount: z.number().nullish(),
    processingStatus: z.string(),
  })
  .passthrough();
export const documentListSchema = z.array(documentSchema);

/** 图片（knowledge 页）：ID/URL/大小必须 */
export const imageSchema = z
  .object({
    imageId: z.string(),
    fileName: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
    width: z.number().nullish(),
    height: z.number().nullish(),
    description: z.string().nullish(),
    imageUrl: z.string(),
    createdAt: z.string(),
  })
  .passthrough();
export const imageListSchema = z.array(imageSchema);

/** 用户分页（admin 页）：list/total/page/pageSize 是列表页命脉 */
export const userListSchema = z
  .object({
    list: z.array(z.object({}).passthrough()),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
  })
  .passthrough();
