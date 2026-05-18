/**
 * 会话工具函数
 */

import type { ChatHistoryDTO, Message } from "@/types/api";

/**
 * 将历史记录转换为消息列表
 */
export function historyItemsToMessages(
  historyItems: Array<{ question: string; answer: string }>
): Message[] {
  const messages: Message[] = [];
  const baseTs = Date.now();

  historyItems.forEach((item, index) => {
    messages.push({
      id: `history-q-${index}-${baseTs}`,
      role: "user",
      content: item.question,
    });
    messages.push({
      id: `history-a-${index}-${baseTs}`,
      role: "assistant",
      content: item.answer,
    });
  });

  return messages;
}

/**
 * 从历史记录中提取唯一会话 ID
 */
export function extractUniqueSessionIds(
  histories: ChatHistoryDTO[]
): string[] {
  const sessionIds = new Set<string>();

  histories.forEach((history) => {
    if (history.sessionId) {
      sessionIds.add(history.sessionId);
    }
  });

  return Array.from(sessionIds);
}

/**
 * 按 sessionId 对历史记录分组
 */
export function groupHistoriesBySession(
  histories: ChatHistoryDTO[]
): Map<string, ChatHistoryDTO[]> {
  const grouped = new Map<string, ChatHistoryDTO[]>();

  histories.forEach((history) => {
    const sessionId = history.sessionId;
    if (!sessionId) return;

    if (!grouped.has(sessionId)) {
      grouped.set(sessionId, []);
    }

    grouped.get(sessionId)!.push(history);
  });

  return grouped;
}

/**
 * 按 agentId 对历史记录分组
 */
export function groupHistoriesByAgent(
  histories: ChatHistoryDTO[]
): Map<string, ChatHistoryDTO[]> {
  const grouped = new Map<string, ChatHistoryDTO[]>();

  histories.forEach((history) => {
    const agentName = history.agentName;
    if (!grouped.has(agentName)) {
      grouped.set(agentName, []);
    }

    grouped.get(agentName)!.push(history);
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
 * 检查是否为旧数据会话（没有 sessionId）
 */
export function isLegacySession(history: ChatHistoryDTO): boolean {
  return !history.sessionId || history.sessionId.startsWith("legacy_");
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
