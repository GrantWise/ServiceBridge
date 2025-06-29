import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../utils/cn"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-elevation-1 hover:shadow-elevation-2 hover:-translate-y-0.5 active:translate-y-0 hover:bg-primary/90",
        destructive:
          "bg-error text-error-foreground shadow-elevation-1 hover:shadow-elevation-2 hover:-translate-y-0.5 active:translate-y-0 hover:bg-error/90 focus-visible:ring-error/20",
        outline:
          "border bg-background shadow-elevation-1 hover:shadow-elevation-2 hover:-translate-y-0.5 active:translate-y-0 hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-elevation-1 hover:shadow-elevation-2 hover:-translate-y-0.5 active:translate-y-0 hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground hover:shadow-elevation-1 hover:-translate-y-0.5 active:translate-y-0",
        link: "text-primary underline-offset-4 hover:underline",
        success:
          "bg-success text-success-foreground shadow-elevation-1 hover:shadow-elevation-2 hover:-translate-y-0.5 active:translate-y-0 hover:bg-success/90",
        warning:
          "bg-warning text-warning-foreground shadow-elevation-1 hover:shadow-elevation-2 hover:-translate-y-0.5 active:translate-y-0 hover:bg-warning/90",
        info:
          "bg-info text-info-foreground shadow-elevation-1 hover:shadow-elevation-2 hover:-translate-y-0.5 active:translate-y-0 hover:bg-info/90",
        glass:
          "bg-card/60 backdrop-blur-glass border border-border/30 shadow-glass hover:shadow-elevation-3 hover:-translate-y-0.5 active:translate-y-0 hover:bg-card/80",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 rounded-lg px-6 has-[>svg]:px-4 text-base",
        xl: "h-14 rounded-xl px-8 has-[>svg]:px-6 text-lg",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
      animation: {
        none: "",
        lift: "hover:-translate-y-0.5 hover:shadow-elevation-2",
        scale: "hover:scale-105 active:scale-95",
        glow: "hover:shadow-glow-primary",
        pulse: "hover:animate-pulse-glow",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "lift",
    },
  }
)

function Button({
  className,
  variant,
  size,
  animation,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, animation, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
