/**
 * lib/session-storage 会话缓存契约测试（工单 1142）：
 * 存取持久化、LRU 容量淘汰、TTL 过期清理、损坏数据容错。
 */
import type { SessionCacheData } from "@/types/api";
import { SessionStorage } from "@/lib/session-storage";

const STORAGE_KEY = "chat_session_cache";

const cacheData = (sessionId: string): SessionCacheData => ({
  sessionId,
  agentId: "agent-1",
  agentName: "测试智能体",
  messages: [],
  lastUpdateTime: Date.now(),
});

const seed = (value: unknown) => window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));

beforeEach(() => {
  window.localStorage.clear();
  jest.restoreAllMocks();
});

describe("SessionStorage", () => {
  it("set 后 get 命中，并持久化到 localStorage", () => {
    const store = new SessionStorage();

    store.set("s1", cacheData("s1"));

    expect(store.get("s1")?.sessionId).toBe("s1");
    const persisted = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
    expect(persisted.s1.data.sessionId).toBe("s1");
  });

  it("未知会话返回 null", () => {
    const store = new SessionStorage();
    expect(store.get("nope")).toBeNull();
  });

  it("容量上限 10：插入第 11 条时淘汰最早条目", () => {
    const store = new SessionStorage();
    for (let i = 1; i <= 10; i++) {
      store.set(`s${i}`, cacheData(`s${i}`));
    }

    store.set("s11", cacheData("s11"));

    expect(store.get("s1")).toBeNull();
    expect(store.get("s2")).not.toBeNull();
    expect(store.get("s11")).not.toBeNull();
  });

  it("重复 set 同一 key 不触发淘汰且刷新 LRU 位置", () => {
    const store = new SessionStorage();
    for (let i = 1; i <= 10; i++) {
      store.set(`s${i}`, cacheData(`s${i}`));
    }
    store.set("s1", cacheData("s1")); // s1 移到最新
    store.set("s11", cacheData("s11")); // 淘汰的应是最旧的 s2

    expect(store.get("s1")).not.toBeNull();
    expect(store.get("s2")).toBeNull();
  });

  it("超过 24 小时的条目读取时过期清理", () => {
    const store = new SessionStorage();
    store.set("s1", cacheData("s1"));

    const realNow = Date.now;
    const spy = jest.spyOn(Date, "now").mockReturnValue(realNow() + 25 * 60 * 60 * 1000);
    try {
      expect(store.get("s1")).toBeNull();
    } finally {
      spy.mockRestore();
    }
  });

  it("localStorage 中损坏的 JSON 不抛异常，按空缓存工作", () => {
    window.localStorage.setItem(STORAGE_KEY, "{broken json!!");
    const store = new SessionStorage();

    expect(store.get("s1")).toBeNull();
    store.set("s1", cacheData("s1"));
    expect(store.get("s1")?.sessionId).toBe("s1");
  });

  it("构造时清理已过期的历史条目", () => {
    seed({
      stale: { data: cacheData("stale"), timestamp: Date.now() - 48 * 60 * 60 * 1000 },
      fresh: { data: cacheData("fresh"), timestamp: Date.now() },
    });

    const store = new SessionStorage();

    expect(store.get("stale")).toBeNull();
    expect(store.get("fresh")?.sessionId).toBe("fresh");
  });

  it("delete 与 clear 语义", () => {
    const store = new SessionStorage();
    store.set("s1", cacheData("s1"));
    store.set("s2", cacheData("s2"));

    store.delete("s1");
    expect(store.get("s1")).toBeNull();
    expect(store.get("s2")).not.toBeNull();

    store.clear();
    expect(store.get("s2")).toBeNull();
  });
});
