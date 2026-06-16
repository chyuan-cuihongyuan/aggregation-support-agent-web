import { test, expect } from '@playwright/test';

/**
 * 核心用户场景端到端测试
 * 
 * 测试场景：
 * 1. 用户登录
 * 2. 创建对话会话
 * 3. 发送消息并接收响应
 * 4. 查看对话历史
 * 5. 知识库检索
 */

test.describe('用户认证流程', () => {
  test('应该能够访问登录页面', async ({ page }) => {
    await page.goto('/');
    
    // 验证页面加载成功
    await expect(page).toHaveTitle(/.*智能助手.*|.*Agent.*/);
  });

  test('应该能够登录系统', async ({ page }) => {
    await page.goto('/login');
    
    // 填写登录表单
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'test123');
    
    // 点击登录按钮
    await page.click('button[type="submit"]');
    
    // 验证登录成功（跳转到主页）
    await expect(page).toHaveURL(/.*\/(chat|dashboard).*/);
  });

  test('登录失败应该显示错误提示', async ({ page }) => {
    await page.goto('/login');
    
    // 填写错误的凭据
    await page.fill('input[name="username"]', 'wronguser');
    await page.fill('input[name="password"]', 'wrongpass');
    
    // 点击登录按钮
    await page.click('button[type="submit"]');
    
    // 验证显示错误提示
    await expect(page.locator('.error-message, .toast-error')).toBeVisible();
  });
});

test.describe('对话功能', () => {
  test.beforeEach(async ({ page }) => {
    // 假设已登录，设置认证状态
    await page.goto('/chat');
  });

  test('应该能够创建新对话', async ({ page }) => {
    // 点击新建对话按钮
    await page.click('button:has-text("新建对话"), button:has-text("New Chat")');
    
    // 验证对话创建成功
    await expect(page.locator('.chat-container, .conversation-panel')).toBeVisible();
  });

  test('应该能够发送消息并接收响应', async ({ page }) => {
    await page.goto('/chat');
    
    // 输入消息
    const messageInput = page.locator('textarea[placeholder*="输入"], input[placeholder*="消息"]');
    await messageInput.fill('你好，请介绍一下你自己');
    
    // 发送消息
    await page.click('button:has-text("发送"), button[type="submit"]');
    
    // 验证消息已发送
    await expect(page.locator('.message-user, .user-message')).toContainText('你好');
    
    // 等待 AI 响应（最多 30 秒）
    await expect(page.locator('.message-assistant, .ai-message')).toBeVisible({ timeout: 30000 });
  });

  test('应该能够查看对话历史', async ({ page }) => {
    await page.goto('/chat');
    
    // 验证侧边栏显示历史对话
    await expect(page.locator('.sidebar, .history-panel')).toBeVisible();
    
    // 验证有历史对话列表
    const historyItems = page.locator('.history-item, .conversation-item');
    await expect(historyItems.first()).toBeVisible();
  });

  test('应该能够切换历史对话', async ({ page }) => {
    await page.goto('/chat');
    
    // 点击历史对话
    const historyItem = page.locator('.history-item, .conversation-item').first();
    await historyItem.click();
    
    // 验证对话内容加载
    await expect(page.locator('.message-list, .chat-messages')).toBeVisible();
  });
});

test.describe('知识库检索', () => {
  test('应该能够访问知识库页面', async ({ page }) => {
    await page.goto('/knowledge');
    
    // 验证知识库页面加载
    await expect(page.locator('.knowledge-base-container, .rag-page')).toBeVisible();
  });

  test('应该能够上传文档', async ({ page }) => {
    await page.goto('/knowledge');
    
    // 点击上传按钮
    await page.click('button:has-text("上传"), button:has-text("Upload")');
    
    // 选择文件
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-files/sample.pdf');
    
    // 验证上传成功
    await expect(page.locator('.upload-success, .document-item')).toBeVisible({ timeout: 10000 });
  });

  test('应该能够执行知识库检索', async ({ page }) => {
    await page.goto('/knowledge');
    
    // 输入检索查询
    const searchInput = page.locator('input[placeholder*="搜索"], input[placeholder*="检索"]');
    await searchInput.fill('测试查询');
    
    // 点击搜索按钮
    await page.click('button:has-text("搜索"), button:has-text("Search")');
    
    // 验证检索结果显示
    await expect(page.locator('.search-results, .retrieval-results')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('监控面板', () => {
  test('应该能够访问监控页面', async ({ page }) => {
    await page.goto('/monitor');
    
    // 验证监控页面加载
    await expect(page.locator('.monitor-container, .dashboard-page')).toBeVisible();
  });

  test('应该能够查看 Trace 列表', async ({ page }) => {
    await page.goto('/monitor');
    
    // 验证 Trace 列表显示
    await expect(page.locator('.trace-list, .trace-table')).toBeVisible();
    
    // 验证有 Trace 数据
    const traceItems = page.locator('.trace-item, .trace-row');
    await expect(traceItems.first()).toBeVisible();
  });

  test('应该能够查看 Trace 详情', async ({ page }) => {
    await page.goto('/monitor');
    
    // 点击第一个 Trace
    const traceItem = page.locator('.trace-item, .trace-row').first();
    await traceItem.click();
    
    // 验证 Trace 详情页面
    await expect(page.locator('.trace-detail, .trace-waterfall')).toBeVisible();
  });

  test('应该能够查看性能指标', async ({ page }) => {
    await page.goto('/monitor');
    
    // 验证性能指标卡片显示
    await expect(page.locator('.metric-card, .performance-card')).toBeVisible();
    
    // 验证指标数据
    await expect(page.locator('.metric-value')).not.toBeEmpty();
  });
});

test.describe('响应式设计', () => {
  test('移动端应该能够正常使用', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // 验证页面正常显示
    await expect(page.locator('body')).toBeVisible();
    
    // 验证导航菜单可访问
    await page.click('button.menu-toggle, .hamburger-menu');
    await expect(page.locator('.mobile-menu, .sidebar')).toBeVisible();
  });

  test('平板端应该能够正常使用', async ({ page }) => {
    // 设置平板视口
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    
    // 验证页面正常显示
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('错误处理', () => {
  test('网络错误应该显示友好提示', async ({ page }) => {
    // 模拟网络错误
    await page.route('**/api/**', route => route.abort());
    
    await page.goto('/chat');
    
    // 尝试发送消息
    const messageInput = page.locator('textarea[placeholder*="输入"]');
    await messageInput.fill('测试消息');
    await page.click('button:has-text("发送")');
    
    // 验证显示错误提示
    await expect(page.locator('.error-message, .toast-error')).toBeVisible({ timeout: 5000 });
  });

  test('404 页面应该正确显示', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // 验证 404 页面
    await expect(page.locator('.not-found, .error-404')).toBeVisible();
  });
});
