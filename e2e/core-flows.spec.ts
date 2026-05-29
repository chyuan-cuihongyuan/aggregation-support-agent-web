import { expect, test } from "@playwright/test";

const success = (data: unknown) => ({
  code: "0000",
  info: "success",
  data,
});

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/user/info", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      headers: { "set-cookie": "auth_token=e2e-token; Path=/; SameSite=Lax" },
      body: JSON.stringify(success({
        id: 1,
        username: "admin",
        nickname: "管理员",
        role: "admin",
        status: 1,
      })),
    });
  });

  await page.route("**/api/v1/query_ai_agent_config_list", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(success([
        { agentId: "agent-1", agentName: "默认智能体", agentDesc: "测试智能体" },
      ])),
    });
  });

  await page.route("**/api/v1/chat_history/**", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(success([])) });
  });
  await page.route("**/api/v1/create_session", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(success({ sessionId: "session-e2e" })),
    });
  });
  await page.route("**/api/v1/plugins/status", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(success({
        builtIn: {
          knowledge: { available: true, enabled: true },
          aiops: { available: true, enabled: true },
          export: { available: true, enabled: true },
          history: { available: true, enabled: true },
        },
        mcpServers: [],
        customTools: [],
      })),
    });
  });
});

test("login page submits credentials and enters chat", async ({ page }) => {
  await page.route("**/api/v1/auth/login", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(success({
        id: 1,
        username: "admin",
        nickname: "管理员",
        role: "admin",
        status: 1,
      })),
    });
  });

  await page.goto("/login");
  await page.getByPlaceholder("请输入用户名").fill("admin");
  await page.getByPlaceholder("请输入密码").fill("admin");
  await page.getByRole("button", { name: /^登\s*录$/ }).click();

  await expect(page).toHaveURL(/\/chat$/);
});

test("chat page loads agent list and input surface", async ({ page }) => {
  await page.context().addCookies([{
    name: "auth_token",
    value: "e2e-token",
    domain: "127.0.0.1",
    path: "/",
  }]);

  await page.goto("/chat");

  await expect(page.getByText("默认智能体").first()).toBeVisible();
  await expect(page.getByRole("textbox").first()).toBeVisible();
});
