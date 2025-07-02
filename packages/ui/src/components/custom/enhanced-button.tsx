"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface EnhancedButtonProps {
  children: ReactNode
  className?: string
  variant?: "default" | "gradient" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
  onClick?: () => void
  disabled?: boolean
}

export function EnhancedButton({
  children,
  className,
  variant = "default",
  size = "default",
  onClick,
  disabled,
  ...props
}: EnhancedButtonProps) {
  if (variant === "gradient") {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
          "bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200",
          size === "default" && "h-10 py-2 px-4",
          size === "sm" && "h-9 px-3 rounded-md",
          size === "lg" && "h-11 px-8 rounded-md",
          size === "icon" && "h-10 w-10",
          className,
        )}
        onClick={onClick}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    )
  }

  return (
    <Button
      className={className}
      variant={variant as any}
      size={size as any}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  )
}
