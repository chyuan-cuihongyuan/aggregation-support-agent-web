/**
 * 用户管理页（管理员专属）
 *
 * 管理员可查看用户列表、切换用户状态、调整用户角色
 */

"use client";

import { useState, useEffect } from "react";
import { requestJson } from "@chyuan/ui-kit";
import type { UserInfoDTO, UserListResponse } from "@/types/api";
import { Button } from "@chyuan/ui-kit";
import { Card, CardContent } from "@chyuan/ui-kit";
import { Users, Shield, UserX, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function UsersPage() {
  const [users, setUsers] = useState<UserInfoDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // 使用 useEffect 的 cleanup 函数避免级联渲染
  useEffect(() => {
    let cancelled = false;
    
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const data = await requestJson<UserListResponse>(`/api/v1/user/list?page=${page}&pageSize=20`);
        if (!cancelled) {
          setUsers(data.list);
          setTotal(data.total);
        }
      } catch {
        // 401 会被 api.ts 自动拦截
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    
    loadUsers();
    
    return () => {
      cancelled = true;
    };
  }, [page]); // 只依赖 page

  const handleToggleStatus = async (user: UserInfoDTO) => {
    const newStatus = user.status === 1 ? 0 : 1;
    try {
      await requestJson<boolean>(`/api/v1/user/${user.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`用户已${newStatus === 1 ? "启用" : "禁用"}`);
      // 通过改变 page 触发重新加载
      setPage(page + 1);
      setPage(page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败");
    }
  };

  const handleToggleRole = async (user: UserInfoDTO) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      await requestJson<boolean>(`/api/v1/user/${user.id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      });
      toast.success(`用户角色已更新为${newRole === "admin" ? "管理员" : "普通用户"}`);
      // 通过改变 page 触发重新加载
      setPage(page + 1);
      setPage(page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败");
    }
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">用户管理</h1>
        <p className="text-muted-foreground">管理系统用户和权限</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 text-left font-medium">用户ID</th>
                  <th className="p-4 text-left font-medium">用户名</th>
                  <th className="p-4 text-left font-medium">邮箱</th>
                  <th className="p-4 text-left font-medium">角色</th>
                  <th className="p-4 text-left font-medium">状态</th>
                  <th className="p-4 text-left font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">{user.id}</td>
                    <td className="p-4">{user.username}</td>
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleRole(user)}
                      >
                        {user.role === "admin" ? (
                          <>
                            <Shield className="mr-2 h-4 w-4" />
                            管理员
                          </>
                        ) : (
                          <>
                            <Users className="mr-2 h-4 w-4" />
                            普通用户
                          </>
                        )}
                      </Button>
                    </td>
                    <td className="p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.status === 1 ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                            启用
                          </>
                        ) : (
                          <>
                            <UserX className="mr-2 h-4 w-4 text-red-500" />
                            禁用
                          </>
                        )}
                      </Button>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          user.status === 1
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                        }`}
                      >
                        {user.status === 1 ? "正常" : "禁用"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              暂无用户数据
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
