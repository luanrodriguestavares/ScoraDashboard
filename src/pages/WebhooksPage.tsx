import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from '@/services/api'
import type { Webhook as WebhookType, WebhookEvent } from '@/types'
import { cn } from '@/lib/utils'
import {
    Plus,
    Trash2,
    Edit,
    Webhook,
    Key,
    Filter,
    Zap,
    Copy,
    X,
    ChevronDown,
    ChevronUp,
    BarChart2,
    ArrowRight,
    Clock,
    Info,
    Layers,
    AlertOctagon,
    ShieldAlert,
    TrendingUp,
    Scan,
    Network,
    CheckCircle,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const WEBHOOK_EVENT_OPTIONS: Array<{
    value: WebhookEvent
    label: string
    description: string
    category: string
}> = [
    {
        value: 'decision.allow',
        label: 'Decisão: Liberada',
        description: 'Transação aprovada normalmente',
        category: 'Decisões',
    },
    {
        value: 'decision.review',
        label: 'Decisão: Revisão',
        description: 'Transação requer análise manual',
        category: 'Decisões',
    },
    {
        value: 'decision.block',
        label: 'Decisão: Bloqueada',
        description: 'Transação bloqueada por risco',
        category: 'Decisões',
    },
    {
        value: 'risk.high',
        label: 'Risco Alto',
        description: 'Score acima do limiar de revisão',
        category: 'Risco',
    },
    {
        value: 'risk.critical',
        label: 'Risco Crítico',
        description: 'Risco crítico exige ação imediata',
        category: 'Risco',
    },
    {
        value: 'velocity.burst',
        label: 'Volume Atípico',
        description: 'Pico de requisições detectado',
        category: 'Padrões',
    },
    {
        value: 'anomaly.detected',
        label: 'Anomalia Detectada',
        description: 'Comportamento incomum identificado',
        category: 'Padrões',
    },
    {
        value: 'pattern.fraud',
        label: 'Padrão de Fraude',
        description: 'Padrão de fraude confirmado',
        category: 'Padrões',
    },
    {
        value: 'graph.suspicious_cluster',
        label: 'Cluster Suspeito',
        description: 'Grupo de contas suspeitas identificado',
        category: 'Grafo',
    },
]

interface EventMeta {
    icon: typeof CheckCircle
    color: string
    bgColor: string
    triggerCondition: string
    payloadKey: string
    scenarios: string[]
}

const EVENT_META: Record<WebhookEvent, EventMeta> = {
    'decision.allow': {
        icon: CheckCircle,
        triggerCondition:
            'Disparado quando a transação é aprovada — score abaixo do limiar de revisão (padrão: 0.50). Útil para confirmar processamentos bem-sucedidos.',
        payloadKey: 'data.risk.decision === "allow"',
        scenarios: ['Score baixo em todos os componentes', 'Histórico limpo, sem padrões de risco'],
    },
    'decision.review': {
        icon: Clock,
        triggerCondition:
            'Disparado quando o score cai no intervalo de revisão (entre os dois limiares configurados). A decisão recomenda análise humana antes de prosseguir.',
        payloadKey: 'data.risk.decision === "review"',
        scenarios: [
            'Score elevado mas abaixo do bloqueio automático',
            'Sinais ambíguos que requerem avaliação',
        ],
    },
    'decision.block': {
        icon: AlertOctagon,
        triggerCondition:
            'Disparado quando a transação é bloqueada automaticamente — score acima do limiar de bloqueio (padrão: 0.85). Ação imediata pode ser necessária.',
        payloadKey: 'data.risk.decision === "block"',
        scenarios: ['Score crítico com múltiplos sinais negativos', 'Fraude identificada com alta confiança'],
    },
    'risk.high': {
        icon: ShieldAlert,
        triggerCondition:
            'Disparado quando o nível de risco é classificado como "high" — geralmente entre 0.50 e 0.85. Pode ocorrer junto com decision.review.',
        payloadKey: 'data.risk.level === "high"',
        scenarios: [
            'Velocidade elevada de requisições',
            'Padrões históricos suspeitos',
            'Conexões a contas problemáticas',
        ],
    },
    'risk.critical': {
        icon: AlertOctagon,
        triggerCondition:
            'Disparado quando o nível de risco é "critical" — score acima de 0.85. Normalmente ocorre junto com decision.block. Exige resposta imediata.',
        payloadKey: 'data.risk.level === "critical"',
        scenarios: [
            'Combinação de múltiplos sinais de fraude',
            'Fraude confirmada por padrão + histórico + grafo',
        ],
    },
    'velocity.burst': {
        icon: TrendingUp,
        triggerCondition:
            'Disparado quando o mesmo identificador gera um volume atípico de requisições em curto período. Indica possível bot, força bruta ou fraude coordenada.',
        payloadKey: 'data.explanation.pattern_flags inclui flags contendo "burst"',
        scenarios: [
            'Teste massivo de cartões',
            'Ataque de credential stuffing',
            'Bot de enumeração de CPFs',
        ],
    },
    'anomaly.detected': {
        icon: Scan,
        triggerCondition:
            'Disparado quando o comportamento desvia estatisticamente do padrão histórico do identificador — não necessariamente fraude, mas merece investigação.',
        payloadKey: 'data.explanation.anomalies.length > 0',
        scenarios: [
            'Uso fora do horário habitual',
            'Geolocalização incomum para o perfil',
            'Mudança brusca de padrão de uso',
        ],
    },
    'pattern.fraud': {
        icon: Network,
        triggerCondition:
            'Disparado quando o identificador tem conexões confirmadas com redes de fraude conhecidas. Alta precisão — baixo volume, alta severidade.',
        payloadKey: 'data.explanation.pattern_flags inclui "fraudulent_connections"',
        scenarios: [
            'CPF ligado a rede de estelionato',
            'Email presente em base de fraudes',
            'Cluster de fraude organizada',
        ],
    },
    'graph.suspicious_cluster': {
        icon: Network,
        triggerCondition:
            'Disparado quando o grafo de relações identifica um cluster de risco elevado (cluster_risk_score > 0.70). Indica comportamento coordenado entre múltiplas contas.',
        payloadKey: 'data.graph.cluster_risk_score > 0.70',
        scenarios: [
            'Rede de contas interligadas com comportamento coordenado',
            'Múltiplos perfis compartilhando mesmos dados',
        ],
    },
}

const PAYLOAD_PRIORITY: WebhookEvent[] = [
    'risk.critical',
    'pattern.fraud',
    'decision.block',
    'graph.suspicious_cluster',
    'risk.high',
    'velocity.burst',
    'anomaly.detected',
    'decision.review',
    'decision.allow',
]

function buildExamplePayload(events: WebhookEvent[]): { event: WebhookEvent; payload: object } {
    const event =
        events.length > 0 ? (PAYLOAD_PRIORITY.find((e) => events.includes(e)) ?? events[0]) : 'risk.high'

    const isBlock = event === 'decision.block' || event === 'risk.critical' || event === 'pattern.fraud'
    const isAllow = event === 'decision.allow'
    const score = isBlock ? 0.91 : isAllow ? 0.23 : 0.76
    const level = isBlock ? 'critical' : isAllow ? 'low' : 'high'
    const decision = isBlock ? 'block' : isAllow ? 'allow' : 'review'
    const patternFlags =
        event === 'velocity.burst'
            ? ['velocity_burst']
            : event === 'pattern.fraud'
              ? ['fraudulent_connections']
              : []
    const anomalies = event === 'anomaly.detected' ? ['unusual_time_pattern'] : []
    const clusterRisk =
        event === 'graph.suspicious_cluster' ? 0.83 : event === 'risk.critical' ? 0.71 : 0.42

    const payload = {
        event,
        timestamp: '2026-04-19T14:32:11.523Z',
        data: {
            request_id: 'req_7f4e2c1a9b3d',
            timestamp: '2026-04-19T14:32:11.523Z',
            validation: {
                type: 'cpf',
                valid: true,
                sanitized: '123.456.789-09',
                confidence: 0.98,
                issues: [],
            },
            risk: {
                score,
                level,
                decision,
                confidence: 0.91,
                score_breakdown: {
                    validation: 0.0,
                    historical: isBlock ? 0.35 : 0.18,
                    velocity: event === 'velocity.burst' ? 0.38 : 0.15,
                    context: 0.12,
                    graph: event === 'graph.suspicious_cluster' ? 0.28 : 0.08,
                    pattern: event === 'pattern.fraud' ? 0.31 : 0.05,
                    rule_adjustments: 0.0,
                },
            },
            action: {
                recommended: decision,
                reason:
                    isBlock
                        ? 'Score crítico com múltiplos sinais de fraude detectados'
                        : isAllow
                          ? 'Score baixo, nenhum sinal de risco identificado'
                          : 'Score elevado requer revisão manual antes de prosseguir',
            },
            explanation: {
                reasons:
                    isBlock
                        ? ['Padrão de fraude confirmado', 'Cluster de alto risco', 'Velocidade atípica']
                        : isAllow
                          ? ['Score baixo em todos os componentes']
                          : ['Velocidade elevada: 47 req nas últimas 24h', 'Conexões suspeitas detectadas'],
                pattern_flags: patternFlags,
                anomalies,
                rules_triggered: [],
            },
            features: {
                velocity_24h: event === 'velocity.burst' ? 183 : 47,
                distinct_accounts: isBlock ? 1 : 3,
                is_vpn: 0,
                is_tor: 0,
                is_proxy: 0,
            },
            feature_weights: {},
            intelligence: {
                total_seen: 238,
                valid_rate: 0.94,
                first_seen: '2023-09-01T08:00:00Z',
                last_seen: '2026-04-19T14:32:11Z',
                distinct_accounts: 3,
                recent_24h: 47,
                risk_distribution: { low: 0.41, medium: 0.33, high: 0.18, critical: 0.08 },
            },
            context: {
                ip_risk_score: isBlock ? 0.78 : 0.22,
                geo_country: 'BR',
                is_vpn: false,
                is_tor: false,
                is_proxy: false,
                device_type: 'mobile',
                anomalies_detected: isBlock ? 2 : 0,
            },
            graph: {
                connections_count: 12,
                suspicious_connections: isBlock ? 8 : 2,
                fraudulent_connections: event === 'pattern.fraud' ? 3 : 0,
                cluster_risk_score: clusterRisk,
            },
            metadata: {
                processing_time_ms: 11,
                api_version: '1.2.0',
                model_version: '2.3.1',
            },
        },
    }

    return { event, payload }
}

const FILTER_VALIDATION_TYPE_OPTIONS = [
    { value: 'cpf', label: 'CPF' },
    { value: 'cnpj', label: 'CNPJ' },
    { value: 'email', label: 'E-mail' },
    { value: 'phone', label: 'Telefone' },
    { value: 'name', label: 'Nome' },
    { value: 'pis_pasep', label: 'PIS/PASEP' },
    { value: 'cns', label: 'CNS' },
    { value: 'address', label: 'Endereço' },
]

const FILTER_RISK_LEVEL_OPTIONS = [
    { value: 'low', label: 'Baixo' },
    { value: 'medium', label: 'Médio' },
    { value: 'high', label: 'Alto' },
    { value: 'critical', label: 'Crítico' },
]

const FILTER_DECISION_OPTIONS = [
    { value: 'allow', label: 'Liberada' },
    { value: 'review', label: 'Revisão' },
    { value: 'block', label: 'Bloqueada' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface WebhookFormState {
    name: string
    url: string
    events: WebhookEvent[]
    filterValidationTypes: string[]
    filterRiskLevels: string[]
    filterDecisions: string[]
    filterMinScore: number
    timeoutMs: number
    maxRetries: number
    headers: Array<{ key: string; value: string }>
    showFilters: boolean
    showAdvanced: boolean
}

const defaultWebhookForm: WebhookFormState = {
    name: '',
    url: '',
    events: ['decision.block'],
    filterValidationTypes: [],
    filterRiskLevels: [],
    filterDecisions: [],
    filterMinScore: 0,
    timeoutMs: 5000,
    maxRetries: 3,
    headers: [],
    showFilters: false,
    showAdvanced: false,
}

// ─── Utility functions ────────────────────────────────────────────────────────

function buildWebhookPayload(form: WebhookFormState) {
    return {
        name: form.name,
        url: form.url,
        events: form.events,
        filter_validation_types: form.filterValidationTypes.length > 0 ? form.filterValidationTypes : null,
        filter_risk_levels: form.filterRiskLevels.length > 0 ? form.filterRiskLevels : null,
        filter_decisions: form.filterDecisions.length > 0 ? form.filterDecisions : null,
        filter_min_score: form.filterMinScore > 0 ? form.filterMinScore : null,
        timeout_ms: form.timeoutMs,
        max_retries: form.maxRetries,
        headers:
            form.headers.length > 0
                ? Object.fromEntries(
                      form.headers
                          .filter((h) => h.key.trim())
                          .map((h) => [h.key.trim(), h.value])
                  )
                : null,
    }
}

function webhookToForm(webhook: WebhookType): WebhookFormState {
    const existingHeaders = webhook.headers
        ? Object.entries(webhook.headers).map(([key, value]) => ({ key, value }))
        : []
    return {
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        filterValidationTypes: webhook.filter_validation_types ?? [],
        filterRiskLevels: webhook.filter_risk_levels ?? [],
        filterDecisions: webhook.filter_decisions ?? [],
        filterMinScore: webhook.filter_min_score ?? 0,
        timeoutMs: webhook.timeout_ms ?? 5000,
        maxRetries: webhook.max_retries ?? 3,
        headers: existingHeaders,
        showFilters:
            (webhook.filter_validation_types?.length ?? 0) > 0 ||
            (webhook.filter_risk_levels?.length ?? 0) > 0 ||
            (webhook.filter_decisions?.length ?? 0) > 0 ||
            (webhook.filter_min_score ?? 0) > 0,
        showAdvanced:
            (webhook.timeout_ms ?? 5000) !== 5000 ||
            (webhook.max_retries ?? 3) !== 3 ||
            existingHeaders.length > 0,
    }
}

function toggleArrayItem<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EventPicker({
    selected,
    onChange,
}: {
    selected: WebhookEvent[]
    onChange: (events: WebhookEvent[]) => void
}) {
    const categories = Array.from(new Set(WEBHOOK_EVENT_OPTIONS.map((e) => e.category)))
    return (
        <div className="space-y-3">
            {categories.map((cat) => (
                <div key={cat}>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                        {cat}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {WEBHOOK_EVENT_OPTIONS.filter((e) => e.category === cat).map((event) => {
                            const active = selected.includes(event.value)
                            return (
                                <button
                                    key={event.value}
                                    type="button"
                                    onClick={() => onChange(toggleArrayItem(selected, event.value))}
                                    className={cn(
                                        'text-left rounded-lg border px-3 py-2 text-xs transition-all',
                                        active
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-border hover:border-muted-foreground/40 text-muted-foreground'
                                    )}
                                >
                                    <span className="font-medium block">{event.label}</span>
                                    <span className="opacity-70">{event.description}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}

function FilterPicker({
    label,
    options,
    selected,
    onChange,
}: {
    label: string
    options: Array<{ value: string; label: string }>
    selected: string[]
    onChange: (v: string[]) => void
}) {
    return (
        <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <div className="flex flex-wrap gap-1.5">
                {options.map((opt) => {
                    const active = selected.includes(opt.value)
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => onChange(toggleArrayItem(selected, opt.value))}
                            className={cn(
                                'rounded-full border px-2.5 py-0.5 text-xs transition-all',
                                active
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border text-muted-foreground hover:border-muted-foreground/40'
                            )}
                        >
                            {opt.label}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

function HeadersEditor({
    headers,
    onChange,
}: {
    headers: Array<{ key: string; value: string }>
    onChange: (h: Array<{ key: string; value: string }>) => void
}) {
    return (
        <div className="space-y-2">
            {headers.map((h, i) => (
                <div key={i} className="flex gap-2">
                    <Input
                        placeholder="Nome do header"
                        value={h.key}
                        onChange={(e) => {
                            const next = [...headers]
                            next[i] = { ...h, key: e.target.value }
                            onChange(next)
                        }}
                        className="flex-1 text-xs h-8"
                    />
                    <Input
                        placeholder="Valor"
                        value={h.value}
                        onChange={(e) => {
                            const next = [...headers]
                            next[i] = { ...h, value: e.target.value }
                            onChange(next)
                        }}
                        className="flex-1 text-xs h-8"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => onChange(headers.filter((_, j) => j !== i))}
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ))}
            <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => onChange([...headers, { key: '', value: '' }])}
            >
                <Plus className="h-3 w-3 mr-1" />
                Adicionar header
            </Button>
        </div>
    )
}

function WebhookForm({
    form,
    onChange,
}: {
    form: WebhookFormState
    onChange: (f: WebhookFormState) => void
}) {
    const set = <K extends keyof WebhookFormState>(key: K, value: WebhookFormState[K]) =>
        onChange({ ...form, [key]: value })

    return (
        <div className="space-y-5">
            <div className="space-y-1.5">
                <label className="text-sm font-medium">Nome</label>
                <Input
                    placeholder="Ex: Notificações de bloqueio"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-sm font-medium">URL de destino</label>
                <Input
                    placeholder="https://api.seuservico.com/webhook"
                    value={form.url}
                    onChange={(e) => set('url', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                    Deve ser HTTPS. IPs privados e localhost não são permitidos.
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Eventos</label>
                <p className="text-xs text-muted-foreground">
                    Selecione quais eventos disparam notificações para esta URL.
                </p>
                <EventPicker selected={form.events} onChange={(events) => set('events', events)} />
            </div>

            <div className="border rounded-lg overflow-hidden">
                <button
                    type="button"
                    onClick={() => set('showFilters', !form.showFilters)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span>Filtros</span>
                        <span className="text-xs font-normal text-muted-foreground">
                            — Envie apenas eventos com critérios específicos
                        </span>
                    </div>
                    {form.showFilters ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                </button>
                {form.showFilters && (
                    <div className="px-4 pb-4 space-y-4 border-t">
                        <p className="text-xs text-muted-foreground pt-3">
                            Sem filtros, todos os eventos selecionados são enviados. Com filtros,
                            apenas eventos que correspondam a todos os critérios abaixo são
                            notificados.
                        </p>
                        <FilterPicker
                            label="Tipo de validação"
                            options={FILTER_VALIDATION_TYPE_OPTIONS}
                            selected={form.filterValidationTypes}
                            onChange={(v) => set('filterValidationTypes', v)}
                        />
                        <FilterPicker
                            label="Nível de risco"
                            options={FILTER_RISK_LEVEL_OPTIONS}
                            selected={form.filterRiskLevels}
                            onChange={(v) => set('filterRiskLevels', v)}
                        />
                        <FilterPicker
                            label="Decisão"
                            options={FILTER_DECISION_OPTIONS}
                            selected={form.filterDecisions}
                            onChange={(v) => set('filterDecisions', v)}
                        />
                        <div className="space-y-1.5">
                            <div className="flex justify-between">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Score mínimo
                                </p>
                                <span className="text-xs font-mono">
                                    {form.filterMinScore === 0
                                        ? 'Sem mínimo'
                                        : form.filterMinScore.toFixed(2)}
                                </span>
                            </div>
                            <Slider
                                value={[form.filterMinScore]}
                                min={0}
                                max={1}
                                step={0.01}
                                onValueChange={([v]) => set('filterMinScore', v)}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="border rounded-lg overflow-hidden">
                <button
                    type="button"
                    onClick={() => set('showAdvanced', !form.showAdvanced)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <span>Avançado</span>
                        <span className="text-xs font-normal text-muted-foreground">
                            — Timeout, tentativas e headers personalizados
                        </span>
                    </div>
                    {form.showAdvanced ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                </button>
                {form.showAdvanced && (
                    <div className="px-4 pb-4 space-y-4 border-t pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium">Timeout (ms)</label>
                                <Input
                                    type="number"
                                    min={1000}
                                    max={30000}
                                    step={500}
                                    value={form.timeoutMs}
                                    onChange={(e) => set('timeoutMs', Number(e.target.value))}
                                    className="text-xs"
                                />
                                <p className="text-xs text-muted-foreground">1000 – 30 000 ms</p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium">Tentativas</label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={5}
                                    step={1}
                                    value={form.maxRetries}
                                    onChange={(e) => set('maxRetries', Number(e.target.value))}
                                    className="text-xs"
                                />
                                <p className="text-xs text-muted-foreground">0 – 5 tentativas</p>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">Headers personalizados</label>
                            <p className="text-xs text-muted-foreground">
                                Adicionados a todas as requisições. Útil para autenticação no seu
                                servidor.
                            </p>
                            <HeadersEditor
                                headers={form.headers}
                                onChange={(h) => set('headers', h)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function SecretBox({ secret }: { secret: string }) {
    const { toast } = useToast()
    const copy = () => {
        navigator.clipboard.writeText(secret)
        toast({ description: 'Secret copiado.' })
    }
    return (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Guarde este secret agora
                </span>
            </div>
            <p className="text-xs text-muted-foreground">
                Este secret é exibido apenas uma vez. Use-o para verificar a autenticidade das
                requisições via header{' '}
                <code className="bg-muted px-1 rounded">X-Scora-Signature</code>.
            </p>
            <div className="flex items-center gap-2 bg-muted rounded px-3 py-2">
                <code className="text-xs flex-1 break-all font-mono">{secret}</code>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={copy}>
                    <Copy className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    )
}

function EventExecutiveSummary({ events }: { events: WebhookEvent[] }) {
    if (events.length === 0) {
        return (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
                <Info className="h-4 w-4 shrink-0" />
                <span>Selecione ao menos um evento para ver o resumo de disparo.</span>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {events.map((event) => {
                const meta = EVENT_META[event]
                const opt = WEBHOOK_EVENT_OPTIONS.find((e) => e.value === event)
                if (!meta || !opt) return null
                const Icon = meta.icon

                return (
                    <div
                        key={event}
                        className="rounded-lg border border-border/70 bg-background/80 p-3 space-y-2.5"
                    >
                        <div className="flex items-center gap-2">
                            <div className="rounded-md border border-border/70 bg-muted/40 p-1">
                                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            </div>
                            <span className="text-sm font-medium text-foreground">
                                {opt.label}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {meta.triggerCondition}
                        </p>
                        <div className="space-y-1">
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                Cenários típicos
                            </p>
                            <ul className="space-y-0.5">
                                {meta.scenarios.slice(0, 2).map((s) => (
                                    <li
                                        key={s}
                                        className="flex items-start gap-1.5 text-xs text-muted-foreground"
                                    >
                                        <ArrowRight className="h-3 w-3 shrink-0 mt-0.5 opacity-60" />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-md bg-muted/25 px-2.5 py-1.5">
                            <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                                Campo no payload
                            </p>
                            <code className="text-[10px] font-mono text-muted-foreground/90 break-all">
                                {meta.payloadKey}
                            </code>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function PayloadPreview({ events }: { events: WebhookEvent[] }) {
    const { toast } = useToast()
    const [showBody, setShowBody] = useState(true)
    const [showHeaders, setShowHeaders] = useState(false)

    const { event, payload } = buildExamplePayload(events)
    const opt = WEBHOOK_EVENT_OPTIONS.find((e) => e.value === event)
    const bodyStr = JSON.stringify(payload, null, 2)

    const httpHeaders = [
        ['Content-Type', 'application/json'],
        ['X-Scora-Event', event],
        ['X-Scora-Timestamp', '2026-04-19T14:32:11.523Z'],
        ['X-Scora-Delivery', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
        ['X-Scora-Signature', 'sha256=3a7f9c2e… (presente se secret configurado)'],
    ]

    const copyBody = () => {
        navigator.clipboard.writeText(bodyStr)
        toast({ description: 'Payload copiado.' })
    }

    return (
        <div className="space-y-3 mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Exemplo de payload
                </p>
                {events.length > 0 && (
                    <span className="text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground/80">
                            {opt?.label ?? event}
                        </span>
                    </span>
                )}
            </div>

            <div className="space-y-2">
                <button
                    type="button"
                    onClick={() => setShowHeaders(!showHeaders)}
                    className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <span className="font-medium">Headers HTTP enviados</span>
                    {showHeaders ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                    )}
                </button>
                {showHeaders && (
                    <div className="rounded-lg bg-muted/60 px-3 py-2.5 space-y-1">
                        {httpHeaders.map(([k, v]) => (
                            <div key={k} className="flex gap-2 text-[11px] font-mono">
                                <span className="text-blue-400 shrink-0">{k}:</span>
                                <span className="text-muted-foreground break-all">{v}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => setShowBody(!showBody)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <span className="font-medium">Body (JSON)</span>
                        {showBody ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                        )}
                    </button>
                    {showBody && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] px-2"
                            onClick={copyBody}
                        >
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                        </Button>
                    )}
                </div>
                {showBody && (
                    <div className="rounded-lg bg-muted/60 overflow-auto max-h-72 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/25 hover:scrollbar-thumb-muted-foreground/40">
                        <pre className="text-[10px] font-mono leading-relaxed p-3 text-muted-foreground whitespace-pre">
                            {bodyStr}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    )
}

interface WebhookItemProps {
    webhook: WebhookType
    onToggleActive: (active: boolean) => void
    onTest: () => void
    onEdit: () => void
    onDelete: () => void
    isUpdating?: boolean
    isTesting?: boolean
    isDeleting?: boolean
}

function WebhookItem({
    webhook,
    onToggleActive,
    onTest,
    onEdit,
    onDelete,
    isUpdating = false,
    isTesting = false,
    isDeleting = false,
}: WebhookItemProps) {
    const hasFilters =
        (webhook.filter_validation_types?.length ?? 0) > 0 ||
        (webhook.filter_risk_levels?.length ?? 0) > 0 ||
        (webhook.filter_decisions?.length ?? 0) > 0 ||
        (webhook.filter_min_score ?? 0) > 0

    return (
        <div className="border rounded-lg overflow-hidden">
            <div className="flex items-start gap-3 p-4">
                <span
                    className={cn(
                        'w-2 h-2 rounded-full mt-1.5 shrink-0',
                        webhook.active ? 'bg-emerald-500' : 'bg-muted-foreground'
                    )}
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{webhook.name}</span>
                        {webhook.total_sent > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <BarChart2 className="h-3 w-3" />
                                {webhook.total_sent} enviados
                                {webhook.total_failed > 0 && (
                                    <span className="text-destructive ml-1">
                                        · {webhook.total_failed} falhas
                                    </span>
                                )}
                            </span>
                        )}
                    </div>
                    <span className="font-mono text-xs text-muted-foreground truncate block mt-0.5">
                        {webhook.url}
                    </span>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {webhook.events.map((event) => (
                            <Badge key={event} variant="secondary" className="text-xs">
                                {WEBHOOK_EVENT_OPTIONS.find((o) => o.value === event)?.label ??
                                    event}
                            </Badge>
                        ))}
                    </div>
                    {hasFilters && (
                        <div className="flex items-center gap-1 mt-1.5">
                            <Filter className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Filtros ativos</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Switch
                        checked={webhook.active}
                        onCheckedChange={onToggleActive}
                        disabled={isUpdating || isDeleting}
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onTest}
                        disabled={isTesting || isDeleting}
                    >
                        Testar
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onEdit}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onDelete} disabled={isDeleting}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

function WebhookDialog({
    open,
    onOpenChange,
    title,
    description,
    form,
    onChange,
    onSubmit,
    submitLabel,
    isSubmitting,
    createdSecret,
    onSecretAcknowledged,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    form: WebhookFormState
    onChange: (f: WebhookFormState) => void
    onSubmit: () => void
    submitLabel: string
    isSubmitting: boolean
    createdSecret?: string | null
    onSecretAcknowledged?: () => void
}) {
    const canSubmit = !!form.name && !!form.url && form.events.length > 0 && !isSubmitting

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl p-0 gap-0 max-h-[92vh] flex flex-col">
                <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                {createdSecret ? (
                    <div className="px-6 pb-6 flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/25 hover:scrollbar-thumb-muted-foreground/40">
                        <SecretBox secret={createdSecret} />
                        <DialogFooter className="mt-4">
                            <Button onClick={onSecretAcknowledged}>Concluir</Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_440px] flex-1 min-h-0 border-t">
                            <div className="overflow-y-auto px-6 py-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/25 hover:scrollbar-thumb-muted-foreground/40">
                                <WebhookForm form={form} onChange={onChange} />
                            </div>
                            <div className="overflow-y-auto border-l px-6 py-5 bg-muted/20 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/25 hover:scrollbar-thumb-muted-foreground/40">
                                <div className="space-y-1.5 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Layers className="h-4 w-4 text-muted-foreground" />
                                        <p className="text-sm font-semibold">Quando será disparado</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Resumo do comportamento esperado e um exemplo realista do payload enviado.
                                    </p>
                                </div>
                                <EventExecutiveSummary events={form.events} />
                                <PayloadPreview events={form.events} />
                            </div>
                        </div>
                        <DialogFooter className="px-6 py-4 border-t shrink-0">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={onSubmit} disabled={!canSubmit}>
                                {submitLabel}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function WebhooksPage() {
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [createdSecret, setCreatedSecret] = useState<string | null>(null)
    const [editingWebhook, setEditingWebhook] = useState<WebhookType | null>(null)
    const [createForm, setCreateForm] = useState<WebhookFormState>(defaultWebhookForm)
    const [editForm, setEditForm] = useState<WebhookFormState>(defaultWebhookForm)

    const webhooksQuery = useQuery({
        queryKey: ['webhooks'],
        queryFn: settingsApi.getWebhooks,
    })

    const createMutation = useMutation({
        mutationFn: (form: WebhookFormState) =>
            settingsApi.createWebhook({ ...buildWebhookPayload(form), active: true }),
        onSuccess: (created) => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] })
            if (created.secret) {
                setCreatedSecret(created.secret)
            } else {
                setIsCreateOpen(false)
                setCreateForm(defaultWebhookForm)
            }
            toast({ description: 'Webhook criado com sucesso.' })
        },
        onError: () => {
            toast({ description: 'Falha ao criar webhook.', variant: 'destructive' })
        },
    })

    const updateMutation = useMutation({
        mutationFn: (payload: {
            id: string
            data: Partial<Parameters<typeof settingsApi.updateWebhook>[1]>
        }) => settingsApi.updateWebhook(payload.id, payload.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] })
            setEditingWebhook(null)
            toast({ description: 'Webhook atualizado com sucesso.' })
        },
        onError: () => {
            toast({ description: 'Falha ao atualizar webhook.', variant: 'destructive' })
        },
    })

    const testMutation = useMutation({
        mutationFn: (id: string) => settingsApi.testWebhook(id),
        onSuccess: (result) => {
            toast({
                description: result.success
                    ? `Teste enviado com sucesso${result.status_code ? ` (${result.status_code})` : ''}.`
                    : (result.error ?? 'Teste falhou.'),
                variant: result.success ? 'default' : 'destructive',
            })
        },
        onError: () => {
            toast({ description: 'Falha ao testar webhook.', variant: 'destructive' })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => settingsApi.deleteWebhook(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] })
            toast({ description: 'Webhook removido.' })
        },
        onError: () => {
            toast({ description: 'Falha ao remover webhook.', variant: 'destructive' })
        },
    })

    const handleCreate = () => {
        if (!createForm.name || !createForm.url || createForm.events.length === 0) return
        createMutation.mutate(createForm)
    }

    const handleEdit = () => {
        if (!editingWebhook || !editForm.name || !editForm.url || editForm.events.length === 0)
            return
        updateMutation.mutate({ id: editingWebhook.id, data: buildWebhookPayload(editForm) })
    }

    const closeCreate = () => {
        setIsCreateOpen(false)
        setCreatedSecret(null)
        setCreateForm(defaultWebhookForm)
    }

    const webhooks = webhooksQuery.data ?? []

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading font-bold">Webhooks</h2>
                    <p className="text-muted-foreground">
                        Receba notificações em tempo real quando o Scora tomar decisões de risco.
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo webhook
                </Button>
            </div>

            <Card className="border-dashed">
                <CardContent className="pt-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Webhook className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">O que é um webhook?</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Uma URL no seu sistema que recebe uma chamada HTTP POST do Scora
                                    cada vez que um evento relevante acontece — bloqueio, fraude
                                    detectada, anomalia, etc.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Key className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">Como verificar autenticidade?</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Cada requisição inclui o header{' '}
                                    <code className="bg-muted px-1 rounded">
                                        X-Scora-Signature
                                    </code>{' '}
                                    com uma assinatura HMAC-SHA256. Use o secret do webhook para
                                    validar.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Zap className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">Retentativas automáticas</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Se seu servidor não responder com HTTP 2xx, o Scora retenta com
                                    backoff exponencial até o número máximo configurado de
                                    tentativas.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Endpoints configurados</CardTitle>
                    <CardDescription>
                        {webhooks.length === 0
                            ? 'Nenhum webhook configurado ainda.'
                            : `${webhooks.length} webhook${webhooks.length > 1 ? 's' : ''} configurado${webhooks.length > 1 ? 's' : ''}.`}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {webhooksQuery.isLoading ? (
                        <div className="space-y-3">
                            {[1, 2].map((i) => (
                                <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                            ))}
                        </div>
                    ) : webhooks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                            <Webhook className="h-10 w-10 opacity-20" />
                            <p className="text-sm">Nenhum webhook configurado.</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsCreateOpen(true)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Criar primeiro webhook
                            </Button>
                        </div>
                    ) : (
                        webhooks.map((webhook) => (
                            <WebhookItem
                                key={webhook.id}
                                webhook={webhook}
                                onToggleActive={(active) =>
                                    updateMutation.mutate({ id: webhook.id, data: { active } })
                                }
                                onTest={() => testMutation.mutate(webhook.id)}
                                onEdit={() => {
                                    setEditingWebhook(webhook)
                                    setEditForm(webhookToForm(webhook))
                                }}
                                onDelete={() => deleteMutation.mutate(webhook.id)}
                                isUpdating={updateMutation.isPending}
                                isTesting={testMutation.isPending}
                                isDeleting={deleteMutation.isPending}
                            />
                        ))
                    )}
                </CardContent>
            </Card>

            <WebhookDialog
                open={isCreateOpen}
                onOpenChange={(open) => {
                    if (!open) closeCreate()
                    else setIsCreateOpen(true)
                }}
                title="Novo webhook"
                description="Configure uma URL para receber notificações em tempo real do Scora."
                form={createForm}
                onChange={setCreateForm}
                onSubmit={handleCreate}
                submitLabel="Criar webhook"
                isSubmitting={createMutation.isPending}
                createdSecret={createdSecret}
                onSecretAcknowledged={closeCreate}
            />

            <WebhookDialog
                open={!!editingWebhook}
                onOpenChange={(open) => !open && setEditingWebhook(null)}
                title="Editar webhook"
                description="Atualize a configuração deste endpoint de notificação."
                form={editForm}
                onChange={setEditForm}
                onSubmit={handleEdit}
                submitLabel="Salvar alterações"
                isSubmitting={updateMutation.isPending}
            />
        </div>
    )
}
