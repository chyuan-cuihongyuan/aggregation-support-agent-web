/**
 * error.tsx / global-error.tsx 边界测试（BORROWLOOP b-36，vercel/next.js
 * file-conventions 惯例；obs-web loop-222 同款外部行为锁定）。
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorBoundary from "@/app/error";
import GlobalError from "@/app/global-error";

function makeError(overrides: Partial<Error & { digest?: string }> = {}) {
  return Object.assign(new Error("渲染失败"), overrides) as Error & { digest?: string };
}

describe("error.tsx 错误边界组件", () => {
  it("渲染错误标题与消息摘要", () => {
    render(<ErrorBoundary error={makeError()} reset={jest.fn()} />);

    expect(screen.getByText("页面渲染出错")).toBeTruthy();
    expect(screen.getByText("渲染失败")).toBeTruthy();
  });

  it("空消息回退未知错误文案", () => {
    render(<ErrorBoundary error={makeError({ message: "" })} reset={jest.fn()} />);

    expect(screen.getByText("未知错误")).toBeTruthy();
  });

  it("digest 存在时展示（排障关联）", () => {
    render(<ErrorBoundary error={makeError({ digest: "abc123" })} reset={jest.fn()} />);

    expect(screen.getByText(/digest: abc123/)).toBeTruthy();
  });

  it("点击重试触发 reset 回调", async () => {
    const reset = jest.fn();
    const user = userEvent.setup();
    render(<ErrorBoundary error={makeError()} reset={reset} />);

    await user.click(screen.getByRole("button", { name: "重试" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});

describe("global-error.tsx 全局兜底组件", () => {
  it("渲染严重错误标题与自洽提示", () => {
    render(<GlobalError error={makeError()} reset={jest.fn()} />);

    expect(screen.getByText("应用发生严重错误")).toBeTruthy();
    expect(screen.getByText(/全局布局渲染失败/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "重试" })).toBeTruthy();
  });

  it("点击重试触发 reset 回调", async () => {
    const reset = jest.fn();
    const user = userEvent.setup();
    render(<GlobalError error={makeError()} reset={reset} />);

    await user.click(screen.getByRole("button", { name: "重试" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
