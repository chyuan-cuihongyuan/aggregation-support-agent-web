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
]);

export default eslintConfig;
