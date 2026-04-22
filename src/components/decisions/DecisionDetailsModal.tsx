import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { DecisionBadge, RiskBadge } from '@/components/dashboard/RiskIndicators'
import type { RiskDecision } from '@/types'
import { useNavigate } from 'react-router-dom'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ExplanationNarrative } from '@/components/explainability/ExplanationNarrative'
import { buildLocalExplainability } from '@/utils/buildLocalExplainability'
import { History } from 'lucide-react'

type RevealState = {
    canReveal: boolean
    isRevealing: boolean
    revealedValue: string | null
    onToggleReveal: () => void
}

type ActionState = {
    onApprove?: () => void
    onBlock?: () => void
}

interface DecisionDetailsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    decision: RiskDecision | null
    reveal?: RevealState
    actions?: ActionState
}

export function DecisionDetailsModal({
    open,
    onOpenChange,
    decision,
    reveal,
    actions,
}: DecisionDetailsModalProps) {
    const { t } = useLanguage()
    const navigate = useNavigate()

    if (!decision) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{t.overview.decisionDetails}</DialogTitle>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        )
    }

    const formatTime = (dateString: string) =>
        new Date(dateString).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        })

    const graphAnalysis = decision.graph_analysis
    const explanation = decision.explanation
    const itemLabel = decision.item_ref || decision.valueHash

    const explainability = decision.explainability ?? buildLocalExplainability(decision)

    const breakdownItems = [
        {
            key: 'validation',
            label: t.reviewQueue.scoreLabels.validation,
            value: Number(decision.scoring.validation_score ?? 0),
        },
        {
            key: 'history',
            label: t.reviewQueue.scoreLabels.history,
            value: Number(decision.scoring.history_score ?? 0),
        },
        {
            key: 'velocity',
            label: t.reviewQueue.scoreLabels.velocity,
            value: Number(decision.scoring.velocity_score ?? 0),
        },
        {
            key: 'context',
            label: t.reviewQueue.scoreLabels.context,
            value: Number(decision.scoring.context_score ?? 0),
        },
        {
            key: 'pattern',
            label: t.reviewQueue.scoreLabels.pattern,
            value: Number(decision.scoring.pattern_score ?? 0),
        },
        {
            key: 'graph',
            label: t.reviewQueue.scoreLabels.graph,
            value: Number(decision.scoring.graph_score ?? 0),
        },
    ]
    const ruleAdj = Number(decision.scoring.rule_adjustments ?? 0)
    if (Math.abs(ruleAdj) > 0.001) {
        breakdownItems.push({
            key: 'rules',
            label: t.reviewQueue.scoreLabels.rules ?? 'Regras',
            value: Math.abs(ruleAdj),
        })
    }

    const hasThresholds =
        explanation?.thresholds?.review_start != null && explanation?.thresholds?.review_end != null

    const getScoreBarColor = (value: number) =>
        value < 0.35
            ? 'bg-emerald-500/70'
            : value < 0.65
              ? 'bg-amber-500/70'
              : 'bg-red-500/70'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
                <DialogHeader className="text-left pb-2">
                    <DialogTitle>{t.overview.decisionDetails}</DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[76vh] pr-4">
                    <div className="space-y-3">
                        {/* ── 1. Identity header ─────────────────────────────────── */}
                        <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-3">
                            {/* Decision + risk + type + score */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2 flex-wrap min-w-0">
                                    <DecisionBadge decision={decision.decision} />
                                    <RiskBadge level={decision.riskLevel} />
                                    <Badge variant="outline" className="text-xs font-mono">
                                        {decision.type.toUpperCase()}
                                    </Badge>
                                    {decision.use_case && (
                                        <Badge variant="secondary" className="text-xs font-mono">
                                            {decision.use_case}
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                        {t.common.score}
                                    </p>
                                    <p className="text-xl font-bold tabular-nums text-primary">
                                        {decision.score.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            {/* Timestamp */}
                            <p className="text-xs text-muted-foreground">
                                {formatTime(decision.created_at)}
                            </p>

                            {/* Hash */}
                            <div className="border-t border-border/60 pt-2 space-y-1.5">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                    {t.common.decisionIdLabel}
                                </p>
                                <p className="font-mono text-xs break-all text-muted-foreground bg-muted/40 rounded px-2 py-1.5">
                                    {decision.decision_id || decision.id}
                                </p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider pt-1">
                                    {t.common.valueHashLabel}
                                </p>
                                <p className="font-mono text-xs break-all text-muted-foreground bg-muted/40 rounded px-2 py-1.5">
                                    {reveal?.revealedValue ?? itemLabel}
                                </p>
                                {reveal?.canReveal && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        disabled={reveal.isRevealing}
                                        onClick={reveal.onToggleReveal}
                                    >
                                        {reveal.revealedValue
                                            ? t.reviewQueue.hideValue
                                            : t.reviewQueue.revealValue}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* ── 2. Threat narrative (always present) ───────────────── */}
                        <ExplanationNarrative
                            explainability={explainability}
                            decisionId={decision.id}
                            decision={decision.decision}
                        />

                        {/* ── 3. Intelligence & Graph ─────────────────────────────── */}
                        <div
                            className={
                                graphAnalysis
                                    ? 'grid grid-cols-1 md:grid-cols-2 gap-3'
                                    : 'grid grid-cols-1 gap-3'
                            }
                        >
                            {/* Historical intelligence */}
                            <div className="rounded-xl border border-border/60 p-3">
                                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">
                                    {t.reviewQueue.history}
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground mb-0.5">
                                            {t.reviewQueue.totalSeen}
                                        </p>
                                        <p className="text-sm font-semibold tabular-nums text-primary">
                                            {decision.intelligence.total_seen}x
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground mb-0.5">
                                            {t.reviewQueue.distinctAccounts}
                                        </p>
                                        <p className="text-sm font-semibold tabular-nums text-primary">
                                            {decision.intelligence.distinct_accounts}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-0.5">
                                            {t.reviewQueue.recent24h}
                                            <span
                                                className="text-[9px] bg-muted px-1 py-0.5 rounded opacity-70"
                                                title="Número de vezes visto nas últimas 24 horas"
                                            >
                                                24h
                                            </span>
                                        </p>
                                        <p className="text-sm font-semibold tabular-nums text-primary">
                                            {decision.intelligence.recent_24h}x
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground mb-0.5">
                                            {t.reviewQueue.validRate}
                                        </p>
                                        <p className="text-sm font-semibold tabular-nums text-primary">
                                            {(decision.intelligence.valid_rate * 100).toFixed(0)}%
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Graph analysis */}
                            {graphAnalysis && (
                                <div className="rounded-xl border border-border/60 p-3">
                                    <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">
                                        {t.reviewQueue.graphInfo}
                                    </p>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-[10px] text-muted-foreground mb-0.5">
                                                {t.reviewQueue.clusterLabel}
                                            </p>
                                            <p className="font-mono text-xs break-all text-foreground">
                                                {graphAnalysis.cluster_id}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-[10px] text-muted-foreground mb-0.5">
                                                    {t.graph.clusterSize}
                                                </p>
                                                <p className="text-sm font-semibold tabular-nums text-primary">
                                                    {graphAnalysis.cluster_size}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground mb-0.5">
                                                    {t.graph.sharedIdentities}
                                                </p>
                                                <p className="text-sm font-semibold tabular-nums text-primary">
                                                    {graphAnalysis.shared_identities}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground mb-0.5">
                                                {t.reviewQueue.riskPropagation}
                                            </p>
                                            <p className="text-sm font-semibold tabular-nums text-primary">
                                                {(graphAnalysis.risk_propagation * 100).toFixed(0)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── 4. Scoring breakdown ────────────────────────────────── */}
                        <div className="rounded-xl border border-border/60 p-3">
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">
                                {t.reviewQueue.scoringBreakdown}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {breakdownItems.map((item) => (
                                    <div
                                        key={item.key}
                                        className="rounded-lg border border-border/60 p-2"
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <p className="text-muted-foreground text-[10px]">
                                                {item.label}
                                            </p>
                                            <p className="font-semibold text-xs tabular-nums text-primary">
                                                {item.value.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${getScoreBarColor(item.value)}`}
                                                style={{
                                                    width: `${Math.min(100, Math.max(0, item.value * 100))}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Threshold zones */}
                            {hasThresholds && (
                                <div className="mt-3">
                                    <p className="text-[10px] text-muted-foreground mb-2">
                                        {t.reviewQueue.thresholdsLabel}
                                    </p>
                                    <div className="relative h-3 rounded-full overflow-hidden flex">
                                        <div
                                            className="h-full bg-emerald-500/30 flex items-center justify-center"
                                            style={{
                                                width: `${explanation!.thresholds.review_start! * 100}%`,
                                            }}
                                        />
                                        <div
                                            className="h-full bg-amber-500/30 flex items-center justify-center"
                                            style={{
                                                width: `${(explanation!.thresholds.review_end! - explanation!.thresholds.review_start!) * 100}%`,
                                            }}
                                        />
                                        <div className="h-full bg-red-500/30 flex-1" />
                                        <div
                                            className="absolute top-0 bottom-0 w-0.5 bg-foreground/30"
                                            style={{
                                                left: `${explanation!.thresholds.review_start! * 100}%`,
                                            }}
                                        />
                                        <div
                                            className="absolute top-0 bottom-0 w-0.5 bg-foreground/30"
                                            style={{
                                                left: `${explanation!.thresholds.review_end! * 100}%`,
                                            }}
                                        />
                                        <div
                                            className="absolute top-0.5 bottom-0.5 w-1.5 bg-foreground rounded-full shadow-sm"
                                            style={{
                                                left: `calc(${decision.scoring.final_score * 100}% - 3px)`,
                                            }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1.5">
                                        <span className="flex items-center gap-1">
                                            <span className="inline-block w-2 h-2 rounded-sm bg-emerald-500/40" />
                                            Aprovação
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="inline-block w-2 h-2 rounded-sm bg-amber-500/40" />
                                            Revisão
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className="inline-block w-2 h-2 rounded-sm bg-red-500/40" />
                                            Bloqueio
                                        </span>
                                        <span className="text-foreground font-medium tabular-nums">
                                            Score: {decision.scoring.final_score.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── 5. Footer: history link + actions ──────────────────── */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                    const params = new URLSearchParams({
                                        caseId: decision.id,
                                        itemRef: decision.item_ref || '',
                                        valueHash: decision.valueHash,
                                        type: decision.type,
                                    })
                                    navigate(`/dashboard/investigation?${params.toString()}`)
                                }}
                            >
                                <History className="h-3.5 w-3.5" />
                                {t.reviewQueue.viewHistory}
                            </Button>

                            {(actions?.onApprove || actions?.onBlock) && (
                                <div className="flex items-center gap-2">
                                    {actions.onApprove && (
                                        <Button
                                            size="sm"
                                            variant="default"
                                            className="min-w-[110px]"
                                            onClick={actions.onApprove}
                                        >
                                            {t.reviewQueue.actions.approve}
                                        </Button>
                                    )}
                                    {actions.onBlock && (
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="min-w-[110px]"
                                            onClick={actions.onBlock}
                                        >
                                            {t.reviewQueue.actions.block}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
