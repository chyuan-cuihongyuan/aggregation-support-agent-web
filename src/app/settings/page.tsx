/**
 * 设置页面
 *
 * 左侧导航 + 右侧设置表单
 */

"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "next-themes";
import { usePluginStatus } from "@/hooks/use-plugin-status";
import { usePluginConfig } from "@/hooks/use-plugin-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/state/loading-state";
import { toast } from "sonner";
import {
  User,
  Lock,
  Settings as SettingsIcon,
  Layers,
  Wrench,
  Terminal,
  Bell,
  Activity,
  FileText,
  ChevronLeft,
  Save,
  LogOut,
  KeyRound,
  Server,
  Mail,
  ShieldCheck,
  Plug,
  Globe2,
  Code2,
  CircleCheck,
  CircleOff,
  CircleDot,
  Info,
  Monitor,
} from "lucide-react";
import {
  loadAppSettings,
  patchAppSettings,
  persistAppSettings,
  type AppSettings,
  type SendMode,
  type SeverityLevel,
} from "@/lib/app-settings";

// 禁止 build 时静态预渲染：SSR 时无 cookie/user 会导致 router.push 被缓存为 307
export const dynamic = "force-dynamic";

type NavKey =
  | "profile"
  | "security"
  | "general"
  | "ai-config"
  | "plugins"
  | "ssh"
  | "notifications"
  | "aiops"
  | "about";

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
    items: [{ key: "about" as NavKey, label: "关于平台", icon: FileText }],
  },
];

const BUILTIN_PLUGIN_NAMES: Record<string, string> = {
  knowledge: "知识库",
  aiops: "AIOps",
  export: "导出",
  history: "历史",
};

const selectClassName =
  "h-9 w-full sm:w-[260px] px-3 text-[13px] bg-[var(--surface-card)] dark:bg-[#22222e] border border-[var(--border-default)] dark:border-[#2a2a3a] rounded-lg outline-none cursor-pointer";

