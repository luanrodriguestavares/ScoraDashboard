import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { monitoringApi } from '@/services/api'
import {
    Activity,
    Database,
    Server,
    Cpu,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    RefreshCw,
    Gauge,
    TrendingUp,
    TrendingDown,
    Zap,
    HardDrive,
    Globe,
} from 'lucide-react'

interface ComponentHealth {
    name: string
    status: 'healthy' | 'degraded' | 'critical'
    latency_ms?: number
    error_rate?: number
    uptime?: number
    details?: Record<string, unknown>
}

interface PerformanceMetrics {
    avg_processing_time_ms: number
    p50_processing_time_ms: number
    p95_processing_time_ms: number
    p99_processing_time_ms: number
    requests_per_minute: number
    error_rate: number
    decision_distribution: Record<string, number>
}

interface HealthAlert {
    id: string
    severity: 'warning' | 'error' | 'critical'
    component: string
    message: string
    metric?: string
    current_value?: number
    threshold?: number
    timestamp: string
}

interface SystemHealth {
    status: 'healthy' | 'degraded' | 'critical'
    timestamp: string
    components: ComponentHealth[]
    metrics: PerformanceMetrics
    alerts: HealthAlert[]
}

const emptyHealth: SystemHealth = {
    status: 'healthy',
    timestamp: new Date(0).toISOString(),
    components: [],
    metrics: {
        avg_processing_time_ms: 0,
        p50_processing_time_ms: 0,
        p95_processing_time_ms: 0,
        p99_processing_time_ms: 0,
        requests_per_minute: 0,
        error_rate: 0,
        decision_distribution: {},
    },
    alerts: [],
}

const buildHistoryData = (metrics: PerformanceMetrics, points = 30) => {
    const now = Date.now()
    return Array.from({ length: points }, (_, i) => ({
        time: new Date(now - (points - i) * 60000).toISOString(),
        latency: metrics.avg_processing_time_ms || 0,
        rpm: metrics.requests_per_minute || 0,
        errors: metrics.error_rate || 0,
    }))
}

interface StatusIndicatorProps {
    status: 'healthy' | 'degraded' | 'critical'
    showLabel?: boolean
    size?: 'sm' | 'md' | 'lg'
}

function StatusIndicator({ status, showLabel = false, size = 'md' }: StatusIndicatorProps) {
    const sizeClasses = {
        sm: 'h-2 w-2',
        md: 'h-3 w-3',
        lg: 'h-4 w-4',
    }

    return (
        <div className="flex items-center gap-2">
            <div
                className={cn(
                    'rounded-full animate-pulse',
                    sizeClasses[size],
                    status === 'healthy' && 'bg-decision-allow',
                    status === 'degraded' && 'bg-decision-review',
                    status === 'critical' && 'bg-decision-block'
                )}
            />
            {showLabel && (
                <span
                    className={cn(
                        'text-sm font-medium capitalize',
                        status === 'healthy' && 'text-decision-allow',
                        status === 'degraded' && 'text-decision-review',
                        status === 'critical' && 'text-decision-block'
                    )}
                >
                    {status}
                </span>
            )}
        </div>
    )
}

interface ComponentCardProps {
    component: ComponentHealth
}

