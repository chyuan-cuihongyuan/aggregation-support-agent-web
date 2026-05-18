"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ViewOption<T extends string = string> {
  value: T;
  label: string;
}

interface ViewToggleProps<T extends string = string> {
  mode: T;
  onModeChange: (mode: T) => void;
  options: ViewOption<T>[];
  className?: string;
}

export function ViewToggle<T extends string = string>({
  mode,
  onModeChange,
  options,
  className
}: ViewToggleProps<T>) {
  const currentLabel = options.find(opt => opt.value === mode)?.label || options[0]?.label || "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={className}>
          {currentLabel}
          <ChevronDown className="ml-2 h-4 w-4" />
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
