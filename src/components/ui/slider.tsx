import * as React from 'react'
import { cn } from '@/lib/utils'

interface SliderProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: number[]
    min?: number
    max?: number
    step?: number
    onValueChange?: (value: number[]) => void
    disabled?: boolean
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
    (
        {
            className,
            value = [0],
            min = 0,
            max = 100,
            step = 1,
            onValueChange,
            disabled = false,
            ...props
        },
        ref
    ) => {
        const trackRef = React.useRef<HTMLDivElement>(null)

        const percentage = ((value[0] - min) / (max - min)) * 100

        const handleInteraction = (clientX: number) => {
            if (disabled || !trackRef.current) return

            const rect = trackRef.current.getBoundingClientRect()
            const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
            const newValue = Math.round((percent * (max - min) + min) / step) * step
            onValueChange?.([Math.max(min, Math.min(max, newValue))])
        }

        const handleMouseDown = (e: React.MouseEvent) => {
            handleInteraction(e.clientX)

            const handleMouseMove = (e: MouseEvent) => {
                handleInteraction(e.clientX)
            }

            const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
            }

            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
        }

        return (
            <div
                ref={ref}
                className={cn(
                    'relative flex w-full touch-none select-none items-center',
                    disabled && 'opacity-50 cursor-not-allowed',
                    className
                )}
                {...props}
            >
                <div
                    ref={trackRef}
                    className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary cursor-pointer"
                    onMouseDown={handleMouseDown}
                >
                    <div
                        className="absolute h-full bg-primary"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div
                    className="absolute h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-grab active:cursor-grabbing"
                    style={{ left: `calc(${percentage}% - 10px)` }}
                    onMouseDown={handleMouseDown}
                />
            </div>
        )
    }
)
Slider.displayName = 'Slider'

export { Slider }
