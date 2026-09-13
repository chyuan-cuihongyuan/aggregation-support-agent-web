/**
 * not-found.tsx 渲染测试（SELFLOOP2 loop-248；断言风格对齐本仓——不依赖 jest-dom）。
 */
import { render, screen } from "@testing-library/react";
import NotFound from "@/app/not-found";

describe("not-found 404 页", () => {
  it("展示 404 主视觉与页面不存在文案", () => {
    render(<NotFound />);
    expect(screen.getByText("404")).toBeTruthy();
    expect(screen.getByText("页面不存在")).toBeTruthy();
  });

  it("提供返回首页链接", () => {
    render(<NotFound />);
    const link = screen.getByRole("link", { name: "返回首页" });
    expect(link.getAttribute("href")).toBe("/");
  });
});
