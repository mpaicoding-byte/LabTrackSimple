import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = (variant: string = "default", size: string = "default") => {
    // Implementing CVA manually since I didn't ask to install 'class-variance-authority'
    // Actually, I should probably stick to `clsx` logic for simplicity unless I install cva.
    // I'll stick to simple logic.
    return cn(
        "cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        {
            "bg-primary text-primary-foreground shadow-lg shadow-indigo-500/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all duration-200": variant === "default",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-red-500/20": variant === "destructive",
            "border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white backdrop-blur-sm": variant === "outline",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
            "hover:bg-white/10 hover:text-white": variant === "ghost",
            "text-primary underline-offset-4 hover:underline": variant === "link",
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-lg px-3": size === "sm",
            "h-12 rounded-xl px-8 text-base": size === "lg",
            "h-10 w-10 p-0": size === "icon",
        }
    );
}

type SlotProps = React.HTMLAttributes<HTMLElement> & {
    children?: React.ReactNode
}

type SlottableProps = React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>

const Slot = React.forwardRef<HTMLElement, SlotProps>(({ children, className, ...props }, ref) => {
    if (!React.isValidElement(children)) {
        return null
    }

    const child = children as React.ReactElement<SlottableProps>
    return React.cloneElement(child, {
        ...props,
        className: cn(child.props.className, className),
        ref,
    })
})
Slot.displayName = "Slot"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
        const Component = asChild ? Slot : "button"

        return (
            <Component
                className={cn(buttonVariants(variant, size), className)}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
