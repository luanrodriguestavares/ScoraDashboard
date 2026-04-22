import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { rulesApi } from '@/services/api'
import { Slider } from '@/components/ui/slider'
import {
    Plus,
    Play,
    Pause,
    Trash2,
    Copy,
    MoreHorizontal,
    FlaskConical,
    Zap,
    AlertTriangle,
    CheckCircle,
    XCircle,
    GitBranch,
    Filter,
    ChevronRight,
    Beaker,
} from 'lucide-react'

interface RuleCondition {
    id: string
    field: string
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains' | 'in' | 'not_in'
    value: string | number | string[]
    logicalOperator?: 'AND' | 'OR'
}

interface RuleAction {
    type: 'block' | 'review' | 'allow' | 'tag'
    config?: Record<string, unknown>
}

interface Rule {
    id: string
    name: string
    description: string
    conditions: RuleCondition[]
    action: RuleAction
    priority: number
    enabled: boolean
    abTest?: {
        enabled: boolean
        variant: 'A' | 'B'
        trafficPercentage: number
    }
    stats: {
        triggered: number
        lastTriggered?: string
        impactedDecisions: number
    }
    createdAt: string
    updatedAt: string
}

const emptySimulationResults = {
    totalDecisions: 0,
    wouldTrigger: 0,
    breakdown: { allow: 0, review: 0, block: 0 },
    impactOnFalsePositives: 0,
    impactOnFalseNegatives: 0,
}

const PRIORITY_LEVELS = [
    { id: 'low', label: 'Baixa', value: 10, hint: 'Executada por último' },
    { id: 'medium', label: 'Média', value: 40, hint: 'Prioridade padrão' },
    { id: 'high', label: 'Alta', value: 70, hint: 'Alta precedência' },
    { id: 'critical', label: 'Crítica', value: 90, hint: 'Executada primeiro' },
] as const

function priorityToLevel(p: number): string {
    if (p >= 80) return 'critical'
    if (p >= 55) return 'high'
    if (p >= 25) return 'medium'
    return 'low'
}

type FieldType = 'score' | 'count' | 'boolean' | 'enum' | 'text'

interface FieldOption {
    value: string
    label: string
    description: string
    fieldType: FieldType
    min?: number
    max?: number
    step?: number
    hint?: string
    options?: Array<{ value: string; label: string }>
}

const fieldOptions: FieldOption[] = [
    {
        value: 'final_score',
        label: 'Nível de risco',
        description: 'Score calculado pelo motor (0 = sem risco, 1 = risco máximo)',
        fieldType: 'score',
        min: 0,
        max: 1,
        step: 0.01,
        hint: 'Deslize para definir o limiar de risco',
    },
    {
        value: 'validation_score',
        label: 'Qualidade do dado',
        description: 'Risco baseado na validade do formato submetido (0 a 1)',
        fieldType: 'score',
        min: 0,
        max: 1,
        step: 0.01,
        hint: 'Deslize para definir o limiar de qualidade',
    },
    {
        value: 'history_score',
        label: 'Risco histórico',
        description: 'Risco acumulado com base no histórico de uso deste valor (0 a 1)',
        fieldType: 'score',
        min: 0,
        max: 1,
        step: 0.01,
        hint: 'Deslize para definir o limiar histórico',
    },
    {
        value: 'velocity_score',
        label: 'Risco de velocidade',
        description: 'Risco calculado a partir da frequência de uso recente (0 a 1)',
        fieldType: 'score',
        min: 0,
        max: 1,
        step: 0.01,
        hint: 'Deslize para definir o limiar de velocidade',
    },
    {
        value: 'pattern_score',
        label: 'Risco de padrão',
        description: 'Risco baseado em padrões anômalos nos dados submetidos (0 a 1)',
        fieldType: 'score',
        min: 0,
        max: 1,
        step: 0.01,
        hint: 'Deslize para definir o limiar de padrão',
    },
    {
        value: 'graph_score',
        label: 'Risco de rede',
        description: 'Risco baseado nas conexões deste valor com outras entidades (0 a 1)',
        fieldType: 'score',
        min: 0,
        max: 1,
        step: 0.01,
        hint: 'Deslize para definir o limiar de rede',
    },
    {
        value: 'cluster_risk',
        label: 'Risco do grupo',
        description: 'Score médio de risco do grupo de identidades conectadas (0 a 1)',
        fieldType: 'score',
        min: 0,
        max: 1,
        step: 0.01,
        hint: 'Deslize para definir o limiar de risco do grupo',
    },
    {
        value: 'account_trust_score',
        label: 'Confiança acumulada',
        description: 'Score de confiança histórico desta conta (0 = baixa, 1 = alta)',
        fieldType: 'score',
        min: 0,
        max: 1,
        step: 0.01,
        hint: 'Deslize para definir o limiar de confiança',
    },
    {
        value: 'velocity_24h',
        label: 'Usos nas últimas 24h',
        description: 'Número de vezes que este valor foi submetido nas últimas 24 horas',
        fieldType: 'count',
        min: 0,
        max: 1000,
        step: 1,
        hint: 'Número inteiro — ex: 10 significa mais de 10 usos em 24h',
    },
    {
        value: 'distinct_accounts',
        label: 'Contas distintas',
        description: 'Quantidade de contas diferentes que já usaram este mesmo valor',
        fieldType: 'count',
        min: 0,
        max: 500,
        step: 1,
        hint: 'Número inteiro — ex: 3 significa usado em 3 contas diferentes',
    },
    {
        value: 'cluster_size',
        label: 'Tamanho do grupo',
        description: 'Número de entidades no grupo conectado no grafo de identidade',
        fieldType: 'count',
        min: 0,
        max: 1000,
        step: 1,
        hint: 'Número inteiro — ex: 5 significa 5 entidades conectadas',
    },
    {
        value: 'is_vpn',
        label: 'Acesso via VPN',
        description: 'Detectado quando o acesso é realizado através de VPN',
        fieldType: 'boolean',
    },
    {
        value: 'is_tor',
        label: 'Acesso via Tor',
        description: 'Detectado quando o acesso é realizado via rede Tor',
        fieldType: 'boolean',
    },
    {
        value: 'is_proxy',
        label: 'Acesso via proxy',
        description: 'Detectado quando o acesso passa por proxy anônimo',
        fieldType: 'boolean',
    },
    {
        value: 'validation_type',
        label: 'Tipo de dado',
        description: 'Tipo do valor validado',
        fieldType: 'enum',
        options: [
            { value: 'email', label: 'E-mail' },
            { value: 'cpf', label: 'CPF' },
            { value: 'cnpj', label: 'CNPJ' },
            { value: 'phone', label: 'Telefone' },
            { value: 'ip', label: 'Endereço IP' },
            { value: 'cnh', label: 'CNH' },
            { value: 'rg', label: 'RG' },
            { value: 'pis_pasep', label: 'PIS/PASEP' },
            { value: 'passport', label: 'Passaporte' },
            { value: 'creditcard', label: 'Cartão de crédito' },
        ],
    },
    {
        value: 'use_case',
        label: 'Caso de uso',
        description: 'Contexto declarado da validação',
        fieldType: 'enum',
        options: [
            { value: 'signup', label: 'Cadastro (signup)' },
            { value: 'login', label: 'Login' },
            { value: 'checkout', label: 'Checkout' },
            { value: 'kyc', label: 'Verificação de identidade (KYC)' },
            { value: 'update', label: 'Atualização de dados' },
            { value: 'recovery', label: 'Recuperação de conta' },
        ],
    },
    {
        value: 'geo_country',
        label: 'País de acesso',
        description: 'Código ISO do país detectado no acesso',
        fieldType: 'text',
        hint: 'Use o código de 2 letras — ex: BR, US, DE, AR',
    },
    {
        value: 'patterns',
        label: 'Padrões suspeitos',
        description: 'Flags de padrões anômalos identificados na análise',
        fieldType: 'text',
        hint: 'Ex: high_velocity, cross_account_reuse, tor_detected',
    },
]

