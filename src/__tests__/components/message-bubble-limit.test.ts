/**
 * 渲染长度护栏契约（SELFLOOP2 loop-247）。
 */
import { enforceContentLimit } from "@/components/chat/message-bubble";

describe("enforceContentLimit 长度护栏", () => {
  it("短内容原样透传", () => {
    expect(enforceContentLimit("正常内容")).toBe("正常内容");
  });

  it("超长内容截断并追加提示（含原始长度）", () => {
    const long = "x".repeat(25001);
    const out = enforceContentLimit(long);
    expect(out).toContain("[内容过长已截断渲染");
    expect(out).toContain("25001");
    expect(out.length).toBeLessThan(25001);
  });

  it("恰好 20000 字符不截断", () => {
    const edge = "y".repeat(20000);
    expect(enforceContentLimit(edge)).toBe(edge);
  });
});
