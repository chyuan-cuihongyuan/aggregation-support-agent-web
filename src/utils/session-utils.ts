/**
 * 会话工具函数
 */

import type { ChatHistoryDTO } from "@/types/api";

/**
 * 按 agentName 对历史记录分组
 */
export function groupHistoriesByAgent(
  histories: ChatHistoryDTO[]
): Record<string, ChatHistoryDTO[]> {
  const grouped: Record<string, ChatHistoryDTO[]> = {};

  histories.forEach((history) => {
    const key = history.agentName;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(history);
  });

  return grouped;
}

/**
 * 生成临时会话 ID（降级策略）
 */
export function generateTempSessionId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 为旧数据生成虚拟 sessionId
 */
export function migrateLegacyHistory(history: ChatHistoryDTO): ChatHistoryDTO {
  if (!history.sessionId) {
    return {
      ...history,
      sessionId: `legacy_${history.id}`,
    };
  }
  return history;
}
