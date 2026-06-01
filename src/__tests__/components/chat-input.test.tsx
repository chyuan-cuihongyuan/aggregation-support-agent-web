import { fireEvent, render, screen } from "@testing-library/react";
import { ChatInput } from "@/components/chat/chat-input";

const defaultProps = {
  onSend: jest.fn(),
  agents: [{ agentId: "200001", agentName: "RAG 智能问答", agentDesc: "" }],
  selectedAgentId: "200001",
  onAgentChange: jest.fn(),
};

describe("ChatInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("中文输入法组合态下按 Enter 不发送消息", () => {
    const onSend = jest.fn();
    render(<ChatInput {...defaultProps} onSend={onSend} />);

    const textarea = screen.getByPlaceholderText("输入消息，按 Enter 发送...");
    fireEvent.change(textarea, { target: { value: "崔洪源" } });
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", isComposing: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it("compositionStart 到 compositionEnd 期间按 Enter 不发送消息", () => {
    const onSend = jest.fn();
    render(<ChatInput {...defaultProps} onSend={onSend} />);

    const textarea = screen.getByPlaceholderText("输入消息，按 Enter 发送...");
    fireEvent.change(textarea, { target: { value: "崔洪源" } });
    fireEvent.compositionStart(textarea);
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", isComposing: false });

    expect(onSend).not.toHaveBeenCalled();

    fireEvent.compositionEnd(textarea);
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", isComposing: false });

    expect(onSend).toHaveBeenCalledWith("崔洪源");
  });

  it("非输入法组合态下按 Enter 发送消息", () => {
    const onSend = jest.fn();
    render(<ChatInput {...defaultProps} onSend={onSend} />);

    const textarea = screen.getByPlaceholderText("输入消息，按 Enter 发送...");
    fireEvent.change(textarea, { target: { value: "崔洪源有几段实习经历" } });
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", isComposing: false });

    expect(onSend).toHaveBeenCalledWith("崔洪源有几段实习经历");
  });

  it("按上下箭头切换已发送输入历史", () => {
    render(<ChatInput {...defaultProps} />);

    const textarea = screen.getByPlaceholderText("输入消息，按 Enter 发送...") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "第一条问题" } });
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", isComposing: false });
    fireEvent.change(textarea, { target: { value: "第二条问题" } });
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", isComposing: false });

    fireEvent.keyDown(textarea, { key: "ArrowUp", code: "ArrowUp" });
    expect(textarea.value).toBe("第二条问题");

    fireEvent.keyDown(textarea, { key: "ArrowUp", code: "ArrowUp" });
    expect(textarea.value).toBe("第一条问题");

    fireEvent.keyDown(textarea, { key: "ArrowDown", code: "ArrowDown" });
    expect(textarea.value).toBe("第二条问题");

    fireEvent.keyDown(textarea, { key: "ArrowDown", code: "ArrowDown" });
    expect(textarea.value).toBe("");
  });

  it("历史切换后按下箭头恢复未发送草稿", () => {
    render(<ChatInput {...defaultProps} />);

    const textarea = screen.getByPlaceholderText("输入消息，按 Enter 发送...") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "已发送问题" } });
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", isComposing: false });
    fireEvent.change(textarea, { target: { value: "未发送草稿" } });

    fireEvent.keyDown(textarea, { key: "ArrowUp", code: "ArrowUp" });
    expect(textarea.value).toBe("已发送问题");

    fireEvent.keyDown(textarea, { key: "ArrowDown", code: "ArrowDown" });
    expect(textarea.value).toBe("未发送草稿");
  });
});
