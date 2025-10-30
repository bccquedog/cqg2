import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary-600 text-white hover:bg-primary-700",
        secondary: "border-transparent bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
        destructive: "border-transparent bg-error-600 text-white hover:bg-error-700",
        outline: "border-neutral-300 text-neutral-700 hover:bg-neutral-50",
        success: "border-transparent bg-success-600 text-white hover:bg-success-700",
        warning: "border-transparent bg-warning-600 text-white hover:bg-warning-700",
        info: "border-transparent bg-primary-500 text-white hover:bg-primary-600",
        live: "border-transparent bg-error-500 text-white animate-pulse shadow-lg",
        upcoming: "border-transparent bg-warning-500 text-white",
        completed: "border-transparent bg-success-500 text-white",
        ghost: "text-neutral-700 hover:bg-neutral-100"
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  pulse?: boolean
}

function Badge({ 
  className, 
  variant, 
  size, 
  icon, 
  iconPosition = "left", 
  pulse = false,
  children, 
  ...props 
}: BadgeProps) {
  return (
    <div 
      className={cn(
        badgeVariants({ variant, size }), 
        pulse && "animate-pulse",
        className
      )} 
      {...props}
    >
      {icon && iconPosition === "left" && (
        <span className="mr-1 flex-shrink-0">{icon}</span>
      )}
      {children}
      {icon && iconPosition === "right" && (
        <span className="ml-1 flex-shrink-0">{icon}</span>
      )}
    </div>
  )
}

export { Badge, badgeVariants }
