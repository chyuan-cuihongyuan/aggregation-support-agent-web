"use client";

export const APP_SETTINGS_STORAGE_KEY = "aggregation_support_agent_web_settings";
export const APP_SETTINGS_CHANGED_EVENT = "app-settings:changed";

export type SendMode = "enter" | "ctrl-enter";
export type SeverityLevel = "info" | "warning" | "critical";

export interface AppSettings {
  general: {
    sendMode: SendMode;
    compactMode: boolean;
    autoSaveDraft: boolean;
  };
  security: {
    sessionTimeoutMinutes: number;
    loginNotification: boolean;
    requireStrongPassword: boolean;
    trustedIpRange: string;
  };
  ai: {
    apiBase: string;
    modelName: string;
    temperature: number;
  };
  ssh: {
    host: string;
    port: number;
    username: string;
    privateKeyAlias: string;
    connectTimeoutSeconds: number;
    enableTunnel: boolean;
  };
  notifications: {
    email: boolean;
    browser: boolean;
    dailyDigest: boolean;
    minSeverity: SeverityLevel;
  };
  aiops: {
    autoAnalyze: boolean;
    severityThreshold: SeverityLevel;
    reportSchedule: string;
    webhookUrl: string;
  };
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  general: {
    sendMode: "enter",
    compactMode: false,
    autoSaveDraft: true,
  },
  security: {
    sessionTimeoutMinutes: 30,
    loginNotification: true,
    requireStrongPassword: true,
    trustedIpRange: "",
  },
  ai: {
    apiBase: "http://127.0.0.1:8091",
    modelName: "default",
    temperature: 0.7,
  },
  ssh: {
    host: "",
    port: 22,
    username: "",
    privateKeyAlias: "",
    connectTimeoutSeconds: 20,
    enableTunnel: false,
  },
  notifications: {
    email: true,
    browser: false,
    dailyDigest: true,
    minSeverity: "warning",
  },
  aiops: {
    autoAnalyze: true,
    severityThreshold: "warning",
    reportSchedule: "daily",
    webhookUrl: "",
  },
};

export function mergeAppSettings(value?: Partial<AppSettings> | null): AppSettings {
  return {
    general: { ...DEFAULT_APP_SETTINGS.general, ...value?.general },
    security: { ...DEFAULT_APP_SETTINGS.security, ...value?.security },
    ai: { ...DEFAULT_APP_SETTINGS.ai, ...value?.ai },
    ssh: { ...DEFAULT_APP_SETTINGS.ssh, ...value?.ssh },
    notifications: { ...DEFAULT_APP_SETTINGS.notifications, ...value?.notifications },
    aiops: { ...DEFAULT_APP_SETTINGS.aiops, ...value?.aiops },
  };
}

export function loadAppSettings(): AppSettings {
  if (typeof window === "undefined") {
    return DEFAULT_APP_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
    return raw ? mergeAppSettings(JSON.parse(raw) as Partial<AppSettings>) : DEFAULT_APP_SETTINGS;
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export function persistAppSettings(settings: AppSettings) {
  window.localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event(APP_SETTINGS_CHANGED_EVENT));
}

export function patchAppSettings<K extends keyof AppSettings>(
  settings: AppSettings,
  section: K,
  patch: Partial<AppSettings[K]>
): AppSettings {
  return {
    ...settings,
    [section]: {
      ...settings[section],
      ...patch,
    },
  } as AppSettings;
}