function ComponentCard({ component }: ComponentCardProps) {
    const { t } = useLanguage()
    const icons: Record<string, typeof Database> = {
        Database: Database,
        'Scoring Engine': Cpu,
        'Graph Analyzer': Globe,
        'Pattern Detector': Activity,
        'Context Analyzer': Server,
        'Cache (Redis)': HardDrive,
    }
    const Icon = icons[component.name] || Server

    return (
        <Card
            className={cn(
                'transition-all',
                component.status === 'degraded' && 'border-decision-review',
                component.status === 'critical' && 'border-decision-block'
            )}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                'h-10 w-10 rounded-lg flex items-center justify-center',
                                component.status === 'healthy' && 'bg-decision-allow/10',
                                component.status === 'degraded' && 'bg-decision-review/10',
                                component.status === 'critical' && 'bg-decision-block/10'
                            )}
                        >
                            <Icon
                                className={cn(
                                    'h-5 w-5',
                                    component.status === 'healthy' && 'text-decision-allow',
                                    component.status === 'degraded' && 'text-decision-review',
                                    component.status === 'critical' && 'text-decision-block'
                                )}
                            />
                        </div>
                        <div>
                            <p className="font-medium">{component.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {component.latency_ms}ms {t.monitoring?.latency || 'latency'}
                            </p>
                        </div>
                    </div>
                    <StatusIndicator status={component.status} />
                </div>
                {component.uptime && (
                    <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">
                                {t.monitoring?.uptime || 'Uptime'}
                            </span>
                            <span className="font-mono">{component.uptime}%</span>
                        </div>
                        <Progress value={component.uptime} className="h-1" />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

interface MetricGaugeProps {
    label: string
    value?: number | null
    unit: string
    icon: typeof Clock
    trend?: 'up' | 'down' | 'stable'
    status?: 'good' | 'warning' | 'critical'
}

function MetricGauge({ label, value, unit, icon: Icon, trend, status = 'good' }: MetricGaugeProps) {
    const safeValue = typeof value === 'number' && Number.isFinite(value) ? value : 0

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div
                        className={cn(
                            'h-10 w-10 rounded-lg flex items-center justify-center',
                            status === 'good' && 'bg-primary/10',
                            status === 'warning' && 'bg-decision-review/10',
                            status === 'critical' && 'bg-decision-block/10'
                        )}
                    >
                        <Icon
                            className={cn(
                                'h-5 w-5',
                                status === 'good' && 'text-primary',
                                status === 'warning' && 'text-decision-review',
                                status === 'critical' && 'text-decision-block'
                            )}
                        />
                    </div>
                    {trend && (
                        <div
                            className={cn(
                                'flex items-center gap-1 text-xs',
                                trend === 'up' && 'text-decision-block',
                                trend === 'down' && 'text-decision-allow',
                                trend === 'stable' && 'text-muted-foreground'
                            )}
                        >
                            {trend === 'up' && <TrendingUp className="h-3 w-3" />}
                            {trend === 'down' && <TrendingDown className="h-3 w-3" />}
                            {trend === 'stable' && <Activity className="h-3 w-3" />}
                        </div>
                    )}
                </div>
                <div className="mt-3">
                    <p className="text-2xl font-bold font-mono">
                        {safeValue.toLocaleString()}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                            {unit}
                        </span>
                    </p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                </div>
            </CardContent>
        </Card>
    )
}

interface LatencyChartProps {
    data: { time: string; latency: number }[]
}

function LatencyChart({ data }: LatencyChartProps) {
    const { t } = useLanguage()
    const maxLatency = Math.max(...data.map((d) => d.latency))
    const minLatency = Math.min(...data.map((d) => d.latency))

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {t.monitoring?.latency || 'Latency'} ({t.monitoring?.last30min || 'last 30 min'}
                    )
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-32 flex items-end gap-0.5">
                    {data.map((point, i) => {
                        const height =
                            ((point.latency - minLatency) / (maxLatency - minLatency + 1)) * 100
                        const isHigh = point.latency > 60

                        return (
                            <div
                                key={i}
                                className={cn(
                                    'flex-1 rounded-t transition-all hover:opacity-80',
                                    isHigh ? 'bg-decision-review' : 'bg-primary'
                                )}
                                style={{ height: `${Math.max(height, 5)}%` }}
                                title={`${point.latency.toFixed(1)}ms`}
                            />
                        )
                    })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{t.monitoring?.last30min || '30 min'}</span>
                    <span>{t.monitoring?.now || 'Now'}</span>
                </div>
            </CardContent>
        </Card>
    )
}

interface ThroughputChartProps {
    data: { time: string; rpm: number }[]
}

function ThroughputChart({ data }: ThroughputChartProps) {
    const { t } = useLanguage()
    const maxRpm = Math.max(...data.map((d) => d.rpm))

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    {t.monitoring?.throughput || 'Throughput'} (RPM)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-32 flex items-end gap-0.5">
                    {data.map((point, i) => {
                        const height = (point.rpm / maxRpm) * 100

                        return (
                            <div
                                key={i}
                                className="flex-1 rounded-t bg-primary transition-all hover:opacity-80"
                                style={{ height: `${height}%` }}
                                title={`${point.rpm.toFixed(0)} RPM`}
                            />
                        )
                    })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{t.monitoring?.last30min || '30 min'}</span>
                    <span>{t.monitoring?.now || 'Now'}</span>
                </div>
            </CardContent>
        </Card>
    )
}

interface AlertItemProps {
    alert: HealthAlert
}

function AlertItem({ alert }: AlertItemProps) {
    const { t } = useLanguage()
    return (
        <div
            className={cn(
                'flex items-start gap-3 p-3 rounded-lg border',
                alert.severity === 'warning' && 'bg-decision-review/5 border-decision-review/20',
                alert.severity === 'error' && 'bg-orange-500/5 border-orange-500/20',
                alert.severity === 'critical' && 'bg-decision-block/5 border-decision-block/20'
            )}
        >
            <AlertTriangle
                className={cn(
                    'h-5 w-5 mt-0.5 shrink-0',
                    alert.severity === 'warning' && 'text-decision-review',
                    alert.severity === 'error' && 'text-orange-500',
                    alert.severity === 'critical' && 'text-decision-block'
                )}
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">
                        {alert.component}
                    </Badge>
                    <Badge
                        variant="outline"
                        className={cn(
                            'text-xs',
                            alert.severity === 'warning' &&
                                'text-decision-review border-decision-review',
                            alert.severity === 'error' && 'text-orange-500 border-orange-500',
                            alert.severity === 'critical' &&
                                'text-decision-block border-decision-block'
                        )}
                    >
                        {alert.severity}
                    </Badge>
                </div>
                <p className="text-sm font-medium mt-1">{alert.message}</p>
                {alert.current_value !== undefined && alert.threshold !== undefined && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {t.monitoring?.current || 'Current'}:{' '}
                        <span className="font-mono">{alert.current_value}</span> |
                        {t.alerting?.threshold || 'Threshold'}:{' '}
                        <span className="font-mono">{alert.threshold}</span>
                    </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                </p>
            </div>
        </div>
    )
}

export function MonitoringPage() {
    const { t } = useLanguage()
    const queryClient = useQueryClient()
    const healthQuery = useQuery({
        queryKey: ['monitoring', 'health'],
        queryFn: monitoringApi.getHealth,
        refetchInterval: 15000,
    })
    const asyncJobsQuery = useQuery({
        queryKey: ['monitoring', 'async-jobs'],
        queryFn: monitoringApi.getAsyncJobs,
        refetchInterval: 15000,
        retry: false,
    })
    const deadLetterQuery = useQuery({
        queryKey: ['monitoring', 'dead-letter'],
        queryFn: () => monitoringApi.getDeadLetterJobs(10),
        refetchInterval: 15000,
        retry: false,
    })
    const requeueMutation = useMutation({
        mutationFn: (id: string) => monitoringApi.requeueDeadLetterJob(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['monitoring', 'async-jobs'] })
            queryClient.invalidateQueries({ queryKey: ['monitoring', 'dead-letter'] })
        },
    })
    const health = healthQuery.data ?? emptyHealth
    const historicalData = useMemo(
        () => buildHistoryData(health.metrics),
        [
            health.metrics.avg_processing_time_ms,
            health.metrics.requests_per_minute,
            health.metrics.error_rate,
        ]
    )

    const errorRatePercent =
        health.metrics.error_rate <= 1 ? health.metrics.error_rate * 100 : health.metrics.error_rate

    const statusLabel = t.monitoring?.status || 'Status'
    const asyncJobs = asyncJobsQuery.data
    const deadLetter = deadLetterQuery.data

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading font-bold">
                        {t.monitoring?.title || 'System Monitoring'}
                    </h2>
                    <p className="text-muted-foreground">
                        {t.monitoring?.subtitle ||
                            'Real-time system health and performance metrics'}
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => healthQuery.refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t.common?.refresh || 'Refresh'}
                </Button>
            </div>

            <Card>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <StatusIndicator status={health.status} size="lg" />
                        <div>
                            <p className="text-sm text-muted-foreground">{statusLabel}</p>
                            <p className="text-lg font-semibold capitalize">{health.status}</p>
                        </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {t.monitoring?.lastUpdate || 'Last update'}:{' '}
                        {new Date(health.timestamp).toLocaleString()}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Async Jobs</CardTitle>
                    <CardDescription>
                        Fila assincrona e dead-letter expostas pela API administrativa.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {asyncJobsQuery.isError ? (
                        <div className="text-sm text-muted-foreground">
                            Disponivel apenas para administradores ou quando o Redis estiver
                            configurado.
                        </div>
                    ) : asyncJobs ? (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <MetricGauge
                                label="Ready"
                                value={asyncJobs.queue.ready}
                                unit=""
                                icon={Clock}
                            />
                            <MetricGauge
                                label="Delayed"
                                value={asyncJobs.queue.delayed}
                                unit=""
                                icon={RefreshCw}
                            />
                            <MetricGauge
                                label="Oldest ready"
                                value={asyncJobs.oldest_age_seconds.ready}
                                unit="s"
                                icon={CheckCircle}
                            />
                            <MetricGauge
                                label="Oldest delayed"
                                value={asyncJobs.oldest_age_seconds.delayed}
                                unit="s"
                                icon={AlertTriangle}
                                status={
                                    asyncJobs.oldest_age_seconds.delayed > 0 ? 'warning' : 'good'
                                }
                            />
                            <MetricGauge
                                label="Dead letter"
                                value={asyncJobs.queue.dead_letter}
                                unit=""
                                icon={XCircle}
                                status={asyncJobs.queue.dead_letter > 0 ? 'critical' : 'good'}
                            />
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            Carregando fila assincrona...
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Dead Letter</CardTitle>
                    <CardDescription>
                        Itens com falha permanente na fila assincrona.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {deadLetterQuery.isError ? (
                        <div className="text-sm text-muted-foreground">
                            Nao disponivel no contexto atual.
                        </div>
                    ) : deadLetter && deadLetter.jobs.length > 0 ? (
                        deadLetter.jobs.map((job) => (
                            <div
                                key={job.id}
                                className="flex items-start justify-between gap-3 rounded-lg border p-3"
                            >
                                <div className="min-w-0">
                                    <p className="font-medium font-mono text-sm truncate">
                                        {job.id}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {(job.type || 'job').toString()}
                                        {job.failed_at
                                            ? ` • ${new Date(job.failed_at).toLocaleString()}`
                                            : ''}
                                    </p>
                                    {job.error && (
                                        <p className="text-xs text-decision-block mt-1 line-clamp-2">
                                            {job.error}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => requeueMutation.mutate(job.id)}
                                    disabled={requeueMutation.isPending}
                                >
                                    Requeue
                                </Button>
                            </div>
                        ))
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            Nenhum item em dead-letter.
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricGauge
                    label={t.monitoring?.avgProcessing || 'Avg processing'}
                    value={health.metrics.avg_processing_time_ms}
                    unit="ms"
                    icon={Clock}
                    status={health.metrics.avg_processing_time_ms > 60 ? 'warning' : 'good'}
                />
                <MetricGauge
                    label={t.monitoring?.p95Processing || 'P95 processing'}
                    value={health.metrics.p95_processing_time_ms}
                    unit="ms"
                    icon={Gauge}
                    status={health.metrics.p95_processing_time_ms > 120 ? 'warning' : 'good'}
                />
                <MetricGauge
                    label={t.monitoring?.requestsPerMinute || 'Requests/min'}
                    value={health.metrics.requests_per_minute}
                    unit="rpm"
                    icon={Zap}
                    trend={health.metrics.requests_per_minute > 0 ? 'up' : 'stable'}
                />
                <MetricGauge
                    label={t.monitoring?.errorRate || 'Error rate'}
                    value={Number(errorRatePercent.toFixed(2))}
                    unit="%"
                    icon={AlertTriangle}
                    status={errorRatePercent > 2 ? 'warning' : 'good'}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <LatencyChart
                    data={historicalData.map((d) => ({ time: d.time, latency: d.latency }))}
                />
                <ThroughputChart data={historicalData.map((d) => ({ time: d.time, rpm: d.rpm }))} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">
                        {t.monitoring?.components || 'Components'}
                    </CardTitle>
                    <CardDescription>
                        {t.monitoring?.componentsDesc || 'Service health overview'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {health.components.map((component) => (
                            <ComponentCard key={component.name} component={component} />
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">
                        {t.monitoring?.alerts || 'Alerts'}
                    </CardTitle>
                    <CardDescription>
                        {t.monitoring?.alertsDesc || 'Recent system alerts'} Sem fluxo de
                        dismiss/ack nesta API.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {health.alerts.length === 0 ? (
                        <div className="text-center text-muted-foreground py-6">
                            <CheckCircle className="h-10 w-10 mx-auto mb-2 text-decision-allow" />
                            <p>{t.monitoring?.noAlerts || 'No alerts at the moment'}</p>
                        </div>
                    ) : (
                        health.alerts.map((alert) => <AlertItem key={alert.id} alert={alert} />)
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
