import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RiskArchetypeBadge } from './RiskArchetypeBadge'
import { FactorContributionChart } from './FactorContributionChart'
import type { ExplainabilityData } from '@/types'
import {
    ThumbsUp,
    ThumbsDown,
    BookOpen,
    BarChart3,
    CheckCircle,
    AlertTriangle,
    ShieldAlert,
    ShieldCheck,
    Info,
} from 'lucide-react'

interface ExplanationNarrativeProps {
    explainability: ExplainabilityData
    decisionId: string
    decision: string
}

type StatusConfig = {
    icon: React.ComponentType<{ className?: string }>
    label: string
}

function getStatus(decision: string, archetypeId: string, hasFactors: boolean): StatusConfig {
    if (decision === 'block')
        return { icon: ShieldAlert, label: 'Ameaça confirmada — acesso bloqueado' }
    if (decision === 'review')
        return { icon: AlertTriangle, label: 'Sinais ambíguos — avaliação manual recomendada' }
    if (hasFactors && archetypeId !== 'unknown')
        return {
            icon: Info,
            label: 'Aprovado, mas com sinais detectados abaixo do limiar de bloqueio',
        }
    return {
        icon: ShieldCheck,
        label: 'Nenhum sinal adverso determinante — aprovado automaticamente',
    }
}

export function ExplanationNarrative({
    explainability,
    decisionId,
    decision,
}: ExplanationNarrativeProps) {
    const [feedbackGiven, setFeedbackGiven] = useState<'yes' | 'no' | null>(null)
    const [activeTab, setActiveTab] = useState<'summary' | 'factors'>('summary')

    const { risk_archetype, factor_contributions, narrative } = explainability
    const hasFactors = narrative.risk_factors.length > 0
    const status = getStatus(decision, risk_archetype.id, hasFactors)
    const StatusIcon = status.icon

    const sectionLabel =
        decision === 'allow' && risk_archetype.id !== 'unknown'
            ? 'Sinais Detectados (não determinantes)'
            : decision === 'allow'
              ? 'Distribuição de Score'
              : 'Principais Fatores'

    return (
        <div className="rounded-xl border border-border/60 overflow-hidden">
            {/* Header */}
            <div className="px-3 pt-3 pb-2.5 border-b border-border/40">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-primary">
                        Análise da Ameaça
                    </p>
                    <div className="flex gap-0.5">
                        <button
                            onClick={() => setActiveTab('summary')}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                                activeTab === 'summary'
                                    ? 'bg-muted text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <BookOpen className="h-3 w-3" />
                            Resumo
                        </button>
                        <button
                            onClick={() => setActiveTab('factors')}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                                activeTab === 'factors'
                                    ? 'bg-muted text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <BarChart3 className="h-3 w-3" />
                            Fatores
                        </button>
                    </div>
                </div>

                <RiskArchetypeBadge
                    archetypeId={risk_archetype.id}
                    confidence={risk_archetype.confidence}
                    showDescription
                />

                {/* Status line */}
                <div className="mt-2 flex items-center gap-1.5">
                    <StatusIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{status.label}</p>
                </div>
            </div>

            {/* Summary tab */}
            {activeTab === 'summary' && (
                <div className="p-3 space-y-3">
                    {/* Executive summary */}
                    <div className="border-l-2 border-primary/50 pl-3 py-0.5">
                        <p className="text-[10px] text-primary font-semibold uppercase tracking-wider mb-1">
                            Resumo Executivo
                        </p>
                        <p className="text-sm leading-relaxed text-foreground">
                            {narrative.executive_summary}
                        </p>
                    </div>

                    {/* Risk factors */}
                    {hasFactors ? (
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                {sectionLabel}
                            </p>
                            {narrative.risk_factors.map((factor, idx) => (
                                <div
                                    key={`${factor.signal}-${idx}`}
                                    className="flex gap-3 rounded-lg bg-muted/20 border border-border/40 px-3 py-2"
                                >
                                    <div className="shrink-0 mt-0.5 w-8 text-right">
                                        <span className="text-[11px] font-semibold tabular-nums text-primary">
                                            {factor.weight_pct.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-foreground">
                                            {factor.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                            {factor.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        decision === 'allow' && (
                            <div className="flex items-center gap-2 rounded-lg bg-muted/20 border border-border/40 px-3 py-2">
                                <CheckCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <p className="text-xs text-muted-foreground">
                                    Todos os componentes ficaram dentro dos parâmetros normais.
                                    Nenhum fator de risco significativo identificado.
                                </p>
                            </div>
                        )
                    )}

                    {/* Recommended action */}
                    {narrative.recommended_action && (
                        <div className="rounded-lg bg-muted/20 border border-border/40 px-3 py-2">
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                                Ação Recomendada
                            </p>
                            <p className="text-xs text-foreground leading-relaxed">
                                {narrative.recommended_action}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Factors chart tab */}
            {activeTab === 'factors' && (
                <div className="p-3 space-y-2.5">
                    <p className="text-xs text-muted-foreground">
                        Contribuição percentual de cada camada para a pontuação de risco.
                        {decision === 'allow' && ' Score dentro do limiar de aprovação.'}
                    </p>
                    <FactorContributionChart contributions={factor_contributions} />
                </div>
            )}

            {/* Feedback */}
            <div className="px-3 pb-3 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">Esta explicação foi útil?</p>
                    {feedbackGiven ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CheckCircle className="h-3 w-3" />
                            Obrigado pelo feedback
                        </div>
                    ) : (
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs gap-1 text-muted-foreground"
                                onClick={() => setFeedbackGiven('yes')}
                            >
                                <ThumbsUp className="h-3 w-3" />
                                Sim
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs gap-1 text-muted-foreground"
                                onClick={() => setFeedbackGiven('no')}
                            >
                                <ThumbsDown className="h-3 w-3" />
                                Não
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
