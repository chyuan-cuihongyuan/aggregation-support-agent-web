/**
 * 新建对话按钮组件
 */

"use client";

import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

interface NewChatButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isSwitching?: boolean;
}

export function NewChatButton({ onClick, disabled, isSwitching }: NewChatButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isSwitching}
      variant="outline"
      size="sm"
      className="gap-2 h-8 text-[13px] border-[var(--chat-border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
    >
      {isSwitching ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
      新建对话
    </Button>
  );
}
