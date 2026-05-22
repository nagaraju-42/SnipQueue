import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: "bg-gray-100 text-gray-800",
      success: "bg-green-100 text-green-800",
      warning: "bg-amber-100 text-amber-800",
      danger: "bg-red-100 text-red-800",
      info: "bg-primary/10 text-primary",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
