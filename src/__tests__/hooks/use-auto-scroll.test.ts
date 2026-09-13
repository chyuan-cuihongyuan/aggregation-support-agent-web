/**
 * useAutoScroll 跟随滚动契约（SELFLOOP2 loop-243，L03）。
 * 探针组件挂真实 DOM；布局属性用 Object.defineProperty 桩（jsdom 无布局）。
 * 本文件为 .ts：探针用 React.createElement（避免 JSX 后缀要求）。
 */
import { render } from "@testing-library/react";
import React from "react";
import { useAutoScroll } from "@/hooks/use-auto-scroll";

function stubLayout(
  el: HTMLElement,
  scrollHeight: number,
  scrollTop: number,
  clientHeight: number
) {
  Object.defineProperty(el, "scrollHeight", { value: scrollHeight, configurable: true });
  Object.defineProperty(el, "scrollTop", { value: scrollTop, configurable: true });
  Object.defineProperty(el, "clientHeight", { value: clientHeight, configurable: true });
}

type AutoScrollApi = ReturnType<typeof useAutoScroll>;
type ApiRef = { current: AutoScrollApi | null };

// jsdom 未实现 scrollIntoView：原型 polyfill 供首帧 effect 调用
Element.prototype.scrollIntoView = function scrollIntoView() {};

interface ProbeProps {
  deps: unknown[];
  apiRef: ApiRef;
}

/** 探针：暴露 hook 返回值与真实 DOM 引用 */
function Probe({ deps, apiRef }: ProbeProps) {
  const api = useAutoScroll(deps);
  apiRef.current = api;
  return React.createElement(
    "div",
    { ref: api.containerRef, onScroll: api.handleScroll, "data-testid": "container" },
    React.createElement("div", { ref: api.bottomRef, "data-testid": "bottom" })
  );
}

function setup() {
  const apiRef: ApiRef = { current: null };
  const view = render(React.createElement(Probe, { deps: [["a"]], apiRef }));
  const api = apiRef.current!;
  const bottom = view.getByTestId("bottom") as HTMLDivElement & {
    scrollIntoView: jest.Mock;
  };
  bottom.scrollIntoView = jest.fn();
  return { apiRef, api, view, bottom };
}

describe("useAutoScroll 跟随滚动契约", () => {
  it("贴底时 deps 变化自动 scrollIntoView", () => {
    const { apiRef, view, bottom } = setup();
    const container = view.getByTestId("container");
    stubLayout(container, 1000, 920, 80);

    view.rerender(React.createElement(Probe, { deps: [["a", "b"]], apiRef }));
    expect(bottom.scrollIntoView).toHaveBeenCalled();
  });

  it("上翻后 deps 变化不强制滚动；滚回底部恢复跟随", () => {
    const { apiRef, api, view, bottom } = setup();
    const container = view.getByTestId("container");

    // 首轮贴底滚动后模拟上翻 500px
    stubLayout(container, 1000, 0, 500);
    api.handleScroll();
    bottom.scrollIntoView.mockClear();
    view.rerender(React.createElement(Probe, { deps: [["a", "b"]], apiRef }));
    expect(bottom.scrollIntoView).not.toHaveBeenCalled();

    // 滚回底部恢复
    stubLayout(container, 1000, 920, 80);
    api.handleScroll();
    view.rerender(React.createElement(Probe, { deps: [["a", "b", "c"]], apiRef }));
    expect(bottom.scrollIntoView).toHaveBeenCalled();
  });

  it("scrollToBottom 强制回底", () => {
    const { api, bottom } = setup();
    bottom.scrollIntoView.mockClear();
    api.scrollToBottom("auto");
    expect(bottom.scrollIntoView).toHaveBeenCalledWith({ behavior: "auto" });
  });
});
