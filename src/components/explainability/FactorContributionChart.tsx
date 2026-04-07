import type { FactorContribution } from '@/types'

const COMPONENT_LABELS: Record<string, string> = {
    validation: 'Qualidade do Dado',
    historical: 'Histórico',
    velocity: 'Velocidade',
    context: 'Contexto de Acesso',
    graph: 'Grafo de Identidade',
    pattern: 'Padrão Comportamental',
    rules: 'Regras Customizadas',
}

interface FactorContributionChartProps {
    contributions: FactorContribution[]
}

export function FactorContributionChart({ contributions }: FactorContributionChartProps) {
    const visible = contributions.filter((c) => c.contribution_pct > 0)

    if (visible.length === 0) return null

    return (
        <div className="space-y-2.5">
            {visible.map((c) => {
                const label = COMPONENT_LABELS[c.component] ?? c.component
                const pct = c.contribution_pct

                return (
                    <div key={c.component} className="flex items-center gap-3">
                        <div className="w-36 shrink-0 text-right">
                            <span className="text-xs text-muted-foreground">{label}</span>
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-primary/70 transition-all"
                                    style={{ width: `${Math.min(100, pct)}%` }}
                                />
                            </div>
                            <span className="text-xs tabular-nums w-9 text-right text-primary font-medium">
                                {pct.toFixed(0)}%
                            </span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
