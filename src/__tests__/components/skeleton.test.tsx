/**
 * 骨架渲染测试（SELFLOOP2 loop-240，obs-web loop-231 同款断言面；
 * 断言风格对齐本仓既有测试——不依赖 jest-dom 匹配器）。
 */
import { render, screen } from "@testing-library/react";
import Loading from "@/app/loading";
import { Skeleton } from "@/components/ui/skeleton";

describe("loading.tsx 路由骨架", () => {
  it("容器标记 aria-busy 与加载标签", () => {
    render(<Loading />);
    const region = screen.getByLabelText("加载中");
    expect(region.getAttribute("aria-busy")).toBe("true");
  });

  it("渲染卡片骨架×3 + 面板骨架（animate-pulse 块 ≥ 11）", () => {
    const { container } = render(<Loading />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThanOrEqual(11);
  });
});

describe("Skeleton 组件", () => {
  it("合并自定义 className 并保留基础类", () => {
    const { container } = render(<Skeleton className="h-8 w-16 extra" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain("animate-pulse");
    expect(el.className).toContain("bg-muted");
    expect(el.className).toContain("extra");
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });
});
