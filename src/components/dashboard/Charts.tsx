import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'

interface SimpleBarChartProps {
    data: { label: string; value: number; color?: string }[]
    title?: string
    description?: string
    height?: number
}

export function SimpleBarChart({ data, title, description, height = 200 }: SimpleBarChartProps) {
    const maxValue = Math.max(...data.map((d) => d.value))

    return (
        <Card>
            {(title || description) && (
                <CardHeader className="pb-2">
                    {title && (
                        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {title}
                        </CardTitle>
                    )}
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
            )}
            <CardContent>
                <div className="flex items-end gap-2" style={{ height }}>
                    {data.map((item, index) => {
                        const heightPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0
                        return (
                            <div key={index} className="flex-1 flex flex-col items-center gap-1">
                                <div
                                    className="w-full flex flex-col justify-end"
                                    style={{ height: height - 24 }}
                                >
                                    <div
                                        className="w-full rounded-t-sm bg-primary/80 hover:bg-primary transition-all"
                                        style={{ height: `${heightPercent}%` }}
                                    />
                                </div>
                                <span className="text-xs text-muted-foreground truncate max-w-full">
                                    {item.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

interface SimpleLineChartProps {
    data: { label: string; value: number }[]
    title?: string
    description?: string
    height?: number
}

export function SimpleLineChart({ data, title, description, height = 200 }: SimpleLineChartProps) {
    const maxValue = Math.max(...data.map((d) => d.value))
    const minValue = Math.min(...data.map((d) => d.value))
    const range = maxValue - minValue || 1

    const points = data.map((item, index) => {
        const x = (index / (data.length - 1)) * 100
        const y = 100 - ((item.value - minValue) / range) * 80 - 10
        return `${x},${y}`
    })

    const pathD = points.length > 0 ? `M ${points.join(' L ')}` : ''
    const areaD = points.length > 0 ? `M 0,100 L ${points.join(' L ')} L 100,100 Z` : ''

    return (
        <Card>
            {(title || description) && (
                <CardHeader className="pb-2">
                    {title && (
                        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {title}
                        </CardTitle>
                    )}
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
            )}
            <CardContent>
                <div style={{ height }}>
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                        <defs>
                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop
                                    offset="0%"
                                    stopColor="hsl(var(--primary))"
                                    stopOpacity="0.3"
                                />
                                <stop
                                    offset="100%"
                                    stopColor="hsl(var(--primary))"
                                    stopOpacity="0"
                                />
                            </linearGradient>
                        </defs>
                        <path d={areaD} fill="url(#lineGradient)" />
                        <path
                            d={pathD}
                            fill="none"
                            stroke="hsl(var(--primary))"
                            strokeWidth="0.5"
                            vectorEffect="non-scaling-stroke"
                        />
                        {data.map((item, index) => {
                            const x = (index / (data.length - 1)) * 100
                            const y = 100 - ((item.value - minValue) / range) * 80 - 10
                            return (
                                <circle
                                    key={index}
                                    cx={x}
                                    cy={y}
                                    r="1"
                                    fill="hsl(var(--primary))"
                                    className="hover:r-2 transition-all"
                                />
                            )
                        })}
                    </svg>
                </div>
                <div className="flex justify-between mt-2">
                    {data
                        .filter((_, i) => i % Math.ceil(data.length / 6) === 0)
                        .map((item, index) => (
                            <span key={index} className="text-xs text-muted-foreground">
                                {item.label}
                            </span>
                        ))}
                </div>
            </CardContent>
        </Card>
    )
}

interface HourlyChartProps {
    data: { hour: number; count: number }[]
    title?: string
    height?: number
}

export function HourlyChart({ data, title, height = 120 }: HourlyChartProps) {
    const { t } = useLanguage()
    const maxValue = Math.max(...data.map((d) => d.count))
    const [hover, setHover] = useState<{
        hour: number
        count: number
        x: number
        y: number
    } | null>(null)
    const formatHour = (hour: number) => `${hour.toString().padStart(2, '0')}:00`

    return (
        <Card>
            {title && (
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {title}
                    </CardTitle>
                </CardHeader>
            )}
            <CardContent>
                <div className="relative">
                    {hover && (
                        <div
                            className="absolute rounded border bg-background/95 px-2 py-1 text-xs shadow pointer-events-none"
                            style={{
                                left: hover.x,
                                top: hover.y,
                                transform: 'translate(-50%, -120%)',
                            }}
                        >
                            <span className="font-medium">{formatHour(hover.hour)}</span>
                            <span className="mx-1 text-muted-foreground">|</span>
                            <span>
                                {hover.count} {t.common.decisionsLabel}
                            </span>
                        </div>
                    )}
                    <div className="flex items-end gap-0.5" style={{ height }}>
                        {data.map((item, index) => {
                            const heightPercent = maxValue > 0 ? (item.count / maxValue) * 100 : 0
                            return (
                                <div
                                    key={index}
                                    className="flex-1 rounded-t-sm bg-primary/60 hover:bg-primary transition-all cursor-default"
                                    style={{ height: `${Math.max(heightPercent, 2)}%` }}
                                    onMouseEnter={(e) => {
                                        const rect = (
                                            e.currentTarget.parentElement as HTMLElement
                                        ).getBoundingClientRect()
                                        setHover({
                                            hour: item.hour,
                                            count: item.count,
                                            x: e.clientX - rect.left,
                                            y: e.clientY - rect.top,
                                        })
                                    }}
                                    onMouseMove={(e) => {
                                        const rect = (
                                            e.currentTarget.parentElement as HTMLElement
                                        ).getBoundingClientRect()
                                        setHover((prev) =>
                                            prev
                                                ? {
                                                      ...prev,
                                                      x: e.clientX - rect.left,
                                                      y: e.clientY - rect.top,
                                                  }
                                                : null
                                        )
                                    }}
                                    onMouseLeave={() => setHover(null)}
                                />
                            )
                        })}
                    </div>
                </div>
                <div className="mt-2 grid grid-cols-6 text-xs text-muted-foreground">
                    {[0, 4, 8, 12, 16, 20].map((h) => (
                        <span key={h}>{formatHour(h)}</span>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

interface DecisionStackedChartProps {
    data: { hour: number; allow: number; review: number; block: number; total: number }[]
    title?: string
    height?: number
}

export function DecisionStackedChart({ data, title, height = 140 }: DecisionStackedChartProps) {
    const { t } = useLanguage()
    const maxValue = Math.max(...data.map((d) => d.total))
    const [hover, setHover] = useState<{
        hour: number
        allow: number
        review: number
        block: number
        x: number
        y: number
    } | null>(null)
    const formatHour = (hour: number) => `${hour.toString().padStart(2, '0')}:00`

    return (
        <Card>
            {title && (
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {title}
                    </CardTitle>
                </CardHeader>
            )}
            <CardContent>
                <div className="relative">
                    {hover && (
                        <div
                            className="absolute rounded border bg-background/95 px-2 py-1 text-xs shadow pointer-events-none"
                            style={{
                                left: hover.x,
                                top: hover.y,
                                transform: 'translate(-50%, -120%)',
                            }}
                        >
                            <div className="font-medium">{formatHour(hover.hour)}</div>
                            <div className="text-muted-foreground">
                                {t.decisions.allow}: {hover.allow} · {t.decisions.review}:{' '}
                                {hover.review} · {t.decisions.block}: {hover.block}
                            </div>
                        </div>
                    )}
                    <div className="flex items-end gap-0.5" style={{ height }}>
                        {data.map((item, index) => {
                            const heightPercent = maxValue > 0 ? (item.total / maxValue) * 100 : 0
                            const allowPercent =
                                item.total > 0 ? (item.allow / item.total) * 100 : 0
                            const reviewPercent =
                                item.total > 0 ? (item.review / item.total) * 100 : 0
                            const blockPercent =
                                item.total > 0 ? (item.block / item.total) * 100 : 0
                            return (
                                <div
                                    key={index}
                                    className="flex-1 cursor-default"
                                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                                    onMouseEnter={(e) => {
                                        const rect = (
                                            e.currentTarget.parentElement as HTMLElement
                                        ).getBoundingClientRect()
                                        setHover({
                                            hour: item.hour,
                                            allow: item.allow,
                                            review: item.review,
                                            block: item.block,
                                            x: e.clientX - rect.left,
                                            y: e.clientY - rect.top,
                                        })
                                    }}
                                    onMouseMove={(e) => {
                                        const rect = (
                                            e.currentTarget.parentElement as HTMLElement
                                        ).getBoundingClientRect()
                                        setHover((prev) =>
                                            prev
                                                ? {
                                                      ...prev,
                                                      x: e.clientX - rect.left,
                                                      y: e.clientY - rect.top,
                                                  }
                                                : null
                                        )
                                    }}
                                    onMouseLeave={() => setHover(null)}
                                >
                                    <div className="h-full w-full rounded-t-sm overflow-hidden flex flex-col">
                                        <div
                                            className="bg-primary/70"
                                            style={{ height: `${allowPercent}%` }}
                                        />
                                        <div
                                            className="bg-primary/50"
                                            style={{ height: `${reviewPercent}%` }}
                                        />
                                        <div
                                            className="bg-primary/30"
                                            style={{ height: `${blockPercent}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div className="mt-2 grid grid-cols-6 text-xs text-muted-foreground">
                    {[0, 4, 8, 12, 16, 20].map((h) => (
                        <span key={h}>{formatHour(h)}</span>
                    ))}
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-primary/70" />
                        {t.decisions.allow}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-primary/50" />
                        {t.decisions.review}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-primary/30" />
                        {t.decisions.block}
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}
