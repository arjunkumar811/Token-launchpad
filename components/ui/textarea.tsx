import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[140px] w-full rounded-2xl border border-zinc-600 bg-zinc-800 px-4 py-3 text-base text-zinc-100 placeholder:text-zinc-500 transition-all duration-200 focus-visible:outline-none focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400/20",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
