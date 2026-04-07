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
import {
    Plus,
    Play,
    Pause,
    Trash2,
    Copy,
    MoreHorizontal,
    FlaskConical,
    ArrowUpDown,
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
    type: 'block' | 'review' | 'allow' | 'escalate' | 'webhook' | 'tag'
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

const fieldOptions = [
    { value: 'final_score', label: 'Final Score' },
    { value: 'validation_score', label: 'Validation Score' },
    { value: 'history_score', label: 'History Score' },
    { value: 'pattern_score', label: 'Pattern Score' },
    { value: 'graph_score', label: 'Graph Score' },
    { value: 'patterns', label: 'Patterns Detected' },
    { value: 'is_vpn', label: 'Is VPN' },
    { value: 'is_tor', label: 'Is Tor' },
    { value: 'is_proxy', label: 'Is Proxy' },
    { value: 'cluster_size', label: 'Cluster Size' },
    { value: 'cluster_risk', label: 'Cluster Risk' },
    { value: 'account_trust_score', label: 'Account Trust Score' },
    { value: 'velocity_24h', label: 'Velocity (24h)' },
    { value: 'distinct_accounts', label: 'Distinct Accounts' },
    { value: 'validation_type', label: 'Validation Type' },
    { value: 'geo_country', label: 'Country' },
]

const operatorOptions = [
    { value: '>', label: '>' },
    { value: '<', label: '<' },
    { value: '>=', label: '>=' },
    { value: '<=', label: '<=' },
    { value: '==', label: '==' },
    { value: '!=', label: '!=' },
    { value: 'contains', label: 'contains' },
    { value: 'in', label: 'in' },
    { value: 'not_in', label: 'not in' },
]

const actionOptions = [
    { value: 'block', label: 'Block', icon: XCircle, color: 'text-decision-block' },
    { value: 'review', label: 'Review', icon: AlertTriangle, color: 'text-decision-review' },
    { value: 'allow', label: 'Allow', icon: CheckCircle, color: 'text-decision-allow' },
    { value: 'escalate', label: 'Escalate', icon: ArrowUpDown, color: 'text-purple-500' },
    { value: 'webhook', label: 'Webhook', icon: Zap, color: 'text-blue-500' },
]

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
                                        'bg-decision-allow/10 text-decision-allow',
                                    rule.action.type === 'escalate' &&
                                        'bg-purple-500/10 text-purple-500',
                                    rule.action.type === 'webhook' && 'bg-blue-500/10 text-blue-500'
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
            operator: '>',
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

    return (
        <div className="space-y-3">
            {conditions.map((condition, index) => (
                <div key={condition.id} className="flex items-center gap-2">
                    {index > 0 && (
                        <Select
                            value={condition.logicalOperator || 'AND'}
                            onValueChange={(v) =>
                                updateCondition(condition.id, {
                                    logicalOperator: v as 'AND' | 'OR',
                                })
                            }
                        >
                            <SelectTrigger className="w-20">
                                <SelectValue placeholder="Operador" />
                            </SelectTrigger>
                            <SelectContent side="bottom" align="start">
                                <SelectItem value="AND">AND</SelectItem>
                                <SelectItem value="OR">OR</SelectItem>
                            </SelectContent>
                        </Select>
                    )}

                    <Select
                        value={condition.field || ''}
                        onValueChange={(v) => updateCondition(condition.id, { field: v })}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Campo" />
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
                        <SelectTrigger className="w-24">
                            <SelectValue placeholder="Op." />
                        </SelectTrigger>
                        <SelectContent side="bottom" align="start">
                            {operatorOptions.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Input
                        value={String(condition.value)}
                        onChange={(e) =>
                            updateCondition(condition.id, {
                                value: isNaN(Number(e.target.value))
                                    ? e.target.value
                                    : Number(e.target.value),
                            })
                        }
                        className="w-32"
                        placeholder="Valor"
                    />

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCondition(condition.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}

            <Button variant="outline" size="sm" onClick={addCondition}>
                <Plus className="h-4 w-4 mr-1" />
                {t.rules.addCondition}
            </Button>
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
            ? ((results.wouldTrigger / results.totalDecisions) * 100).toFixed(2)
            : '0.00'
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">
                            {t.rules?.totalDecisionsAnalyzed || 'Total Decisions Analyzed'}
                        </p>
                        <p className="text-2xl font-bold">
                            {results.totalDecisions.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">
                            {t.rules?.wouldTrigger || 'Would Trigger'}
                        </p>
                        <p className="text-2xl font-bold text-primary">
                            {results.wouldTrigger.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {triggerRate}% {t.rules?.ofDecisions || 'of decisions'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                        {t.rules?.impactBreakdown || 'Impact Breakdown'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">{t.overview?.allow || 'Allow'}</span>
                            <span className="font-mono">
                                {results.breakdown.allow.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">{t.overview?.review || 'Review'}</span>
                            <span className="font-mono">
                                {results.breakdown.review.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">{t.overview?.block || 'Block'}</span>
                            <span className="font-mono">
                                {results.breakdown.block.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                        {t.rules?.estimatedImpact || 'Estimated Impact on Metrics'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">
                                {t.rules?.falsePositives || 'False Positives'}
                            </span>
                            <span
                                className={cn(
                                    'font-mono',
                                    results.impactOnFalsePositives < 0
                                        ? 'text-decision-allow'
                                        : 'text-decision-block'
                                )}
                            >
                                {results.impactOnFalsePositives > 0 ? '+' : ''}
                                {results.impactOnFalsePositives}%
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">
                                {t.rules?.falseNegatives || 'False Negatives'}
                            </span>
                            <span
                                className={cn(
                                    'font-mono',
                                    results.impactOnFalseNegatives < 0
                                        ? 'text-decision-allow'
                                        : 'text-decision-block'
                                )}
                            >
                                {results.impactOnFalseNegatives > 0 ? '+' : ''}
                                {results.impactOnFalseNegatives}%
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={onClose}>{t.commandPalette?.close || 'Close'}</Button>
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
            setSimulationResults(data)
            setIsSimulateOpen(true)
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
                            <DialogTitle>{t.rules?.newRule || 'New Rule'}</DialogTitle>
                            <DialogDescription>
                                {t.rules?.newRuleDescription ||
                                    'Define conditions and actions for your rule'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    {t.rules?.name || 'Nome'}
                                </label>
                                <Input
                                    value={newRuleName}
                                    onChange={(e) => setNewRuleName(e.target.value)}
                                    placeholder="Ex: Bloqueio de Alto Risco"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    {t.rules?.name || 'Descrição'}
                                </label>
                                <Input
                                    value={newRuleDescription}
                                    onChange={(e) => setNewRuleDescription(e.target.value)}
                                    placeholder="Descreva o que esta regra faz..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    {t.rules?.priority || 'Prioridade'} (maior = maior prioridade)
                                </label>
                                <Input
                                    type="number"
                                    value={newRulePriority}
                                    onChange={(e) => setNewRulePriority(Number(e.target.value))}
                                    min={0}
                                    max={100}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    {t.rules?.conditions || 'Condições'} (SE)
                                </label>
                                <ConditionBuilder
                                    conditions={newRuleConditions}
                                    onChange={setNewRuleConditions}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    {t.rules?.actions || 'Ações (ENTÃO)'}
                                </label>
                                <Select
                                    value={newRuleAction || ''}
                                    onValueChange={(v) => setNewRuleAction(v as RuleAction['type'])}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma ação" />
                                    </SelectTrigger>
                                    <SelectContent side="bottom" align="start">
                                        {actionOptions.map((a) => (
                                            <SelectItem key={a.value} value={a.value}>
                                                <div className="flex items-center gap-2">
                                                    <a.icon className={cn('h-4 w-4', a.color)} />
                                                    {a.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-sm font-medium">
                                            {t.rules?.abTesting || 'Teste A/B'}
                                        </label>
                                        <p className="text-xs text-muted-foreground">
                                            {t.rules?.trafficPercentage
                                                ? 'Teste esta regra em uma porcentagem do tráfego'
                                                : 'Test this rule on a percentage of traffic'}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={enableAbTest}
                                        onCheckedChange={setEnableAbTest}
                                    />
                                </div>
                                {enableAbTest && (
                                    <div className="space-y-2">
                                        <label className="text-sm">
                                            {t.rules?.trafficPercentage || 'Traffic Percentage'}
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={abTestPercentage}
                                                onChange={(e) =>
                                                    setAbTestPercentage(Number(e.target.value))
                                                }
                                                min={1}
                                                max={99}
                                                className="w-24"
                                            />
                                            <span className="text-sm text-muted-foreground">%</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                {t.common?.cancel || 'Cancel'}
                            </Button>
                            <Button variant="outline" onClick={() => simulateMutation.mutate({})}>
                                <FlaskConical className="h-4 w-4 mr-2" />
                                Baseline 30d
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    simulateMutation.mutate(
                                        buildSimulationPayload({
                                            name: newRuleName || 'New Rule',
                                            description: newRuleDescription,
                                            conditions: newRuleConditions,
                                            action: { type: newRuleAction },
                                            priority: newRulePriority,
                                            enabled: true,
                                            abTest: enableAbTest
                                                ? {
                                                      enabled: true,
                                                      variant: 'A',
                                                      trafficPercentage: abTestPercentage,
                                                  }
                                                : undefined,
                                        })
                                    )
                                }
                                disabled={newRuleConditions.length === 0}
                            >
                                <FlaskConical className="h-4 w-4 mr-2" />
                                {t.rules?.simulateFirst || 'Simulate First'}
                            </Button>
                            <Button
                                onClick={handleCreateRule}
                                disabled={!newRuleName || newRuleConditions.length === 0}
                            >
                                {t.rules?.createRule || 'Create Rule'}
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
                                    onSimulate={(currentRule) =>
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
                                    }
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
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.rules?.name || 'Nome'}</label>
                            <Input
                                value={editRuleName}
                                onChange={(e) => setEditRuleName(e.target.value)}
                                placeholder="Ex: Bloqueio de Alto Risco"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {t.rules?.description || 'Descrição'}
                            </label>
                            <Input
                                value={editRuleDescription}
                                onChange={(e) => setEditRuleDescription(e.target.value)}
                                placeholder="Descreva o que esta regra faz..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {t.rules?.priority || 'Prioridade'} (maior = maior prioridade)
                            </label>
                            <Input
                                type="number"
                                value={editRulePriority}
                                onChange={(e) => setEditRulePriority(Number(e.target.value))}
                                min={0}
                                max={100}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {t.rules?.conditions || 'Condições'} (SE)
                            </label>
                            <ConditionBuilder
                                conditions={editRuleConditions}
                                onChange={setEditRuleConditions}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {t.rules?.actions || 'Ações (ENTÃO)'}
                            </label>
                            <Select
                                value={editRuleAction || ''}
                                onValueChange={(v) => setEditRuleAction(v as RuleAction['type'])}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma ação" />
                                </SelectTrigger>
                                <SelectContent side="bottom" align="start">
                                    {actionOptions.map((a) => (
                                        <SelectItem key={a.value} value={a.value}>
                                            <div className="flex items-center gap-2">
                                                <a.icon className={cn('h-4 w-4', a.color)} />
                                                {a.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium">
                                        {t.rules?.abTesting || 'Teste A/B'}
                                    </label>
                                    <p className="text-xs text-muted-foreground">
                                        {t.rules?.trafficPercentage
                                            ? 'Teste esta regra em uma porcentagem do tráfego'
                                            : 'Teste esta regra em uma porcentagem do tráfego'}
                                    </p>
                                </div>
                                <Switch
                                    checked={editEnableAbTest}
                                    onCheckedChange={setEditEnableAbTest}
                                />
                            </div>
                            {editEnableAbTest && (
                                <div className="space-y-2">
                                    <label className="text-sm">
                                        {t.rules?.trafficPercentage || 'Porcentagem de tráfego'}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={editAbTestPercentage}
                                            onChange={(e) =>
                                                setEditAbTestPercentage(Number(e.target.value))
                                            }
                                            min={1}
                                            max={99}
                                            className="w-24"
                                        />
                                        <span className="text-sm text-muted-foreground">%</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={closeEditDialog}>
                            {t.common?.cancel || 'Cancelar'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() =>
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
                                            ? {
                                                  enabled: true,
                                                  variant: editingRule?.abTest?.variant ?? 'A',
                                                  trafficPercentage: editAbTestPercentage,
                                              }
                                            : undefined,
                                    })
                                )
                            }
                            disabled={editRuleConditions.length === 0}
                        >
                            <FlaskConical className="h-4 w-4 mr-2" />
                            {t.rules?.simulateFirst || 'Simulate First'}
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
