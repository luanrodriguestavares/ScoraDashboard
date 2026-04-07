import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { learningApi } from '@/services/api'
import {
    Brain,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    XCircle,
    RefreshCw,
    ThumbsUp,
    ThumbsDown,
    History,
    Target,
    BarChart3,
    Lightbulb,
    ArrowRight,
    Clock,
    Sparkles,
    Activity,
    Gauge,
    Zap,
    Info,
} from 'lucide-react'

interface FeedbackItem {
    id: string
    decisionId: string
    valueHash: string
    type: string
    originalDecision: 'allow' | 'review' | 'block'
    feedback: 'false_positive' | 'confirmed_fraud' | 'incorrect_score' | 'confirmed_legitimate'
    feedbackBy: string
    feedbackAt: string
    notes?: string
    impactApplied: boolean
}

interface DriftMetric {
    feature: string
    baseline: number
    current: number
    drift: number
    status: 'stable' | 'warning' | 'critical'
    trend: 'up' | 'down' | 'stable'
}

interface Recommendation {
    id: string
    type: 'threshold' | 'rule' | 'weight' | 'alert'
    priority: 'low' | 'medium' | 'high'
    title: string
    description: string
    currentValue?: string
    suggestedValue?: string
    expectedImpact: string
    confidence: number
}

interface RetrainingEvent {
    id: string
    triggeredAt: string
    completedAt?: string
    status: 'pending' | 'running' | 'completed' | 'failed'
    feedbackCount: number
    metricsImprovement?: {
        falsePositives: number
        falseNegatives: number
        accuracy: number
    }
}

interface FeedbackCardProps {
    feedback: FeedbackItem
}

