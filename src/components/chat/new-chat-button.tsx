"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface NewChatButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isSwitching?: boolean;
}

/**
 * 新建对话按钮组件
 * 用于创建新的对话会话
 */
export function NewChatButton({ onClick, disabled, isSwitching }: NewChatButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isSwitching}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Plus className="h-4 w-4" />
      新建对话
    </Button>
  );
}
