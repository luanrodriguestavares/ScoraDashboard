import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useLanguage } from '@/contexts/LanguageContext'
import {
    Download,
    FileText,
    User,
    Settings,
    Key,
    Shield,
    Activity,
    LogIn,
    Calendar,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import type { AuditLog } from '@/types'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { auditApi } from '@/services/api'

function getActionIcon(action: string) {
    const icons: Record<string, typeof Activity> = {
        decision: Shield,
        feedback: Activity,
        config: Settings,
        login: LogIn,
        api_key: Key,
    }
    return icons[action] || FileText
}

function getActionColor(action: string) {
    const colors: Record<string, string> = {
        decision: 'text-primary',
        feedback: 'text-decision-allow',
        config: 'text-decision-review',
        login: 'text-blue-500',
        api_key: 'text-purple-500',
    }
    return colors[action] || 'text-muted-foreground'
}

function getActionLabel(action: string) {
    const labels: Record<string, string> = {
        decision: 'decisão',
        feedback: 'feedback',
        config: 'configuração',
        login: 'login',
        api_key: 'chave api',
    }
    return labels[action] || action.replace('_', ' ')
}

interface AuditLogRowProps {
    log: AuditLog
    onClick?: () => void
}

function AuditLogRow({ log, onClick }: AuditLogRowProps) {
    const Icon = getActionIcon(log.action)
    const iconColor = getActionColor(log.action)

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString()
    }

    const formatDetails = (details: Record<string, unknown>) => {
        return Object.entries(details)
            .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
            .join(', ')
    }

    return (
        <TableRow className="cursor-pointer hover:bg-muted/40" onClick={onClick}>
            <TableCell className="whitespace-nowrap">
                <span className="text-sm text-muted-foreground">{formatTime(log.created_at)}</span>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4', iconColor)} />
                    <Badge variant="outline" className="capitalize">
                        {getActionLabel(log.action)}
                    </Badge>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    {log.actor_type === 'user' ? (
                        <User className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm">
                        {log.actor_type === 'system' ? 'Sistema' : log.actor_id}
                    </span>
                </div>
            </TableCell>
            <TableCell>
                <code className="text-xs bg-muted px-2 py-1 rounded max-w-xs truncate block">
                    {formatDetails(log.details || {})}
                </code>
            </TableCell>
            <TableCell>
                <span className="text-sm text-muted-foreground font-mono">
                    {log.ip_address || '-'}
                </span>
            </TableCell>
        </TableRow>
    )
}

export function AuditLogsPage() {
    const { t } = useLanguage()
    const [filterAction, setFilterAction] = useState('all')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

    const logsQuery = useQuery({
        queryKey: ['audit-logs', filterAction, startDate, endDate, page, pageSize],
        queryFn: () =>
            auditApi.getLogs({
                page,
                limit: pageSize,
                action: filterAction === 'all' ? undefined : filterAction,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            }),
    })

    const logs = logsQuery.data?.items ?? []
    const total = logsQuery.data?.total ?? 0

    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            if (filterAction !== 'all' && log.action !== filterAction) return false
            return true
        })
    }, [logs, filterAction])

    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const visiblePages = useMemo(() => {
        const maxVisible = 5
        let start = Math.max(1, page - Math.floor(maxVisible / 2))
        let end = Math.min(totalPages, start + maxVisible - 1)
        start = Math.max(1, end - maxVisible + 1)
        return Array.from({ length: end - start + 1 }, (_, i) => start + i)
    }, [page, totalPages])

    useEffect(() => {
        setPage(1)
    }, [filterAction, startDate, endDate, pageSize])

    useEffect(() => {
        if (page > totalPages) setPage(totalPages)
    }, [page, totalPages])

    const handleExport = () => {
        auditApi
            .exportCsv({
                action: filterAction === 'all' ? undefined : filterAction,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            })
            .then(({ blob, filename }) => {
                const objectUrl = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = objectUrl
                link.download = filename || 'audit_logs.csv'
                document.body.appendChild(link)
                link.click()
                link.remove()
                URL.revokeObjectURL(objectUrl)
            })
    }

    const actions = ['all', 'decision', 'feedback', 'config', 'login', 'api_key'] as const

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-heading font-bold">{t.auditLogs.title}</h2>
                    <p className="text-muted-foreground">{t.auditLogs.subtitle}</p>
                </div>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    {t.auditLogs.exportCsv}
                </Button>
            </div>

            <div className="flex flex-wrap gap-2">
                {actions.map((action) => (
                    <Button
                        key={action}
                        variant={filterAction === action ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterAction(action)}
                        className="capitalize"
                    >
                        {action === 'all' ? 'Todos' : getActionLabel(action)}
                        {action === 'all' && (
                            <Badge
                                variant="secondary"
                                className={cn(
                                    'ml-2',
                                    filterAction === action && 'bg-primary-foreground text-primary'
                                )}
                            >
                                {total}
                            </Badge>
                        )}
                    </Button>
                ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                <div className="relative w-[140px]">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="relative w-[140px]">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="pl-10"
                    />
                </div>
                {(startDate || endDate) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setStartDate('')
                            setEndDate('')
                        }}
                    >
                        Limpar
                    </Button>
                )}
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-48">{t.auditLogs.timestamp}</TableHead>
                                <TableHead className="w-32">{t.auditLogs.action}</TableHead>
                                <TableHead className="w-40">{t.auditLogs.actor}</TableHead>
                                <TableHead>{t.auditLogs.details}</TableHead>
                                <TableHead className="w-32">{t.auditLogs.ipAddress}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-muted-foreground">
                                            {t.auditLogs.noLogs}
                                        </p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs.map((log) => (
                                    <AuditLogRow
                                        key={log.id}
                                        log={log}
                                        onClick={() => setSelectedLog(log)}
                                    />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="flex items-center justify-center gap-2 pb-2">
                <Select
                    value={String(pageSize)}
                    onValueChange={(value) => setPageSize(Number(value))}
                >
                    <SelectTrigger className="w-[110px] h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[10, 20, 30, 50].map((size) => (
                            <SelectItem key={size} value={String(size)}>
                                {size}/pag
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    variant="outline"
                    size="icon"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                {visiblePages.map((p) => (
                    <Button
                        key={p}
                        variant={p === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(p)}
                    >
                        {p}
                    </Button>
                ))}
                <Button
                    variant="outline"
                    size="icon"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="ml-2 text-xs text-muted-foreground font-mono">
                    {page}/{totalPages}
                </span>
            </div>

            <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{t.auditLogs.details || 'Detalhes do log'}</DialogTitle>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        {t.auditLogs.action}
                                    </p>
                                    <p className="font-medium capitalize">
                                        {getActionLabel(selectedLog.action)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        {t.auditLogs.actor}
                                    </p>
                                    <p className="font-medium">
                                        {selectedLog.actor_type === 'system'
                                            ? 'Sistema'
                                            : selectedLog.actor_id}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        {t.auditLogs.timestamp}
                                    </p>
                                    <p className="font-medium">
                                        {new Date(selectedLog.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        {t.auditLogs.ipAddress}
                                    </p>
                                    <p className="font-medium font-mono">
                                        {selectedLog.ip_address || '-'}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-2">
                                    {t.auditLogs.details}
                                </p>
                                <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-72">
                                    {JSON.stringify(selectedLog.details || {}, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