const allOperatorOptions = [
    { value: '>', label: 'maior que', symbol: '>' },
    { value: '<', label: 'menor que', symbol: '<' },
    { value: '>=', label: 'maior ou igual a', symbol: '>=' },
    { value: '<=', label: 'menor ou igual a', symbol: '<=' },
    { value: '==', label: 'igual a', symbol: '==' },
    { value: '!=', label: 'diferente de', symbol: '!=' },
    { value: 'contains', label: 'contém', symbol: '∋' },
    { value: 'in', label: 'está na lista', symbol: 'in' },
    { value: 'not_in', label: 'não está na lista', symbol: '∉' },
]

function getOperatorsForField(fieldType: FieldType) {
    if (fieldType === 'boolean') return allOperatorOptions.filter((o) => ['==', '!='].includes(o.value))
    if (fieldType === 'score' || fieldType === 'count')
        return allOperatorOptions.filter((o) => ['>', '<', '>=', '<=', '==', '!='].includes(o.value))
    return allOperatorOptions.filter((o) => ['==', '!=', 'contains', 'in', 'not_in'].includes(o.value))
}

function getDefaultValueForField(fieldType: FieldType): string | number {
    if (fieldType === 'score') return 0.5
    if (fieldType === 'count') return 5
    if (fieldType === 'boolean') return 'true'
    return ''
}

const operatorOptions = allOperatorOptions

const actionOptions = [
    { value: 'block', label: 'Block', icon: XCircle, color: 'text-decision-block' },
    {
        value: 'review',
        label: 'Manual Review',
        icon: AlertTriangle,
        color: 'text-decision-review',
    },
    { value: 'allow', label: 'Allow', icon: CheckCircle, color: 'text-decision-allow' },
]

const RULE_TEMPLATES = [
    {
        label: 'Bloquear Alto Risco',
        description: 'Bloqueia automaticamente quando o risco calculado for crítico',
        conditions: [{ id: 'c1', field: 'final_score', operator: '>=', value: 0.85 }],
        action: 'block' as const,
        priority: 90,
    },
    {
        label: 'Revisar VPN + Risco Médio',
        description: 'Envia para revisão quando há VPN com risco moderado',
        conditions: [
            { id: 'c1', field: 'is_vpn', operator: '==', value: 'true' },
            { id: 'c2', field: 'final_score', operator: '>=', value: 0.5, logicalOperator: 'AND' as const },
        ],
        action: 'review' as const,
        priority: 70,
    },
    {
        label: 'Bloquear Reuso Excessivo',
        description: 'Bloqueia quando o mesmo dado aparece em muitas contas distintas',
        conditions: [{ id: 'c1', field: 'distinct_accounts', operator: '>=', value: 5 }],
        action: 'block' as const,
        priority: 80,
    },
    {
        label: 'Revisar Alta Velocidade',
        description: 'Envia para revisão quando há volume atípico de uso em 24h',
        conditions: [{ id: 'c1', field: 'velocity_24h', operator: '>=', value: 20 }],
        action: 'review' as const,
        priority: 60,
    },
    {
        label: 'Bloquear Rede Suspeita',
        description: 'Bloqueia quando o grupo de identidades conectadas tem alto risco',
        conditions: [{ id: 'c1', field: 'cluster_risk', operator: '>=', value: 0.7 }],
        action: 'block' as const,
        priority: 85,
    },
    {
        label: 'Revisar Acesso via Tor',
        description: 'Revisa todos os acessos realizados via rede Tor',
        conditions: [{ id: 'c1', field: 'is_tor', operator: '==', value: 'true' }],
        action: 'review' as const,
        priority: 75,
    },
] satisfies Array<{
    label: string
    description: string
    conditions: RuleCondition[]
    action: RuleAction['type']
    priority: number
}>

const fieldLabelMap = Object.fromEntries(fieldOptions.map((f) => [f.value, f.label]))
const operatorLabelMap = Object.fromEntries(operatorOptions.map((o) => [o.value, o.label]))

