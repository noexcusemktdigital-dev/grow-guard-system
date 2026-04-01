import React from "react";
import { Loader2 } from "lucide-react";
import { Button, ButtonProps } from "./button";
import { cn } from "@/lib/utils";

interface AsyncButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export function AsyncButton({ loading, loadingText, children, disabled, className, ...props }: AsyncButtonProps) {
  return (
    <Button disabled={disabled || loading} className={cn(className)} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {loading && loadingText ? loadingText : children}
    </Button>
  );
}
