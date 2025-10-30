import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "elevated" | "outlined" | "glass";
    size?: "sm" | "md" | "lg";
  }
>(({ className, variant = "default", size = "md", ...props }, ref) => {
  const variants = {
    default: "bg-white border border-neutral-200 shadow-sm",
    elevated: "bg-white border border-neutral-200 shadow-lg hover:shadow-xl transition-shadow",
    outlined: "bg-transparent border-2 border-neutral-300 hover:border-primary-500 transition-colors",
    glass: "bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg"
  }
  
  const sizes = {
    sm: "p-4 rounded-xl",
    md: "p-6 rounded-2xl", 
    lg: "p-8 rounded-3xl"
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "text-card-foreground transition-all duration-200",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    spacing?: "tight" | "normal" | "loose";
  }
>(({ className, spacing = "normal", ...props }, ref) => {
  const spacingClasses = {
    tight: "space-y-1 p-6 pb-4",
    normal: "space-y-2 p-6 pb-4", 
    loose: "space-y-3 p-6 pb-4"
  }
  
  return (
    <div 
      ref={ref} 
      className={cn("flex flex-col", spacingClasses[spacing], className)} 
      {...props} 
    />
  )
})
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    level?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  }
>(({ className, level = "h3", ...props }, ref) => {
  const levelClasses = {
    h1: "text-4xl font-bold leading-tight tracking-tight",
    h2: "text-3xl font-bold leading-tight tracking-tight",
    h3: "text-2xl font-semibold leading-tight tracking-tight",
    h4: "text-xl font-semibold leading-snug",
    h5: "text-lg font-medium leading-snug",
    h6: "text-base font-medium leading-snug"
  }
  
  const Component = level as keyof JSX.IntrinsicElements
  
  return (
    <Component
      ref={ref}
      className={cn(
        "text-neutral-900 font-semibold",
        levelClasses[level],
        className
      )}
      {...props}
    />
  )
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    variant?: "default" | "muted" | "accent";
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "text-neutral-700",
    muted: "text-neutral-500", 
    accent: "text-primary-600"
  }
  
  return (
    <p
      ref={ref}
      className={cn(
        "text-sm leading-relaxed",
        variants[variant],
        className
      )}
      {...props}
    />
  )
})
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    spacing?: "none" | "tight" | "normal" | "loose";
  }
>(({ className, spacing = "normal", ...props }, ref) => {
  const spacingClasses = {
    none: "p-6 pt-0",
    tight: "p-6 pt-0 space-y-2",
    normal: "p-6 pt-0 space-y-4",
    loose: "p-6 pt-0 space-y-6"
  }
  
  return (
    <div 
      ref={ref} 
      className={cn(spacingClasses[spacing], className)} 
      {...props} 
    />
  )
})
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    justify?: "start" | "center" | "end" | "between";
    spacing?: "tight" | "normal" | "loose";
  }
>(({ className, justify = "start", spacing = "normal", ...props }, ref) => {
  const justifyClasses = {
    start: "justify-start",
    center: "justify-center", 
    end: "justify-end",
    between: "justify-between"
  }
  
  const spacingClasses = {
    tight: "items-center p-6 pt-0 space-x-2",
    normal: "items-center p-6 pt-0 space-x-4",
    loose: "items-center p-6 pt-0 space-x-6"
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "flex",
        justifyClasses[justify],
        spacingClasses[spacing],
        className
      )}
      {...props}
    />
  )
})
CardFooter.displayName = "CardFooter"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent 
}