function buildConditionPreview(conditions: RuleCondition[]): string {
    if (conditions.length === 0) return ''
    const parts = conditions.map((c, i) => {
        const field = fieldLabelMap[c.field] ?? c.field
        const op = operatorLabelMap[c.operator] ?? c.operator
        const val = String(c.value)
        const connector = i > 0 ? (c.logicalOperator === 'OR' ? ' OU ' : ' E ') : ''
        return `${connector}${field} for ${op} ${val}`
    })
    return `SE ${parts.join('')} → `
}

interface RuleCardProps {
    rule: Rule
    onToggle: (id: string) => void
    onEdit: (rule: Rule) => void
    onDelete: (id: string) => void
    onDuplicate: (rule: Rule) => void
    onSimulate: (rule: Rule) => void
}

function RuleCard({ rule, onToggle, onEdit, onDelete, onDuplicate, onSimulate }: RuleCardProps) {
    const { t } = useLanguage()
    const actionConfig = actionOptions.find((a) => a.value === rule.action.type)
    const ActionIcon = actionConfig?.icon || Zap

    return (
        <Card className={cn('transition-all', !rule.enabled && 'opacity-60')}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-muted-foreground">
                                {t.rules?.priority || 'Priority'} {rule.priority}
                            </span>
                            <Badge
                                variant={rule.enabled ? 'default' : 'secondary'}
                                className="text-xs"
                            >
                                {rule.enabled
                                    ? t.rules?.active || 'Active'
                                    : t.rules?.disabled || 'Disabled'}
                            </Badge>
                            {rule.abTest?.enabled && (
                                <Badge variant="outline" className="text-xs gap-1">
                                    <Beaker className="h-3 w-3" />
                                    A/B Test ({rule.abTest.trafficPercentage}%)
                                </Badge>
                            )}
                        </div>

                        <h4 className="font-semibold truncate">{rule.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                            {rule.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mt-3">
                            <div className="flex items-center gap-1 text-xs bg-secondary/50 rounded px-2 py-1">
                                <Filter className="h-3 w-3" />
                                <span>
                                    {rule.conditions.length} {t.rules?.condition || 'condition'}
                                    {rule.conditions.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            <div
                                className={cn(
                                    'flex items-center gap-1 text-xs rounded px-2 py-1',
                                    rule.action.type === 'block' &&
                                        'bg-decision-block/10 text-decision-block',
                                    rule.action.type === 'review' &&
                                        'bg-decision-review/10 text-decision-review',
                                    rule.action.type === 'allow' &&
                                        'bg-decision-allow/10 text-decision-allow'
                                )}
                            >
                                <ActionIcon className="h-3 w-3" />
                                <span className="capitalize">{rule.action.type}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span>
                                {t.rules?.triggered || 'Triggered'}{' '}
                                {rule.stats.triggered.toLocaleString()}–
                            </span>
                            {rule.stats.lastTriggered && (
                                <span>
                                    {t.rules?.last || 'Last'}:{' '}
                                    {new Date(rule.stats.lastTriggered).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Switch checked={rule.enabled} onCheckedChange={() => onToggle(rule.id)} />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(rule)}>
                                    {t.rules?.editRule || 'Edit Rule'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDuplicate(rule)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    {t.rules?.duplicate || 'Duplicate'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onSimulate(rule)}>
                                    <FlaskConical className="h-4 w-4 mr-2" />
                                    {t.rules?.simulate || 'Simulate'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onDelete(rule.id)}
                                    className="text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {t.rules?.delete || 'Delete'}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

interface ConditionBuilderProps {
    conditions: RuleCondition[]
    onChange: (conditions: RuleCondition[]) => void
}

function ConditionBuilder({ conditions, onChange }: ConditionBuilderProps) {
    const { t } = useLanguage()

    const addCondition = () => {
        const newCondition: RuleCondition = {
            id: `c${Date.now()}`,
            field: 'final_score',
            operator: '>=',
            value: 0.5,
            logicalOperator: conditions.length > 0 ? 'AND' : undefined,
        }
        onChange([...conditions, newCondition])
    }

    const updateCondition = (id: string, updates: Partial<RuleCondition>) => {
        onChange(conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)))
    }

    const removeCondition = (id: string) => {
        const updated = conditions.filter((c) => c.id !== id)
        if (updated.length > 0 && updated[0].logicalOperator) {
            updated[0] = { ...updated[0], logicalOperator: undefined }
        }
        onChange(updated)
    }

    const handleFieldChange = (conditionId: string, fieldValue: string) => {
        const fieldMeta = fieldOptions.find((f) => f.value === fieldValue)
        if (!fieldMeta) return
        const availableOps = getOperatorsForField(fieldMeta.fieldType)
        const defaultOp = availableOps[0].value as RuleCondition['operator']
        const defaultVal = getDefaultValueForField(fieldMeta.fieldType)
        updateCondition(conditionId, { field: fieldValue, operator: defaultOp, value: defaultVal })
    }

    const preview = buildConditionPreview(conditions)

    return (
        <div className="space-y-4">
            {conditions.map((condition, index) => {
                const fieldMeta = fieldOptions.find((f) => f.value === condition.field)
                const availableOps = fieldMeta
                    ? getOperatorsForField(fieldMeta.fieldType)
                    : allOperatorOptions
                const currentValue = Number(condition.value)
                const numValue = isNaN(currentValue) ? 0 : currentValue

                return (
                    <div key={condition.id} className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            {index > 0 && (
                                <Select
                                    value={condition.logicalOperator || 'AND'}
                                    onValueChange={(v) =>
                                        updateCondition(condition.id, {
                                            logicalOperator: v as 'AND' | 'OR',
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-20 h-8 text-xs">
                                        <SelectValue placeholder="E / OU" />
                                    </SelectTrigger>
                                    <SelectContent side="bottom" align="start">
                                        <SelectItem value="AND">E</SelectItem>
                                        <SelectItem value="OR">OU</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}

                            <Select
                                value={condition.field || ''}
                                onValueChange={(v) => handleFieldChange(condition.id, v)}
                            >
                                <SelectTrigger className="w-52 h-8 text-xs">
                                    <SelectValue placeholder="Escolha um campo..." />
                                </SelectTrigger>
                                <SelectContent side="bottom" align="start">
                                    {fieldOptions.map((f) => (
                                        <SelectItem key={f.value} value={f.value}>
                                            {f.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={condition.operator || '=='}
                                onValueChange={(v) =>
                                    updateCondition(condition.id, {
                                        operator: v as RuleCondition['operator'],
                                    })
                                }
                            >
                                <SelectTrigger className="w-40 h-8 text-xs">
                                    <SelectValue placeholder="Condição" />
                                </SelectTrigger>
                                <SelectContent side="bottom" align="start">
                                    {availableOps.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>
                                            <span className="flex items-center gap-2">
                                                <span className="font-mono text-xs text-muted-foreground w-6">
                                                    {o.symbol}
                                                </span>
                                                {o.label}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCondition(condition.id)}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive ml-auto"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Value input — adaptive by field type */}
                        {fieldMeta?.fieldType === 'score' && (
                            <div className="space-y-2 px-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">{fieldMeta.hint}</p>
                                    <span className="text-sm font-semibold tabular-nums text-primary min-w-[3rem] text-right">
                                        {numValue.toFixed(2)}
                                        <span className="text-xs text-muted-foreground ml-1">
                                            ({Math.round(numValue * 100)}%)
                                        </span>
                                    </span>
                                </div>
                                <Slider
                                    value={[numValue]}
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    onValueChange={([v]) =>
                                        updateCondition(condition.id, { value: v })
                                    }
                                    className="w-full"
                                />
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>0 — sem risco</span>
                                    <span>1 — risco máximo</span>
                                </div>
                            </div>
                        )}

                        {fieldMeta?.fieldType === 'count' && (
                            <div className="space-y-1.5">
                                <p className="text-xs text-muted-foreground px-1">{fieldMeta.hint}</p>
                                <Input
                                    type="number"
                                    value={String(condition.value)}
                                    min={fieldMeta.min ?? 0}
                                    max={fieldMeta.max}
                                    step={fieldMeta.step ?? 1}
                                    onChange={(e) => {
                                        const v = parseInt(e.target.value, 10)
                                        if (!isNaN(v) && v >= 0)
                                            updateCondition(condition.id, { value: v })
                                    }}
                                    className="h-8 text-sm"
                                    placeholder={`Número inteiro (mín ${fieldMeta.min ?? 0})`}
                                />
                            </div>
                        )}

                        {fieldMeta?.fieldType === 'boolean' && (
                            <Select
                                value={String(condition.value)}
                                onValueChange={(v) => updateCondition(condition.id, { value: v })}
                            >
                                <SelectTrigger className="h-8 text-sm">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent side="bottom" align="start">
                                    <SelectItem value="true">
                                        <span className="flex items-center gap-2">
                                            <span className="text-emerald-500 font-medium">Sim</span>
                                            <span className="text-muted-foreground text-xs">— detectado</span>
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="false">
                                        <span className="flex items-center gap-2">
                                            <span className="text-muted-foreground font-medium">Não</span>
                                            <span className="text-muted-foreground text-xs">— não detectado</span>
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}

                        {fieldMeta?.fieldType === 'enum' && fieldMeta.options && (
                            <Select
                                value={String(condition.value)}
                                onValueChange={(v) => updateCondition(condition.id, { value: v })}
                            >
                                <SelectTrigger className="h-8 text-sm">
                                    <SelectValue placeholder="Selecione uma opção..." />
                                </SelectTrigger>
                                <SelectContent side="bottom" align="start">
                                    {fieldMeta.options.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {(fieldMeta?.fieldType === 'text' || !fieldMeta) && (
                            <div className="space-y-1.5">
                                {fieldMeta?.hint && (
                                    <p className="text-xs text-muted-foreground px-1">
                                        {fieldMeta.hint}
                                    </p>
                                )}
                                <Input
                                    value={String(condition.value)}
                                    onChange={(e) =>
                                        updateCondition(condition.id, { value: e.target.value })
                                    }
                                    className="h-8 text-sm"
                                    placeholder="Digite o valor..."
                                />
                            </div>
                        )}
                    </div>
                )
            })}

            <Button variant="outline" size="sm" onClick={addCondition}>
                <Plus className="h-4 w-4 mr-1" />
                {t.rules.addCondition}
            </Button>

            {preview && (
                <div className="rounded-lg bg-muted/40 border border-border/60 px-3 py-2 mt-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                        Leitura da regra
                    </p>
                    <p className="text-xs text-foreground leading-relaxed font-medium">
                        {preview}
                        <span className="text-muted-foreground font-normal">ação definida abaixo</span>
                    </p>
                </div>
            )}
        </div>
    )
}

interface SimulationResultsProps {
    results: typeof emptySimulationResults
    onClose: () => void
}

function SimulationResults({ results, onClose }: SimulationResultsProps) {
    const { t } = useLanguage()
    const triggerRate =
        results.totalDecisions > 0
            ? ((results.wouldTrigger / results.totalDecisions) * 100).toFixed(1)
            : '0.0'

    const fp = results.impactOnFalsePositives
    const fn = results.impactOnFalseNegatives
    const interpretation =
        fp <= 0 && fn <= 0
            ? {
                  color: 'text-decision-allow',
                  bg: 'bg-decision-allow/10 border-decision-allow/20',
                  text: 'Esta regra melhora ambas as métricas: menos bloqueios indevidos e menos fraudes passando.',
              }
            : fp < 0
              ? {
                    color: 'text-amber-500',
                    bg: 'bg-amber-500/10 border-amber-500/20',
                    text: 'Esta regra reduz bloqueios indevidos, mas pode deixar mais fraudes passarem. Avalie o tradeoff.',
                }
              : fn < 0
                ? {
                      color: 'text-amber-500',
                      bg: 'bg-amber-500/10 border-amber-500/20',
                      text: 'Esta regra captura mais fraudes, mas pode bloquear mais usuários legítimos. Avalie o tradeoff.',
                  }
                : {
                      color: 'text-decision-block',
                      bg: 'bg-decision-block/10 border-decision-block/20',
                      text: 'Esta regra piora ambas as métricas. Revise as condições antes de ativar.',
                  }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Decisões analisadas</p>
                        <p className="text-2xl font-bold">
                            {results.totalDecisions.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">últimos 30 dias</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Seriam afetadas</p>
                        <p className="text-2xl font-bold text-primary">
                            {results.wouldTrigger.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">{triggerRate}% do total</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Distribuição de decisões</CardTitle>
                    <CardDescription className="text-xs">
                        Como ficariam as decisões se a regra estivesse ativa
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-decision-allow">Aprovadas</span>
                            <span className="font-mono text-sm">
                                {results.breakdown.allow.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-decision-review">Para revisão</span>
                            <span className="font-mono text-sm">
                                {results.breakdown.review.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-decision-block">Bloqueadas</span>
                            <span className="font-mono text-sm">
                                {results.breakdown.block.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Impacto estimado na precisão</CardTitle>
                    <CardDescription className="text-xs">
                        Variação esperada em relação ao comportamento atual do motor
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <p className="text-sm font-medium">Usuários legítimos bloqueados</p>
                                <p className="text-xs text-muted-foreground">
                                    Bloqueios indevidos — pessoas reais que seriam barradas
                                </p>
                            </div>
                            <span
                                className={cn(
                                    'font-mono text-sm font-semibold shrink-0',
                                    fp < 0 ? 'text-decision-allow' : 'text-decision-block'
                                )}
                            >
                                {fp > 0 ? '+' : ''}
                                {fp}%
                            </span>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <p className="text-sm font-medium">Fraudes não detectadas</p>
                                <p className="text-xs text-muted-foreground">
                                    Fraudes que passariam sem detecção com esta regra
                                </p>
                            </div>
                            <span
                                className={cn(
                                    'font-mono text-sm font-semibold shrink-0',
                                    fn < 0 ? 'text-decision-allow' : 'text-decision-block'
                                )}
                            >
                                {fn > 0 ? '+' : ''}
                                {fn}%
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className={cn('rounded-lg border px-3 py-2.5', interpretation.bg)}>
                <p className={cn('text-xs font-medium', interpretation.color)}>
                    {interpretation.text}
                </p>
            </div>

            <div className="flex justify-end">
                <Button onClick={onClose}>{t.commandPalette?.close || 'Fechar'}</Button>
            </div>
        </div>
    )
}

export function RulesEnginePage() {
    const { t } = useLanguage()
    const queryClient = useQueryClient()
    const rulesQuery = useQuery({ queryKey: ['rules'], queryFn: rulesApi.getAll })
    const rules = (rulesQuery.data as Rule[]) || []
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isSimulateOpen, setIsSimulateOpen] = useState(false)
    const [simulationResults, setSimulationResults] = useState(emptySimulationResults)
    const [editingRule, setEditingRule] = useState<Rule | null>(null)
    const [filter, setFilter] = useState<'all' | 'active' | 'disabled' | 'ab_test'>('all')

    const [showTemplates, setShowTemplates] = useState(false)
    const [simContext, setSimContext] = useState<'create' | 'edit' | 'card'>('card')
    const [createSimResults, setCreateSimResults] = useState<typeof emptySimulationResults | null>(null)
    const [editSimResults, setEditSimResults] = useState<typeof emptySimulationResults | null>(null)
    const [newRuleName, setNewRuleName] = useState('')
    const [newRuleDescription, setNewRuleDescription] = useState('')
    const [newRuleConditions, setNewRuleConditions] = useState<RuleCondition[]>([
        { id: 'c1', field: 'final_score', operator: '>', value: 0.5 },
    ])
    const [newRuleAction, setNewRuleAction] = useState<RuleAction['type']>('review')
    const [newRulePriority, setNewRulePriority] = useState(5)
    const [enableAbTest, setEnableAbTest] = useState(false)
    const [abTestPercentage, setAbTestPercentage] = useState(50)
    const [editRuleName, setEditRuleName] = useState('')
    const [editRuleDescription, setEditRuleDescription] = useState('')
    const [editRuleConditions, setEditRuleConditions] = useState<RuleCondition[]>([])
    const [editRuleAction, setEditRuleAction] = useState<RuleAction['type']>('review')
    const [editRulePriority, setEditRulePriority] = useState(5)
    const [editEnableAbTest, setEditEnableAbTest] = useState(false)
    const [editAbTestPercentage, setEditAbTestPercentage] = useState(50)
    const createMutation = useMutation({
        mutationFn: (payload: any) => rulesApi.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules'] })
            setIsCreateOpen(false)
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: any }) => rulesApi.update(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules'] })
            setEditingRule(null)
        },
    })

    const activateMutation = useMutation({
        mutationFn: (id: string) => rulesApi.activate(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules'] }),
    })

    const deactivateMutation = useMutation({
        mutationFn: (id: string) => rulesApi.deactivate(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules'] }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => rulesApi.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rules'] }),
    })

    const simulateMutation = useMutation({
        mutationFn: (payload: any) => rulesApi.simulate(payload),
        onSuccess: (data) => {
            if (simContext === 'create') setCreateSimResults(data)
            else if (simContext === 'edit') setEditSimResults(data)
            else {
                setSimulationResults(data)
                setIsSimulateOpen(true)
            }
        },
    })

    useEffect(() => {
        if (!editingRule) return
        setEditRuleName(editingRule.name)
        setEditRuleDescription(editingRule.description)
        setEditRuleConditions(editingRule.conditions || [])
        setEditRuleAction(editingRule.action.type)
        setEditRulePriority(editingRule.priority)
        setEditEnableAbTest(!!editingRule.abTest?.enabled)
        setEditAbTestPercentage(editingRule.abTest?.trafficPercentage ?? 50)
    }, [editingRule])

    const filteredRules = rules
        .filter((rule) => {
            if (filter === 'all') return true
            if (filter === 'active') return rule.enabled
            if (filter === 'disabled') return !rule.enabled
            if (filter === 'ab_test') return rule.abTest?.enabled
            return true
        })
        .sort((a, b) => b.priority - a.priority)

    const handleApplyTemplate = (tpl: (typeof RULE_TEMPLATES)[number]) => {
        setNewRuleName(tpl.label)
        setNewRuleDescription(tpl.description)
        setNewRuleConditions(tpl.conditions)
        setNewRuleAction(tpl.action)
        setNewRulePriority(tpl.priority)
        setShowTemplates(false)
    }

    const handleToggle = (id: string) => {
        const rule = rules.find((r) => r.id === id)
        if (!rule) return
        if (rule.enabled) deactivateMutation.mutate(id)
        else activateMutation.mutate(id)
    }

    const handleDelete = (id: string) => {
        deleteMutation.mutate(id)
    }

    const buildSimulationPayload = (payload?: {
        id?: string
        name?: string
        description?: string
        conditions?: RuleCondition[]
        action?: RuleAction
        priority?: number
        enabled?: boolean
        abTest?: { enabled: boolean; variant: 'A' | 'B'; trafficPercentage: number }
    }) => {
        if (!payload?.conditions?.length || !payload.action) return {}
        return {
            id: payload.id,
            name: payload.name,
            description: payload.description,
            conditions: payload.conditions.map(({ field, operator, value, logicalOperator }) => ({
                field,
                operator,
                value,
                logicalOperator,
            })),
            action: payload.action,
            priority: payload.priority,
            enabled: payload.enabled,
            abTest: payload.abTest,
        }
    }

    const handleDuplicate = (rule: Rule) => {
        createMutation.mutate({
            name: `${rule.name} (Copy)`,
            description: rule.description,
            conditions: rule.conditions,
            action: rule.action,
            priority: rule.priority,
            enabled: false,
        })
    }

    const handleCreateRule = () => {
        createMutation.mutate({
            name: newRuleName,
            description: newRuleDescription,
            conditions: newRuleConditions,
            action: { type: newRuleAction },
            priority: newRulePriority,
            enabled: false,
            abTest: enableAbTest
                ? { enabled: true, variant: 'A', trafficPercentage: abTestPercentage }
                : undefined,
        })
        resetForm()
    }
    const resetForm = () => {
        setNewRuleName('')
        setNewRuleDescription('')
        setNewRuleConditions([{ id: 'c1', field: 'final_score', operator: '>', value: 0.5 }])
        setNewRuleAction('review')
        setNewRulePriority(5)
        setEnableAbTest(false)
        setAbTestPercentage(50)
    }

    const closeEditDialog = () => {
        setEditingRule(null)
    }

    const handleUpdateRule = () => {
        if (!editingRule) return
        updateMutation.mutate({
            id: editingRule.id,
            payload: {
                name: editRuleName,
                description: editRuleDescription,
                conditions: editRuleConditions,
                action: { type: editRuleAction },
                priority: editRulePriority,
                abTest: editEnableAbTest
                    ? {
                          enabled: true,
                          variant: editingRule.abTest?.variant ?? 'A',
                          trafficPercentage: editAbTestPercentage,
                      }
                    : undefined,
            },
        })
    }

    const activeRules = rules.filter((r) => r.enabled).length
    const totalTriggered = rules.reduce((sum, r) => sum + r.stats.triggered, 0)
    const abTestRules = rules.filter((r) => r.abTest?.enabled).length

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading font-bold">
                        {t.rules?.title || 'Rules Engine'}
                    </h2>
                    <p className="text-muted-foreground">
                        {t.rules?.subtitle || 'Create and manage custom risk rules'}
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            {t.rules?.createRule || 'Create Rule'}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 hover:scrollbar-thumb-muted-foreground/50">
                        <DialogHeader>
                            <DialogTitle>{t.rules?.newRule || 'Nova Regra'}</DialogTitle>
                            <DialogDescription>
                                {t.rules?.newRuleDescription ||
                                    'Defina condições e ações para sua regra de risco'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="border rounded-lg overflow-hidden">
                            <button
                                type="button"
                                className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors text-left"
                                onClick={() => setShowTemplates((v) => !v)}
                            >
                                <span className="flex items-center gap-2">
                                    <FlaskConical className="h-4 w-4 text-muted-foreground" />
                                    Começar com um template pronto
                                </span>
                                <ChevronRight
                                    className={cn(
                                        'h-4 w-4 text-muted-foreground transition-transform',
                                        showTemplates && 'rotate-90'
                                    )}
                                />
                            </button>
                            {showTemplates && (
                                <div className="border-t divide-y">
                                    {RULE_TEMPLATES.map((tpl) => {
                                        const actionCfg = actionOptions.find(
                                            (a) => a.value === tpl.action
                                        )
                                        const ActionIcon = actionCfg?.icon ?? Zap
                                        return (
                                            <button
                                                key={tpl.label}
                                                type="button"
                                                className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors text-left"
                                                onClick={() => handleApplyTemplate(tpl)}
                                            >
                                                <ActionIcon
                                                    className={cn(
                                                        'h-4 w-4 mt-0.5 shrink-0',
                                                        actionCfg?.color ?? 'text-muted-foreground'
                                                    )}
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium">
                                                        {tpl.label}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {tpl.description}
                                                    </p>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 py-4">
                            {/* Nome + Prioridade lado a lado */}
                            <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Nome</label>
                                    <Input
                                        value={newRuleName}
                                        onChange={(e) => setNewRuleName(e.target.value)}
                                        placeholder="Ex: Bloquear Alto Risco com VPN"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Prioridade</label>
                                    <div className="flex gap-1.5">
                                        {PRIORITY_LEVELS.map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => setNewRulePriority(p.value)}
                                                className={cn(
                                                    'px-2.5 py-1.5 rounded-md border text-xs transition-colors min-w-[56px] text-center',
                                                    priorityToLevel(newRulePriority) === p.id
                                                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                                                        : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                                                )}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {PRIORITY_LEVELS.find(
                                            (p) => p.id === priorityToLevel(newRulePriority)
                                        )?.hint}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Descrição</label>
                                <Input
                                    value={newRuleDescription}
                                    onChange={(e) => setNewRuleDescription(e.target.value)}
                                    placeholder="Descreva o que esta regra faz..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Condições (SE)</label>
                                <ConditionBuilder
                                    conditions={newRuleConditions}
                                    onChange={setNewRuleConditions}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Ação (ENTÃO)</label>
                                <p className="text-xs text-muted-foreground">
                                    Regras decidem entre permitir, bloquear ou enviar para revisão
                                    manual. Webhooks são configurados na página de Webhooks.
                                    Escalonamento é uma ação humana da Review Queue.
                                </p>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {actionOptions.map((a) => (
                                        <button
                                            key={a.value}
                                            type="button"
                                            onClick={() => setNewRuleAction(a.value as RuleAction['type'])}
                                            className={cn(
                                                'flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg border text-xs transition-colors',
                                                newRuleAction === a.value
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                                            )}
                                        >
                                            <a.icon className={cn('h-4 w-4', newRuleAction === a.value ? a.color : '')} />
                                            <span className={newRuleAction === a.value ? 'font-semibold text-foreground' : ''}>
                                                {a.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="border rounded-lg p-3 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-sm font-medium">Teste A/B</label>
                                        <p className="text-xs text-muted-foreground">
                                            Aplica a regra em apenas uma parte do tráfego
                                        </p>
                                    </div>
                                    <Switch
                                        checked={enableAbTest}
                                        onCheckedChange={setEnableAbTest}
                                    />
                                </div>
                                {enableAbTest && (
                                    <div className="flex items-center gap-3">
                                        <label className="text-sm text-muted-foreground shrink-0">
                                            % do tráfego
                                        </label>
                                        <Input
                                            type="number"
                                            value={abTestPercentage}
                                            onChange={(e) =>
                                                setAbTestPercentage(Number(e.target.value))
                                            }
                                            min={1}
                                            max={99}
                                            className="w-24 h-8"
                                        />
                                        <span className="text-sm text-muted-foreground">%</span>
                                    </div>
                                )}
                            </div>

                            {/* Simulação inline — sem Dialog aninhado */}
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs"
                                        disabled={simulateMutation.isPending}
                                        onClick={() => {
                                            setSimContext('create')
                                            setCreateSimResults(null)
                                            simulateMutation.mutate({})
                                        }}
                                    >
                                        <FlaskConical className="h-3.5 w-3.5 mr-1.5" />
                                        Simular baseline (30d)
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs"
                                        disabled={newRuleConditions.length === 0 || simulateMutation.isPending}
                                        onClick={() => {
                                            setSimContext('create')
                                            setCreateSimResults(null)
                                            simulateMutation.mutate(
                                                buildSimulationPayload({
                                                    name: newRuleName || 'Nova Regra',
                                                    description: newRuleDescription,
                                                    conditions: newRuleConditions,
                                                    action: { type: newRuleAction },
                                                    priority: newRulePriority,
                                                    enabled: true,
                                                    abTest: enableAbTest
                                                        ? { enabled: true, variant: 'A', trafficPercentage: abTestPercentage }
                                                        : undefined,
                                                })
                                            )
                                        }}
                                    >
                                        <FlaskConical className="h-3.5 w-3.5 mr-1.5" />
                                        Simular esta regra
                                    </Button>
                                </div>
                                {createSimResults && (
                                    <div className="border rounded-lg overflow-hidden">
                                        <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b">
                                            <p className="text-xs font-medium">Resultado da simulação</p>
                                            <button
                                                type="button"
                                                onClick={() => setCreateSimResults(null)}
                                                className="text-muted-foreground hover:text-foreground text-xs"
                                            >
                                                Fechar
                                            </button>
                                        </div>
                                        <div className="p-3">
                                            <SimulationResults
                                                results={createSimResults}
                                                onClose={() => setCreateSimResults(null)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setCreateSimResults(null) }}>
                                {t.common?.cancel || 'Cancelar'}
                            </Button>
                            <Button
                                onClick={handleCreateRule}
                                disabled={!newRuleName || newRuleConditions.length === 0}
                            >
                                {t.rules?.createRule || 'Criar Regra'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <GitBranch className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {t.rules?.totalRules || 'Total Rules'}
                                </p>
                                <p className="text-2xl font-bold">{rules.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-decision-allow/10 flex items-center justify-center">
                                <Play className="h-5 w-5 text-decision-allow" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {t.rules?.activeRules || 'Active Rules'}
                                </p>
                                <p className="text-2xl font-bold">{activeRules}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <Beaker className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {t.rules?.abTests || 'A/B Tests'}
                                </p>
                                <p className="text-2xl font-bold">{abTestRules}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Zap className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {t.rules?.totalTriggered || 'Total Triggered'}
                                </p>
                                <p className="text-2xl font-bold">
                                    {totalTriggered.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <TabsList>
                    <TabsTrigger value="all">
                        {t.rules?.allRules || 'Todas'} ({rules.length})
                    </TabsTrigger>
                    <TabsTrigger value="active">
                        {t.rules?.activeRules || 'Ativas'} ({activeRules})
                    </TabsTrigger>
                    <TabsTrigger value="disabled">
                        {t.rules?.disabled || 'Desativadas'} ({rules.length - activeRules})
                    </TabsTrigger>
                    <TabsTrigger value="ab_test">
                        {t.rules?.withAbTest || 'Teste A/B'} ({abTestRules})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={filter} className="mt-4">
                    <div className="space-y-3">
                        {filteredRules.length === 0 ? (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">
                                        {t.rules?.noRulesFound || 'No rules found'}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredRules.map((rule) => (
                                <RuleCard
                                    key={rule.id}
                                    rule={rule}
                                    onToggle={handleToggle}
                                    onEdit={setEditingRule}
                                    onDelete={handleDelete}
                                    onDuplicate={handleDuplicate}
                                    onSimulate={(currentRule) => {
                                        setSimContext('card')
                                        simulateMutation.mutate(
                                            buildSimulationPayload({
                                                id: currentRule.id,
                                                name: currentRule.name,
                                                description: currentRule.description,
                                                conditions: currentRule.conditions,
                                                action: currentRule.action,
                                                priority: currentRule.priority,
                                                enabled: currentRule.enabled,
                                                abTest: currentRule.abTest,
                                            })
                                        )
                                    }}
                                />
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={!!editingRule} onOpenChange={(open) => !open && closeEditDialog()}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 hover:scrollbar-thumb-muted-foreground/50">
                    <DialogHeader>
                        <DialogTitle>{t.rules?.editRule || 'Editar Regra'}</DialogTitle>
                        <DialogDescription>
                            {t.rules?.newRuleDescription ||
                                'Defina condições e ações para sua regra'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-[1fr_auto] gap-4 items-start">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Nome</label>
                                <Input
                                    value={editRuleName}
                                    onChange={(e) => setEditRuleName(e.target.value)}
                                    placeholder="Ex: Bloquear Alto Risco com VPN"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Prioridade</label>
                                <div className="flex gap-1.5">
                                    {PRIORITY_LEVELS.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setEditRulePriority(p.value)}
                                            className={cn(
                                                'px-2.5 py-1.5 rounded-md border text-xs transition-colors min-w-[56px] text-center',
                                                priorityToLevel(editRulePriority) === p.id
                                                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                                                    : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                                            )}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {PRIORITY_LEVELS.find(
                                        (p) => p.id === priorityToLevel(editRulePriority)
                                    )?.hint}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Descrição</label>
                            <Input
                                value={editRuleDescription}
                                onChange={(e) => setEditRuleDescription(e.target.value)}
                                placeholder="Descreva o que esta regra faz..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Condições (SE)</label>
                            <ConditionBuilder
                                conditions={editRuleConditions}
                                onChange={setEditRuleConditions}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Ação (ENTÃO)</label>
                            <p className="text-xs text-muted-foreground">
                                Regras decidem entre permitir, bloquear ou enviar para revisão
                                manual. Webhooks são configurados na página de Webhooks.
                                Escalonamento é uma ação humana da Review Queue.
                            </p>
                            <div className="grid grid-cols-3 gap-1.5">
                                {actionOptions.map((a) => (
                                    <button
                                        key={a.value}
                                        type="button"
                                        onClick={() => setEditRuleAction(a.value as RuleAction['type'])}
                                        className={cn(
                                            'flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg border text-xs transition-colors',
                                            editRuleAction === a.value
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                                        )}
                                    >
                                        <a.icon className={cn('h-4 w-4', editRuleAction === a.value ? a.color : '')} />
                                        <span className={editRuleAction === a.value ? 'font-semibold text-foreground' : ''}>
                                            {a.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="border rounded-lg p-3 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium">Teste A/B</label>
                                    <p className="text-xs text-muted-foreground">
                                        Aplica a regra em apenas uma parte do tráfego
                                    </p>
                                </div>
                                <Switch
                                    checked={editEnableAbTest}
                                    onCheckedChange={setEditEnableAbTest}
                                />
                            </div>
                            {editEnableAbTest && (
                                <div className="flex items-center gap-3">
                                    <label className="text-sm text-muted-foreground shrink-0">
                                        % do tráfego
                                    </label>
                                    <Input
                                        type="number"
                                        value={editAbTestPercentage}
                                        onChange={(e) =>
                                            setEditAbTestPercentage(Number(e.target.value))
                                        }
                                        min={1}
                                        max={99}
                                        className="w-24 h-8"
                                    />
                                    <span className="text-sm text-muted-foreground">%</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    disabled={simulateMutation.isPending}
                                    onClick={() => {
                                        setSimContext('edit')
                                        setEditSimResults(null)
                                        simulateMutation.mutate({})
                                    }}
                                >
                                    <FlaskConical className="h-3.5 w-3.5 mr-1.5" />
                                    Simular baseline (30d)
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    disabled={editRuleConditions.length === 0 || simulateMutation.isPending}
                                    onClick={() => {
                                        setSimContext('edit')
                                        setEditSimResults(null)
                                        simulateMutation.mutate(
                                            buildSimulationPayload({
                                                id: editingRule?.id,
                                                name: editRuleName,
                                                description: editRuleDescription,
                                                conditions: editRuleConditions,
                                                action: { type: editRuleAction },
                                                priority: editRulePriority,
                                                enabled: true,
                                                abTest: editEnableAbTest
                                                    ? { enabled: true, variant: editingRule?.abTest?.variant ?? 'A', trafficPercentage: editAbTestPercentage }
                                                    : undefined,
                                            })
                                        )
                                    }}
                                >
                                    <FlaskConical className="h-3.5 w-3.5 mr-1.5" />
                                    Simular esta regra
                                </Button>
                            </div>
                            {editSimResults && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b">
                                        <p className="text-xs font-medium">Resultado da simulação</p>
                                        <button
                                            type="button"
                                            onClick={() => setEditSimResults(null)}
                                            className="text-muted-foreground hover:text-foreground text-xs"
                                        >
                                            Fechar
                                        </button>
                                    </div>
                                    <div className="p-3">
                                        <SimulationResults
                                            results={editSimResults}
                                            onClose={() => setEditSimResults(null)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => { closeEditDialog(); setEditSimResults(null) }}>
                            {t.common?.cancel || 'Cancelar'}
                        </Button>
                        <Button
                            onClick={handleUpdateRule}
                            disabled={!editRuleName || editRuleConditions.length === 0}
                        >
                            {t.common?.save || 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Simulation Dialog */}
            <Dialog open={isSimulateOpen} onOpenChange={setIsSimulateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {t.rules?.simulationResults || 'Simulation Results'}
                        </DialogTitle>
                        <DialogDescription>
                            Simulação baseada nos últimos 30 dias de decisões.
                        </DialogDescription>
                    </DialogHeader>
                    <SimulationResults
                        results={simulationResults}
                        onClose={() => setIsSimulateOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
