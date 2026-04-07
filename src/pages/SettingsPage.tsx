import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
    DialogTrigger,
} from '@/components/ui/dialog'
import { useLanguage } from '@/contexts/LanguageContext'
import { useToast } from '@/hooks/use-toast'
import {
    Settings,
    Sliders,
    Webhook,
    Shield,
    Plus,
    Trash2,
    Edit,
    Save,
    RotateCcw,
    Info,
    Lock,
    CheckCircle2,
    AlertTriangle,
} from 'lucide-react'
import type { Webhook as WebhookType, WebhookEvent, RiskSettings } from '@/types'
import { cn } from '@/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from '@/services/api'

interface ThresholdSliderProps {
    label: string
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    step?: number
}

const defaultSettings: RiskSettings = {
    thresholds: { review_start: 0.5, review_end: 0.85 },
    weights: { validation: 1, history: 1, pattern: 1, graph: 1 },
    retention_days: 90,
    security_mode: 'encrypted',
}

function ThresholdSlider({
    label,
    value,
    onChange,
    min = 0,
    max = 1,
    step = 0.01,
}: ThresholdSliderProps) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm">{label}</span>
                <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                    {value.toFixed(2)}
                </span>
            </div>
            <Slider
                value={[value]}
                min={min}
                max={max}
                step={step}
                onValueChange={([v]) => onChange(v)}
            />
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

