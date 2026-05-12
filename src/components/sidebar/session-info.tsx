/**
 * 会话信息标签页组件
 *
 * 显示当前会话的元数据
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SessionInfoProps {
  userId?: string;
  agentId?: string;
  sessionId?: string;
  agentName?: string;
}

export function SessionInfo({
  userId = "admin",
  agentId,
  sessionId,
  agentName,
}: SessionInfoProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">会话信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">用户 ID</p>
            <Badge variant="outline">{userId}</Badge>
          </div>
          {agentId && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">智能体 ID</p>
              <Badge variant="outline">{agentId}</Badge>
            </div>
          )}
          {agentName && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">智能体名称</p>
              <p className="text-sm">{agentName}</p>
            </div>
          )}
          {sessionId && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">会话 ID</p>
              <p className="text-xs font-mono break-all">{sessionId}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">使用说明</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>• 每条消息会创建一个新的会话</p>
          <p>• 支持流式响应显示</p>
          <p>• 对话历史自动保存</p>
          <p>• 可导出对话为 MD/PDF/Word</p>
        </CardContent>
      </Card>
    </div>
  );
}
