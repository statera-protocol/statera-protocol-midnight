import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface GradientCardProps {
  children: ReactNode
  className?: string
  variant?: "default" | "accent"
  title?: string
  description?: string
}

export function GradientCard({
  children,
  className,
  variant = "default",
  title,
  description,
  ...props
}: GradientCardProps) {
  if (variant === "accent") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border bg-gradient-to-r from-cyan-600/10 to-blue-600/10 dark:from-cyan-600/20 dark:to-blue-600/20 backdrop-blur-sm border-cyan-200 dark:border-cyan-800",
          className,
        )}
        {...props}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/5 to-blue-600/5 dark:from-cyan-600/10 dark:to-blue-600/10" />
        <div className="relative">
          {title && (
            <CardHeader>
              <CardTitle className="text-cyan-700 dark:text-cyan-300">{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
          )}
          <CardContent>{children}</CardContent>
        </div>
      </div>
    )
  }

  return (
    <Card
      className={cn(
        "bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-slate-200 dark:border-zinc-800",
        className,
      )}
      {...props}
    >
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  )
}