function severityLabel(value: SeverityLevel) {
  const labels: Record<SeverityLevel, string> = {
    info: "提示及以上",
    warning: "警告及以上",
    critical: "严重告警",
  };
  return labels[value];
}

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
  const [appSettings, setAppSettings] = useState<AppSettings>(() => loadAppSettings());

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  // 使用 useRef 跟踪用户数据是否已初始化
  const userInitializedRef = useRef(false);
  useEffect(() => {
    if (user && !userInitializedRef.current) {
      userInitializedRef.current = true;
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

  const updateSettings = <K extends keyof AppSettings>(
    section: K,
    patch: Partial<AppSettings[K]>
  ) => {
    setAppSettings((prev) => patchAppSettings(prev, section, patch));
  };

  const handleSaveSettings = () => {
    try {
      persistAppSettings(appSettings);
      toast.success("设置已保存");
    } catch {
      toast.error("保存设置失败，请检查浏览器存储权限");
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--surface-bg)]">
        <LoadingState className="py-0" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--surface-bg)]">
      {/* 顶栏 */}
      <header className="h-14 border-b border-[var(--border-default)] dark:border-[#2a2a3a] bg-[var(--surface-main)] flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="返回对话"
            onClick={() => router.push("/chat")}
            className="h-8 w-8 text-[var(--text-secondary)]"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm font-bold text-[var(--text-primary)]">设置</span>
        </div>
        <Button
          variant="outline"
          className="h-8 text-[13px] gap-2 border-[var(--border-default)] dark:border-[#2a2a3a] text-[var(--text-secondary)]"
          onClick={async () => {
            await logout();
            router.push("/login");
          }}
        >
          <LogOut className="w-3.5 h-3.5" />
          退出登录
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧导航 */}
        <nav className="w-[240px] bg-[var(--surface-main)] border-r border-[var(--border-default)] dark:border-[#2a2a3a] p-3 overflow-y-auto shrink-0">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="px-3 py-3 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                {group.label}
              </div>
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
              <p className="text-[14px] text-[var(--text-secondary)] mb-8">
                管理你的账户信息和个人偏好
              </p>

              <div className="bg-[var(--surface-main)] border border-[var(--border-default)] dark:border-[#2a2a3a] rounded-xl overflow-hidden mb-5">
                <div className="flex items-center gap-4 p-5 border-b border-[var(--border-default)] dark:border-[#2a2a3a]">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand-gradient-start)] to-[var(--brand-gradient-end)] flex items-center justify-center text-white text-2xl font-bold">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[18px] font-bold text-[var(--text-primary)]">
                      {user.nickname || user.username}
                    </div>
                    <div className="text-[13px] text-[var(--text-secondary)]">
                      系统管理员 · {user.email || `${user.username}@example.com`}
                    </div>
                  </div>
                </div>
                {[
                  {
                    label: "用户名",
                    desc: "用于登录的账号名称",
                    value: user.username,
                    disabled: true,
                  },
                  {
                    label: "显示名称",
                    desc: "在界面上显示的名称",
                    value: formData.nickname,
                    field: "nickname" as const,
                  },
                  {
                    label: "邮箱地址",
                    desc: "用于接收通知",
                    value: formData.email,
                    field: "email" as const,
                  },
                ].map((field) => (
                  <div
                    key={field.label}
                    className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)] dark:border-[#2a2a3a] last:border-b-0"
                  >
                    <div>
                      <div className="text-[14px] font-medium text-[var(--text-primary)]">
                        {field.label}
                      </div>
                      <div className="text-[12px] text-[var(--text-muted)]">{field.desc}</div>
                    </div>
                    <Input
                      value={field.value}
                      disabled={field.disabled}
                      onChange={(e) => {
                        if (field.field) {
                          setFormData((prev) => ({ ...prev, [field.field!]: e.target.value }));
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
            <GeneralSection
              settings={appSettings.general}
              theme={theme || "system"}
              onThemeChange={setTheme}
              onChange={(patch) => updateSettings("general", patch)}
              onSave={handleSaveSettings}
            />
          )}

          {activeNav === "security" && (
            <SecuritySection
              settings={appSettings.security}
              onChange={(patch) => updateSettings("security", patch)}
              onSave={handleSaveSettings}
            />
          )}

          {activeNav === "ai-config" && (
            <AiConfigSection
              settings={appSettings.ai}
              onChange={(patch) => updateSettings("ai", patch)}
              onSave={handleSaveSettings}
            />
          )}

          {activeNav === "ssh" && (
            <SshSection
              settings={appSettings.ssh}
              onChange={(patch) => updateSettings("ssh", patch)}
              onSave={handleSaveSettings}
            />
          )}

          {activeNav === "notifications" && (
            <NotificationsSection
              settings={appSettings.notifications}
              onChange={(patch) => updateSettings("notifications", patch)}
              onSave={handleSaveSettings}
            />
          )}

          {activeNav === "aiops" && (
            <AiopsSection
              settings={appSettings.aiops}
              onChange={(patch) => updateSettings("aiops", patch)}
              onSave={handleSaveSettings}
            />
          )}

          {activeNav === "plugins" && <PluginsSection />}

          {activeNav === "about" && <AboutSection />}
        </main>
      </div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <>
      <h1 className="text-[24px] font-bold text-[var(--text-primary)] mb-1">{title}</h1>
      <p className="text-[14px] text-[var(--text-secondary)] mb-8">{description}</p>
    </>
  );
}

function SettingsPanel({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[var(--surface-main)] border border-[var(--border-default)] dark:border-[#2a2a3a] rounded-xl overflow-hidden mb-5">
      {children}
    </div>
  );
}

function SettingRow({
  icon,
  label,
  desc,
  children,
}: {
  icon?: ReactNode;
  label: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 border-b border-[var(--border-default)] dark:border-[#2a2a3a] last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-[var(--surface-card)] dark:bg-[#22222e] border border-[var(--border-default)] dark:border-[#2a2a3a] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-[14px] font-medium text-[var(--text-primary)]">{label}</div>
          <div className="text-[12px] text-[var(--text-muted)]">{desc}</div>
        </div>
      </div>
      <div className="w-full sm:w-auto sm:min-w-[260px] flex justify-start sm:justify-end">
        {children}
      </div>
    </div>
  );
}

function SaveSettingsButton({ onSave }: { onSave: () => void }) {
  return (
    <Button
      className="h-9 px-4 gap-2 bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)] text-white rounded-lg text-[13px]"
      onClick={onSave}
    >
      <Save className="w-3.5 h-3.5" />
      保存设置
    </Button>
  );
}

function NumberInput({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <Input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-9 w-full sm:w-[260px] bg-[var(--surface-card)] dark:bg-[#22222e] border-[var(--border-default)] dark:border-[#2a2a3a] rounded-lg text-[13px]"
    />
  );
}

function GeneralSection({
  settings,
  theme,
  onThemeChange,
  onChange,
  onSave,
}: {
  settings: AppSettings["general"];
  theme: string;
  onThemeChange: (theme: string) => void;
  onChange: (patch: Partial<AppSettings["general"]>) => void;
  onSave: () => void;
}) {
  return (
    <>
      <SectionHeader title="偏好设置" description="自定义你的使用体验" />
      <SettingsPanel>
        <SettingRow
          icon={<SettingsIcon className="w-4 h-4" />}
          label="主题模式"
          desc="选择界面主题"
        >
          <select
            value={theme}
            onChange={(e) => onThemeChange(e.target.value)}
            className={selectClassName}
          >
            <option value="system">跟随系统</option>
            <option value="light">浅色模式</option>
            <option value="dark">深色模式</option>
          </select>
        </SettingRow>
        <SettingRow
          icon={<KeyRound className="w-4 h-4" />}
          label="发送方式"
          desc="设置消息输入提交方式"
        >
          <select
            value={settings.sendMode}
            onChange={(e) => onChange({ sendMode: e.target.value as SendMode })}
            className={selectClassName}
          >
            <option value="enter">Enter 发送</option>
            <option value="ctrl-enter">Ctrl / Command + Enter 发送</option>
          </select>
        </SettingRow>
        <SettingRow
          icon={<Monitor className="w-4 h-4" />}
          label="紧凑模式"
          desc="减少页面留白以提升信息密度"
        >
          <Switch
            checked={settings.compactMode}
            onCheckedChange={(checked) => onChange({ compactMode: checked })}
          />
        </SettingRow>
        <SettingRow
          icon={<FileText className="w-4 h-4" />}
          label="自动保存草稿"
          desc="保留未发送输入内容"
        >
          <Switch
            checked={settings.autoSaveDraft}
            onCheckedChange={(checked) => onChange({ autoSaveDraft: checked })}
          />
        </SettingRow>
      </SettingsPanel>
      <SaveSettingsButton onSave={onSave} />
    </>
  );
}

function SecuritySection({
  settings,
  onChange,
  onSave,
}: {
  settings: AppSettings["security"];
  onChange: (patch: Partial<AppSettings["security"]>) => void;
  onSave: () => void;
}) {
  return (
    <>
      <SectionHeader title="安全设置" description="管理会话和账号保护策略" />
      <SettingsPanel>
        <SettingRow
          icon={<ShieldCheck className="w-4 h-4" />}
          label="会话超时"
          desc="超过指定时间未操作后重新验证"
        >
          <NumberInput
            value={settings.sessionTimeoutMinutes}
            min={5}
            max={480}
            onChange={(value) => onChange({ sessionTimeoutMinutes: value })}
          />
        </SettingRow>
        <SettingRow
          icon={<Bell className="w-4 h-4" />}
          label="登录提醒"
          desc="新设备登录后发送提醒"
        >
          <Switch
            checked={settings.loginNotification}
            onCheckedChange={(checked) => onChange({ loginNotification: checked })}
          />
        </SettingRow>
        <SettingRow
          icon={<KeyRound className="w-4 h-4" />}
          label="强密码策略"
          desc="注册和改密时校验复杂度"
        >
          <Switch
            checked={settings.requireStrongPassword}
            onCheckedChange={(checked) => onChange({ requireStrongPassword: checked })}
          />
        </SettingRow>
        <SettingRow
          icon={<Server className="w-4 h-4" />}
          label="可信 IP 段"
          desc="为空时不限制登录来源"
        >
          <Input
            value={settings.trustedIpRange}
            onChange={(e) => onChange({ trustedIpRange: e.target.value })}
            placeholder="127.0.0.0/24"
            className="h-9 w-full sm:w-[260px] bg-[var(--surface-card)] dark:bg-[#22222e] border-[var(--border-default)] dark:border-[#2a2a3a] rounded-lg text-[13px]"
          />
        </SettingRow>
      </SettingsPanel>
      <SaveSettingsButton onSave={onSave} />
    </>
  );
}

function AiConfigSection({
  settings,
  onChange,
  onSave,
}: {
  settings: AppSettings["ai"];
  onChange: (patch: Partial<AppSettings["ai"]>) => void;
  onSave: () => void;
}) {
  return (
    <>
      <SectionHeader title="AI 模型配置" description="配置 AI 模型参数和 API 连接" />
      <SettingsPanel>
        <SettingRow
          icon={<Server className="w-4 h-4" />}
          label="API 基础地址"
          desc="后端 API 服务器地址"
        >
          <Input
            value={settings.apiBase}
            onChange={(e) => onChange({ apiBase: e.target.value })}
            className="h-9 w-full sm:w-[260px] bg-[var(--surface-card)] dark:bg-[#22222e] border-[var(--border-default)] dark:border-[#2a2a3a] rounded-lg text-[13px]"
          />
        </SettingRow>
        <SettingRow
          icon={<Layers className="w-4 h-4" />}
          label="模型名称"
          desc="默认调用的模型标识"
        >
          <Input
            value={settings.modelName}
            onChange={(e) => onChange({ modelName: e.target.value })}
            className="h-9 w-full sm:w-[260px] bg-[var(--surface-card)] dark:bg-[#22222e] border-[var(--border-default)] dark:border-[#2a2a3a] rounded-lg text-[13px]"
          />
        </SettingRow>
        <SettingRow
          icon={<Activity className="w-4 h-4" />}
          label="温度参数"
          desc="控制回答的发散程度"
        >
          <NumberInput
            value={settings.temperature}
            min={0}
            max={1}
            step={0.1}
            onChange={(value) => onChange({ temperature: value })}
          />
        </SettingRow>
      </SettingsPanel>
      <SaveSettingsButton onSave={onSave} />
    </>
  );
}

function SshSection({
  settings,
  onChange,
  onSave,
}: {
  settings: AppSettings["ssh"];
  onChange: (patch: Partial<AppSettings["ssh"]>) => void;
  onSave: () => void;
}) {
  return (
    <>
      <SectionHeader title="SSH 连接" description="管理远程执行连接参数" />
      <SettingsPanel>
        <SettingRow
          icon={<Server className="w-4 h-4" />}
          label="主机地址"
          desc="目标服务器 IP 或域名"
        >
          <Input
            value={settings.host}
            onChange={(e) => onChange({ host: e.target.value })}
            className="h-9 w-full sm:w-[260px] bg-[var(--surface-card)] dark:bg-[#22222e] border-[var(--border-default)] dark:border-[#2a2a3a] rounded-lg text-[13px]"
          />
        </SettingRow>
        <SettingRow icon={<Terminal className="w-4 h-4" />} label="端口" desc="SSH 服务端口">
          <NumberInput
            value={settings.port}
            min={1}
            max={65535}
            onChange={(value) => onChange({ port: value })}
          />
        </SettingRow>
        <SettingRow icon={<User className="w-4 h-4" />} label="用户名" desc="远程登录账号">
          <Input
            value={settings.username}
            onChange={(e) => onChange({ username: e.target.value })}
            className="h-9 w-full sm:w-[260px] bg-[var(--surface-card)] dark:bg-[#22222e] border-[var(--border-default)] dark:border-[#2a2a3a] rounded-lg text-[13px]"
          />
        </SettingRow>
        <SettingRow
          icon={<KeyRound className="w-4 h-4" />}
          label="密钥别名"
          desc="引用已托管的密钥名称"
        >
          <Input
            value={settings.privateKeyAlias}
            onChange={(e) => onChange({ privateKeyAlias: e.target.value })}
            className="h-9 w-full sm:w-[260px] bg-[var(--surface-card)] dark:bg-[#22222e] border-[var(--border-default)] dark:border-[#2a2a3a] rounded-lg text-[13px]"
          />
        </SettingRow>
        <SettingRow
          icon={<Activity className="w-4 h-4" />}
          label="连接超时"
          desc="建立连接的最大等待秒数"
        >
          <NumberInput
            value={settings.connectTimeoutSeconds}
            min={5}
            max={120}
            onChange={(value) => onChange({ connectTimeoutSeconds: value })}
          />
        </SettingRow>
        <SettingRow
          icon={<Globe2 className="w-4 h-4" />}
          label="启用跳板隧道"
          desc="通过网关代理连接目标主机"
        >
          <Switch
            checked={settings.enableTunnel}
            onCheckedChange={(checked) => onChange({ enableTunnel: checked })}
          />
        </SettingRow>
      </SettingsPanel>
      <SaveSettingsButton onSave={onSave} />
    </>
  );
}

function NotificationsSection({
  settings,
  onChange,
  onSave,
}: {
  settings: AppSettings["notifications"];
  onChange: (patch: Partial<AppSettings["notifications"]>) => void;
  onSave: () => void;
}) {
  return (
    <>
      <SectionHeader title="通知设置" description="配置系统消息和告警通知方式" />
      <SettingsPanel>
        <SettingRow
          icon={<Mail className="w-4 h-4" />}
          label="邮件通知"
          desc="发送关键事件到账号邮箱"
        >
          <Switch
            checked={settings.email}
            onCheckedChange={(checked) => onChange({ email: checked })}
          />
        </SettingRow>
        <SettingRow
          icon={<Monitor className="w-4 h-4" />}
          label="浏览器通知"
          desc="在当前设备显示系统通知"
        >
          <Switch
            checked={settings.browser}
            onCheckedChange={(checked) => onChange({ browser: checked })}
          />
        </SettingRow>
        <SettingRow
          icon={<FileText className="w-4 h-4" />}
          label="每日摘要"
          desc="每日汇总运行和告警情况"
        >
          <Switch
            checked={settings.dailyDigest}
            onCheckedChange={(checked) => onChange({ dailyDigest: checked })}
          />
        </SettingRow>
        <SettingRow
          icon={<Bell className="w-4 h-4" />}
          label="最低通知级别"
          desc="低于该级别的事件不发送通知"
        >
          <select
            value={settings.minSeverity}
            onChange={(e) => onChange({ minSeverity: e.target.value as SeverityLevel })}
            className={selectClassName}
          >
            {(["info", "warning", "critical"] as SeverityLevel[]).map((level) => (
              <option key={level} value={level}>
                {severityLabel(level)}
              </option>
            ))}
          </select>
        </SettingRow>
      </SettingsPanel>
      <SaveSettingsButton onSave={onSave} />
    </>
  );
}

function AiopsSection({
  settings,
  onChange,
  onSave,
}: {
  settings: AppSettings["aiops"];
  onChange: (patch: Partial<AppSettings["aiops"]>) => void;
  onSave: () => void;
}) {
  return (
    <>
      <SectionHeader title="AIOps 告警" description="配置告警分析和报告输出" />
      <SettingsPanel>
        <SettingRow
          icon={<Activity className="w-4 h-4" />}
          label="自动分析"
          desc="告警进入后自动触发根因分析"
        >
          <Switch
            checked={settings.autoAnalyze}
            onCheckedChange={(checked) => onChange({ autoAnalyze: checked })}
          />
        </SettingRow>
        <SettingRow
          icon={<Bell className="w-4 h-4" />}
          label="分析阈值"
          desc="达到该级别后进入分析队列"
        >
          <select
            value={settings.severityThreshold}
            onChange={(e) => onChange({ severityThreshold: e.target.value as SeverityLevel })}
            className={selectClassName}
          >
            {(["info", "warning", "critical"] as SeverityLevel[]).map((level) => (
              <option key={level} value={level}>
                {severityLabel(level)}
              </option>
            ))}
          </select>
        </SettingRow>
        <SettingRow
          icon={<FileText className="w-4 h-4" />}
          label="报告周期"
          desc="自动生成运维报告的频率"
        >
          <select
            value={settings.reportSchedule}
            onChange={(e) => onChange({ reportSchedule: e.target.value })}
            className={selectClassName}
          >
            <option value="off">关闭</option>
            <option value="daily">每日</option>
            <option value="weekly">每周</option>
          </select>
        </SettingRow>
        <SettingRow
          icon={<Globe2 className="w-4 h-4" />}
          label="Webhook 地址"
          desc="向外部系统推送分析结果"
        >
          <Input
            value={settings.webhookUrl}
            onChange={(e) => onChange({ webhookUrl: e.target.value })}
            className="h-9 w-full sm:w-[260px] bg-[var(--surface-card)] dark:bg-[#22222e] border-[var(--border-default)] dark:border-[#2a2a3a] rounded-lg text-[13px]"
          />
        </SettingRow>
      </SettingsPanel>
      <SaveSettingsButton onSave={onSave} />
    </>
  );
}

function PluginsSection() {
  const { status } = usePluginStatus();
  const { config, togglePlugin } = usePluginConfig();
  const builtInConfig = (config || []).filter((plugin) => plugin.type === "builtin");
  const mcpServers = status?.mcpServers || [];
  const customTools = status?.customTools || [];

  return (
    <>
      <SectionHeader title="插件管理" description="管理已安装的插件和扩展" />
      <SettingsPanel>
        {builtInConfig.map((plugin) => {
          const runtimeStatus = status?.builtIn?.[plugin.id];
          const available = runtimeStatus?.available ?? plugin.available;
          const enabled = plugin.enabled && (runtimeStatus?.enabled ?? true);
          return (
            <PluginRow
              key={plugin.id}
              icon={<Plug className="w-4 h-4" />}
              name={plugin.name || BUILTIN_PLUGIN_NAMES[plugin.id] || plugin.id}
              description={plugin.description}
              enabled={enabled}
              available={available}
              statusText="内置插件"
              action={
                <Switch
                  checked={plugin.enabled}
                  disabled={!available}
                  onCheckedChange={() => togglePlugin(plugin.id)}
                />
              }
            />
          );
        })}

        {mcpServers.map((server) => (
          <PluginRow
            key={server.id}
            icon={<Globe2 className="w-4 h-4" />}
            name={server.name}
            description={`${server.description || "MCP 服务"} · ${server.tools?.length || 0} 个工具`}
            enabled={server.enabled}
            available={server.available}
            connected={server.connected}
            statusText={server.config?.transport === "sse" ? "SSE MCP" : "STDIO MCP"}
          />
        ))}

        {customTools.map((tool) => (
          <PluginRow
            key={tool.id}
            icon={<Code2 className="w-4 h-4" />}
            name={tool.name}
            description={
              tool.description ||
              tool.config.apiUrl ||
              tool.config.webhookUrl ||
              tool.config.scriptPath ||
              "自定义工具"
            }
            enabled={tool.enabled}
            available={tool.available}
            statusText={tool.toolType.toUpperCase()}
          />
        ))}

        {builtInConfig.length === 0 && mcpServers.length === 0 && customTools.length === 0 && (
          <div className="p-8 text-center text-[14px] text-[var(--text-muted)]">暂无可用插件</div>
        )}
      </SettingsPanel>
    </>
  );
}

function PluginRow({
  icon,
  name,
  description,
  enabled,
  available,
  connected,
  statusText,
  action,
}: {
  icon: ReactNode;
  name: string;
  description: string;
  enabled: boolean;
  available: boolean;
  connected?: boolean;
  statusText: string;
  action?: ReactNode;
}) {
  const StatusIcon = !available
    ? CircleOff
    : connected === false
      ? CircleDot
      : enabled
        ? CircleCheck
        : CircleOff;
  const statusLabel = !available
    ? "不可用"
    : connected === false
      ? "未连接"
      : enabled
        ? "已启用"
        : "未启用";
  const statusClass =
    !available || !enabled ? "text-[var(--text-muted)]" : "text-[var(--status-success)]";

  return (
    <div className="flex flex-col gap-3 px-5 py-3.5 border-b border-[var(--border-default)] dark:border-[#2a2a3a] last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-[var(--surface-card)] dark:bg-[#22222e] border border-[var(--border-default)] dark:border-[#2a2a3a] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
            {name}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] truncate">{description}</div>
        </div>
      </div>
      <div className="flex items-center gap-3 justify-between sm:justify-end">
        <Badge variant="outline" className="h-6 text-[11px]">
          {statusText}
        </Badge>
        <span className={`inline-flex items-center gap-1.5 text-[12px] ${statusClass}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {statusLabel}
        </span>
        {action}
      </div>
    </div>
  );
}

function AboutSection() {
  return (
    <>
      <SectionHeader title="关于平台" description="查看当前前端应用和运行环境" />
      <SettingsPanel>
        <SettingRow icon={<Info className="w-4 h-4" />} label="应用名称" desc="当前运行的前端项目">
          <span className="text-[13px] text-[var(--text-primary)]">
            aggregation-support-agent-web
          </span>
        </SettingRow>
        <SettingRow icon={<FileText className="w-4 h-4" />} label="版本" desc="前端包版本">
          <span className="text-[13px] text-[var(--text-primary)]">0.1.0</span>
        </SettingRow>
        <SettingRow
          icon={<Server className="w-4 h-4" />}
          label="运行模式"
          desc="Next.js 客户端运行环境"
        >
          <span className="text-[13px] text-[var(--text-primary)]">{process.env.NODE_ENV}</span>
        </SettingRow>
      </SettingsPanel>
    </>
  );
}
