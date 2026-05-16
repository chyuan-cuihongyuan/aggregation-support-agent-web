/**
 * 视图切换组件
 *
 * 用于在多种视图模式之间切换
 */

"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ViewOption {
  value: string;
  label: string;
}

interface ViewToggleProps {
  mode: string;
  onModeChange: (mode: string) => void;
  options: ViewOption[];
  className?: string;
}

export function ViewToggle({ mode, onModeChange, options, className }: ViewToggleProps) {
  const currentLabel = options.find((opt) => opt.value === mode)?.label || options[0]?.label || "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`h-7 text-[12px] gap-1 px-2 text-[var(--text-muted)] ${className || ""}`}>
          {currentLabel}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onModeChange(option.value)}
            className={mode === option.value ? "bg-accent" : ""}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
