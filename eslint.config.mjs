import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // 迁移自 .eslintignore 的忽略规则
  globalIgnores([
    // Dependencies
    "node_modules/**",
    
    // Production build
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    
    // Git worktrees (development artifacts)
    ".worktrees/**",
    
    // Environment files
    ".env.local",
    ".env.*.local",
    
    // IDE
    ".vscode/**",
    ".idea/**",
    "*.swp",
    "*.swo",
    
    // OS
    ".DS_Store",
    "Thumbs.db",
    
    // Testing
    "coverage/**",
    ".nyc_output/**",
    
    // Misc
    "*.log",
    "*.tsbuildinfo",
  ]),
  // AUTOLOOP al-32 / 工单 1032：分层边界（借鉴 import-js/eslint-plugin-import 的
  // layer 约束思想，用内建 no-restricted-imports 零依赖实现）
  {
    files: ["src/lib/**/*.{ts,tsx}", "src/types/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/*", "@/app/*", "@/hooks/*"],
              message: "lib/types 是分层叶子，不得反向依赖上层（components/app/hooks）",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app/*"],
              message: "组件不得依赖页面内部（app/），保持组件可复用",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