function FeedbackCard({ feedback }: FeedbackCardProps) {
    const { t } = useLanguage()
    const isFalsePositive = feedback.feedback === 'false_positive'
    const isConfirmedFraud = feedback.feedback === 'confirmed_fraud'
    const isCorrectDecision = feedback.feedback === 'confirmed_legitimate'
    const fallbackDecisionLabels = {
        allow: 'Aprovar',
        review: 'Revisar',
        block: 'Bloquear',
    }
    const originalLabel =
        t.decisions?.[feedback.originalDecision] ??
        fallbackDecisionLabels[feedback.originalDecision]
    const shouldBeLabel = isFalsePositive
        ? (t.decisions?.allow ?? fallbackDecisionLabels.allow)
        : isConfirmedFraud
          ? (t.decisions?.block ?? fallbackDecisionLabels.block)
          : originalLabel
    return (
        <Card
            className={cn(
                'border-l-4',
                isFalsePositive && 'border-l-decision-review',
                isConfirmedFraud && 'border-l-decision-block',
                isCorrectDecision && 'border-l-decision-allow'
            )}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        {isFalsePositive ? (
                            <ThumbsDown className="h-5 w-5 text-decision-review mt-0.5" />
                        ) : isConfirmedFraud ? (
                            <ThumbsUp className="h-5 w-5 text-decision-block mt-0.5" />
                        ) : (
                            <CheckCircle className="h-5 w-5 text-decision-allow mt-0.5" />
                        )}
                        <div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono text-xs">
                                    {feedback.type.toUpperCase()}
                                </Badge>
                                <Badge
                                    variant={feedback.impactApplied ? 'default' : 'secondary'}
                                    className="text-xs"
                                >
                                    {feedback.impactApplied
                                        ? t.learning?.applied || 'Aplicado'
                                        : t.learning?.pending || 'Pendente'}
                                </Badge>
                            </div>
                            <p className="text-sm font-medium mt-1">
                                {isFalsePositive
                                    ? t.learning?.falsePositive || 'Falso positivo'
                                    : isConfirmedFraud
                                      ? t.learning?.confirmedFraud || 'Fraude confirmada'
                                      : t.learning?.correctDecision || 'Decisão correta'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {t.learning?.original || 'Original'}:{' '}
                                <span className="capitalize">{originalLabel}</span> →
                                {t.learning?.shouldBe || 'Deveria ser'}:{' '}
                                <span className="capitalize">{shouldBeLabel}</span>
                            </p>
                            {feedback.notes && (
                                <p className="text-xs text-muted-foreground mt-2 italic">
                                    "{feedback.notes}"
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                        <p>{feedback.feedbackBy}</p>
                        <p>{new Date(feedback.feedbackAt).toLocaleString()}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

interface DriftChartProps {
    metrics: DriftMetric[]
}

function DriftChart({ metrics }: DriftChartProps) {
    const maxDrift = Math.max(1, ...metrics.map((m) => Math.abs(m.drift)))

    return (
        <div className="space-y-4">
            {metrics.map((metric) => (
                <div key={metric.feature} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{metric.feature.replace(/_/g, ' ')}</span>
                        <div className="flex items-center gap-2">
                            {metric.trend === 'up' && (
                                <TrendingUp className="h-3 w-3 text-decision-block" />
                            )}
                            {metric.trend === 'down' && (
                                <TrendingDown className="h-3 w-3 text-decision-allow" />
                            )}
                            <span
                                className={cn(
                                    'font-mono text-xs',
                                    metric.drift > 0 ? 'text-decision-block' : 'text-decision-allow'
                                )}
                            >
                                {metric.drift > 0 ? '+' : ''}
                                {metric.drift.toFixed(1)}%
                            </span>
                            <Badge
                                variant="outline"
                                className={cn(
                                    'text-xs',
                                    metric.status === 'stable' &&
                                        'text-decision-allow border-decision-allow',
                                    metric.status === 'warning' &&
                                        'text-decision-review border-decision-review',
                                    metric.status === 'critical' &&
                                        'text-decision-block border-decision-block'
                                )}
                            >
                                {metric.status}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    'h-full rounded-full transition-all',
                                    metric.status === 'stable' && 'bg-decision-allow',
                                    metric.status === 'warning' && 'bg-decision-review',
                                    metric.status === 'critical' && 'bg-decision-block'
                                )}
                                style={{
                                    width: `${Math.min((Math.abs(metric.drift) / maxDrift) * 100, 100)}%`,
                                }}
                            />
                        </div>
                        <span className="text-xs text-muted-foreground w-24 text-right">
                            {metric.baseline.toFixed(2)} → {metric.current.toFixed(2)}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    )
}

interface RecommendationCardProps {
    recommendation: Recommendation
}

function RecommendationCard({ recommendation }: RecommendationCardProps) {
    const { t } = useLanguage()
    const icons = {
        threshold: Target,
        rule: Zap,
        weight: Gauge,
        alert: AlertTriangle,
    }
    const Icon = icons[recommendation.type]
    const typeLabels = {
        threshold: 'Limite',
        rule: 'Regra',
        weight: 'Peso',
        alert: 'Alerta',
    }
    const priorityLabels = {
        low: 'Baixa',
        medium: 'Média',
        high: 'Alta',
    }

    return (
        <Card
            className={cn(
                'border-l-4',
                recommendation.priority === 'high' && 'border-l-decision-block',
                recommendation.priority === 'medium' && 'border-l-decision-review',
                recommendation.priority === 'low' && 'border-l-primary'
            )}
        >
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <div
                        className={cn(
                            'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                            recommendation.priority === 'high' && 'bg-decision-block/10',
                            recommendation.priority === 'medium' && 'bg-decision-review/10',
                            recommendation.priority === 'low' && 'bg-primary/10'
                        )}
                    >
                        <Icon
                            className={cn(
                                'h-5 w-5',
                                recommendation.priority === 'high' && 'text-decision-block',
                                recommendation.priority === 'medium' && 'text-decision-review',
                                recommendation.priority === 'low' && 'text-primary'
                            )}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                                {typeLabels[recommendation.type] || recommendation.type}
                            </Badge>
                            <Badge
                                variant="outline"
                                className={cn(
                                    'text-xs',
                                    recommendation.priority === 'high' &&
                                        'text-decision-block border-decision-block',
                                    recommendation.priority === 'medium' &&
                                        'text-decision-review border-decision-review'
                                )}
                            >
                                {priorityLabels[recommendation.priority] || recommendation.priority}
                            </Badge>
                        </div>
                        <h4 className="font-medium">{recommendation.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            {recommendation.description}
                        </p>

                        {recommendation.currentValue && recommendation.suggestedValue && (
                            <div className="flex items-center gap-2 mt-2 text-sm">
                                <span className="font-mono bg-secondary px-2 py-0.5 rounded">
                                    {recommendation.currentValue}
                                </span>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                <span className="font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                                    {recommendation.suggestedValue}
                                </span>
                            </div>
                        )}

                        <p className="text-xs text-muted-foreground mt-2">
                            {t.learning?.expectedImpact || 'Impacto esperado'}:{' '}
                            {recommendation.expectedImpact}
                        </p>

                        <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Sparkles className="h-3 w-3" />
                                <span>
                                    {recommendation.confidence}%{' '}
                                    {t.learning?.confidence || 'confiança'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

interface RetrainingHistoryProps {
    events: RetrainingEvent[]
}

function RetrainingHistory({ events }: RetrainingHistoryProps) {
    const { t } = useLanguage()
    if (events.length === 0) {
        return (
            <div className="rounded-lg border border-dashed p-6 text-center">
                <History className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">
                    {t.learning?.retrainingHistory || 'Histórico de recalibração'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                    Nenhuma recalibração automática foi executada no backend atual.
                </p>
            </div>
        )
    }
    return (
        <div className="space-y-3">
            {events.map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div
                        className={cn(
                            'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                            event.status === 'completed' && 'bg-decision-allow/10',
                            event.status === 'running' && 'bg-primary/10',
                            event.status === 'failed' && 'bg-decision-block/10',
                            event.status === 'pending' && 'bg-secondary'
                        )}
                    >
                        {event.status === 'completed' && (
                            <CheckCircle className="h-4 w-4 text-decision-allow" />
                        )}
                        {event.status === 'running' && (
                            <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                        )}
                        {event.status === 'failed' && (
                            <XCircle className="h-4 w-4 text-decision-block" />
                        )}
                        {event.status === 'pending' && (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">
                                {t.learning?.baselineRecalculation || 'Recalibração de baseline'}
                            </p>
                            <Badge variant="outline" className="text-xs capitalize">
                                {event.status}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(event.triggeredAt).toLocaleString()} • {event.feedbackCount}{' '}
                            {t.learning?.feedbackItems || 'feedbacks'}
                        </p>
                        {event.metricsImprovement && (
                            <div className="flex gap-4 mt-2 text-xs">
                                <span
                                    className={cn(
                                        event.metricsImprovement.falsePositives < 0
                                            ? 'text-decision-allow'
                                            : 'text-decision-block'
                                    )}
                                >
                                    FP: {event.metricsImprovement.falsePositives > 0 ? '+' : ''}
                                    {event.metricsImprovement.falsePositives}%
                                </span>
                                <span
                                    className={cn(
                                        event.metricsImprovement.falseNegatives < 0
                                            ? 'text-decision-allow'
                                            : 'text-decision-block'
                                    )}
                                >
                                    FN: {event.metricsImprovement.falseNegatives > 0 ? '+' : ''}
                                    {event.metricsImprovement.falseNegatives}%
                                </span>
                                <span className="text-decision-allow">
                                    Accuracy: +{event.metricsImprovement.accuracy}%
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

export function LearningPage() {
    const { t } = useLanguage()
    const queryClient = useQueryClient()
    const feedbackQuery = useQuery({
        queryKey: ['learning', 'feedback'],
        queryFn: learningApi.getFeedback,
    })
    const driftQuery = useQuery({
        queryKey: ['learning', 'drift'],
        queryFn: learningApi.getDriftMetrics,
    })
    const recommendationsQuery = useQuery({
        queryKey: ['learning', 'recommendations'],
        queryFn: learningApi.getRecommendations,
    })
    const retrainingQuery = useQuery({
        queryKey: ['learning', 'retraining'],
        queryFn: learningApi.getRetrainingHistory,
    })

    const feedback = (feedbackQuery.data as FeedbackItem[]) || []
    const driftMetrics = (driftQuery.data as DriftMetric[]) || []
    const recommendations = (recommendationsQuery.data as Recommendation[]) || []
    const retrainingHistory = (retrainingQuery.data as RetrainingEvent[]) || []

    const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false)
    const [apiInfoOpen, setApiInfoOpen] = useState(false)
    const [selectedDecisionId, setSelectedDecisionId] = useState('')
    const [feedbackType, setFeedbackType] = useState<'false_positive' | 'confirmed_fraud'>(
        'false_positive'
    )
    const [feedbackNotes, setFeedbackNotes] = useState('')
    const submitFeedbackMutation = useMutation({
        mutationFn: (payload: {
            decisionId: string
            feedback: 'false_positive' | 'confirmed_fraud'
            notes?: string
        }) => learningApi.submitFeedback(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['learning', 'feedback'] })
            setFeedbackDialogOpen(false)
            setSelectedDecisionId('')
            setFeedbackNotes('')
        },
    })

    const handleSubmitFeedback = () => {
        if (!selectedDecisionId) return
        submitFeedbackMutation.mutate({
            decisionId: selectedDecisionId,
            feedback: feedbackType,
            notes: feedbackNotes || undefined,
        })
    }

    const falsePositives = feedback.filter((f) => f.feedback === 'false_positive').length
    const confirmedFrauds = feedback.filter((f) => f.feedback === 'confirmed_fraud').length
    const pendingFeedback = feedback.filter((f) => !f.impactApplied).length
    const criticalDrifts = driftMetrics.filter((m) => m.status === 'critical').length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading font-bold">
                        {t.learning?.title || 'Aprendizado do Modelo'}
                    </h2>
                    <p className="text-muted-foreground">
                        {t.learning?.subtitle ||
                            'Use feedback para melhorar a precisão e acompanhar o desempenho do modelo.'}{' '}
                        Opcional e não interfere no uso da API.
                    </p>
                </div>
                <Button variant="outline" onClick={() => setFeedbackDialogOpen(true)}>
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    {t.learning?.submitFeedback || 'Enviar feedback'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-decision-review/10 flex items-center justify-center">
                                <ThumbsDown className="h-5 w-5 text-decision-review" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">
                                    {t.learning?.submitFeedback || 'Enviar feedback'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Marque falsos positivos ou fraudes confirmadas.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Lightbulb className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">
                                    {t.learning?.recommendations || 'Recomendações'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Consulte os ajustes sugeridos pelo backend e trate-os
                                    manualmente.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-decision-allow/10 flex items-center justify-center">
                                <Activity className="h-5 w-5 text-decision-allow" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">
                                    {t.learning?.featureDrift || 'Drift de features'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Monitore mudanças no comportamento do modelo.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-decision-review/10 flex items-center justify-center">
                                <ThumbsDown className="h-5 w-5 text-decision-review" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {t.learning?.falsePositives || 'Falsos positivos'}
                                </p>
                                <p className="text-2xl font-bold">{falsePositives}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-decision-block/10 flex items-center justify-center">
                                <ThumbsUp className="h-5 w-5 text-decision-block" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {t.learning?.confirmedFrauds || 'Fraudes confirmadas'}
                                </p>
                                <p className="text-2xl font-bold">{confirmedFrauds}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {t.learning?.pendingApply || 'Aguardando incorporação'}
                                </p>
                                <p className="text-2xl font-bold">{pendingFeedback}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div
                                className={cn(
                                    'h-10 w-10 rounded-full flex items-center justify-center',
                                    criticalDrifts > 0
                                        ? 'bg-decision-block/10'
                                        : 'bg-decision-allow/10'
                                )}
                            >
                                <Activity
                                    className={cn(
                                        'h-5 w-5',
                                        criticalDrifts > 0
                                            ? 'text-decision-block'
                                            : 'text-decision-allow'
                                    )}
                                />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {t.learning?.criticalDrifts || 'Drifts críticos'}
                                </p>
                                <p className="text-2xl font-bold">{criticalDrifts}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="feedback">
                <TabsList>
                    <TabsTrigger value="feedback">
                        {t.learning?.recentFeedback || 'Feedback recente'}
                    </TabsTrigger>
                    <TabsTrigger value="recommendations">
                        {t.learning?.recommendations || 'Recomendações'}
                    </TabsTrigger>
                    <TabsTrigger value="drift">
                        {t.learning?.featureDrift || 'Drift de features'}
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        {t.learning?.retrainingHistory || 'Histórico de recalibração'}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="feedback" className="mt-4 space-y-3">
                    {feedback.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <ThumbsUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">
                                    {t.learning?.noFeedback || 'Nenhum feedback enviado ainda'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        feedback.map((fb) => <FeedbackCard key={fb.id} feedback={fb} />)
                    )}
                </TabsContent>

                <TabsContent value="recommendations" className="mt-4 space-y-3">
                    {recommendations.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">
                                    {t.learning?.noRecommendations ||
                                        'Sem recomendações no momento'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        recommendations.map((rec) => (
                            <RecommendationCard key={rec.id} recommendation={rec} />
                        ))
                    )}
                </TabsContent>

                <TabsContent value="drift" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                {t.learning?.featureDriftAnalysis || 'Análise de drift de features'}
                            </CardTitle>
                            <CardDescription>
                                {t.learning?.comparingDistributions ||
                                    'Comparando distribuições atuais com o baseline (últimos 7 dias)'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DriftChart metrics={driftMetrics} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <History className="h-4 w-4" />
                                {t.learning?.baselineRecalcHistory ||
                                    'Histórico de recalibração de baseline'}
                            </CardTitle>
                            <CardDescription>
                                {t.learning?.automaticRecalculations ||
                                    'Recalibrações automáticas com base no feedback acumulado'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RetrainingHistory events={retrainingHistory} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex items-center justify-end">
                <Button variant="outline" size="sm" onClick={() => setApiInfoOpen(true)}>
                    <Info className="h-4 w-4" />
                    {t.learning?.apiIntegration || 'Integração via API'}
                </Button>
            </div>

            <Dialog open={apiInfoOpen} onOpenChange={setApiInfoOpen}>
                <DialogContent className="max-w-2xl bg-background border border-border/70 shadow-lg">
                    <DialogHeader>
                        <DialogTitle>Integração via API (opcional)</DialogTitle>
                        <DialogDescription>
                            Para escala, envie feedback automaticamente quando o caso for resolvido.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 text-sm text-muted-foreground max-h-[70vh] overflow-auto pr-2">
                        <div>
                            Endpoint:{' '}
                            <span className="font-mono">POST /v1/admin/learning/feedback</span>
                        </div>
                        <div>Payload esperado:</div>
                        <pre className="text-xs bg-muted rounded-md p-3 overflow-auto">
                            {`{
  "decisionId": "dec_123",
  "feedback": "confirmed_fraud",
  "notes": "Fraude confirmada"
}`}
                        </pre>
                        <div>
                            Valores aceitos em <span className="font-mono">feedback</span>:{' '}
                            <span className="font-mono">confirmed_fraud</span> e{' '}
                            <span className="font-mono">false_positive</span>.
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Feedback Dialog */}
            <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
                <DialogContent className="max-w-xl bg-background border border-border/70 shadow-lg">
                    <DialogHeader>
                        <DialogTitle>{t.learning?.submitFeedback || 'Enviar feedback'}</DialogTitle>
                        <DialogDescription>
                            {t.learning?.feedbackDialogDescription ||
                                'Reporte um falso positivo ou confirme uma fraude para melhorar a precisão do modelo'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[70vh] overflow-auto pr-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {t.learning?.decisionId || 'ID da decisão'}
                            </label>
                            <input
                                type="text"
                                value={selectedDecisionId}
                                onChange={(e) => setSelectedDecisionId(e.target.value)}
                                placeholder="dec_abc123..."
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {t.learning?.feedbackType || 'Tipo de feedback'}
                            </label>
                            <Select
                                value={feedbackType}
                                onValueChange={(v) => setFeedbackType(v as typeof feedbackType)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="false_positive">
                                        <div className="flex items-center gap-2">
                                            <ThumbsDown className="h-4 w-4 text-decision-review" />
                                            {t.learning?.falsePositive || 'Falso positivo'} (
                                            {t.learning?.shouldBeAllowed || 'deveria ser permitido'}
                                            )
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="confirmed_fraud">
                                        <div className="flex items-center gap-2">
                                            <ThumbsUp className="h-4 w-4 text-decision-block" />
                                            {t.learning?.confirmedFraud || 'Fraude confirmada'} (
                                            {t.learning?.shouldBeBlocked || 'deveria ser bloqueado'}
                                            )
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {t.learning?.notesOptional || 'Observações (opcional)'}
                            </label>
                            <Textarea
                                value={feedbackNotes}
                                onChange={(e) => setFeedbackNotes(e.target.value)}
                                placeholder="Contexto adicional..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setFeedbackDialogOpen(false)}>
                            {t.common?.cancel || 'Cancelar'}
                        </Button>
                        <Button
                            onClick={handleSubmitFeedback}
                            disabled={!selectedDecisionId || submitFeedbackMutation.isPending}
                        >
                            {t.learning?.submitFeedback || 'Enviar feedback'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
