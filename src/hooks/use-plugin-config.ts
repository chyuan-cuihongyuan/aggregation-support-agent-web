/**
 * 插件配置管理 Hook
 *
 * 管理插件配置的本地存储和同步
 */

import { useState, useEffect, useCallback } from "react";
import { requestJson } from "@/lib/api";
import type { PluginConfig, BuiltInPluginConfig } from "@/types/plugin";

const PLUGIN_CONFIG_KEY = "ai_agent_plugin_config";

/** 默认内置插件配置 */
const DEFAULT_BUILT_IN: BuiltInPluginConfig[] = [
  {
    id: "knowledge",
    type: "builtin",
    name: "知识库",
    description: "文档上传、向量化、检索功能",
    icon: "BookOpen",
    enabled: true,
    available: true,
    configurable: true,
    settings: {
      maxFileSize: 10 * 1024 * 1024,
      allowedFormats: ["txt", "md", "pdf", "docx", "html"],
      autoVectorize: true,
    },
  },
  {
    id: "aiops",
    type: "builtin",
    name: "AIOps 分析",
    description: "告警分析与运维报告生成",
    icon: "Activity",
    enabled: true,
    available: true,
    configurable: true,
    settings: {
      autoRefresh: false,
      refreshInterval: 300,
    },
  },
  {
    id: "export",
    type: "builtin",
    name: "导出功能",
    description: "对话导出为 MD/PDF/Word",
    icon: "Download",
    enabled: true,
    available: true,
    configurable: false,
  },
  {
    id: "history",
    type: "builtin",
    name: "对话历史",
    description: "历史记录保存与加载",
    icon: "History",
    enabled: true,
    available: true,
    configurable: true,
    settings: {
      autoSave: true,
      maxHistoryDays: 30,
    },
  },
];

export function usePluginConfig() {
  const [config, setConfig] = useState<PluginConfig[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 从 localStorage 加载配置
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PLUGIN_CONFIG_KEY);
      if (saved) {
        setConfig(JSON.parse(saved));
      } else {
        setConfig(DEFAULT_BUILT_IN);
      }
    } catch (error) {
      console.error("加载插件配置失败:", error);
      setConfig(DEFAULT_BUILT_IN);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 更新配置
  const updateConfig = useCallback((newConfig: PluginConfig[]) => {
    setConfig(newConfig);
    try {
      localStorage.setItem(PLUGIN_CONFIG_KEY, JSON.stringify(newConfig));
    } catch (error) {
      console.error("保存插件配置失败:", error);
    }
  }, []);

  // 切换插件启用状态
  const togglePlugin = useCallback((pluginId: string) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const newConfig = prev.map((plugin) =>
        plugin.id === pluginId
          ? { ...plugin, enabled: !plugin.enabled }
          : plugin
      );
      try {
        localStorage.setItem(PLUGIN_CONFIG_KEY, JSON.stringify(newConfig));
      } catch (error) {
        console.error("保存插件配置失败:", error);
      }
      return newConfig;
    });
  }, []);

  // 保存插件设置到后端
  const savePluginSettings = useCallback(async (
    pluginId: string,
    settings: Record<string, any>
  ) => {
    try {
      await requestJson(`/api/v1/plugins/${pluginId}/config`, {
        method: "POST",
        body: JSON.stringify(settings),
      });

      setConfig((prev) => {
        if (!prev) return prev;
        return prev.map((plugin) =>
          plugin.id === pluginId && plugin.type === "builtin"
            ? { ...plugin, settings: { ...plugin.settings, ...settings } }
            : plugin
        );
      });
    } catch (error) {
      console.error("保存插件设置失败:", error);
      throw error;
    }
  }, []);

  // 重置为默认配置
  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_BUILT_IN);
    try {
      localStorage.setItem(PLUGIN_CONFIG_KEY, JSON.stringify(DEFAULT_BUILT_IN));
    } catch (error) {
      console.error("重置插件配置失败:", error);
    }
  }, []);

  return {
    config,
    isLoading,
    updateConfig,
    togglePlugin,
    savePluginSettings,
    resetConfig,
  };
}
