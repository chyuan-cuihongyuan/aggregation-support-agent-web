/**
 * 内置插件配置对话框
 *
 * 用于配置内置插件的各项设置
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { BuiltInPluginConfig } from "@/types/plugin";

interface BuiltInConfigDialogProps {
  plugin: BuiltInPluginConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (settings: Record<string, any>) => void;
}

export function BuiltInConfigDialog({
  plugin,
  open,
  onOpenChange,
  onSave,
}: BuiltInConfigDialogProps) {
  const [settings, setSettings] = useState<Record<string, any>>(plugin.settings || {});

  const handleSave = () => {
    onSave(settings);
    onOpenChange(false);
  };

  const renderSettingField = (key: string, value: any) => {
    if (typeof value === "boolean") {
      return (
        <div key={key} className="flex items-center justify-between">
          <Label htmlFor={key} className="capitalize">
            {getSettingLabel(key)}
          </Label>
          <Switch
            id={key}
            checked={value}
            onCheckedChange={(checked) =>
              setSettings((prev) => ({ ...prev, [key]: checked }))
            }
          />
        </div>
      );
    }

    if (typeof value === "number") {
      return (
        <div key={key} className="space-y-1">
          <Label htmlFor={key} className="capitalize">
            {getSettingLabel(key)}
          </Label>
          <Input
            id={key}
            type="number"
            value={value}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, [key]: Number(e.target.value) }))
            }
          />
        </div>
      );
    }

    if (Array.isArray(value)) {
      return (
        <div key={key} className="space-y-1">
          <Label className="capitalize">{getSettingLabel(key)}</Label>
          <div className="text-sm text-muted-foreground">
            {value.join(", ")}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>配置 {plugin.name}</DialogTitle>
          <DialogDescription>{plugin.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {Object.entries(settings).map(([key, value]) =>
            renderSettingField(key, value)
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** 获取设置项标签 */
function getSettingLabel(key: string): string {
  const labels: Record<string, string> = {
    maxFileSize: "最大文件大小（字节）",
    allowedFormats: "允许的格式",
    autoVectorize: "自动向量化",
    autoRefresh: "自动刷新",
    refreshInterval: "刷新间隔（秒）",
    autoSave: "自动保存",
    maxHistoryDays: "最大保留天数",
  };
  return labels[key] || key;
}
