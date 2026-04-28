import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-2xl border border-zinc-600 bg-zinc-800 px-4 py-2 text-base text-zinc-100 placeholder:text-zinc-500 transition-all duration-200 focus-visible:outline-none focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400/20",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
