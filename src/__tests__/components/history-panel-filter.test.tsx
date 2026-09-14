/**
 * 历史记录客户端过滤测试（SELFLOOP3 loop-307，工单 0412/0413）：
 * 关键词命中 + 分组自动展开 + 空态提示。
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HistoryPanel } from "@/components/sidebar/history-panel";
import type { ChatHistoryDTO } from "@/types/api";

function history(overrides: Partial<ChatHistoryDTO>): ChatHistoryDTO {
  return {
    id: "id-1",
    userId: "u1",
    agentId: "a1",
    agentName: "运维助手",
    sessionId: "s1",
    question: "默认问题",
    answer: "答案",
    createTime: "2026-09-15 10:00:00",
    ...overrides,
  } as ChatHistoryDTO;
}

const histories = [
  history({ id: "h1", question: "如何重启服务器", agentName: "运维助手" }),
  history({ id: "h2", question: "查询订单状态", agentName: "业务助手" }),
];

describe("HistoryPanel 客户端过滤", () => {
  it("输入关键词后仅命中项可见且分组自动展开", async () => {
    const user = userEvent.setup();
    render(<HistoryPanel histories={histories} onLoad={jest.fn()} onClearAll={jest.fn()} />);

    await user.type(screen.getByLabelText("搜索历史记录"), "重启");

    expect(screen.getByText("如何重启服务器")).toBeTruthy();
    expect(screen.queryByText("查询订单状态")).toBeNull();
    expect(screen.getByText("历史记录 (1)")).toBeTruthy();
  });

  it("智能体名也可命中", async () => {
    const user = userEvent.setup();
    render(<HistoryPanel histories={histories} onLoad={jest.fn()} onClearAll={jest.fn()} />);

    await user.type(screen.getByLabelText("搜索历史记录"), "业务");

    expect(screen.getByText("查询订单状态")).toBeTruthy();
    expect(screen.queryByText("如何重启服务器")).toBeNull();
  });

  it("无命中显示空态提示", async () => {
    const user = userEvent.setup();
    render(<HistoryPanel histories={histories} onLoad={jest.fn()} onClearAll={jest.fn()} />);

    await user.type(screen.getByLabelText("搜索历史记录"), "不存在的词");

    expect(screen.getByText("无匹配历史记录")).toBeTruthy();
  });
});
