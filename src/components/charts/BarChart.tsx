import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface BarChartProps {
    title: string
    description?: string
    data: Array<{
        label: string
        value: number
        color?: string
    }>
    height?: number
}

export function BarChart({ title, description, data, height = 200 }: BarChartProps) {
    const maxValue = Math.max(...data.map((d) => d.value))
    const chartHeight = height - 40 // Espaço para labels

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div className="w-full" style={{ height }}>
                    <svg width="100%" height={chartHeight} className="overflow-visible">
                        {/* Barras */}
                        {data.map((item, index) => {
                            const barHeight = (item.value / maxValue) * (chartHeight - 60)
                            const barWidth = Math.max(20, 100 / data.length - 2)
                            const x = index * (100 / data.length) + 1
                            const y = chartHeight - barHeight - 30

                            return (
                                <g key={item.label}>
                                    {/* Barra */}
                                    <rect
                                        x={`${x}%`}
                                        y={y}
                                        width={`${barWidth}%`}
                                        height={barHeight}
                                        fill={`hsl(var(--primary))`}
                                        className="opacity-80 hover:opacity-100 transition-opacity"
                                        rx={2}
                                    />
                                    {/* Valor acima da barra */}
                                    <text
                                        x={`${x + barWidth / 2}%`}
                                        y={y - 5}
                                        textAnchor="middle"
                                        className="text-xs fill-foreground font-medium"
                                    >
                                        {item.value.toLocaleString()}
                                    </text>
                                    {/* Label abaixo */}
                                    <text
                                        x={`${x + barWidth / 2}%`}
                                        y={chartHeight - 5}
                                        textAnchor="middle"
                                        className="text-xs fill-muted-foreground"
                                        style={{ fontSize: '10px' }}
                                    >
                                        {item.label}
                                    </text>
                                </g>
                            )
                        })}
                    </svg>
                </div>
            </CardContent>
        </Card>
    )
}
