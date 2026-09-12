/**
 * AUTOLOOP al-34 / 工单 1034：状态组件 a11y 冒烟（obs-web al-25 模式推广）。
 * 借鉴 dequelabs/axe-core：a11y 是可测试属性，组件级冒烟先于全页审计。
 */

import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

import { EmptyState } from "@/components/state/empty-state";
import { ErrorState } from "@/components/state/error-state";
import { LoadingState } from "@/components/state/loading-state";

expect.extend(toHaveNoViolations);

describe("状态组件 a11y 冒烟", () => {
  it("EmptyState 无可访问性违规", async () => {
    const { container } = render(<EmptyState />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("ErrorState 无可访问性违规（含重试按钮）", async () => {
    const { container } = render(
      <ErrorState message="加载失败" onRetry={() => undefined} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("LoadingState 无可访问性违规", async () => {
    const { container } = render(<LoadingState title="加载中" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
