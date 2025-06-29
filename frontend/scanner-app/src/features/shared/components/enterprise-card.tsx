import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../utils/cn"

const enterpriseCardVariants = cva(
  "rounded-xl border bg-card/80 backdrop-blur-glass transition-all duration-200 text-card-foreground",
  {
    variants: {
      elevation: {
        1: "shadow-elevation-1 hover:shadow-elevation-2",
        2: "shadow-elevation-2 hover:shadow-elevation-3", 
        3: "shadow-elevation-3 hover:shadow-elevation-4",
        4: "shadow-elevation-4 hover:shadow-glass",
      },
      variant: {
        default: "border-border/50",
        glass: "bg-card/60 border-border/30 backdrop-blur-glass-lg",
        gradient: "bg-gradient-to-br from-card to-card/80 border-border/40",
        success: "border-success/20 bg-success/5",
        warning: "border-warning/20 bg-warning/5",
        error: "border-error/20 bg-error/5",
        info: "border-info/20 bg-info/5",
      },
      hover: {
        none: "",
        lift: "hover:-translate-y-1",
        scale: "hover:scale-[1.02]",
        glow: "hover:shadow-glow-primary",
      },
      interactive: {
        true: "cursor-pointer transition-transform active:scale-[0.98]",
        false: "",
      }
    },
    defaultVariants: {
      elevation: 2,
      variant: "default",
      hover: "lift",
      interactive: false,
    }
  }
)

const EnterpriseCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof enterpriseCardVariants>
>(({ className, elevation, variant, hover, interactive, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(enterpriseCardVariants({ elevation, variant, hover, interactive, className }))}
    {...props}
  />
))
EnterpriseCard.displayName = "EnterpriseCard"

const EnterpriseCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
EnterpriseCardHeader.displayName = "EnterpriseCardHeader"

const EnterpriseCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
EnterpriseCardTitle.displayName = "EnterpriseCardTitle"

const EnterpriseCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
EnterpriseCardDescription.displayName = "EnterpriseCardDescription"

const EnterpriseCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
EnterpriseCardContent.displayName = "EnterpriseCardContent"

const EnterpriseCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
EnterpriseCardFooter.displayName = "EnterpriseCardFooter"

// Specialized card variants for common use cases
const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & Pick<VariantProps<typeof enterpriseCardVariants>, 'elevation' | 'hover'>
>(({ className, elevation = 3, hover = "lift", ...props }, ref) => (
  <EnterpriseCard
    ref={ref}
    variant="glass"
    elevation={elevation}
    hover={hover}
    className={className}
    {...props}
  />
))
GlassCard.displayName = "GlassCard"

const InteractiveCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof enterpriseCardVariants>
>(({ className, hover = "lift", ...props }, ref) => (
  <EnterpriseCard
    ref={ref}
    interactive={true}
    hover={hover}
    className={className}
    {...props}
  />
))
InteractiveCard.displayName = "InteractiveCard"

const StatusCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    status: 'success' | 'warning' | 'error' | 'info'
    elevation?: VariantProps<typeof enterpriseCardVariants>['elevation']
  }
>(({ className, status, elevation = 2, ...props }, ref) => (
  <EnterpriseCard
    ref={ref}
    variant={status}
    elevation={elevation}
    className={className}
    {...props}
  />
))
StatusCard.displayName = "StatusCard"

export { 
  EnterpriseCard, 
  EnterpriseCardHeader, 
  EnterpriseCardFooter, 
  EnterpriseCardTitle, 
  EnterpriseCardDescription, 
  EnterpriseCardContent,
  GlassCard,
  InteractiveCard,
  StatusCard,
  enterpriseCardVariants,
}