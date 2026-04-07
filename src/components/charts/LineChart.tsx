import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LineChartProps {
    title: string
    description?: string
    data: Array<{
        label: string
        value: number
    }>
    height?: number
}

export function LineChart({ title, description, data, height = 200 }: LineChartProps) {
    const maxValue = Math.max(...data.map((d) => d.value))
    const minValue = Math.min(...data.map((d) => d.value))
    const range = maxValue - minValue || 1
    const chartHeight = height - 80
    const chartWidth = 600
    const padding = { top: 20, right: 40, bottom: 40, left: 60 }

    type Point = { x: number; y: number; value: number; label: string }

    const points: Point[] = data.map((item, index) => {
        const x =
            padding.left + (index / (data.length - 1)) * (chartWidth - padding.left - padding.right)
        const normalizedValue = (item.value - minValue) / range
        const y = padding.top + (1 - normalizedValue) * (chartHeight - padding.top - padding.bottom)
        return { x, y, value: item.value, label: item.label }
    })

    const createSmoothPath = (points: Point[]) => {
        if (points.length < 2) return ''

        let path = `M ${points[0].x} ${points[0].y}`

        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1]
            const curr = points[i]
            const next = points[i + 1]

            if (!next) {
                path += ` L ${curr.x} ${curr.y}`
                break
            }

            const cp1x = prev.x + (curr.x - prev.x) * 0.5
            const cp1y = prev.y + (curr.y - prev.y) * 0.5
            const cp2x = curr.x - (next.x - prev.x) * 0.5
            const cp2y = curr.y - (next.y - prev.y) * 0.5

            path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${curr.x} ${curr.y}`
        }

        return path
    }

    const pathData = createSmoothPath(points)

    const areaPath =
        pathData +
        ` L ${points[points.length - 1].x} ${chartHeight - padding.bottom} L ${points[0].x} ${chartHeight - padding.bottom} Z`

    const gridValues = [
        minValue,
        minValue + range * 0.25,
        minValue + range * 0.5,
        minValue + range * 0.75,
        maxValue,
    ]

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div className="w-full" style={{ height }}>
                    <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
                        {/* Área de fundo sutil */}
                        <defs>
                            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop
                                    offset="0%"
                                    stopColor="hsl(var(--primary))"
                                    stopOpacity="0.1"
                                />
                                <stop
                                    offset="100%"
                                    stopColor="hsl(var(--primary))"
                                    stopOpacity="0.02"
                                />
                            </linearGradient>
                        </defs>

                        {/* Área preenchida abaixo da linha */}
                        <path d={areaPath} fill="url(#areaGradient)" stroke="none" />

                        {/* Grade horizontal */}
                        {gridValues.map((value, index) => {
                            const normalizedValue = (value - minValue) / range
                            const y =
                                padding.top +
                                (1 - normalizedValue) * (chartHeight - padding.top - padding.bottom)
                            return (
                                <g key={index}>
                                    <line
                                        x1={padding.left}
                                        y1={y}
                                        x2={chartWidth - padding.right}
                                        y2={y}
                                        stroke="hsl(var(--border))"
                                        strokeWidth="1"
                                        strokeDasharray="3,3"
                                        opacity="0.4"
                                    />
                                    <text
                                        x={padding.left - 8}
                                        y={y + 4}
                                        textAnchor="end"
                                        className="text-xs fill-muted-foreground font-mono"
                                        style={{ fontSize: '9px' }}
                                    >
                                        {value.toLocaleString()}
                                    </text>
                                </g>
                            )
                        })}

                        {/* Linha principal suave */}
                        <path
                            d={pathData}
                            fill="none"
                            stroke="hsl(var(--primary))"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="drop-shadow(0 2px 4px hsl(var(--primary) / 0.2))"
                        />

                        {/* Pontos na linha com efeito de hover */}
                        {points.map((point, index) => (
                            <g key={index}>
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r="5"
                                    fill="hsl(var(--background))"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth="2"
                                    className="transition-all duration-200 hover:r-7 hover:stroke-3"
                                    style={{
                                        filter: 'drop-shadow(0 1px 3px hsl(var(--primary) / 0.3))',
                                    }}
                                />
                                <circle
                                    cx={point.x}
                                    cy={point.y}
                                    r="2"
                                    fill="hsl(var(--primary))"
                                />
                            </g>
                        ))}

                        {/* Labels no eixo X */}
                        {points.map((point, index) => (
                            <text
                                key={`label-${index}`}
                                x={point.x}
                                y={height - 15}
                                textAnchor="middle"
                                className="text-xs fill-muted-foreground font-medium"
                                style={{ fontSize: '11px' }}
                            >
                                {point.label}
                            </text>
                        ))}

                        {/* Tooltips sobre os pontos */}
                        {points.map((point, index) => (
                            <g key={`tooltip-${index}`}>
                                <rect
                                    x={point.x - 20}
                                    y={point.y - 35}
                                    width="40"
                                    height="20"
                                    rx="4"
                                    fill="hsl(var(--popover))"
                                    stroke="hsl(var(--border))"
                                    strokeWidth="1"
                                    opacity="0"
                                    className="hover:opacity-100 transition-opacity"
                                />
                                <text
                                    x={point.x}
                                    y={point.y - 22}
                                    textAnchor="middle"
                                    className="text-xs fill-popover-foreground font-semibold pointer-events-none"
                                    style={{ fontSize: '10px' }}
                                    opacity="0"
                                >
                                    {point.value}
                                </text>
                            </g>
                        ))}

                        {/* Título dos eixos */}
                        <text
                            x={padding.left - 25}
                            y={padding.top + (chartHeight - padding.top - padding.bottom) / 2}
                            textAnchor="middle"
                            className="text-xs fill-muted-foreground font-medium"
                            style={{ fontSize: '9px' }}
                            transform={`rotate(-90 ${padding.left - 25} ${padding.top + (chartHeight - padding.top - padding.bottom) / 2})`}
                        >
                            Requisições
                        </text>
                    </svg>
                </div>
            </CardContent>
        </Card>
    )
}
