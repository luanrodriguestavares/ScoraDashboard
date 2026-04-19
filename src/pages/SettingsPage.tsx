import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { useLanguage } from '@/contexts/LanguageContext'
import { useToast } from '@/hooks/use-toast'
import {
    Settings,
    Sliders,
    Shield,
    Save,
    RotateCcw,
    Info,
    Lock,
    CheckCircle2,
    AlertTriangle,
} from 'lucide-react'
import type { RiskSettings } from '@/types'
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

export function SettingsPage() {
    const { t } = useLanguage()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [settings, setSettings] = useState<RiskSettings>(defaultSettings)
    const [hasChanges, setHasChanges] = useState(false)

    const settingsQuery = useQuery({
        queryKey: ['settings'],
        queryFn: settingsApi.getSettings,
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
        setSettings((prev) => ({ ...prev, security_mode: value }))
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
