import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { learningApi } from '@/services/api'
import { DriftMetrics, Recommendation } from '@/types'
import { handleApiError } from '@/services/error-handler'

const scoreGuide = [
    {
        label: '0.00 – 0.49',
        text: 'Baixo risco. Normalmente pode ser aprovado.',
        color: 'bg-decision-allow/10',
    },
    {
        label: '0.50 – 0.84',
        text: 'Faixa de review. Exige análise manual.',
        color: 'bg-decision-review/10',
    },
    {
        label: '0.85 – 1.00',
        text: 'Alto risco. Normalmente deve ser bloqueado.',
        color: 'bg-decision-block/10',
    },
]

const keySignals = [
    { label: 'Validação', description: 'Formato inválido ou baixa confiança (25% do peso).' },
    {
        label: 'Histórico',
        description: 'Baixa taxa de validade ou alto risco recorrente (20% do peso).',
    },
    { label: 'Velocidade', description: 'Picos de uso ou padrões suspeitos (15% do peso).' },
    { label: 'Contexto', description: 'Anomalias e comportamentos incomuns (20% do peso).' },
    { label: 'Grafo', description: 'Conexões com fraude ou cluster suspeito (10% do peso).' },
    { label: 'Padrão', description: 'Regras explícitas que forçam decisão (10% do peso).' },
]

const faq = [
    {
        q: 'O que significa o score?',
        a: 'Quanto mais próximo de 1, maior o risco. Quanto mais perto de 0, menor o risco. É uma probabilidade de fraude.',
    },
    {
        q: 'Score alto sempre bloqueia?',
        a: 'Em geral sim. A faixa acima de 0.85 tende a bloquear, mas regras podem forçar revisão.',
    },
    {
        q: 'Por que um caso foi para review?',
        a: 'Normalmente porque ficou na faixa intermediária (0.50–0.84) ou houve um floor de validação.',
    },
    {
        q: 'O que é floor de decisão?',
        a: 'Quando a validação força review/bloqueio independente do score final. Exemplo: CPF inválido força review.',
    },
    {
        q: 'Como usar os drivers?',
        a: 'Eles explicam quais camadas mais puxaram o score. Use para justificar revisão ou bloqueio.',
    },
    {
        q: 'O que são métricas de drift?',
        a: 'Indicam degradação do modelo. Se taxa de falsos positivos aumentou, pode ser necessário retreinar.',
    },
]

export function TrainingPage() {
    const [driftMetrics, setDriftMetrics] = useState<DriftMetrics[]>([])
    const [recommendations, setRecommendations] = useState<Recommendation[]>([])

    useEffect(() => {
        const loadData = async () => {
            try {
                const metrics = await learningApi.getDriftMetrics()
                const recs = await learningApi.getRecommendations()
                setDriftMetrics(metrics || [])
                setRecommendations(recs || [])
            } catch (error) {
                handleApiError(error, 'Erro ao carregar dados de aprendizado')
            }
        }

        loadData()
    }, [])

    const falsePositiveRate = driftMetrics.find(
        (metric) => metric.feature === 'false_positive_rate'
    )
    const fraudDetectionRate = driftMetrics.find((metric) => metric.feature === 'block_rate')
    const modelStability = driftMetrics.find((metric) => metric.feature === 'avg_score')
    const driftDetected = driftMetrics.some((metric) => metric.status !== 'stable')

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-heading font-bold">Ajuda e Treinamento</h2>
                <p className="text-muted-foreground">
                    Referência rápida para interpretar scores, entender sinais de risco e manter
                    consistência nas decisões.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Como interpretar o score</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {scoreGuide.map((item) => (
                        <div
                            key={item.label}
                            className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50"
                        >
                            <div>
                                <Badge variant="outline" className="font-mono">
                                    {item.label}
                                </Badge>
                            </div>
                            <span className="text-sm text-muted-foreground flex-1">
                                {item.text}
                            </span>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Componentes do score (ponderação)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {keySignals.map((signal) => (
                        <div key={signal.label} className="border-l-4 border-primary pl-4 py-2">
                            <div className="font-medium text-sm">{signal.label}</div>
                            <div className="text-sm text-muted-foreground">
                                {signal.description}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {driftMetrics.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Status do modelo (Últimas 24h)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-lg bg-muted">
                                <div className="text-xs text-muted-foreground font-medium">
                                    Taxa de Falsos Positivos
                                </div>
                                <div className="text-2xl font-bold mt-2">
                                    {((falsePositiveRate?.current ?? 0) * 100).toFixed(2)}%
                                </div>
                            </div>
                            <div className="p-4 rounded-lg bg-muted">
                                <div className="text-xs text-muted-foreground font-medium">
                                    Taxa de Detecção de Fraude
                                </div>
                                <div className="text-2xl font-bold mt-2">
                                    {((fraudDetectionRate?.current ?? 0) * 100).toFixed(2)}%
                                </div>
                            </div>
                            <div className="p-4 rounded-lg bg-muted">
                                <div className="text-xs text-muted-foreground font-medium">
                                    Estabilidade do Modelo
                                </div>
                                <div className="text-2xl font-bold mt-2">
                                    {((modelStability?.current ?? 0) * 100).toFixed(2)}%
                                </div>
                            </div>
                        </div>
                        {driftDetected && (
                            <div className="p-3 bg-decision-review/10 border border-decision-review/20 rounded-lg">
                                <div className="text-sm font-medium text-decision-review">
                                    Drift detectado
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    O modelo está apresentando comportamento diferente. Considere
                                    revisar o treinamento.
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {recommendations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Recomendações do Sistema</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {recommendations.map((rec, idx) => (
                            <div key={idx} className="p-3 border rounded-lg">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="font-medium text-sm capitalize">
                                            {rec.type.replace(/_/g, ' ')}
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {rec.description}
                                        </div>
                                        {rec.suggestedValue && (
                                            <div className="text-xs text-primary mt-2 font-mono">
                                                Valor sugerido: {rec.suggestedValue}
                                            </div>
                                        )}
                                    </div>
                                    <Badge variant="secondary" className="shrink-0">
                                        {(rec.confidence * 100).toFixed(0)}%
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">FAQ rápido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {faq.map((item) => (
                        <div key={item.q} className="pb-4 border-b last:border-b-0 last:pb-0">
                            <div className="text-sm font-medium">{item.q}</div>
                            <div className="text-sm text-muted-foreground mt-1">{item.a}</div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Próximas ações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Utilize o sistema de forma consistente e forneça feedback sobre decisões
                        incorretas. Isso ajuda a melhorar o modelo.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" asChild>
                            <a href="/dashboard/review">Ir para Fila de Revisão</a>
                        </Button>
                        <Button variant="outline" asChild>
                            <a href="/dashboard/learning">Ver Aprendizado</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
