/**
 * AUTOLOOP al-07 / 工单 1007：响应边界校验单元测试（借鉴 colinhacks/zod，
 * 模式承 obs-web al-04，适配本仓 ApiError 签名）。
 */

import { parseWithSchema, ApiError, requestJson } from "@/lib/api";
import {
  agentConfigListSchema,
  knowledgeBaseListSchema,
  documentListSchema,
  userListSchema,
} from "@/lib/schemas";

describe("schemas 宽容式校验", () => {
  it("合法智能体配置通过且保留多余字段", () => {
    const data = [{ agentId: "a1", agentName: "运维助手", extra: "kept" }];
    expect(parseWithSchema(data, agentConfigListSchema)).toEqual(data);
  });

  it("agentName 类型错抛 ApiError(ESCHEMA) 带路径", () => {
    try {
      parseWithSchema([{ agentId: "a1", agentName: 42 }], agentConfigListSchema);
      throw new Error("should not reach");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).code).toBe("ESCHEMA");
      expect((e as ApiError).message).toContain("0.agentName");
    }
  });

  it("知识库可选字段缺失放行", () => {
    expect(
      parseWithSchema([{ knowledgeBaseId: "kb1", name: "运维手册" }], knowledgeBaseListSchema)
    ).toEqual([{ knowledgeBaseId: "kb1", name: "运维手册" }]);
    expect(() =>
      parseWithSchema([{ knowledgeBaseId: 7, name: "x" }], knowledgeBaseListSchema)
    ).toThrow(ApiError);
  });

  it("文档 fileSize 为字符串即失败", () => {
    const ok = [
      { documentId: "d1", fileName: "a.pdf", fileExtension: ".pdf", fileSize: 1, mimeType: "application/pdf", processingStatus: "success" },
    ];
    expect(parseWithSchema(ok, documentListSchema)).toHaveLength(1);
    expect(() =>
      parseWithSchema([{ ...ok[0], fileSize: "1024" }], documentListSchema)
    ).toThrow(/fileSize/);
  });

  it("用户分页结构：list 非数组即失败", () => {
    expect(() =>
      parseWithSchema({ list: {}, total: 1, page: 1, pageSize: 20 }, userListSchema)
    ).toThrow(ApiError);
    expect(
      parseWithSchema({ list: [{ userId: "u1" }], total: 1, page: 1, pageSize: 20 }, userListSchema).total
    ).toBe(1);
  });
});

describe("requestJson seam 集成（fetch mock）", () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  function mockFetchOnce(payload: unknown) {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ code: "0000", info: "success", data: payload }),
    } as Response);
  }

  it("结构性损坏在 requestJson 边界抛 ESCHEMA", async () => {
    mockFetchOnce([{ agentId: "a1", agentName: null }]);
    await expect(
      requestJson("/api/v1/query_ai_agent_config_list", { schema: agentConfigListSchema })
    ).rejects.toThrow(/响应结构校验失败/);
  });

  it("信封错误码优先于 schema 校验", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ code: "E0001", info: "未登录" }),
    } as Response);
    await expect(
      requestJson("/api/v1/knowledge-bases", { schema: knowledgeBaseListSchema })
    ).rejects.toThrow("未登录");
  });

  it("合法载荷通过 seam", async () => {
    mockFetchOnce([{ agentId: "a1", agentName: "助手" }]);
    const result = await requestJson("/api/v1/query_ai_agent_config_list", {
      schema: agentConfigListSchema,
    });
    expect(result).toEqual([{ agentId: "a1", agentName: "助手" }]);
  });
});
