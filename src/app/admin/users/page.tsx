/**
 * 用户管理页（管理员专属）
 *
 * 管理员可查看用户列表、切换用户状态、调整用户角色
 */

"use client";

import { useEffect, useState } from "react";
import { requestJson } from "@/lib/api";
import type { UserInfoDTO, UserListResponse } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Shield, UserX, CheckCircle } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<UserInfoDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = async (p: number) => {
    setIsLoading(true);
    try {
      const data = await requestJson<UserListResponse>(`/api/v1/user/list?page=${p}&pageSize=20`);
      setUsers(data.list);
      setTotal(data.total);
      setPage(p);
    } catch {
      // 401 会被 api.ts 自动拦截
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadUsers(1); }, []);

  const handleToggleStatus = async (user: UserInfoDTO) => {
    const newStatus = user.status === 1 ? 0 : 1;
    try {
      await requestJson<boolean>(`/api/v1/user/${user.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      loadUsers(page);
    } catch (err) {
      alert(err instanceof Error ? err.message : "操作失败");
    }
  };

  const handleToggleRole = async (user: UserInfoDTO) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      await requestJson<boolean>(`/api/v1/user/${user.id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      });
      loadUsers(page);
    } catch (err) {
      alert(err instanceof Error ? err.message : "操作失败");
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">用户管理</h1>
            <span className="text-muted-foreground">共 {total} 个用户</span>
          </div>
          <a href="/chat" className="text-primary hover:underline text-sm">返回对话</a>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">加载中...</div>
        ) : (
          <>
            <div className="space-y-3">
              {users.map((user) => (
                <Card key={user.id} className="border-border/50">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {(user.nickname || user.username).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.nickname || user.username}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            user.role === "admin"
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {user.role === "admin" ? "管理员" : "用户"}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            user.status === 1
                              ? "bg-green-500/20 text-green-500"
                              : "bg-destructive/20 text-destructive"
                          }`}>
                            {user.status === 1 ? "启用" : "禁用"}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          @{user.username} · {user.email || "未设置邮箱"} · 注册于 {user.createTime}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleToggleRole(user)}
                        title={user.role === "admin" ? "降级为用户" : "升级为管理员"}>
                        <Shield className="w-4 h-4" />
                      </Button>
                      <Button variant={user.status === 1 ? "destructive" : "default"} size="sm"
                        onClick={() => handleToggleStatus(user)}
                        title={user.status === 1 ? "禁用用户" : "启用用户"}>
                        {user.status === 1 ? <UserX className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => loadUsers(page - 1)}>
                  上一页
                </Button>
                <span className="flex items-center text-sm text-muted-foreground">
                  第 {page} / {totalPages} 页
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => loadUsers(page + 1)}>
                  下一页
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
