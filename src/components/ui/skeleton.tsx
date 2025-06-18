import * as React from "react"

import { cn } from "@/lib/utils"

const Skeleton = React.forwardRef<
  React.HTMLAttributes<HTMLDivElement>,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-secondary",
        className
      )}
      {...props}
      ref={ref}
    />
  )
})
Skeleton.displayName = "Skeleton"

export { Skeleton }
