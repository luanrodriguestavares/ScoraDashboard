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
        success: '',
        warning: '',
        danger: '',
    }

    return (
        <Card className={cn(variantStyles[variant], className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {title}
                </CardTitle>
                {Icon && <Icon className="h-4 w-4 text-muted-foreground/70" />}
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-semibold">{value}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
                {trend && (
                    <p
                        className={cn(
                            'text-xs mt-1',
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
