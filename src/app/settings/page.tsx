/**
 * 设置页面
 *
 * 左侧导航 + 右侧设置表单
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "next-themes";
import { usePluginStatus } from "@/hooks/use-plugin-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  User, Lock, Settings as SettingsIcon, Layers, Wrench, Terminal,
  Bell, Activity, FileText, ChevronLeft,
} from "lucide-react";

type NavKey = "profile" | "security" | "general" | "ai-config" | "plugins" | "ssh" | "notifications" | "aiops" | "about";

const NAV_GROUPS = [
  {
    label: "账户",
    items: [
      { key: "profile" as NavKey, label: "个人资料", icon: User },
      { key: "security" as NavKey, label: "安全设置", icon: Lock },
    ],
  },
  {
    label: "平台",
    items: [
      { key: "general" as NavKey, label: "通用设置", icon: SettingsIcon },
      { key: "ai-config" as NavKey, label: "AI 模型配置", icon: Layers },
      { key: "plugins" as NavKey, label: "插件管理", icon: Wrench },
      { key: "ssh" as NavKey, label: "SSH 连接", icon: Terminal },
    ],
  },
  {
    label: "通知",
    items: [
      { key: "notifications" as NavKey, label: "通知设置", icon: Bell },
      { key: "aiops" as NavKey, label: "AIOps 告警", icon: Activity },
    ],
  },
  {
    label: "系统",
    items: [
      { key: "about" as NavKey, label: "关于平台", icon: FileText },
    ],
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeNav, setActiveNav] = useState<NavKey>("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    nickname: "",
    email: "",
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        nickname: user.nickname || "",
        email: user.email || "",
      });
    }
  }, [user]);

  // 表单验证函数
  const validateForm = (): { valid: boolean; error?: string } => {
    if (!formData.nickname.trim()) {
      return { valid: false, error: "显示名称不能为空" };
    }
    if (formData.nickname.length > 50) {
      return { valid: false, error: "显示名称不能超过50个字符" };
    }
    if (!formData.email.trim()) {
      return { valid: false, error: "邮箱地址不能为空" };
    }
    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return { valid: false, error: "请输入有效的邮箱地址" };
    }
    return { valid: true };
  };

  // 保存用户信息
  const handleSaveProfile = async () => {
    const validation = validateForm();
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setIsSaving(true);
    try {
      await updateUser({
        nickname: formData.nickname,
        email: formData.email,
      });
      toast.success("保存成功");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !user) {
    return <div className="flex h-screen items-center justify-center bg-[var(--surface-bg)] text-[var(--text-muted)]">加载中...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--surface-bg)]">
      {/* 顶栏 */}
      <header className="h-14 border-b border-[var(--border-default)] dark:border-[#2a2a3a] bg-[var(--surface-main)] flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/chat")} className="h-8 w-8 text-[var(--text-secondary)]">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm font-bold text-[var(--text-primary)]">设置</span>
        </div>
        <Button
          variant="outline"
          className="h-8 text-[13px] gap-2 border-[var(--border-default)] dark:border-[#2a2a3a] text-[var(--text-secondary)]"
          onClick={async () => { await logout(); router.push("/login"); }}
        >
          退出登录
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧导航 */}
        <nav className="w-[240px] bg-[var(--surface-main)] border-r border-[var(--border-default)] dark:border-[#2a2a3a] p-3 overflow-y-auto shrink-0">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="px-3 py-3 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">{group.label}</div>
              {group.items.map((item) => (
                <div
                  key={item.key}
                  onClick={() => setActiveNav(item.key)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer mb-0.5 text-[13px] transition-colors ${
                    activeNav === item.key
                      ? "bg-red-50 dark:bg-[#e63946]/10 text-[var(--brand-accent)] font-semibold"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-card)] dark:hover:bg-[#22222e]"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* 右侧设置内容 */}
        <main className="flex-1 overflow-y-auto p-8">
          {activeNav === "profile" && (
            <>
              <h1 className="text-[24px] font-bold text-[var(--text-primary)] mb-1">个人资料</h1>
              <p className="text-[14px] text-[var(--text-secondary)] mb-8">管理你的账户信息和个人偏好</p>

              <div className="bg-[var(--surface-main)] border border-[var(--border-default)] dark:border-[#2a2a3a] rounded-xl overflow-hidden mb-5">
                <div className="flex items-center gap-4 p-5 border-b border-[var(--border-default)] dark:border-[#2a2a3a]">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand-gradient-start)] to-[var(--brand-gradient-end)] flex items-center justify-center text-white text-2xl font-bold">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[18px] font-bold text-[var(--text-primary)]">{user.nickname || user.username}</div>
                    <div className="text-[13px] text-[var(--text-secondary)]">系统管理员 · {user.email || `${user.username}@example.com`}</div>
                  </div>
                </div>
                {[
                  { label: "用户名", desc: "用于登录的账号名称", value: user.username, disabled: true },
                  { label: "显示名称", desc: "在界面上显示的名称", value: formData.nickname, field: "nickname" as const },
                  { label: "邮箱地址", desc: "用于接收通知", value: formData.email, field: "email" as const },
                ].map((field) => (
                  <div key={field.label} className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)] dark:border-[#2a2a3a] last:border-b-0">
                    <div>
                      <div className="text-[14px] font-medium text-[var(--text-primary)]">{field.label}</div>
                      <div className="text-[12px] text-[var(--text-muted)]">{field.desc}</div>
                    </div>
                    <Input
                      value={field.value}
                      disabled={field.disabled}
                      onChange={(e) => {
                        if (field.field) {
                          setFormData(prev => ({ ...prev, [field.field!]: e.target.value }));
                        }
                      }}
                      className="h-9 min-w-[200px] bg-[var(--surface-card)] dark:bg-[#22222e] border-[var(--border-default)] dark:border-[#2a2a3a] rounded-lg text-[13px]"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <Button
                  className="h-9 px-4 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white rounded-lg text-[13px]"
                  disabled={isSaving}
                  onClick={handleSaveProfile}
                >
                  {isSaving ? "保存中..." : "保存修改"}
                </Button>
              </div>
            </>
          )}

          {activeNav === "general" && (
            <>
              <h1 className="text-[24px] font-bold text-[var(--text-primary)] mb-1">偏好设置</h1>
              <p className="text-[14px] text-[var(--text-secondary)] mb-8">自定义你的使用体验</p>

              <div className="bg-[var(--surface-main)] border border-[var(--border-default)] dark:border-[#2a2a3a] rounded-xl overflow-hidden mb-5">
                {[
                  {
                    label: "主题模式",
                    desc: "选择界面主题",
                    type: "select" as const,
                    options: [
                      { value: "system", label: "跟随系统" },
                      { value: "light", label: "浅色模式" },
                      { value: "dark", label: "深色模式" },
                    ],
                    currentValue: theme || "dark",
                    onChange: (v: string) => setTheme(v),
                  },
                  {
                    label: "发送方式",
                    desc: "设置消息发送快捷键",
                    type: "select" as const,
                    options: [
                      { value: "enter", label: "Enter 发送，Shift+Enter 换行" },
                      { value: "ctrl-enter", label: "Ctrl+Enter 发送，Enter 换行" },
                    ],
                    currentValue: "enter",
                    onChange: () => {},
                  },
                ].map((setting) => (
                  <div key={setting.label} className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)] dark:border-[#2a2a3a] last:border-b-0">
                    <div>
                      <div className="text-[14px] font-medium text-[var(--text-primary)]">{setting.label}</div>
                      <div className="text-[12px] text-[var(--text-muted)]">{setting.desc}</div>
                    </div>
                    <select
                      value={setting.currentValue}
                      onChange={(e) => setting.onChange(e.target.value)}
                      className="h-9 min-w-[200px] px-3 text-[13px] font-family-inherit bg-[var(--surface-card)] dark:bg-[#22222e] border border-[var(--border-default)] dark:border-[#2a2a3a] rounded-lg outline-none cursor-pointer appearance-none"
                    >
                      {setting.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeNav === "ai-config" && (
            <>
              <h1 className="text-[24px] font-bold text-[var(--text-primary)] mb-1">AI 模型配置</h1>
              <p className="text-[14px] text-[var(--text-secondary)] mb-8">配置 AI 模型参数和 API 连接</p>

              <div className="bg-[var(--surface-main)] border border-[var(--border-default)] dark:border-[#2a2a3a] rounded-xl overflow-hidden mb-5">
                {[
                  { label: "API 基础地址", desc: "后端 API 服务器地址", value: "http://127.0.0.1:8091" },
                  { label: "温度参数", desc: "控制 AI 回答的创造性 (0-1)", value: "0.7" },
                ].map((field) => (
                  <div key={field.label} className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)] dark:border-[#2a2a3a] last:border-b-0">
                    <div>
                      <div className="text-[14px] font-medium text-[var(--text-primary)]">{field.label}</div>
                      <div className="text-[12px] text-[var(--text-muted)]">{field.desc}</div>
                    </div>
                    <Input
                      defaultValue={field.value}
                      className="h-9 min-w-[260px] bg-[var(--surface-card)] dark:bg-[#22222e] border-[var(--border-default)] dark:border-[#2a2a3a] rounded-lg text-[13px]"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {activeNav === "plugins" && <PluginsSection />}

          {/* 默认占位 */}
          {!["profile", "general", "ai-config", "plugins"].includes(activeNav) && (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
              <SettingsIcon className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-[14px]">{NAV_GROUPS.flatMap(g => g.items).find(i => i.key === activeNav)?.label || "设置"}页面开发中...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/** 插件管理区块 */
function PluginsSection() {
  const { status } = usePluginStatus();

  const pluginList = status
    ? [
        ...Object.entries(status.builtIn || {}).map(([id, p]) => ({
          id, name: id, enabled: p.enabled, type: "builtin" as const,
        })),
        ...(status.mcpServers || []).map((s) => ({
          id: s.id, name: s.name, enabled: s.enabled, type: "mcp" as const,
        })),
        ...(status.customTools || []).map((t) => ({
          id: t.id, name: t.name, enabled: t.enabled, type: "custom" as const,
        })),
      ]
    : [];

  return (
    <>
      <h1 className="text-[24px] font-bold text-[var(--text-primary)] mb-1">插件管理</h1>
      <p className="text-[14px] text-[var(--text-secondary)] mb-8">管理已安装的插件和扩展</p>

      <div className="bg-[var(--surface-main)] border border-[var(--border-default)] dark:border-[#2a2a3a] rounded-xl overflow-hidden">
        {pluginList.length === 0 && (
          <div className="p-8 text-center text-[14px] text-[var(--text-muted)]">暂无可用插件</div>
        )}
        {pluginList.map((plugin) => (
          <div key={plugin.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--border-default)] dark:border-[#2a2a3a] last:border-b-0">
            <div className="w-10 h-10 rounded-lg bg-[var(--surface-card)] dark:bg-[#22222e] flex items-center justify-center text-lg">
              {plugin.type === "builtin" ? "🔌" : plugin.type === "mcp" ? "🌐" : "🔧"}
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-[var(--text-primary)]">{plugin.name}</div>
              <div className="text-[11px] text-[var(--text-muted)]">{plugin.type === "builtin" ? "内置插件" : plugin.type === "mcp" ? "MCP 服务" : "自定义工具"}</div>
            </div>
            <div className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${plugin.enabled ? "bg-[var(--brand-accent)]" : "bg-[var(--border-default)] dark:bg-[#3a3a4a]"}`}>
              <span className={`absolute top-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform ${plugin.enabled ? "left-[22px]" : "left-[2px]"}`} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