const WEBHOOK_EVENT_OPTIONS: Array<{ value: WebhookEvent; label: string }> = [
    { value: 'decision.allow', label: 'Decision Allow' },
    { value: 'decision.review', label: 'Decision Review' },
    { value: 'decision.block', label: 'Decision Block' },
    { value: 'risk.high', label: 'High Risk' },
    { value: 'risk.critical', label: 'Critical Risk' },
    { value: 'velocity.burst', label: 'Velocity Burst' },
    { value: 'anomaly.detected', label: 'Anomaly Detected' },
    { value: 'pattern.fraud', label: 'Fraud Pattern' },
    { value: 'graph.suspicious_cluster', label: 'Suspicious Cluster' },
]

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
    return (
        <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            'w-2 h-2 rounded-full',
                            webhook.active ? 'bg-decision-allow' : 'bg-muted-foreground'
                        )}
                    />
                    <span className="font-mono text-sm truncate">{webhook.url}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    {webhook.events.map((event) => (
                        <Badge key={event} variant="secondary" className="text-xs capitalize">
                            {WEBHOOK_EVENT_OPTIONS.find((option) => option.value === event)
                                ?.label ?? event}
                        </Badge>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
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
    )
}

export function SettingsPage() {
    const { t } = useLanguage()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [settings, setSettings] = useState<RiskSettings>(defaultSettings)
    const [hasChanges, setHasChanges] = useState(false)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [editingWebhook, setEditingWebhook] = useState<WebhookType | null>(null)
    const [newWebhookUrl, setNewWebhookUrl] = useState('')
    const [newWebhookEvents, setNewWebhookEvents] = useState<WebhookEvent[]>(['decision.block'])
    const [editWebhookUrl, setEditWebhookUrl] = useState('')
    const [editWebhookEvents, setEditWebhookEvents] = useState<WebhookEvent[]>([])

    const settingsQuery = useQuery({
        queryKey: ['settings'],
        queryFn: settingsApi.getSettings,
    })

    const webhooksQuery = useQuery({
        queryKey: ['webhooks'],
        queryFn: settingsApi.getWebhooks,
    })

    useEffect(() => {
        if (settingsQuery.data) {
            setSettings(settingsQuery.data)
            setHasChanges(false)
        }
    }, [settingsQuery.data])

    const thresholdsMutation = useMutation({
        mutationFn: (thresholds: RiskSettings['thresholds']) =>
            settingsApi.updateThresholds(thresholds),
    })

    const weightsMutation = useMutation({
        mutationFn: (weights: RiskSettings['weights']) => settingsApi.updateWeights(weights),
    })

    const securityMutation = useMutation({
        mutationFn: (payload: {
            security_mode: RiskSettings['security_mode']
            retention_days?: number
        }) => settingsApi.updateSecurity(payload),
    })

    const createWebhookMutation = useMutation({
        mutationFn: (payload: { url: string; events: WebhookType['events'] }) =>
            settingsApi.createWebhook({
                name: 'Webhook',
                url: payload.url,
                events: payload.events,
                active: true,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] })
            setNewWebhookUrl('')
            setNewWebhookEvents(['decision.block'])
            setIsCreateDialogOpen(false)
            toast({ description: 'Webhook criado com sucesso.' })
        },
        onError: () => {
            toast({ description: 'Falha ao criar webhook.', variant: 'destructive' })
        },
    })

    const updateWebhookMutation = useMutation({
        mutationFn: (payload: {
            id: string
            data: Partial<{
                name: string
                url: string
                events: WebhookType['events']
                active: boolean
            }>
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

    const testWebhookMutation = useMutation({
        mutationFn: (id: string) => settingsApi.testWebhook(id),
        onSuccess: (result) => {
            toast({
                description: result.success
                    ? `Teste enviado com sucesso${result.status_code ? ` (${result.status_code})` : ''}.`
                    : (result.error ?? 'O teste do webhook falhou.'),
                variant: result.success ? 'default' : 'destructive',
            })
        },
        onError: () => {
            toast({ description: 'Falha ao testar webhook.', variant: 'destructive' })
        },
    })

    const deleteWebhookMutation = useMutation({
        mutationFn: (id: string) => settingsApi.deleteWebhook(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] })
            toast({ description: 'Webhook removido com sucesso.' })
        },
        onError: () => {
            toast({ description: 'Falha ao remover webhook.', variant: 'destructive' })
        },
    })

    const updateThreshold = (key: keyof RiskSettings['thresholds'], value: number) => {
        setSettings((prev) => ({
            ...prev,
            thresholds: { ...prev.thresholds, [key]: value },
        }))
        setHasChanges(true)
    }

    const updateWeight = (key: keyof RiskSettings['weights'], value: number) => {
        setSettings((prev) => ({
            ...prev,
            weights: { ...prev.weights, [key]: value },
        }))
        setHasChanges(true)
    }

    const updateSecurityMode = (value: RiskSettings['security_mode']) => {
        setSettings((prev) => ({
            ...prev,
            security_mode: value,
        }))
        setHasChanges(true)
    }

    const restoreDefaults = async () => {
        setSettings(defaultSettings)
        setHasChanges(true)
        try {
            await Promise.all([
                thresholdsMutation.mutateAsync(defaultSettings.thresholds),
                weightsMutation.mutateAsync(defaultSettings.weights),
            ])
            queryClient.invalidateQueries({ queryKey: ['settings'] })
            setHasChanges(false)
            toast({ description: t.settings.security.saveSuccess })
        } catch {
            toast({ description: t.settings.security.saveError, variant: 'destructive' })
        }
    }

    const saveChanges = async () => {
        try {
            await Promise.all([
                thresholdsMutation.mutateAsync(settings.thresholds),
                weightsMutation.mutateAsync(settings.weights),
                securityMutation.mutateAsync({
                    security_mode: settings.security_mode,
                    retention_days: settings.retention_days,
                }),
            ])
            setHasChanges(false)
            toast({ description: t.settings.security.saveSuccess })
        } catch {
            toast({ description: t.settings.security.saveError, variant: 'destructive' })
        }
    }

    const addWebhook = () => {
        if (!newWebhookUrl) return
        createWebhookMutation.mutate({
            url: newWebhookUrl,
            events: newWebhookEvents,
        })
    }

    const saveWebhookEdit = () => {
        if (!editingWebhook || !editWebhookUrl || editWebhookEvents.length === 0) return
        updateWebhookMutation.mutate({
            id: editingWebhook.id,
            data: {
                url: editWebhookUrl,
                events: editWebhookEvents,
            },
        })
    }

    const deleteWebhook = (id: string) => {
        deleteWebhookMutation.mutate(id)
    }

    const openEditWebhook = (webhook: WebhookType) => {
        setEditingWebhook(webhook)
        setEditWebhookUrl(webhook.url)
        setEditWebhookEvents(webhook.events)
    }

    const toggleWebhookEvent = (
        event: WebhookEvent,
        setSelectedEvents: (
            value: WebhookEvent[] | ((prev: WebhookEvent[]) => WebhookEvent[])
        ) => void
    ) => {
        setSelectedEvents((prev) =>
            prev.includes(event)
                ? prev.filter((currentEvent) => currentEvent !== event)
                : [...prev, event]
        )
    }

    const webhooks = webhooksQuery.data ?? []

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-heading font-bold">{t.settings.title}</h2>
                <p className="text-muted-foreground">{t.settings.subtitle}</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Sliders className="h-5 w-5" />
                        <CardTitle className="text-lg">{t.settings.thresholds.title}</CardTitle>
                    </div>
                    <CardDescription>{t.settings.thresholds.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="relative h-16 bg-gradient-to-r from-decision-allow via-decision-review to-decision-block rounded-lg overflow-hidden">
                        <div className="absolute inset-0 flex items-center px-4">
                            <div
                                className="absolute w-1 h-full bg-white shadow-lg"
                                style={{ left: `${settings.thresholds.review_start * 100}%` }}
                            />
                            <div
                                className="absolute w-1 h-full bg-white shadow-lg"
                                style={{ left: `${settings.thresholds.review_end * 100}%` }}
                            />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-between px-8 text-white text-sm font-medium">
                            <span>ALLOW</span>
                            <span>REVIEW</span>
                            <span>BLOCK</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ThresholdSlider
                            label={t.settings.thresholds.reviewStart}
                            value={settings.thresholds.review_start}
                            onChange={(v) => updateThreshold('review_start', v)}
                        />
                        <ThresholdSlider
                            label={t.settings.thresholds.reviewEnd}
                            value={settings.thresholds.review_end}
                            onChange={(v) => updateThreshold('review_end', v)}
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={restoreDefaults}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            {t.settings.thresholds.restoreDefault}
                        </Button>
                        <Button onClick={saveChanges} disabled={!hasChanges}>
                            <Save className="h-4 w-4 mr-2" />
                            {t.settings.thresholds.saveChanges}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        <CardTitle className="text-lg">{t.settings.weights.title}</CardTitle>
                    </div>
                    <CardDescription>{t.settings.weights.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ThresholdSlider
                            label={t.settings.weights.validation}
                            value={settings.weights.validation}
                            onChange={(v) => updateWeight('validation', v)}
                        />
                        <ThresholdSlider
                            label={t.settings.weights.history}
                            value={settings.weights.history}
                            onChange={(v) => updateWeight('history', v)}
                        />
                        <ThresholdSlider
                            label={t.settings.weights.pattern}
                            value={settings.weights.pattern}
                            onChange={(v) => updateWeight('pattern', v)}
                        />
                        <ThresholdSlider
                            label={t.settings.weights.graph}
                            value={settings.weights.graph}
                            onChange={(v) => updateWeight('graph', v)}
                        />
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        <Info className="h-4 w-4 shrink-0" />
                        <span>{t.settings.weights.autoAdjusted}</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Webhook className="h-5 w-5" />
                            <CardTitle className="text-lg">{t.settings.webhooks.title}</CardTitle>
                        </div>
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t.settings.webhooks.addWebhook}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{t.settings.webhooks.addWebhook}</DialogTitle>
                                    <DialogDescription>
                                        {t.settings.webhooks.description}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            {t.settings.webhooks.url}
                                        </label>
                                        <Input
                                            placeholder="https://api.example.com/webhook"
                                            value={newWebhookUrl}
                                            onChange={(e) => setNewWebhookUrl(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            {t.settings.webhooks.events}
                                        </label>
                                        <div className="flex gap-2 flex-wrap">
                                            {WEBHOOK_EVENT_OPTIONS.map((event) => (
                                                <Badge
                                                    key={event.value}
                                                    variant={
                                                        newWebhookEvents.includes(event.value)
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    className="cursor-pointer"
                                                    onClick={() => {
                                                        toggleWebhookEvent(
                                                            event.value,
                                                            setNewWebhookEvents
                                                        )
                                                    }}
                                                >
                                                    {event.label}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        onClick={addWebhook}
                                        disabled={!newWebhookUrl || newWebhookEvents.length === 0}
                                    >
                                        {t.common.create}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <CardDescription>{t.settings.webhooks.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {webhooks.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            {t.settings.webhooks.noWebhooks}
                        </p>
                    ) : (
                        webhooks.map((webhook) => (
                            <WebhookItem
                                key={webhook.id}
                                webhook={webhook}
                                onToggleActive={(active) =>
                                    updateWebhookMutation.mutate({
                                        id: webhook.id,
                                        data: { active },
                                    })
                                }
                                onTest={() => testWebhookMutation.mutate(webhook.id)}
                                onEdit={() => openEditWebhook(webhook)}
                                onDelete={() => deleteWebhook(webhook.id)}
                                isUpdating={updateWebhookMutation.isPending}
                                isTesting={testWebhookMutation.isPending}
                                isDeleting={deleteWebhookMutation.isPending}
                            />
                        ))
                    )}
                </CardContent>
            </Card>

            <Dialog
                open={!!editingWebhook}
                onOpenChange={(open) => !open && setEditingWebhook(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t.common.edit}</DialogTitle>
                        <DialogDescription>{t.settings.webhooks.description}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t.settings.webhooks.url}</label>
                            <Input
                                placeholder="https://api.example.com/webhook"
                                value={editWebhookUrl}
                                onChange={(e) => setEditWebhookUrl(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                {t.settings.webhooks.events}
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {WEBHOOK_EVENT_OPTIONS.map((event) => (
                                    <Badge
                                        key={event.value}
                                        variant={
                                            editWebhookEvents.includes(event.value)
                                                ? 'default'
                                                : 'outline'
                                        }
                                        className="cursor-pointer"
                                        onClick={() =>
                                            toggleWebhookEvent(event.value, setEditWebhookEvents)
                                        }
                                    >
                                        {event.label}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingWebhook(null)}>
                            {t.common.cancel}
                        </Button>
                        <Button
                            onClick={saveWebhookEdit}
                            disabled={
                                !editWebhookUrl ||
                                editWebhookEvents.length === 0 ||
                                updateWebhookMutation.isPending
                            }
                        >
                            {t.common.save}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        <CardTitle className="text-lg">{t.settings.security.title}</CardTitle>
                    </div>
                    <CardDescription>{t.settings.security.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">{t.settings.security.mode}</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Zero-Knowledge card */}
                            <button
                                type="button"
                                onClick={() => updateSecurityMode('zero_knowledge')}
                                className={cn(
                                    'text-left rounded-lg border-2 p-4 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                    settings.security_mode === 'zero_knowledge'
                                        ? 'border-decision-allow bg-decision-allow/5'
                                        : 'border-border hover:border-muted-foreground/40'
                                )}
                            >
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div
                                        className={cn(
                                            'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
                                            settings.security_mode === 'zero_knowledge'
                                                ? 'bg-decision-allow/15'
                                                : 'bg-muted'
                                        )}
                                    >
                                        <Shield
                                            className={cn(
                                                'h-5 w-5',
                                                settings.security_mode === 'zero_knowledge'
                                                    ? 'text-decision-allow'
                                                    : 'text-muted-foreground'
                                            )}
                                        />
                                    </div>
                                    <div className="flex gap-1.5 flex-wrap justify-end">
                                        <Badge
                                            variant="secondary"
                                            className="text-xs bg-decision-allow/10 text-decision-allow border-decision-allow/20"
                                        >
                                            {t.settings.security.recommended}
                                        </Badge>
                                        {settings.security_mode === 'zero_knowledge' && (
                                            <CheckCircle2 className="h-4 w-4 text-decision-allow mt-0.5" />
                                        )}
                                    </div>
                                </div>
                                <p className="font-semibold text-sm mb-1">
                                    {t.settings.security.zeroKnowledge}
                                </p>
                                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                                    {t.settings.security.zeroKnowledgeDesc}
                                </p>
                                <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/60 rounded px-2 py-1.5">
                                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                    <span>{t.settings.security.zeroKnowledgeWarning}</span>
                                </div>
                            </button>

                            {/* Encrypted card */}
                            <button
                                type="button"
                                onClick={() => updateSecurityMode('encrypted')}
                                className={cn(
                                    'text-left rounded-lg border-2 p-4 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                    settings.security_mode === 'encrypted'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-muted-foreground/40'
                                )}
                            >
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div
                                        className={cn(
                                            'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
                                            settings.security_mode === 'encrypted'
                                                ? 'bg-primary/15'
                                                : 'bg-muted'
                                        )}
                                    >
                                        <Lock
                                            className={cn(
                                                'h-5 w-5',
                                                settings.security_mode === 'encrypted'
                                                    ? 'text-primary'
                                                    : 'text-muted-foreground'
                                            )}
                                        />
                                    </div>
                                    <div className="flex gap-1.5 flex-wrap justify-end">
                                        <Badge
                                            variant="secondary"
                                            className="text-xs bg-primary/10 text-primary border-primary/20"
                                        >
                                            {t.settings.security.compliance}
                                        </Badge>
                                        {settings.security_mode === 'encrypted' && (
                                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                                        )}
                                    </div>
                                </div>
                                <p className="font-semibold text-sm mb-1">
                                    {t.settings.security.encrypted}
                                </p>
                                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                                    {t.settings.security.encryptedDesc}
                                </p>
                                <div className="flex items-start gap-1.5 text-xs text-decision-review bg-decision-review/10 rounded px-2 py-1.5">
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                    <span>{t.settings.security.encryptedWarning}</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            {t.settings.security.retentionDays}
                        </label>
                        <Input
                            type="number"
                            value={settings.retention_days}
                            disabled
                            className="max-w-[180px]"
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={saveChanges} disabled={!hasChanges}>
                            <Save className="h-4 w-4 mr-2" />
                            {t.common.save}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
