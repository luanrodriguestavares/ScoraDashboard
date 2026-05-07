import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
    title: string
    value: string | number
    description?: string
    icon?: LucideIcon
    trend?: {
        value: number
        positive?: boolean
    }
    variant?: 'default' | 'success' | 'warning' | 'danger'
    className?: string
}

export function StatCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    variant = 'default',
    className,
}: StatCardProps) {
    const variantStyles = {
        default: '',
        success: 'border-l-[3px] border-l-decision-allow',
        warning: 'border-l-[3px] border-l-decision-review',
        danger: 'border-l-[3px] border-l-decision-block',
    }

    const iconVariantStyles = {
        default: 'text-muted-foreground/60',
        success: 'text-decision-allow/70',
        warning: 'text-decision-review/70',
        danger: 'text-decision-block/70',
    }

    return (
        <Card className={cn(variantStyles[variant], className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {title}
                </CardTitle>
                {Icon && <Icon className={cn('h-4 w-4', iconVariantStyles[variant])} />}
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-semibold tabular-nums">{value}</div>
                {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
                {trend && (
                    <p
                        className={cn(
                            'text-xs mt-1 font-medium',
                            trend.positive ? 'text-decision-allow' : 'text-decision-block'
                        )}
                    >
                        {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
