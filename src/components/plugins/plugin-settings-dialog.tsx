/**
 * 插件设置主对话框
 *
 * 显示所有插件并提供配置入口
 */

"use client";

import { useState } from "react";
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
import type { BuiltInPluginConfig } from "@/types/plugin";

interface PluginSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PluginSettingsDialog({
  open,
  onOpenChange,
}: PluginSettingsDialogProps) {
  const { config, togglePlugin } = usePluginConfig();
  const { status } = usePluginStatus();
  const [selectedPlugin, setSelectedPlugin] = useState<BuiltInPluginConfig | null>(null);

  const handleOpenConfig = (plugin: BuiltInPluginConfig) => {
    if (plugin.configurable) {
      setSelectedPlugin(plugin);
    }
  };

  const builtInPlugins = config?.filter((p) => p.type === "builtin") || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>插件设置</DialogTitle>
          <DialogDescription>
            管理内置插件、MCP 服务和自定义工具
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
              {builtInPlugins.map((plugin) => (
                <div
                  key={plugin.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{plugin.name}</span>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      {plugin.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
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
              <div className="text-center text-sm text-muted-foreground py-8">
                MCP 服务配置功能即将推出
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-3">
              <div className="text-center text-sm text-muted-foreground py-8">
                自定义工具配置功能即将推出
              </div>
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
            console.log("保存设置:", settings);
          }}
        />
      )}
    </Dialog>
  );
}
