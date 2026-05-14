You are given a task to integrate an existing React component in the codebase

The codebase should support:
- shadcn project structure  
- Tailwind CSS
- Typescript

If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

Determine the default path for components and styles. 
If default path for components is not /components/ui, provide instructions on why it's important to create this folder
Copy-paste this component to /components/ui folder:
```tsx
button-download.tsx
"use client"

import { Download, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DownloadButtonProps {
    downloadStatus: "idle" | "downloading" | "downloaded" | "complete"
    progress: number
    onClick: () => void
    className?: string
}

export default function DownloadButton({ downloadStatus, progress, onClick, className }: DownloadButtonProps) {
    return (
        <Button
            onClick={onClick}
            className={cn(
                "rounded-xl w-40 relative overflow-hidden select-none",
                downloadStatus === "downloading" && "bg-primary/50 hover:bg-primary/50",
                downloadStatus !== "idle" && "pointer-events-none",
                className,
            )}
        >
            {downloadStatus === "idle" && (
                <>
                    <Download className="h-4 w-4" />
                    Download
                </>
            )}
            {downloadStatus === "downloading" && (
                <div className="z-[5] flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {progress}%
                </div>
            )}
            {downloadStatus === "downloaded" && (
                <>
                    <CheckCircle className="h-4 w-4" />
                    <span className="t">Downloaded</span>
                </>
            )}
            {downloadStatus === "complete" && <span className="text-primary">Download</span>}
            {downloadStatus === "downloading" && (
                <div
                    className="absolute bottom-0 z-[3] h-full left-0 bg-primary inset-0 transition-all duration-200 ease-in-out"
                    style={{ width: `${progress}%` }}
                />
            )}
        </Button>
    )
}



demo.tsx
"use client"

import { useState } from "react"
import DownloadButton from "@/components/ui/button-download"

export default function DownloadButtonDemo() {
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "downloading" | "downloaded" | "complete">("idle")
  const [progress, setProgress] = useState(0)

  const simulateDownload = () => {
    setDownloadStatus("downloading")
    setProgress(0)

    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval)
          setDownloadStatus("downloaded")
          return 100
        }
        return prevProgress + 5
      })
    }, 200) // Update every 200ms to complete in 4 seconds

    // Show 'Downloaded' state for 1.5 seconds
    setTimeout(() => {
      setDownloadStatus("complete")
    }, 4000 + 1500)

    // Reset to idle state after download completes and 'Downloaded' state is shown
    setTimeout(
      () => {
        setDownloadStatus("idle")
        setProgress(0)
      },
      4000 + 1500 + 100,
    ) // Added 100ms buffer for smoother transition
  }

  const handleClick = () => {
    if (downloadStatus === "idle") {
      simulateDownload()
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[10rem]">
      <DownloadButton
        downloadStatus={downloadStatus}
        progress={progress}
        onClick={handleClick}
        className="hover:shadow-xl transition-shadow duration-300"
      />
    </div>
  )
}


```

Copy-paste these files for dependencies:
```tsx
shadcn/button
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }

```

Install NPM dependencies:
```bash
lucide-react, @radix-ui/react-slot, class-variance-authority
```

Implementation Guidelines
 1. Analyze the component structure and identify all required dependencies
 2. Review the component's argumens and state
 3. Identify any required context providers or hooks and install them
 4. Questions to Ask
 - What data/props will be passed to this component?
 - Are there any specific state management requirements?
 - Are there any required assets (images, icons, etc.)?
 - What is the expected responsive behavior?
 - What is the best place to use this component in the app?

Steps to integrate
 0. Copy paste all the code above in the correct directories
 1. Install external dependencies
 2. Fill image assets with Unsplash stock images you know exist
 3. Use lucide-react icons for svgs or logos if component requires them
