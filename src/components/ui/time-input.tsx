
"use client";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const TimeInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentPropsWithoutRef<"input">, "type">
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      type="time"
      className={cn("w-full appearance-none", className)}
      {...props}
    />
  );
});
TimeInput.displayName = "TimeInput";

export { TimeInput };
