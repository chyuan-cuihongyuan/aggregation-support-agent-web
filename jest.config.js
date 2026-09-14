/* eslint-disable @typescript-eslint/no-require-imports */
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // 指向 Next.js 应用的路径
  dir: "./",
});

/** @type {import('jest').Config} */
const config = {
  // 测试环境
  testEnvironment: "jsdom",

  // 测试文件匹配模式
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}", "<rootDir>/src/**/__tests__/**/*.{ts,tsx}"],

  // 模块名映射（处理路径别名）
  // marked 仅发布 ESM（next/jest 的 transformIgnorePatterns 前置且不可让位），
  // 映射到 UMD 构建供 jest 消费（工单 1142）
  moduleNameMapper: {
    "^marked$": "<rootDir>/node_modules/marked/lib/marked.umd.js",
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // 设置文件
  setupFiles: ["<rootDir>/jest.polyfills.js"],

  // 转换配置
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },

  // 忽略转换的模块
  transformIgnorePatterns: ["/node_modules/(?!(@radix-ui|lucide-react|next)/)"],
};

module.exports = createJestConfig(config);
