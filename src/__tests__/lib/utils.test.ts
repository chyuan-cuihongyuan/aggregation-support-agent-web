/**
 * 工具函数单元测试
 *
 * 覆盖 cn() CSS 类合并函数
 */

import { cn } from "@/lib/utils";

// ==================== 测试用例 ====================

describe("工具函数", () => {
  describe("cn", () => {
    it("应该合并多个 CSS 类名", () => {
      const result = cn("px-4", "py-2", "bg-blue-500");

      expect(result).toBe("px-4 py-2 bg-blue-500");
    });

    it("应该正确处理条件类名（truthy/falsy）", () => {
      const isActive = true;
      const isDisabled = false;

      const result = cn(
        "base-class",
        isActive && "active",
        isDisabled && "disabled"
      );

      expect(result).toBe("base-class active");
      expect(result).not.toContain("disabled");
    });

    it("应该去重冲突的 Tailwind 类（twMerge 功能）", () => {
      // px-4 和 px-6 是冲突的，twMerge 应该保留后者
      const result = cn("px-4", "px-6");

      expect(result).toBe("px-6");
    });

    it("应该去重冲突的间距类", () => {
      // p-2 和 p-4 冲突，保留后者
      const result = cn("p-2", "p-4");

      expect(result).toBe("p-4");
    });

    it("应该处理空输入", () => {
      const result = cn();

      expect(result).toBe("");
    });

    it("应该处理 undefined 和 null 输入", () => {
      const result = cn("base", undefined, null, "extra");

      expect(result).toBe("base extra");
    });

    it("应该处理对象形式的类名映射", () => {
      const result = cn({
        "font-bold": true,
        "font-normal": false,
        "text-red-500": true,
      });

      expect(result).toBe("font-bold text-red-500");
      expect(result).not.toContain("font-normal");
    });

    it("应该处理数组形式的类名", () => {
      const result = cn(["px-4", "py-2"], "bg-white");

      expect(result).toBe("px-4 py-2 bg-white");
    });

    it("应该正确合并冲突的颜色类", () => {
      // text-red-500 和 text-blue-500 冲突
      const result = cn("text-red-500", "text-blue-500");

      expect(result).toBe("text-blue-500");
    });

    it("应该处理复杂的混合输入场景", () => {
      const isPrimary = true;
      const isLarge = false;

      const result = cn(
        "rounded-md",
        {
          "bg-primary": isPrimary,
          "bg-secondary": !isPrimary,
          "text-lg": isLarge,
        },
        isPrimary && "text-white",
        undefined
      );

      expect(result).toContain("rounded-md");
      expect(result).toContain("bg-primary");
      expect(result).toContain("text-white");
      expect(result).not.toContain("bg-secondary");
      expect(result).not.toContain("text-lg");
    });
  });
});
