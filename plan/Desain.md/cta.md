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
emoji-rating.tsx
"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface RatingInteractionProps {
  onChange?: (rating: number) => void
  className?: string
}

const ratingData = [
  { emoji: "😔", label: "Terrible", color: "from-red-400 to-red-500", shadowColor: "shadow-red-500/30" },
  { emoji: "😕", label: "Poor", color: "from-orange-400 to-orange-500", shadowColor: "shadow-orange-500/30" },
  { emoji: "😐", label: "Okay", color: "from-yellow-400 to-yellow-500", shadowColor: "shadow-yellow-500/30" },
  { emoji: "🙂", label: "Good", color: "from-lime-400 to-lime-500", shadowColor: "shadow-lime-500/30" },
  { emoji: "😍", label: "Amazing", color: "from-emerald-400 to-emerald-500", shadowColor: "shadow-emerald-500/30" },
]

export function RatingInteraction({ onChange, className }: RatingInteractionProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)

  const handleClick = (value: number) => {
    setRating(value)
    onChange?.(value)
  }

  const displayRating = hoverRating || rating
  const activeData = displayRating > 0 ? ratingData[displayRating - 1] : null

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      {/* Emoji rating buttons */}
      <div className="flex items-center gap-3">
        {ratingData.map((item, i) => {
          const value = i + 1
          const isActive = value <= displayRating
          const isExact = value === displayRating

          return (
            <button
              key={value}
              onClick={() => handleClick(value)}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              className="group relative focus:outline-none"
              aria-label={`Rate ${value}: ${item.label}`}
            >
              <div
                className={cn(
                  "relative flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 ease-out",
                  isActive ? "scale-110" : "scale-100 group-hover:scale-105",
                )}
              >
                {/* Emoji with smooth grayscale transition */}
                <span
                  className={cn(
                    "text-3xl transition-all duration-300 ease-out select-none",
                    isActive
                      ? "grayscale-0 drop-shadow-lg"
                      : "grayscale opacity-40 group-hover:opacity-70 group-hover:grayscale-[0.3]",
                  )}
                >
                  {item.emoji}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="relative h-7 w-32">
        {/* Default "Rate us" text */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out",
            displayRating > 0 ? "opacity-0 blur-md scale-95" : "opacity-100 blur-0 scale-100",
          )}
        >
          <span className="text-sm font-medium text-muted-foreground">Rate us</span>
        </div>

        {/* Rating labels with blur in/out effect */}
        {ratingData.map((item, i) => (
          <div
            key={i}
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out",
              displayRating === i + 1 ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-md scale-105",
            )}
          >
            <span className="text-sm font-semibold tracking-wide text-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}


demo.tsx
import { RatingInteraction } from "@/components/ui/emoji-rating"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8 w-full">
      <div className="flex flex-col items-center gap-8">
      
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
          How was your experience?
        </p>

        <RatingInteraction />
        
        <div className="mt-4 h-px w-24 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
    </main>
  )
}

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
