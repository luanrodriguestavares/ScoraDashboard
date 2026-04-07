import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCircle, Info, AlertTriangle, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { dashboardApi } from '@/services/api'
import type { Alert } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'
import { useNavigate } from 'react-router-dom'

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
                'flex items-start gap-3 rounded-md border border-border/40 p-3',
                alert.acknowledged && 'opacity-60',
                isDismissing && 'opacity-0'
            )}
        >
            <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium truncate">{alert.title}</span>
                    <span className="text-[11px] text-muted-foreground">
                        ({formatTime(alert.created_at)})
                    </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{alert.description}</p>
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
                <CheckCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
        </div>
    )
}

export function AlertsDropdown() {
    const { t } = useLanguage()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set())
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

    const alertsQuery = useQuery({
        queryKey: ['dashboard', 'alerts'],
        queryFn: dashboardApi.getAlerts,
    })

    const acknowledgeMutation = useMutation({
        mutationFn: (id: string) => dashboardApi.acknowledgeAlert(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['dashboard', 'alerts'] })
            const previous = queryClient.getQueryData<Alert[]>(['dashboard', 'alerts'])
            if (previous) {
                queryClient.setQueryData<Alert[]>(
                    ['dashboard', 'alerts'],
                    previous.map((alert) =>
                        alert.id === id ? { ...alert, acknowledged: true } : alert
                    )
                )
            }
            return { previous }
        },
        onError: (_error, _id, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['dashboard', 'alerts'], context.previous)
            }
        },
    })

    const alerts = alertsQuery.data ?? []
    const visibleAlerts = useMemo(
        () => alerts.filter((alert) => !dismissedIds.has(alert.id)),
        [alerts, dismissedIds]
    )
    const displayAlerts = visibleAlerts.slice(0, 6)
    const unacknowledgedCount = visibleAlerts.filter((a) => !a.acknowledged).length

    const handleAcknowledge = (id: string) => {
        acknowledgeMutation.mutate(id)
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
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground relative"
                    aria-label={t.header.notifications}
                >
                    <Bell className="h-4 w-4" />
                    {unacknowledgedCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center px-1">
                            {unacknowledgedCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[360px] p-2">
                <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t.header.notifications}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => navigate('/dashboard/alerting')}
                    >
                        {t.overview.viewAll}
                    </Button>
                </div>
                <ScrollArea className="max-h-[360px] pr-2">
                    <div className="space-y-2 p-2">
                        {displayAlerts.length === 0 ? (
                            <div className="text-xs text-muted-foreground text-center py-6">
                                {t.common.noActiveAlerts}
                            </div>
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
                    </div>
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
