import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { alertingApi } from '@/services/api'
import type { AlertRule, AlertEvent } from '@/types'
import {
    Bell,
    BellOff,
    Mail,
    MessageSquare,
    Webhook,
    Phone,
    Plus,
    Trash2,
    Edit,
    AlertTriangle,
    AlertCircle,
    Info,
    Clock,
    Activity,
    Zap,
    Volume2,
    VolumeX,
} from 'lucide-react'

function SeverityBadge({
    severity,
}: {
    severity?: AlertRule['severity'] | AlertEvent['severity'] | string
}) {
    const normalized =
        severity === 'critical' ||
        severity === 'warning' ||
        severity === 'info' ||
        severity === 'error'
            ? severity
            : 'info'
    const config = {
        critical: { icon: AlertCircle, textClass: 'text-decision-block' },
        error: { icon: AlertCircle, textClass: 'text-orange-500' },
        warning: { icon: AlertTriangle, textClass: 'text-yellow-500' },
        info: { icon: Info, textClass: 'text-blue-500' },
    }
    const { icon: Icon, textClass } = config[normalized]

    return (
        <Badge variant="outline" className={cn('gap-1 capitalize', textClass)}>
            <Icon className="h-3 w-3" />
            {normalized}
        </Badge>
    )
}

function ChannelIcon({ channel }: { channel: string }) {
    const normalized = channel.toLowerCase()
    const icons: Record<string, typeof Mail> = {
        email: Mail,
        slack: MessageSquare,
        webhook: Webhook,
        sms: Phone,
    }
    const Icon = icons[normalized] ?? Bell
    return <Icon className="h-4 w-4" />
}

interface AlertRuleCardProps {
    rule: AlertRule
    onToggle: (id: string) => void
    onMute: (id: string) => void
    onUnmute: (id: string) => void
    onEdit: (rule: AlertRule) => void
    onDelete: (id: string) => void
}

