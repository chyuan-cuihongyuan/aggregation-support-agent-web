/**
 * use-auth 认证上下文契约测试（工单 1142）：
 * 初始加载态、登录/登出/注册/更新对全局用户状态的影响、Provider 外使用报错、401 事件清态。
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import type { UserInfoDTO } from "@/types/api";

const userA: UserInfoDTO = {
  id: 1,
  username: "alice",
  nickname: "Alice",
  email: "alice@test.dev",
  avatar: "",
  role: "user",
  status: 1,
  createTime: "2026-01-01 00:00:00",
};

jest.mock("@/lib/auth", () => ({
  getCurrentUser: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  updateUser: jest.fn(),
}));

import { getCurrentUser, login, logout, register, updateUser } from "@/lib/auth";

const mockedGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const mockedLogin = login as jest.MockedFunction<typeof login>;
const mockedLogout = logout as jest.MockedFunction<typeof logout>;
const mockedRegister = register as jest.MockedFunction<typeof register>;
const mockedUpdateUser = updateUser as jest.MockedFunction<typeof updateUser>;

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useAuth 认证上下文", () => {
  it("挂载时拉取当前用户，完成后关闭 loading", async () => {
    mockedGetCurrentUser.mockResolvedValue(userA);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user?.username).toBe("alice");
  });

  it("未登录（getCurrentUser 返回 null）时 user 为空", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it("login 成功后写入全局用户状态", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);
    mockedLogin.mockResolvedValue(userA);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login({ username: "alice", password: "pw" });
    });

    expect(result.current.user?.id).toBe(1);
    expect(mockedLogin).toHaveBeenCalledTimes(1);
  });

  it("logout 即使后端失败也清除本地用户", async () => {
    mockedGetCurrentUser.mockResolvedValue(userA);
    mockedLogout.mockRejectedValue(new Error("backend down"));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user?.id).toBe(1));

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
  });

  it("register 成功后写入用户状态", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);
    mockedRegister.mockResolvedValue(userA);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.register({ username: "alice", password: "pw" } as never);
    });

    expect(result.current.user?.username).toBe("alice");
  });

  it("updateUser 成功后触发 refresh 并返回 true；失败返回 false", async () => {
    mockedGetCurrentUser.mockResolvedValue(userA);
    mockedUpdateUser.mockResolvedValue(true);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      const ok = await result.current.updateUser({ nickname: "Alicia" } as never);
      expect(ok).toBe(true);
    });

    expect(mockedGetCurrentUser).toHaveBeenCalledTimes(2);

    mockedUpdateUser.mockRejectedValue(new Error("forbidden"));
    await act(async () => {
      const ok = await result.current.updateUser({ nickname: "X" } as never);
      expect(ok).toBe(false);
    });
  });

  it("auth:unauthorized 事件清空用户状态", async () => {
    mockedGetCurrentUser.mockResolvedValue(userA);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user?.id).toBe(1));

    await act(async () => {
      window.dispatchEvent(new Event("auth:unauthorized"));
    });

    expect(result.current.user).toBeNull();
  });

  it("Provider 外使用 useAuth 抛出引导错误", () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth must be used within an AuthProvider"
    );
  });
});
