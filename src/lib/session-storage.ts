/**
 * 会话本地存储
 *
 * 用于缓存会话数据，提升切换性能
 */

import type { SessionCacheData } from "@/types/api";

const STORAGE_KEY = "chat_session_cache";
const MAX_CACHE_SIZE = 10;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24小时

interface CacheEntry {
  data: SessionCacheData;
  timestamp: number;
}

export class SessionStorage {
  private cache: Map<string, CacheEntry> = new Map();

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cache = new Map(Object.entries(parsed));
        this.cleanExpired();
      }
    } catch {
      // 静默失败
    }
  }

  private saveToLocalStorage() {
    try {
      const obj = Object.fromEntries(this.cache);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch {
      // 静默失败
    }
  }

  private cleanExpired() {
    const now = Date.now();
    const expired: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > CACHE_TTL) {
        expired.push(key);
      }
    });

    expired.forEach((key) => this.cache.delete(key));

    if (expired.length > 0) {
      this.saveToLocalStorage();
    }
  }

  set(sessionId: string, data: SessionCacheData) {
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(sessionId, {
      data,
      timestamp: Date.now(),
    });

    this.saveToLocalStorage();
  }

  get(sessionId: string): SessionCacheData | null {
    const entry = this.cache.get(sessionId);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_TTL) {
      this.cache.delete(sessionId);
      this.saveToLocalStorage();
      return null;
    }

    return entry.data;
  }

  delete(sessionId: string) {
    this.cache.delete(sessionId);
    this.saveToLocalStorage();
  }

  clear() {
    this.cache.clear();
    this.saveToLocalStorage();
  }
}

export const sessionStorage = new SessionStorage();