function AlertRuleCard({ rule, onToggle, onMute, onUnmute, onEdit, onDelete }: AlertRuleCardProps) {
    const { t } = useLanguage()

    return (
        <Card className={cn(!rule.enabled && 'opacity-60')}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{rule.name}</h4>
                            <SeverityBadge severity={rule.severity} />
                            {rule.muted && (
                                <Badge variant="secondary" className="gap-1">
                                    <VolumeX className="h-3 w-3" />
                                    {t.alerting?.muted || 'Silenciado'}
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                            {rule.description || '-'}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="font-mono bg-muted px-2 py-1 rounded">
                                {rule.condition}
                            </span>
                            <span>
                                {t.alerting?.triggered || 'Disparos'}: {rule.triggerCount ?? 0}x
                            </span>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                            <span className="text-xs text-muted-foreground">
                                {t.alerting?.channels || 'Canais'}:
                            </span>
                            <div className="flex items-center gap-1 flex-wrap">
                                {rule.channels.map((channel, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs"
                                    >
                                        <ChannelIcon channel={channel} />
                                        <span>{channel}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Switch checked={rule.enabled} onCheckedChange={() => onToggle(rule.id)} />
                        {rule.muted ? (
                            <Button variant="outline" size="icon" onClick={() => onUnmute(rule.id)}>
                                <Volume2 className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button variant="outline" size="icon" onClick={() => onMute(rule.id)}>
                                <VolumeX className="h-4 w-4" />
                            </Button>
                        )}
                        <Button variant="outline" size="icon" onClick={() => onEdit(rule)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => onDelete(rule.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function AlertingPage() {
    const { t } = useLanguage()
    const queryClient = useQueryClient()
    const rulesQuery = useQuery({ queryKey: ['alerting', 'rules'], queryFn: alertingApi.getRules })
    const eventsQuery = useQuery({
        queryKey: ['alerting', 'events'],
        queryFn: alertingApi.getEvents,
    })
    const [rules, setRules] = useState<AlertRule[]>([])
    const [events, setEvents] = useState<AlertEvent[]>([])
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingRule, setEditingRule] = useState<AlertRule | null>(null)
    const [filter, setFilter] = useState<'all' | 'active' | 'muted'>('all')

    const [newRuleName, setNewRuleName] = useState('')
    const [newRuleDescription, setNewRuleDescription] = useState('')
    const [newRuleCondition, setNewRuleCondition] = useState('')
    const [newRuleSeverity, setNewRuleSeverity] = useState<AlertRule['severity']>('warning')
    const [newRuleChannels, setNewRuleChannels] = useState('')

    const createRuleMutation = useMutation({
        mutationFn: (
            payload: Pick<
                AlertRule,
                'name' | 'description' | 'condition' | 'severity' | 'channels' | 'enabled'
            >
        ) => alertingApi.createRule(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerting', 'rules'] })
            setIsCreateOpen(false)
            resetForm()
        },
    })

    const updateRuleMutation = useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string
            payload: Partial<
                Pick<
                    AlertRule,
                    | 'name'
                    | 'description'
                    | 'condition'
                    | 'severity'
                    | 'channels'
                    | 'enabled'
                    | 'muted'
                >
            >
        }) => alertingApi.updateRule(id, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerting', 'rules'] }),
    })

    const deleteRuleMutation = useMutation({
        mutationFn: (id: string) => alertingApi.deleteRule(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerting', 'rules'] }),
    })

    useEffect(() => {
        setRules(rulesQuery.data || [])
    }, [rulesQuery.data])

    useEffect(() => {
        setEvents(eventsQuery.data || [])
    }, [eventsQuery.data])

    const handleToggle = (id: string) => {
        const rule = rules.find((r) => r.id === id)
        if (!rule) return
        updateRuleMutation.mutate({ id, payload: { enabled: !rule.enabled } })
    }

    const handleMute = (id: string) => {
        updateRuleMutation.mutate({ id, payload: { muted: true } })
    }

    const handleUnmute = (id: string) => {
        updateRuleMutation.mutate({ id, payload: { muted: false } })
    }

    const handleDelete = (id: string) => {
        deleteRuleMutation.mutate(id)
    }

    const handleCreateRule = () => {
        const newRule = {
            name: newRuleName,
            description: newRuleDescription || undefined,
            condition: newRuleCondition,
            severity: newRuleSeverity,
            channels: newRuleChannels
                .split(',')
                .map((channel) => channel.trim())
                .filter(Boolean),
            enabled: true,
        }
        createRuleMutation.mutate(newRule)
    }

    const handleEditRule = (rule: AlertRule) => {
        setEditingRule(rule)
        setNewRuleName(rule.name)
        setNewRuleDescription(rule.description || '')
        setNewRuleCondition(rule.condition)
        setNewRuleSeverity(rule.severity)
        setNewRuleChannels(rule.channels.join(', '))
        setIsCreateOpen(true)
    }

    const handleSaveRule = () => {
        if (editingRule) {
            updateRuleMutation.mutate({
                id: editingRule.id,
                payload: {
                    name: newRuleName,
                    description: newRuleDescription || undefined,
                    condition: newRuleCondition,
                    severity: newRuleSeverity,
                    channels: newRuleChannels
                        .split(',')
                        .map((channel) => channel.trim())
                        .filter(Boolean),
                },
            })
            setEditingRule(null)
            setIsCreateOpen(false)
            resetForm()
            return
        }

        handleCreateRule()
    }

    const resetForm = () => {
        setNewRuleName('')
        setNewRuleDescription('')
        setNewRuleCondition('')
        setNewRuleSeverity('warning')
        setNewRuleChannels('')
        setEditingRule(null)
    }

    const filteredRules = rules.filter((r) => {
        if (filter === 'all') return true
        if (filter === 'active') return r.enabled && !r.muted
        if (filter === 'muted') return r.muted
        return true
    })

    const activeAlerts = events.length
    const criticalRules = rules.filter((r) => r.severity === 'critical' && r.enabled).length
    const mutedRules = rules.filter((r) => Boolean(r.muted)).length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading font-bold">
                        {t.alerting?.title || 'Sistema de Alertas'}
                    </h2>
                    <p className="text-muted-foreground">
                        {t.alerting?.subtitle || 'Configure alertas e notificacoes'}
                    </p>
                </div>
                <Dialog
                    open={isCreateOpen}
                    onOpenChange={(open) => {
                        setIsCreateOpen(open)
                        if (!open) resetForm()
                    }}
                >
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            {editingRule
                                ? t.common?.edit || 'Editar'
                                : t.alerting?.createAlert || 'Criar alerta'}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                {editingRule
                                    ? t.common?.edit || 'Editar'
                                    : t.alerting?.createAlertRule || 'Criar regra de alerta'}
                            </DialogTitle>
                            <DialogDescription>
                                {t.alerting?.configureAlertRule ||
                                    'Configure uma nova regra de alerta para monitorar seu sistema'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    {t.alerting?.ruleName || 'Nome da regra'}
                                </label>
                                <Input
                                    className="bg-background"
                                    value={newRuleName}
                                    onChange={(e) => setNewRuleName(e.target.value)}
                                    placeholder="Ex.: alerta de alto volume"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    {t.alerting?.description || 'Descricao'}
                                </label>
                                <Textarea
                                    className="bg-background"
                                    value={newRuleDescription}
                                    onChange={(e) => setNewRuleDescription(e.target.value)}
                                    placeholder="Descreva o que esta regra monitora"
                                    rows={2}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Condicao</label>
                                <Textarea
                                    className="bg-background font-mono text-sm"
                                    value={newRuleCondition}
                                    onChange={(e) => setNewRuleCondition(e.target.value)}
                                    placeholder="Ex.: final_score >= 0.85 AND decision = 'block'"
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    {t.alerting?.severity || 'Severidade'}
                                </label>
                                <Select
                                    value={newRuleSeverity}
                                    onValueChange={(v) =>
                                        setNewRuleSeverity(v as AlertRule['severity'])
                                    }
                                >
                                    <SelectTrigger className="bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="critical">Critico</SelectItem>
                                        <SelectItem value="error">Erro</SelectItem>
                                        <SelectItem value="warning">Alerta</SelectItem>
                                        <SelectItem value="info">Informativo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Canais</label>
                                <Input
                                    className="bg-background"
                                    value={newRuleChannels}
                                    onChange={(e) => setNewRuleChannels(e.target.value)}
                                    placeholder="email, webhook, slack"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsCreateOpen(false)
                                    resetForm()
                                }}
                            >
                                {t.common?.cancel || 'Cancelar'}
                            </Button>
                            <Button
                                onClick={handleSaveRule}
                                disabled={!newRuleName || !newRuleCondition}
                            >
                                {editingRule
                                    ? t.common?.save || 'Salvar'
                                    : t.alerting?.createRule || 'Criar regra'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-decision-block/10 flex items-center justify-center">
                                <Bell className="h-5 w-5 text-decision-block" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Eventos recentes</p>
                                <p className="text-2xl font-bold">{activeAlerts}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Zap className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {t.alerting?.totalRules || 'Total de regras'}
                                </p>
                                <p className="text-2xl font-bold">{rules.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-decision-block/10 flex items-center justify-center">
                                <AlertCircle className="h-5 w-5 text-decision-block" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {t.alerting?.criticalRules || 'Regras criticas'}
                                </p>
                                <p className="text-2xl font-bold">{criticalRules}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <BellOff className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {t.alerting?.mutedRules || 'Regras silenciadas'}
                                </p>
                                <p className="text-2xl font-bold">{mutedRules}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="rules">
                <TabsList>
                    <TabsTrigger value="rules">
                        {t.alerting?.alertRules || 'Regras de alerta'}
                    </TabsTrigger>
                    <TabsTrigger value="events">
                        {t.alerting?.eventHistory || 'Historico de eventos'}
                        {activeAlerts > 0 && (
                            <Badge variant="destructive" className="ml-2">
                                {activeAlerts}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="rules" className="mt-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Button
                            variant={filter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('all')}
                        >
                            {t.common?.all || 'Todos'} ({rules.length})
                        </Button>
                        <Button
                            variant={filter === 'active' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('active')}
                        >
                            {t.common?.active || 'Ativos'} (
                            {rules.filter((r) => r.enabled && !r.muted).length})
                        </Button>
                        <Button
                            variant={filter === 'muted' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('muted')}
                        >
                            {t.alerting?.muted || 'Silenciados'} ({mutedRules})
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {filteredRules.map((rule) => (
                            <AlertRuleCard
                                key={rule.id}
                                rule={rule}
                                onToggle={handleToggle}
                                onMute={handleMute}
                                onUnmute={handleUnmute}
                                onEdit={handleEditRule}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="events" className="mt-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                {t.alerting?.alertEvents || 'Eventos de alerta'}
                            </CardTitle>
                            <div className="text-sm text-muted-foreground">
                                Este feed combina decisões de alto risco, eventos internos do
                                sistema e disparos das regras ativas configuradas acima.
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            {t.alerting?.severity || 'Severidade'}
                                        </TableHead>
                                        <TableHead>{t.alerting?.rule || 'Regra'}</TableHead>
                                        <TableHead>{t.alerting?.message || 'Mensagem'}</TableHead>
                                        <TableHead>
                                            {t.alerting?.triggered || 'Disparado'}
                                        </TableHead>
                                        <TableHead>{t.reports?.status || 'Status'}</TableHead>
                                        <TableHead className="text-right">
                                            {t.common?.actions || 'Acoes'}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {events.map((event) => (
                                        <TableRow key={event.id}>
                                            <TableCell>
                                                <SeverityBadge severity={event.severity} />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {event.component ?? event.metric ?? '-'}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {event.message}
                                            </TableCell>
                                            <TableCell>
                                                {(() => {
                                                    const date = new Date(event.timestamp)
                                                    return Number.isNaN(date.getTime())
                                                        ? t.common?.unavailable || 'Unavailable'
                                                        : date.toLocaleString()
                                                })()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {'Recente'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right" />
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
