import { render, screen, act, waitFor } from "@testing-library/react";
import { LiveAnnouncer } from "@/components/state/live-announcer";
import { announce, A11Y_ANNOUNCE_EVENT } from "@/lib/announce";

/**
 * LiveAnnouncer 契约测试（SELFLOOP4 loop-422，工单 0642/0643）：
 * 常驻 sr-only + role=status 区域；announce 事件驱动文本更新。
 */
describe("LiveAnnouncer", () => {
  it("常驻渲染 aria-live 区域（先于公告存在于 DOM）", () => {
    render(<LiveAnnouncer />);
    const region = screen.getByRole("status");
    expect(region.getAttribute("aria-live")).toBe("polite");
    expect(region.className).toContain("sr-only");
    expect(region.textContent).toBe("");
  });

  it("announce() 驱动区域文本更新（重公告：同消息两次也更新）", async () => {
    render(<LiveAnnouncer />);
    act(() => {
      announce("回复生成完成");
    });
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("回复生成完成"));

    act(() => {
      window.dispatchEvent(new CustomEvent(A11Y_ANNOUNCE_EVENT, { detail: "回复生成完成" }));
    });
    // 第二次同消息：清空后重写，最终文本仍在（rAF 时序）
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("回复生成完成"));
  });
});
