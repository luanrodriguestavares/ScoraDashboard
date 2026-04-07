import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { RiskLevel, Decision } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface RiskBadgeProps {
    level: RiskLevel
    className?: string
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
    const { t } = useLanguage()
    const styles = {
        low: 'bg-risk-low/10 text-risk-low border-risk-low/30',
        medium: 'bg-risk-medium/10 text-risk-medium border-risk-medium/30',
        high: 'bg-risk-high/10 text-risk-high border-risk-high/30',
        critical: 'bg-risk-critical/10 text-risk-critical border-risk-critical/30',
    }

    const labels: Record<RiskLevel, string> = {
        low: t.risk.low,
        medium: t.risk.medium,
        high: t.risk.high,
        critical: t.risk.critical,
    }

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
                styles[level],
                className
            )}
        >
            {labels[level]}
        </span>
    )
}

interface DecisionBadgeProps {
    decision: Decision
    className?: string
}

export function DecisionBadge({ decision, className }: DecisionBadgeProps) {
    const { t } = useLanguage()
    const styles = {
        allow: 'bg-decision-allow/10 text-decision-allow border-decision-allow/30',
        review: 'bg-decision-review/10 text-decision-review border-decision-review/30',
        block: 'bg-decision-block/10 text-decision-block border-decision-block/30',
    }

    const labels: Record<Decision, string> = {
        allow: t.decisions.allow,
        review: t.decisions.review,
        block: t.decisions.block,
    }

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold uppercase',
                styles[decision],
                className
            )}
        >
            {labels[decision]}
        </span>
    )
}

interface RiskDistributionProps {
    data: { level: RiskLevel; count: number; percentage: number }[]
    title?: string
}

export function RiskDistribution({ data, title }: RiskDistributionProps) {
    const { t } = useLanguage()
    const [hovered, setHovered] = useState<RiskLevel | null>(null)
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
    const formatNumber = (num: number) => new Intl.NumberFormat().format(num)

    const opacityMap = {
        low: 0.3,
        medium: 0.5,
        high: 0.7,
        critical: 0.9,
    }

    const labels: Record<RiskLevel, string> = {
        low: t.risk.low,
        medium: t.risk.medium,
        high: t.risk.high,
        critical: t.risk.critical,
    }

    const total = data.reduce((sum, item) => sum + item.count, 0)
    const normalized = data.map((item) => ({
        ...item,
        pct: total > 0 ? (item.count / total) * 100 : 0,
    }))

    const chartData = normalized.map((item) => ({
        name: labels[item.level],
        value: item.count,
        level: item.level,
        pct: item.pct,
    }))

    const activeItem = hovered ? normalized.find((item) => item.level === hovered) : null

    return (
        <Card className="group">
            {title && (
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {title}
                    </CardTitle>
                </CardHeader>
            )}
            <CardContent>
                <div
                    className="relative h-[200px] flex items-center justify-center"
                    onMouseLeave={() => {
                        setHovered(null)
                        setMousePos(null)
                    }}
                    onMouseMove={(e) => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                        setMousePos({
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top,
                        })
                    }}
                    aria-label={title ?? t.overview.riskDistribution}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={85}
                                paddingAngle={2}
                                onMouseLeave={() => setHovered(null)}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`${entry.level}-${index}`}
                                        fill="hsl(185 72% 36%)"
                                        opacity={opacityMap[entry.level]}
                                        className="transition-all duration-200 cursor-default"
                                        onMouseEnter={() => setHovered(entry.level)}
                                        style={{
                                            filter:
                                                hovered === entry.level
                                                    ? 'brightness(1.15)'
                                                    : 'brightness(1)',
                                        }}
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                    {activeItem && mousePos && (
                        <div
                            className="absolute px-3 py-2 rounded-md border bg-background/95 backdrop-blur-sm pointer-events-none text-xs"
                            style={{
                                left: mousePos.x,
                                top: mousePos.y,
                                transform: 'translate(-50%, -120%)',
                                zIndex: 50,
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{
                                        backgroundColor: `hsl(185 72% 36% / ${opacityMap[activeItem.level]})`,
                                    }}
                                />
                                <span className="font-semibold">{labels[activeItem.level]}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                                <span>{formatNumber(activeItem.count)}</span>
                                <span>•</span>
                                <span className="font-medium text-foreground">
                                    {activeItem.pct.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
