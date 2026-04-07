import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, AlertCircle, Info, CheckCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Alert } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'

interface AlertItemProps {
    alert: Alert
    onAcknowledge?: (id: string) => void
    isDismissing?: boolean
}

function AlertItem({ alert, onAcknowledge, isDismissing }: AlertItemProps) {
    const { t } = useLanguage()
    const icons = {
        spike: AlertTriangle,
        cluster: AlertCircle,
        pattern: AlertCircle,
        system: Info,
    }

    const severityStyles = {
        info: 'border-l-primary/70 bg-primary/5',
        warning: 'border-l-primary/80 bg-primary/7',
        critical: 'border-l-primary/90 bg-primary/10',
    }

    const Icon = icons[alert.type] || AlertTriangle

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / (1000 * 60))

        if (diffMins < 1) return t.common.now
        if (diffMins < 60) return `${diffMins}${t.common.minutesShort}`
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}${t.common.hoursShort}`
        return `${Math.floor(diffMins / 1440)}${t.common.daysShort}`
    }

    return (
        <div
            className={cn(
                'flex items-start gap-3 border-l-4 p-3 rounded-r-md transition-opacity duration-300',
                severityStyles[alert.severity],
                alert.acknowledged && 'opacity-50',
                isDismissing && 'opacity-0'
            )}
        >
            <Icon
                className={cn(
                    'h-5 w-5 mt-0.5',
                    alert.severity === 'critical' && 'text-decision-block',
                    alert.severity === 'warning' && 'text-decision-review',
                    alert.severity === 'info' && 'text-blue-500'
                )}
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{alert.title}</span>
                    <span className="text-xs text-muted-foreground">
                        ({formatTime(alert.created_at)})
                    </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
            </div>
            {!alert.acknowledged && onAcknowledge && !isDismissing && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => onAcknowledge(alert.id)}
                >
                    <X className="h-3 w-3" />
                </Button>
            )}
            {alert.acknowledged && !isDismissing && (
                <CheckCircle className="h-4 w-4 text-decision-allow shrink-0" />
            )}
        </div>
    )
}

interface AlertListProps {
    alerts: Alert[]
    title?: string
    onAcknowledge?: (id: string) => void
    maxItems?: number
}

export function AlertList({ alerts, title, onAcknowledge, maxItems = 5 }: AlertListProps) {
    const { t } = useLanguage()
    const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set())
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

    const visibleAlerts = useMemo(
        () => alerts.filter((alert) => !dismissedIds.has(alert.id)),
        [alerts, dismissedIds]
    )

    const displayAlerts = visibleAlerts.slice(0, maxItems)
    const unacknowledgedCount = visibleAlerts.filter((a) => !a.acknowledged).length

    const handleAcknowledge = (id: string) => {
        onAcknowledge?.(id)
        setDismissingIds((prev) => {
            const next = new Set(prev)
            next.add(id)
            return next
        })
        window.setTimeout(() => {
            setDismissedIds((prev) => {
                const next = new Set(prev)
                next.add(id)
                return next
            })
            setDismissingIds((prev) => {
                const next = new Set(prev)
                next.delete(id)
                return next
            })
        }, 350)
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    {unacknowledgedCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                            {unacknowledgedCount}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                {displayAlerts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        {t.common.noActiveAlerts}
                    </p>
                ) : (
                    displayAlerts.map((alert) => (
                        <AlertItem
                            key={alert.id}
                            alert={alert}
                            onAcknowledge={handleAcknowledge}
                            isDismissing={dismissingIds.has(alert.id)}
                        />
                    ))
                )}
            </CardContent>
        </Card>
    )
}
