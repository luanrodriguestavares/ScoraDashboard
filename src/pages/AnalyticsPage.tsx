import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/contexts/LanguageContext'
import {
    Download,
    TrendingUp,
    TrendingDown,
    Target,
    Clock,
    Shield,
    FileText,
    FileSpreadsheet,
    FileJson,
    ChevronDown,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/services/api'
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    LineChart,
    Line,
} from 'recharts'
import type { DashboardStats } from '@/types'
import { cn } from '@/lib/utils'
import { generatePDFReport, downloadCSV, downloadJSON } from '@/utils/export'
import { useState } from 'react'

interface MetricCardProps {
    title: string
    value: string
    change?: number
    changeLabel?: string
    subLabel?: string
    icon?: React.ReactNode
}

function MetricCard({ title, value, change, changeLabel, subLabel, icon }: MetricCardProps) {
    const isPositive = change !== undefined && change > 0

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold mt-1">{value}</p>
                        {change !== undefined && (
                            <div className="flex items-center gap-1 mt-1">
                                {isPositive ? (
                                    <TrendingUp className="h-3 w-3 text-decision-allow" />
                                ) : (
                                    <TrendingDown className="h-3 w-3 text-decision-block" />
                                )}
                                <span
                                    className={cn(
                                        'text-xs',
                                        isPositive ? 'text-decision-allow' : 'text-decision-block'
                                    )}
                                >
                                    {isPositive ? '+' : ''}
                                    {change}% {changeLabel}
                                </span>
                            </div>
                        )}
                        {subLabel && (
                            <div className="text-xs text-muted-foreground mt-1">{subLabel}</div>
                        )}
                    </div>
                    {icon && (
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            {icon}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

interface PatternBarProps {
    pattern: string
    percentage: number
    maxPercentage: number
}

function PatternBar({ pattern, percentage, maxPercentage }: PatternBarProps) {
    const { t } = useLanguage()
    const width = (percentage / maxPercentage) * 100

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
                <span>{t.patterns[pattern as keyof typeof t.patterns] || pattern}</span>
                <span className="text-muted-foreground">{percentage}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${width}%` }}
                />
            </div>
        </div>
    )
}

const emptyStats: DashboardStats = {
    period_days: 30,
    total_decisions_today: 0,
    total_decisions_week: 0,
    total_decisions_month: 0,
    pending_reviews: 0,
    blocked_today: 0,
    allowed_today: 0,
    avg_latency_ms: 0,
    p95_latency_ms: 0,
    false_positive_rate: 0,
    decisions_by_hour: [],
    decisions_by_type: [],
    risk_distribution: [],
    pattern_distribution: [],
}

const analyticsPeriods = [
    { value: 7 as const, label: '7 dias' },
    { value: 30 as const, label: '30 dias' },
    { value: 90 as const, label: '90 dias' },
]

export function AnalyticsPage() {
    const { t } = useLanguage()
    const [periodDays, setPeriodDays] = useState<7 | 30 | 90>(30)
    const liveWindowLabel = `Últimos ${periodDays} dias`
    const comparisonLabel = 'vs período anterior equivalente'

    const statsQuery = useQuery({
        queryKey: ['dashboard', 'stats', 'analytics', periodDays],
        queryFn: () => analyticsApi.getStats({ periodDays }),
    })

    const stats = statsQuery.data ?? emptyStats
    const efficacy = stats.model_efficacy ?? {
        false_positive_rate: 0,
        fraud_detection_rate: 0,
        avg_review_time_minutes: 0,
        delta_false_positive_rate: 0,
        delta_fraud_detection_rate: 0,
        delta_avg_review_time_minutes: 0,
    }

    const handleExportPDF = () => {
        generatePDFReport({
            title: t.analytics.title,
            date: new Date().toLocaleDateString(),
            period: liveWindowLabel,
            stats,
        })
    }

    const handleExportCSV = () => {
        const data = stats.decisions_by_type.map((d) => ({
            type: d.type,
            allow: d.allow,
            review: d.review,
            block: d.block,
            total: d.allow + d.review + d.block,
        }))
        downloadCSV(data, 'scora_analytics')
    }

    const handleExportJSON = () => {
        downloadJSON(stats, 'scora_analytics')
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-heading font-bold">{t.analytics.title}</h2>
                    <p className="text-muted-foreground">{t.analytics.subtitle}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-lg border border-border bg-card p-1">
                        {analyticsPeriods.map((period) => (
                            <Button
                                key={period.value}
                                type="button"
                                size="sm"
                                variant={periodDays === period.value ? 'default' : 'ghost'}
                                onClick={() => setPeriodDays(period.value)}
                            >
                                {period.label}
                            </Button>
                        ))}
                    </div>
                    <Badge variant="outline">{liveWindowLabel}</Badge>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                {t.analytics.exportReport}
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleExportPDF}>
                                <FileText className="h-4 w-4 mr-2" />
                                {t.analytics.exportPDF}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportCSV}>
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                {t.analytics.exportCSV}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportJSON}>
                                <FileJson className="h-4 w-4 mr-2" />
                                {t.analytics.exportJSON}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">
                        {t.analytics.modelEfficacy}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <MetricCard
                            title={t.analytics.falsePositives}
                            value={`${efficacy.false_positive_rate}%`}
                            change={efficacy.delta_false_positive_rate}
                            changeLabel={comparisonLabel}
                            icon={<Target className="h-6 w-6 text-primary" />}
                        />
                        <MetricCard
                            title={t.analytics.fraudsDetected}
                            value={`${efficacy.fraud_detection_rate}%`}
                            change={efficacy.delta_fraud_detection_rate}
                            changeLabel={comparisonLabel}
                            icon={<Shield className="h-6 w-6 text-primary" />}
                        />
                        <MetricCard
                            title={t.analytics.avgReviewTime}
                            value={`${efficacy.avg_review_time_minutes} min`}
                            change={efficacy.delta_avg_review_time_minutes}
                            changeLabel={comparisonLabel}
                            icon={<Clock className="h-6 w-6 text-primary" />}
                        />
                        <MetricCard
                            title={t.analytics.avgLatency}
                            value={`${stats.avg_latency_ms} ms`}
                            subLabel={`${t.common.p95}: ${stats.p95_latency_ms} ms`}
                            icon={<Clock className="h-6 w-6 text-primary" />}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">
                            {t.analytics.topPatterns}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.pattern_distribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={stats.pattern_distribution.map((p) => ({
                                            name:
                                                t.patterns[p.pattern as keyof typeof t.patterns] ||
                                                p.pattern,
                                            value: p.count,
                                            percentage: p.percentage,
                                        }))}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ percentage }) => `${percentage}%`}
                                        innerRadius={80}
                                        outerRadius={140}
                                        paddingAngle={2}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {stats.pattern_distribution.map((_, index) => {
                                            const opacities = [0.3, 0.5, 0.7, 0.95]
                                            return (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill="hsl(185 72% 36%)"
                                                    opacity={opacities[index % opacities.length]}
                                                />
                                            )
                                        })}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name) => {
                                            if (name === 'value') return [value, 'Count']
                                            return [value, name]
                                        }}
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '0.4375rem',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">
                                Sem dados de padrões detectados
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">
                            {t.analytics.decisionsByType}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.decisions_by_type.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={stats.decisions_by_type.map((d) => ({
                                        type: d.type.toUpperCase(),
                                        allow: d.allow,
                                        review: d.review,
                                        block: d.block,
                                        total: d.allow + d.review + d.block,
                                    }))}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="hsl(var(--border))"
                                    />
                                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                                    <YAxis
                                        dataKey="type"
                                        type="category"
                                        width={75}
                                        stroke="hsl(var(--muted-foreground))"
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '0.4375rem',
                                        }}
                                    />
                                    <Bar
                                        dataKey="allow"
                                        stackId="a"
                                        fill="hsl(185 72% 36%)"
                                        opacity={0.3}
                                    />
                                    <Bar
                                        dataKey="review"
                                        stackId="a"
                                        fill="hsl(185 72% 36%)"
                                        opacity={0.6}
                                    />
                                    <Bar
                                        dataKey="block"
                                        stackId="a"
                                        fill="hsl(185 72% 36%)"
                                        opacity={0.95}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">
                                Sem dados de decisões por tipo
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">
                        {t.analytics.trendsOverTime}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Visão intradiária de hoje por hora. Os cards e gráficos de distribuição
                        acima usam {liveWindowLabel.toLowerCase()}.
                    </p>
                </CardHeader>
                <CardContent>
                    {stats.decisions_by_hour.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart
                                data={(() => {
                                    const map = new Map<number, { hour: number; count: number }>()
                                    for (let h = 0; h < 24; h += 1) {
                                        map.set(h, { hour: h, count: 0 })
                                    }
                                    stats.decisions_by_hour.forEach((entry) => {
                                        const item = map.get(entry.hour) ?? {
                                            hour: entry.hour,
                                            count: 0,
                                        }
                                        item.count += entry.count
                                        map.set(entry.hour, item)
                                    })
                                    return Array.from(map.values())
                                        .sort((a, b) => a.hour - b.hour)
                                        .map((h) => ({
                                            hour: `${h.hour}h`,
                                            count: h.count,
                                        }))
                                })()}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="hour"
                                    stroke="hsl(var(--muted-foreground))"
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis stroke="hsl(var(--muted-foreground))" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '0.4375rem',
                                    }}
                                    formatter={(value) => [`${value} decisions`, 'Count']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">
                            Sem dados de decisões por hora disponíveis
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
