import * as React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "w-full px-4 py-3 border border-border rounded-lg text-foreground placeholder:text-muted-foreground bg-background/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
