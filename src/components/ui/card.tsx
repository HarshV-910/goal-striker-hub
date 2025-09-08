import * as React from "react"

import { cn } from "@/lib/utils"
import glassImage from "@/assets/glass.webp"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "shadow-2xl backdrop-blur-xl border border-white/5 relative overflow-hidden transition-all duration-300 rounded-lg text-white hover:scale-[1.02]",
      className
    )}
    style={{
      backdropFilter: 'blur(20px)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 8px 32px rgba(59, 130, 246, 0.05)'
    }}
    {...props}
  >
    {/* Background image with reduced opacity */}
    <div className="absolute inset-0 opacity-50" style={{ backgroundImage: `url(${glassImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
    
    {/* Glass overlay with opacity control */}
    <div className="absolute inset-0 bg-black/20 opacity-80 hover:opacity-95 transition-opacity duration-300 rounded-lg"></div>
    
    {/* Glass reflection effects */}
    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none"></div>
    <div className="absolute top-4 left-4 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
    <div className="absolute bottom-4 right-4 w-12 h-12 bg-white/5 rounded-full blur-lg pointer-events-none"></div>
    
    <div className="relative z-10 text-white">
      {props.children}
    </div>
  </div>
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
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
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
