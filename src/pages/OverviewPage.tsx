import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DecisionDetailsModal } from '@/components/decisions/DecisionDetailsModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RiskDistribution, RiskBadge } from '@/components/dashboard/RiskIndicators'
import { DecisionStackedChart } from '@/components/dashboard/Charts'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { Activity, Clock, RefreshCw, ArrowRight } from 'lucide-react'
import type { RiskDecision, DashboardStats } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi, decisionApi } from '@/services/api'
import { useNavigate } from 'react-router-dom'
import { formatReason } from '@/constants/reasonCatalog'
import { mockDashboardStats, mockRecentDecisions } from '@/mocks/dashboardOverview'

const emptyStats: DashboardStats = {
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

const DECISION_PRIORITY = { block: 2, review: 1, allow: 0 } as const
const useMockDashboardOverview = import.meta.env.VITE_MOCK_DASHBOARD_OVERVIEW === 'true'

function getItemLabel(d: Pick<RiskDecision, 'item_ref' | 'valueHash'>) {
    return d.item_ref || d.valueHash
}

function worstDecision(items: RiskDecision[]): RiskDecision['decision'] {
    return items.reduce<RiskDecision['decision']>((acc, d) => {
        const dp = DECISION_PRIORITY[d.decision as keyof typeof DECISION_PRIORITY] ?? 0
        const ap = DECISION_PRIORITY[acc as keyof typeof DECISION_PRIORITY] ?? 0
        return dp > ap ? d.decision : acc
    }, 'allow')
}

interface GroupedDecisionItemProps {
    items: RiskDecision[]
    onItemClick: (d: RiskDecision) => void
}

function GroupedDecisionItem({ items, onItemClick }: GroupedDecisionItemProps) {
    const { t, language } = useLanguage()
    const [expanded, setExpanded] = useState(false)
    const representativeDecision = items[0]
    const groupDecision = worstDecision(items)
    const isGroup = items.length > 1

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

    const decisionLabel = (d: RiskDecision['decision']) =>
        d === 'block' ? t.decisions.block : d === 'review' ? t.decisions.review : t.decisions.allow

    const decisionClass = (d: RiskDecision['decision']) =>
        d === 'block'
            ? 'bg-decision-block/10 text-decision-block border-decision-block/30'
            : d === 'review'
              ? 'bg-decision-review/10 text-decision-review border-decision-review/30'
              : 'bg-decision-allow/10 text-decision-allow border-decision-allow/30'

    if (!isGroup) {
        const d = representativeDecision
        const primaryReason = d.reasons?.[0]
        const badges = [
            ...(d.reasons?.slice(0, 2) ?? []),
            ...(d.patterns_detected?.slice(0, 1) ?? []),
        ]
        return (
            <div
                className="rounded-lg border border-border/40 p-3 hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => onItemClick(d)}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge
                                className={`text-xs font-semibold uppercase ${decisionClass(d.decision)}`}
                                variant="outline"
                            >
                                {decisionLabel(d.decision)}
                            </Badge>
                            <RiskBadge level={d.riskLevel} />
                            {d.use_case && (
                                <Badge variant="secondary" className="text-[10px] font-mono">
                                    {d.use_case}
                                </Badge>
                            )}
                            <span className="text-[11px] text-muted-foreground font-mono">
                                #{d.id.slice(0, 8)}
                            </span>
                        </div>
                        <div className="text-sm font-medium break-all">
                            {d.type.toUpperCase()} · {getItemLabel(d)}
                        </div>
                        <div className="text-xs text-muted-foreground break-words">
                            {primaryReason
                                ? formatReason(primaryReason, language)
                                : t.common.unavailable}
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {badges.map((label, idx) => (
                                <Badge
                                    key={`${label}-${idx}`}
                                    variant="secondary"
                                    className="text-[10px]"
                                >
                                    {formatReason(label, language)}
                                </Badge>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">
                            {formatTime(d.created_at)}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums font-mono">
                            {d.score.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        )
    }

    const maxScore = Math.max(...items.map((d) => d.score))

    return (
        <div className="rounded-lg border border-border/40 overflow-hidden">
            <div
                className="p-3 hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => setExpanded((v) => !v)}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge
                                className={`text-xs font-semibold uppercase ${decisionClass(groupDecision)}`}
                                variant="outline"
                            >
                                {decisionLabel(groupDecision)}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">
                                {items.length} {t.common.items}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground font-mono">
                                {t.common.group} #{representativeDecision.group_id?.slice(0, 8)}
                            </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {items.map((d) => d.type.toUpperCase()).join(' · ')}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">
                            {formatTime(representativeDecision.created_at)}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums font-mono">
                            {maxScore.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
            {expanded && (
                <div className="border-t border-border/40 divide-y divide-border/30">
                    {items.map((d) => {
                        const primaryReason = d.reasons?.[0]
                        return (
                            <div
                                key={d.id}
                                className="p-3 pl-5 hover:bg-muted/30 transition-colors cursor-pointer"
                                onClick={() => onItemClick(d)}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge
                                                className={`text-xs font-semibold uppercase ${decisionClass(d.decision)}`}
                                                variant="outline"
                                            >
                                                {decisionLabel(d.decision)}
                                            </Badge>
                                            <RiskBadge level={d.riskLevel} />
                                            {d.use_case && (
                                                <Badge variant="secondary" className="text-[10px] font-mono">
                                                    {d.use_case}
                                                </Badge>
                                            )}
                                            <span className="text-[11px] text-muted-foreground font-mono">
                                                #{d.id.slice(0, 8)}
                                            </span>
                                        </div>
                                        <div className="text-sm font-medium break-all">
                                            {d.type.toUpperCase()} · {getItemLabel(d)}
                                        </div>
                                        {primaryReason && (
                                            <div className="text-xs text-muted-foreground">
                                                {formatReason(primaryReason, language)}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground shrink-0 tabular-nums font-mono">
                                        {d.score.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export function OverviewPage() {
    const { t } = useLanguage()
    const navigate = useNavigate()
    const [selectedDecision, setSelectedDecision] = useState<RiskDecision | null>(null)
    const [isSpinning, setIsSpinning] = useState(false)
    const [now, setNow] = useState(Date.now())

    const statsQuery = useQuery({
        queryKey: ['dashboard', 'stats', useMockDashboardOverview ? 'mock' : 'live'],
        queryFn: () =>
            useMockDashboardOverview ? Promise.resolve(mockDashboardStats) : dashboardApi.getStats(),
    })

    const recentQuery = useQuery({
        queryKey: ['decisions', 'recent', 10, useMockDashboardOverview ? 'mock' : 'live'],
        queryFn: () =>
            useMockDashboardOverview
                ? Promise.resolve(mockRecentDecisions)
                : decisionApi.getRecent(10),
    })

    const stats = statsQuery.data ?? emptyStats
    const recentDecisionsRaw = recentQuery.data ?? []
    const isRefreshing = statsQuery.isFetching || recentQuery.isFetching

    type DecisionGroup = { group_id: string | null; items: RiskDecision[] }
    const recentGroups = useMemo<DecisionGroup[]>(() => {
        const groups: DecisionGroup[] = []
        const seen = new Map<string, DecisionGroup>()
        for (const d of recentDecisionsRaw) {
            if (d.group_id) {
                const existing = seen.get(d.group_id)
                if (existing) {
                    existing.items.push(d)
                } else {
                    const g: DecisionGroup = { group_id: d.group_id, items: [d] }
                    groups.push(g)
                    seen.set(d.group_id, g)
                }
            } else {
                groups.push({ group_id: null, items: [d] })
            }
        }
        return groups
    }, [recentDecisionsRaw])

    const handleRefresh = async () => {
        const start = Date.now()
        setIsSpinning(true)
        await Promise.all([statsQuery.refetch(), recentQuery.refetch()])
        const elapsed = Date.now() - start
        const remaining = Math.max(0, 800 - elapsed)
        window.setTimeout(() => setIsSpinning(false), remaining)
    }

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat().format(num)
    }

    const blockedPercent = stats.total_decisions_today
        ? (stats.blocked_today / stats.total_decisions_today) * 100
        : 0

    const autoDecisions = stats.allowed_today + stats.blocked_today
    const lastUpdatedAt = Math.max(statsQuery.dataUpdatedAt, recentQuery.dataUpdatedAt)
    const secondsSinceUpdate = lastUpdatedAt
        ? Math.max(0, Math.floor((now - lastUpdatedAt) / 1000))
        : null
    const streamActive = secondsSinceUpdate !== null ? secondsSinceUpdate < 30 : false

    const hourlyData = useMemo(() => {
        const map = new Map<
            number,
            { hour: number; allow: number; review: number; block: number; total: number }
        >()
        for (let h = 0; h < 24; h += 1) {
            map.set(h, { hour: h, allow: 0, review: 0, block: 0, total: 0 })
        }
        stats.decisions_by_hour.forEach((entry) => {
            const item = map.get(entry.hour) ?? {
                hour: entry.hour,
                allow: 0,
                review: 0,
                block: 0,
                total: 0,
            }
            const decision = entry.decision
            if (decision === 'allow') item.allow += entry.count
            if (decision === 'review') item.review += entry.count
            if (decision === 'block') item.block += entry.count
            item.total += entry.count
            map.set(entry.hour, item)
        })
        return Array.from(map.values()).sort((a, b) => a.hour - b.hour)
    }, [stats.decisions_by_hour])

    const riskData = useMemo<DashboardStats['risk_distribution']>(() => {
        const base = [
            { level: 'low', count: 0, percentage: 0 },
            { level: 'medium', count: 0, percentage: 0 },
            { level: 'high', count: 0, percentage: 0 },
            { level: 'critical', count: 0, percentage: 0 },
        ] as DashboardStats['risk_distribution']
        const map = new Map<
            DashboardStats['risk_distribution'][number]['level'],
            DashboardStats['risk_distribution'][number]
        >(stats.risk_distribution.map((item) => [item.level, item] as const))
        return base.map((item) => map.get(item.level) ?? item)
    }, [stats.risk_distribution])

    useEffect(() => {
        const id = window.setInterval(() => setNow(Date.now()), 1000)
        return () => window.clearInterval(id)
    }, [])

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-heading font-bold tracking-tight">{t.overview.title}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{t.overview.subtitle}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-xs text-muted-foreground tabular-nums">
                        {t.overview.lastUpdated}:{' '}
                        {secondsSinceUpdate === null
                            ? t.common.unavailable
                            : `${secondsSinceUpdate}s`}
                    </div>
                    <div className={cn(
                        'flex items-center gap-1.5 text-xs transition-colors duration-700',
                        streamActive ? 'text-decision-allow/80' : 'text-muted-foreground/60'
                    )}>
                        <span
                            className={cn(
                                'h-1.5 w-1.5 rounded-full transition-colors duration-700',
                                streamActive ? 'bg-decision-allow animate-pulse' : 'bg-muted-foreground/30'
                            )}
                        />
                        {t.overview.streamActive}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw
                            className={cn(
                                'h-4 w-4 mr-2',
                                isSpinning && 'animate-spin [animation-duration:700ms]'
                            )}
                        />
                        {t.common.refresh}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <Card className="xl:col-span-2">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    {t.overview.heroTitle}
                                </CardTitle>
                                {stats.total_decisions_today > 0 ? (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {t.common.today} {t.overview.heroAnalyzed}{' '}
                                        {formatNumber(stats.total_decisions_today)},{' '}
                                        {t.overview.heroBlocked} {formatNumber(stats.blocked_today)}
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {t.overview.noDecisionsToday}
                                    </p>
                                )}
                            </div>
                            <Activity className="h-5 w-5 text-muted-foreground/70" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="rounded-lg border border-border/60 bg-card/60 p-4">
                                <div className="text-3xl font-semibold tabular-nums">
                                    {formatNumber(stats.total_decisions_today)}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {t.overview.decisionsToday}
                                </div>
                            </div>
                            <div className="rounded-lg border border-border/60 bg-card/60 p-4">
                                <div className="text-3xl font-semibold tabular-nums">
                                    {formatNumber(autoDecisions)}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {t.overview.autoDecisions}
                                </div>
                                <div className="text-xs text-muted-foreground/70 mt-1">
                                    {stats.total_decisions_today
                                        ? `${((autoDecisions / stats.total_decisions_today) * 100).toFixed(0)}% ${t.common.ofTotal}`
                                        : '0%'}
                                </div>
                            </div>
                            <div className="rounded-lg border border-border/60 bg-card/60 p-4">
                                <div className="text-3xl font-semibold tabular-nums">
                                    {formatNumber(stats.pending_reviews)}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {t.overview.humanReview}
                                </div>
                                <div className="text-xs text-muted-foreground/70 mt-1">
                                    {t.overview.pendingReviewLabel}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end text-xs text-muted-foreground">
                            <div>
                                {t.overview.impactLabel}:{' '}
                                <span className="text-foreground font-medium tabular-nums">
                                    {blockedPercent.toFixed(1)}%
                                </span>{' '}
                                {t.overview.blockedToday}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {t.overview.pendingReviews}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-3xl font-semibold tabular-nums">
                            {formatNumber(stats.pending_reviews)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {t.overview.pendingReviews}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/dashboard/review')}
                        >
                            {t.reviewQueue.title}
                            <ArrowRight className="h-3 w-3 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
                <div className="space-y-4">
                    <DecisionStackedChart
                        data={hourlyData}
                        title={t.overview.decisionsPerHour}
                        height={150}
                    />
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    {t.overview.recentDecisions}
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => navigate('/dashboard/decisions')}
                                >
                                    {t.overview.viewAll}
                                    <ArrowRight className="h-3 w-3 ml-1" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[260px]">
                                <div className="space-y-3">
                                    {recentGroups.map((group, idx) => (
                                        <GroupedDecisionItem
                                            key={group.group_id ?? group.items[0]?.id ?? idx}
                                            items={group.items}
                                            onItemClick={(d) => setSelectedDecision(d)}
                                        />
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
                <RiskDistribution data={riskData} title={t.overview.riskDistribution} />
            </div>

            <DecisionDetailsModal
                open={!!selectedDecision}
                onOpenChange={() => setSelectedDecision(null)}
                decision={selectedDecision}
            />
        </div>
    )
}
