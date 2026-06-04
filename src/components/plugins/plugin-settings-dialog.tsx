/**
 * 插件设置主对话框
 *
 * 显示所有插件并提供配置入口
 */

"use client";

import { useState, type ReactNode } from "react";
import { Activity, Code2, Globe2, Plug, Wrench } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePluginConfig } from "@/hooks/use-plugin-config";
import { usePluginStatus } from "@/hooks/use-plugin-status";
import { BuiltInConfigDialog } from "./dialogs/builtin-config-dialog";
import { toast } from "sonner";
import type { BuiltInPluginConfig, CustomToolConfig, MCPServerConfig } from "@/types/plugin";

interface PluginSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PluginSettingsDialog({
  open,
  onOpenChange,
}: PluginSettingsDialogProps) {
  const { config, togglePlugin, savePluginSettings } = usePluginConfig();
  const { status, isLoading, error } = usePluginStatus();
  const [selectedPlugin, setSelectedPlugin] = useState<BuiltInPluginConfig | null>(null);

  const handleOpenConfig = (plugin: BuiltInPluginConfig) => {
    if (plugin.configurable) {
      setSelectedPlugin(plugin);
    }
  };

  const builtInPlugins = config?.filter((p) => p.type === "builtin") || [];
  const mcpServers = status?.mcpServers || [];
  const customTools = status?.customTools || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>插件设置</DialogTitle>
          <DialogDescription>
            管理内置插件、MCP 服务和自定义工具状态
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="builtin" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="builtin">内置插件</TabsTrigger>
            <TabsTrigger value="mcp">MCP 服务</TabsTrigger>
            <TabsTrigger value="custom">自定义工具</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="builtin" className="space-y-3">
              {builtInPlugins.length === 0 && (
                <EmptyPluginState text="暂无内置插件配置" />
              )}
              {builtInPlugins.map((plugin) => (
                <div
                  key={plugin.id}
                  className="flex items-center justify-between gap-3 p-3 border rounded-lg"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <PluginIcon icon={<Plug className="w-4 h-4" />} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{plugin.name}</span>
                        {plugin.available ? (
                          <Badge variant="outline" className="text-xs">
                            可用
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            不可用
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {plugin.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {plugin.configurable && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenConfig(plugin as BuiltInPluginConfig)}
                        disabled={!plugin.available}
                      >
                        配置
                      </Button>
                    )}
                    <Switch
                      checked={plugin.enabled}
                      onCheckedChange={() => togglePlugin(plugin.id)}
                      disabled={!plugin.available}
                    />
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="mcp" className="space-y-3">
              {isLoading && <EmptyPluginState text="正在加载 MCP 服务状态" />}
              {!isLoading && error && <EmptyPluginState text="MCP 服务状态暂不可用" />}
              {!isLoading && !error && mcpServers.length === 0 && (
                <EmptyPluginState text="暂无已接入 MCP 服务" />
              )}
              {mcpServers.map((server) => (
                <McpServerRow key={server.id} server={server} />
              ))}
            </TabsContent>

            <TabsContent value="custom" className="space-y-3">
              {isLoading && <EmptyPluginState text="正在加载自定义工具状态" />}
              {!isLoading && error && <EmptyPluginState text="自定义工具状态暂不可用" />}
              {!isLoading && !error && customTools.length === 0 && (
                <EmptyPluginState text="暂无已接入自定义工具" />
              )}
              {customTools.map((tool) => (
                <CustomToolRow key={tool.id} tool={tool} />
              ))}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={() => onOpenChange(false)}>关闭</Button>
        </div>
      </DialogContent>

      {/* 内置插件配置对话框 */}
      {selectedPlugin && (
        <BuiltInConfigDialog
          plugin={selectedPlugin}
          open={!!selectedPlugin}
          onOpenChange={(open) => !open && setSelectedPlugin(null)}
          onSave={(settings) => {
            void savePluginSettings(selectedPlugin.id, settings)
              .then(() => toast.success("插件配置已保存"))
              .catch((err) => {
                toast.error(err instanceof Error ? err.message : "插件配置保存失败");
              });
          }}
        />
      )}
    </Dialog>
  );
}

function PluginIcon({ icon }: { icon: ReactNode }) {
  return (
    <div className="w-9 h-9 rounded-lg bg-muted/40 border flex items-center justify-center text-muted-foreground shrink-0">
      {icon}
    </div>
  );
}

function EmptyPluginState({ text }: { text: string }) {
  return (
    <div className="text-center text-sm text-muted-foreground py-8">
      {text}
    </div>
  );
}

function StatusBadge({
  available,
  enabled,
  connected,
}: {
  available: boolean;
  enabled: boolean;
  connected?: boolean;
}) {
  if (!available) {
    return <Badge variant="destructive" className="text-xs">不可用</Badge>;
  }
  if (connected === false) {
    return <Badge variant="outline" className="text-xs">未连接</Badge>;
  }
  return (
    <Badge variant="outline" className="text-xs">
      {enabled ? "已启用" : "未启用"}
    </Badge>
  );
}

function McpServerRow({ server }: { server: MCPServerConfig }) {
  return (
    <div className="flex items-start justify-between gap-3 p-3 border rounded-lg">
      <div className="flex items-start gap-3 min-w-0">
        <PluginIcon icon={<Globe2 className="w-4 h-4" />} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{server.name}</span>
            <StatusBadge available={server.available} enabled={server.enabled} connected={server.connected} />
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{server.description}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Activity className="w-3 h-3" />
              {(server.config?.transport || "stdio").toUpperCase()}
            </span>
            <span>{server.tools?.length || 0} 个工具</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomToolRow({ tool }: { tool: CustomToolConfig }) {
  const target = tool.config?.apiUrl || tool.config?.webhookUrl || tool.config?.scriptPath || "未配置目标";
  return (
    <div className="flex items-start justify-between gap-3 p-3 border rounded-lg">
      <div className="flex items-start gap-3 min-w-0">
        <PluginIcon icon={tool.toolType === "script" ? <Code2 className="w-4 h-4" /> : <Wrench className="w-4 h-4" />} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{tool.name}</span>
            <StatusBadge available={tool.available} enabled={tool.enabled} />
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tool.description || target}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>{tool.toolType.toUpperCase()}</span>
            {tool.lastTest && (
              <span>{tool.lastTest.success ? "测试通过" : tool.lastTest.error || "测试失败"}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
