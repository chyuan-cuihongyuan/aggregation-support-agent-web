import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 端到端测试配置
 * 
 * 测试策略：
 * 1. 使用 Playwright 进行浏览器自动化测试
 * 2. 覆盖核心用户场景：登录、对话、知识库检索、监控查看
 * 3. 支持多浏览器测试（Chromium、Firefox、WebKit）
 * 4. 集成到 CI/CD 流水线
 */
export default defineConfig({
  // 测试目录
  testDir: './e2e',
  
  // 完全并行运行测试
  fullyParallel: true,
  
  // CI 环境下禁止 test.only
  forbidOnly: !!process.env.CI,
  
  // 失败重试次数
  retries: process.env.CI ? 2 : 0,
  
  // 并行工作线程数
  workers: process.env.CI ? 1 : undefined,
  
  // 测试报告器
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit-results.xml' }]
  ],
  
  // 所有测试的全局配置
  use: {
    // 基础 URL
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    // 收集失败测试的追踪信息
    trace: 'on-first-retry',
    
    // 截图策略
    screenshot: 'only-on-failure',
    
    // 视频录制
    video: 'retain-on-failure',
    
    // 默认超时
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
  
  // 配置测试项目
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // 移动端测试
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  // 在测试前启动开发服务器（可选）
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
  
  // 全局超时
  globalTimeout: process.env.CI ? 30 * 60 * 1000 : undefined,
  
  // 测试超时
  timeout: 30000,
});
