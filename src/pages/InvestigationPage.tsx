import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { investigationsApi } from '@/services/api'
import { useSearchParams } from 'react-router-dom'
import type {
    InvestigationCase,
    InvestigationTimelineEvent,
    InvestigationConnection,
    InvestigationSimilarCase,
} from '@/types'
import {
    Search,
    Clock,
    MapPin,
    Laptop,
    Globe,
    Shield,
    AlertTriangle,
    CheckCircle,
    XCircle,
    MessageSquare,
    Send,
    History,
    Link2,
    ChevronRight,
    Loader2,
    Menu,
    Calendar,
} from 'lucide-react'

function decisionBadgeVariant(decision?: string) {
    if (decision === 'allow') return 'default' as const
    if (decision === 'review') return 'secondary' as const
    return 'destructive' as const
}

function getDecisionText(decision?: string, t?: any) {
    if (!t) return decision
    if (decision === 'allow') return t.decisions.allow
    if (decision === 'review') return t.decisions.review
    if (decision === 'block') return t.decisions.block
    return decision
}

function getRiskLevelText(riskLevel?: string, t?: any) {
    if (!t) return riskLevel
    const riskMap: Record<string, string> = {
        critical: 'Crítico',
        high: 'Alto',
        medium: 'Médio',
        low: 'Baixo',
    }
    return riskMap[riskLevel || ''] || riskLevel
}

function getStatusText(status?: string, t?: any) {
    if (!t) return status
    const statusMap: Record<string, string> = {
        open: 'Aberto',
        investigating: 'Investigando',
        resolved: 'Resolvido',
        escalated: 'Escalado',
    }
    return statusMap[status || ''] || status
}

function parseNotes(notes: any) {
    if (!notes) return []
    if (Array.isArray(notes)) return notes
    if (typeof notes === 'string') {
        try {
            const parsed = JSON.parse(notes)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return []
        }
    }
    return []
}

function normalizeNotesArray(notesArray: any[]) {
    const normalized: any[] = []

    notesArray.forEach((note) => {
        if (!note || typeof note !== 'object') {
            return
        }

        if (typeof note.content === 'string') {
            const trimmed = note.content.trim()
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                try {
                    const parsed = JSON.parse(trimmed)
                    if (Array.isArray(parsed)) {
                        const looksLikeNotes = parsed.every(
                            (item) => item && typeof item === 'object' && 'content' in item
                        )
                        if (looksLikeNotes) {
                            parsed.forEach((item) => normalized.push(item))
                            return
                        }
                    }
                } catch {
                }
            }
        }

        normalized.push(note)
    })

    return normalized
}

function riskColor(score: number) {
    if (score < 0.4) return 'text-decision-allow'
    if (score < 0.7) return 'text-decision-review'
    return 'text-decision-block'
}

function TimelineItem({ event }: { event: InvestigationTimelineEvent }) {
    const { t } = useLanguage()

    const icon = () => {
        if (event.type === 'decision') {
            if (event.decision === 'allow')
                return <CheckCircle className="h-3.5 w-3.5 text-decision-allow" />
            if (event.decision === 'review')
                return <AlertTriangle className="h-3.5 w-3.5 text-decision-review" />
            return <XCircle className="h-3.5 w-3.5 text-decision-block" />
        }
        if (event.type === 'review') return <Shield className="h-3.5 w-3.5 text-blue-500" />
        if (event.type === 'note')
            return <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
        return <Clock className="h-3.5 w-3.5 text-muted-foreground" />
    }

    return (
        <div className="flex gap-3 pb-4 border-l-2 border-border pl-4 ml-2 relative last:border-transparent">
            <div className="absolute -left-[9px] top-0.5 h-4 w-4 rounded-full bg-background border-2 border-border flex items-center justify-center">
                {icon()}
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(event.timestamp).toLocaleString()}</span>
                    {event.accountId && (
                        <>
                            <span>·</span>
                            <span className="font-mono truncate max-w-[120px]">
                                {event.accountId}
                            </span>
                        </>
                    )}
                    {event.actor && event.actor !== 'system' && (
                        <>
                            <span>·</span>
                            <span>{event.actor}</span>
                        </>
                    )}
                </div>

                {(event.type === 'decision' || event.type === 'review') && (
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                                variant={decisionBadgeVariant(event.decision)}
                                className="text-xs"
                            >
                                {getDecisionText(event.decision, t)}
                            </Badge>
                            {event.type === 'review' && (
                                <Badge
                                    variant="outline"
                                    className="text-xs text-blue-500 border-blue-500/40"
                                >
                                    {t.investigation.reviewed}
                                </Badge>
                            )}
                            {event.score !== undefined && (
                                <span
                                    className={cn(
                                        'text-xs font-mono font-semibold',
                                        riskColor(event.score)
                                    )}
                                >
                                    {(event.score * 100).toFixed(0)}%
                                </span>
                            )}
                        </div>
                        {event.context && (
                            <div className="flex flex-wrap gap-1.5 text-xs">
                                <span className="flex items-center gap-1 bg-secondary/50 rounded px-1.5 py-0.5">
                                    <Globe className="h-3 w-3" /> {event.context.ip}
                                </span>
                                <span className="flex items-center gap-1 bg-secondary/50 rounded px-1.5 py-0.5">
                                    <MapPin className="h-3 w-3" /> {event.context.country}
                                </span>
                                <span className="flex items-center gap-1 bg-secondary/50 rounded px-1.5 py-0.5">
                                    <Laptop className="h-3 w-3" /> {event.context.device}
                                </span>
                                {event.context.isVpn && (
                                    <Badge
                                        variant="outline"
                                        className="text-decision-review text-xs"
                                    >
                                        {t.investigation.vpn}
                                    </Badge>
                                )}
                                {event.context.isTor && (
                                    <Badge
                                        variant="outline"
                                        className="text-decision-block text-xs"
                                    >
                                        {t.investigation.tor}
                                    </Badge>
                                )}
                            </div>
                        )}
                        {event.content && (
                            <p className="text-sm text-muted-foreground italic">{event.content}</p>
                        )}
                    </div>
                )}

                {event.type === 'note' && event.content && (
                    <p className="text-sm">{event.content}</p>
                )}
            </div>
        </div>
    )
}

function ConnectionCard({ connection }: { connection: InvestigationConnection }) {
    const { t } = useLanguage()
    return (
        <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
                <div
                    className={cn(
                        'h-8 w-8 rounded flex items-center justify-center shrink-0',
                        connection.decision === 'allow' && 'bg-decision-allow/10',
                        connection.decision === 'review' && 'bg-decision-review/10',
                        connection.decision === 'block' && 'bg-decision-block/10'
                    )}
                >
                    <Link2
                        className={cn(
                            'h-4 w-4',
                            connection.decision === 'allow' && 'text-decision-allow',
                            connection.decision === 'review' && 'text-decision-review',
                            connection.decision === 'block' && 'text-decision-block'
                        )}
                    />
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs font-mono shrink-0">
                            {connection.type.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-mono truncate">{connection.hash}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {connection.seenCount}× ·{' '}
                        {new Date(connection.lastSeen).toLocaleDateString()}
                    </p>
                </div>
            </div>
            <div className="text-right shrink-0 ml-3">
                <p className={cn('text-sm font-mono font-bold', riskColor(connection.riskScore))}>
                    {(connection.riskScore * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">
                    {getDecisionText(connection.decision, t)}
                </p>
            </div>
        </div>
    )
}

function SimilarCaseCard({ case_ }: { case_: InvestigationSimilarCase }) {
    const { t } = useLanguage()

    return (
        <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{case_.similarity}%</span>
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs font-mono shrink-0">
                            {case_.type.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-mono truncate">{case_.valueHash}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge variant={decisionBadgeVariant(case_.decision)} className="text-xs">
                            {getDecisionText(case_.decision, t)}
                        </Badge>
                        {case_.resolution && (
                            <Badge
                                variant="outline"
                                className={cn(
                                    'text-xs',
                                    case_.resolution === 'confirmed_fraud' &&
                                        'text-decision-block border-decision-block/40',
                                    case_.resolution === 'false_positive' &&
                                        'text-decision-allow border-decision-allow/40'
                                )}
                            >
                                {case_.resolution.replace(/_/g, ' ')}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
            <div className="text-right shrink-0 ml-3">
                <p className={cn('text-sm font-mono', riskColor(case_.score))}>
                    {(case_.score * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">
                    {new Date(case_.timestamp).toLocaleDateString()}
                </p>
            </div>
        </div>
    )
}

function CaseListItem({
    c,
    selected,
    onClick,
}: {
    c: InvestigationCase
    selected: boolean
    onClick: () => void
}) {
    const { t } = useLanguage()
    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full text-left p-3 rounded-lg border transition-colors',
                selected ? 'bg-primary/10 border-primary' : 'hover:bg-accent border-border'
            )}
        >
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                    <Badge variant="outline" className="text-xs font-mono shrink-0">
                        {c.type.toUpperCase()}
                    </Badge>
                    <Badge
                        variant={decisionBadgeVariant(c.currentDecision)}
                        className="text-xs shrink-0"
                    >
                        {(c.currentScore * 100).toFixed(0)}%
                    </Badge>
                </div>
                <span className="text-xs font-mono truncate break-all">{c.valueHash}</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span>{getStatusText(c.status, t)}</span>
                <span>·</span>
                <span>{c.totalOccurrences}×</span>
                <span>·</span>
                <span>{new Date(c.lastSeen).toLocaleDateString()}</span>
            </div>
        </button>
    )
}

export function InvestigationPage() {
    const { t } = useLanguage()
    const queryClient = useQueryClient()
    const [searchParams] = useSearchParams()

    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
    const [searchValue, setSearchValue] = useState('')
    const [newNote, setNewNote] = useState('')
    const [localNotes, setLocalNotes] = useState<InvestigationCase['notes']>([])
    const [casesModalOpen, setCasesModalOpen] = useState(false)
    const [caseStartDate, setCaseStartDate] = useState('')
    const [caseEndDate, setCaseEndDate] = useState('')

    const casesQuery = useQuery({
        queryKey: ['investigations', 'cases', selectedCaseId],
        queryFn: () => investigationsApi.getCases(selectedCaseId ?? undefined),
    })

    const cases = casesQuery.data ?? []
    const caseIdParam = searchParams.get('caseId')
    const valueHashParam = searchParams.get('valueHash')
    const typeParam = searchParams.get('type')

    useEffect(() => {
        if (cases.length === 0) return
        if (caseIdParam || valueHashParam) {
            const matchById = caseIdParam ? cases.find((c) => c.id === caseIdParam) : undefined
            const matchByValue =
                !matchById && valueHashParam
                    ? cases.find(
                          (c) =>
                              c.valueHash === valueHashParam && (!typeParam || c.type === typeParam)
                      )
                    : undefined
            const target = matchById || matchByValue
            if (target && target.id !== selectedCaseId) {
                setSelectedCaseId(target.id)
                return
            }
        }
        if (!selectedCaseId) {
            setSelectedCaseId(cases[0].id)
        }
    }, [cases, caseIdParam, valueHashParam, typeParam, selectedCaseId])

    const selectedCase = cases.find((c) => c.id === selectedCaseId) ?? null

    useEffect(() => {
        if (selectedCase) {
            setLocalNotes(normalizeNotesArray(parseNotes(selectedCase.notes)))
        }
    }, [selectedCase])

    const noteMutation = useMutation({
        mutationFn: ({ caseId, content }: { caseId: string; content: string }) =>
            investigationsApi.addNote(caseId, content),
        onSuccess: (note) => {
            setLocalNotes((prev) => normalizeNotesArray([note, ...prev]))
            setNewNote('')
        },
    })

    const statusMutation = useMutation({
        mutationFn: ({
            caseId,
            status,
            resolution,
        }: {
            caseId: string
            status: 'open' | 'investigating' | 'resolved' | 'escalated'
            resolution?: 'confirmed_fraud' | 'false_positive' | 'monitor'
        }) =>
            investigationsApi.updateStatus(caseId, {
                status,
                resolution,
                notes: newNote.trim() || undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['investigations', 'cases'] })
            setNewNote('')
        },
    })

    const handleSelectCase = (id: string) => {
        setSelectedCaseId(id)
        queryClient.invalidateQueries({ queryKey: ['investigations', 'cases', id] })
    }

    const handleAddNote = () => {
        if (!newNote.trim() || !selectedCaseId) return
        noteMutation.mutate({ caseId: selectedCaseId, content: newNote })
    }

    const handleUpdateStatus = (
        status: 'open' | 'investigating' | 'resolved' | 'escalated',
        resolution?: 'confirmed_fraud' | 'false_positive' | 'monitor'
    ) => {
        if (!selectedCaseId) return
        statusMutation.mutate({ caseId: selectedCaseId, status, resolution })
    }

    const filteredCases = cases.filter((c) => {
        const s = searchValue.toLowerCase()
        return (
            c.valueHash?.toLowerCase().includes(s) ||
            c.type.toLowerCase().includes(s) ||
            c.id.toLowerCase().includes(s)
        )
    })

    const inv = t.investigation

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-3xl font-heading font-bold">
                    {inv?.title ?? 'Investigação de Casos'}
                </h2>
                <p className="text-muted-foreground">
                    {inv?.subtitle ?? 'Análise profunda de casos suspeitos'}
                </p>
            </div>

            {casesQuery.isLoading ? (
                <Card>
                    <CardContent className="p-10 flex items-center justify-center gap-3 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>{inv?.loading ?? 'Carregando casos...'}</span>
                    </CardContent>
                </Card>
            ) : cases.length === 0 ? (
                <Card>
                    <CardContent className="p-10 text-center">
                        <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">
                            {inv?.noCases ?? 'Nenhum caso disponível'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Modal with cases list */}
                    <Dialog open={casesModalOpen} onOpenChange={setCasesModalOpen}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>
                                    {inv?.searchPlaceholder ?? 'Buscar casos...'}
                                </DialogTitle>
                            </DialogHeader>

                            {/* Filters */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                        placeholder={inv?.searchPlaceholder ?? 'Buscar...'}
                                        className="pl-9"
                                    />
                                </div>
                                <div className="relative w-[140px]">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    <Input
                                        type="date"
                                        value={caseStartDate}
                                        onChange={(e) => setCaseStartDate(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="relative w-[140px]">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    <Input
                                        type="date"
                                        value={caseEndDate}
                                        onChange={(e) => setCaseEndDate(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                {(caseStartDate || caseEndDate) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setCaseStartDate('')
                                            setCaseEndDate('')
                                        }}
                                    >
                                        Limpar
                                    </Button>
                                )}
                            </div>

                            <ScrollArea className="max-h-[60vh] pr-4">
                                <div className="space-y-1.5">
                                    {(searchValue ? filteredCases : cases).filter((c) => {
                                        const caseDate = new Date(c.lastSeen)
                                        if (caseStartDate) {
                                            const startDate = new Date(caseStartDate)
                                            startDate.setHours(0, 0, 0, 0)
                                            if (caseDate < startDate) return false
                                        }
                                        if (caseEndDate) {
                                            const endDate = new Date(caseEndDate)
                                            endDate.setHours(23, 59, 59, 999)
                                            if (caseDate > endDate) return false
                                        }
                                        return true
                                    }).length > 0 ? (
                                        (searchValue ? filteredCases : cases)
                                            .filter((c) => {
                                                const caseDate = new Date(c.lastSeen)
                                                if (caseStartDate) {
                                                    const startDate = new Date(caseStartDate)
                                                    startDate.setHours(0, 0, 0, 0)
                                                    if (caseDate < startDate) return false
                                                }
                                                if (caseEndDate) {
                                                    const endDate = new Date(caseEndDate)
                                                    endDate.setHours(23, 59, 59, 999)
                                                    if (caseDate > endDate) return false
                                                }
                                                return true
                                            })
                                            .map((c) => (
                                                <CaseListItem
                                                    key={c.id}
                                                    c={c}
                                                    selected={selectedCaseId === c.id}
                                                    onClick={() => {
                                                        handleSelectCase(c.id)
                                                        setCasesModalOpen(false)
                                                    }}
                                                />
                                            ))
                                    ) : (
                                        <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">
                                            {inv?.noResults ?? 'Nenhum caso encontrado'}
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </DialogContent>
                    </Dialog>

                    {/* Main content area */}
                    {selectedCase ? (
                        <div className="space-y-4 min-w-0">
                            {/* Header with cases button */}
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="text-lg font-semibold">
                                    {inv?.caseDetails ?? 'Detalhes do Caso'}
                                </h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCasesModalOpen(true)}
                                    className="gap-2"
                                >
                                    <Menu className="h-4 w-4" />
                                    {inv?.cases} ({cases.length})
                                </Button>
                            </div>

                            {/* Case header */}
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                        <div className="space-y-2 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge
                                                    variant="outline"
                                                    className="font-mono text-sm shrink-0"
                                                >
                                                    {selectedCase.type.toUpperCase()}
                                                </Badge>
                                                <span className="font-mono text-base truncate">
                                                    {selectedCase.valueHash}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge
                                                    variant={decisionBadgeVariant(
                                                        selectedCase.currentDecision
                                                    )}
                                                >
                                                    {getDecisionText(
                                                        selectedCase.currentDecision,
                                                        t
                                                    )}
                                                </Badge>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        selectedCase.riskLevel === 'critical' &&
                                                            'text-decision-block border-decision-block/40',
                                                        selectedCase.riskLevel === 'high' &&
                                                            'text-decision-review border-decision-review/40'
                                                    )}
                                                >
                                                    <span className="text-muted-foreground mr-1">
                                                        {t.common?.riskLabel ?? 'Risco'}:
                                                    </span>
                                                    {getRiskLevelText(selectedCase.riskLevel, t)}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {getStatusText(selectedCase.status, t)}
                                                </Badge>
                                                <span
                                                    className={cn(
                                                        'text-sm font-mono font-bold',
                                                        riskColor(selectedCase.currentScore)
                                                    )}
                                                >
                                                    {(selectedCase.currentScore * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                                <span>
                                                    {inv?.firstSeen ?? 'Primeira vez'}:{' '}
                                                    {new Date(
                                                        selectedCase.firstSeen
                                                    ).toLocaleDateString()}
                                                </span>
                                                <span>
                                                    {inv?.lastSeen ?? 'Última vez'}:{' '}
                                                    {new Date(
                                                        selectedCase.lastSeen
                                                    ).toLocaleDateString()}
                                                </span>
                                                <span>
                                                    {selectedCase.totalOccurrences}{' '}
                                                    {inv?.occurrencesCount ?? 'ocorrências'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-xs text-muted-foreground mb-1">
                                                Status
                                            </p>
                                            <Badge variant="outline">
                                                {getStatusText(selectedCase.status, t)}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleUpdateStatus('investigating')}
                                            disabled={
                                                statusMutation.isPending ||
                                                selectedCase.status === 'investigating'
                                            }
                                        >
                                            Em análise
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleUpdateStatus('escalated')}
                                            disabled={
                                                statusMutation.isPending ||
                                                selectedCase.status === 'escalated'
                                            }
                                        >
                                            Escalar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleUpdateStatus('resolved', 'false_positive')
                                            }
                                            disabled={statusMutation.isPending}
                                        >
                                            Resolver legítimo
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleUpdateStatus('resolved', 'confirmed_fraud')
                                            }
                                            disabled={statusMutation.isPending}
                                        >
                                            Confirmar fraude
                                        </Button>
                                        {statusMutation.isPending && (
                                            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                Atualizando status...
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Scoring breakdown */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    {
                                        label: inv?.validationScore ?? 'Validação',
                                        value: selectedCase.scoring.validation,
                                    },
                                    {
                                        label: inv?.historyScore ?? 'Histórico',
                                        value: selectedCase.scoring.history,
                                    },
                                    {
                                        label: inv?.patternScore ?? 'Padrão',
                                        value: selectedCase.scoring.pattern,
                                    },
                                    {
                                        label: inv?.graphScore ?? 'Grafo',
                                        value: selectedCase.scoring.graph,
                                    },
                                ].map(({ label, value }) => (
                                    <Card key={label}>
                                        <CardContent className="p-3 text-center">
                                            <p className="text-xs text-muted-foreground mb-1">
                                                {label}
                                            </p>
                                            <p
                                                className={cn(
                                                    'text-xl font-bold font-mono',
                                                    riskColor(value)
                                                )}
                                            >
                                                {(value * 100).toFixed(0)}%
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Tabs: Timeline / Connections / Similar / Notes */}
                            <Tabs defaultValue="timeline">
                                <TabsList className="w-full grid grid-cols-4">
                                    <TabsTrigger
                                        value="timeline"
                                        className="flex items-center gap-1.5 text-xs"
                                    >
                                        <History className="h-3.5 w-3.5" />
                                        {inv?.timeline ?? 'Timeline'}
                                        {selectedCase.timeline.length > 0 && (
                                            <Badge
                                                variant="secondary"
                                                className="text-xs px-1 py-0 ml-1"
                                            >
                                                {selectedCase.timeline.length}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="connections"
                                        className="flex items-center gap-1.5 text-xs"
                                    >
                                        <ChevronRight className="h-3.5 w-3.5" />
                                        {inv?.connections ?? 'Conexões'}
                                        {selectedCase.connections.length > 0 && (
                                            <Badge
                                                variant="secondary"
                                                className="text-xs px-1 py-0 ml-1"
                                            >
                                                {selectedCase.connections.length}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="similar"
                                        className="flex items-center gap-1.5 text-xs"
                                    >
                                        <Search className="h-3.5 w-3.5" />
                                        {inv?.similarCases ?? 'Similares'}
                                        {selectedCase.similarCases.length > 0 && (
                                            <Badge
                                                variant="secondary"
                                                className="text-xs px-1 py-0 ml-1"
                                            >
                                                {selectedCase.similarCases.length}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="notes"
                                        className="flex items-center gap-1.5 text-xs"
                                    >
                                        <MessageSquare className="h-3.5 w-3.5" />
                                        {inv?.notes ?? 'Notas'}
                                        {localNotes.length > 0 && (
                                            <Badge
                                                variant="secondary"
                                                className="text-xs px-1 py-0 ml-1"
                                            >
                                                {localNotes.length}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="timeline">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm">
                                                {inv?.completeHistory ?? 'Histórico Completo'}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {selectedCase.timeline.length === 0 ? (
                                                <p className="text-sm text-muted-foreground py-4 text-center">
                                                    {casesQuery.isFetching ? (
                                                        <span className="flex items-center justify-center gap-2">
                                                            <Loader2 className="h-4 w-4 animate-spin" />{' '}
                                                            Carregando...
                                                        </span>
                                                    ) : (
                                                        'Nenhum evento registrado'
                                                    )}
                                                </p>
                                            ) : (
                                                <ScrollArea className="h-[360px] pr-3">
                                                    <div className="pt-2">
                                                        {selectedCase.timeline.map((event) => (
                                                            <TimelineItem
                                                                key={event.id}
                                                                event={event}
                                                            />
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="connections">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm">
                                                {inv?.connectedIdentities ??
                                                    'Identidades Conectadas'}
                                            </CardTitle>
                                            <CardDescription className="text-xs">
                                                {inv?.connectedIdentitiesDesc ??
                                                    'Outros valores vinculados a esta identidade'}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {selectedCase.connections.length === 0 ? (
                                                <p className="text-sm text-muted-foreground py-4 text-center">
                                                    Nenhuma conexão encontrada
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {selectedCase.connections.map((conn) => (
                                                        <ConnectionCard
                                                            key={conn.id}
                                                            connection={conn}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="similar">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm">
                                                {inv?.similarCases ?? 'Casos Similares'}
                                            </CardTitle>
                                            <CardDescription className="text-xs">
                                                {inv?.similarCasesDesc ??
                                                    'Casos com padrões e características similares'}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {selectedCase.similarCases.length === 0 ? (
                                                <p className="text-sm text-muted-foreground py-4 text-center">
                                                    Nenhum caso similar encontrado
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {selectedCase.similarCases.map((sc) => (
                                                        <SimilarCaseCard key={sc.id} case_={sc} />
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="notes">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm flex items-center gap-2">
                                                <MessageSquare className="h-4 w-4" />
                                                {inv?.analystNotes ?? 'Notas do Analista'}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex gap-2">
                                                <Textarea
                                                    value={newNote}
                                                    onChange={(e) => setNewNote(e.target.value)}
                                                    placeholder={
                                                        inv?.writeNote ?? 'Escreva uma nota...'
                                                    }
                                                    rows={3}
                                                    className="resize-none"
                                                    onKeyDown={(e) => {
                                                        if (
                                                            e.key === 'Enter' &&
                                                            (e.ctrlKey || e.metaKey)
                                                        )
                                                            handleAddNote()
                                                    }}
                                                />
                                                <Button
                                                    size="icon"
                                                    onClick={handleAddNote}
                                                    disabled={
                                                        !newNote.trim() || noteMutation.isPending
                                                    }
                                                    className="shrink-0 self-end"
                                                >
                                                    {noteMutation.isPending ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Send className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                            <ScrollArea className="h-[280px]">
                                                {localNotes.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground text-center py-8">
                                                        Nenhuma nota ainda
                                                    </p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {localNotes.map((note) => (
                                                            <div
                                                                key={note.id}
                                                                className="p-3 rounded-lg bg-secondary/50"
                                                            >
                                                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                                                                    <span className="font-medium">
                                                                        {note.author}
                                                                    </span>
                                                                    <span>
                                                                        {new Date(
                                                                            note.timestamp
                                                                        ).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm">
                                                                    {note.content}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>

                            {/* Patterns */}
                            {selectedCase.patterns.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">
                                            Padrões Detectados
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedCase.patterns.map((p) => (
                                                <Badge
                                                    key={p}
                                                    variant="outline"
                                                    className="text-xs text-decision-review border-decision-review/40"
                                                >
                                                    {p}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-10 flex items-center justify-center text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                <span>Carregando detalhes...</span>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    )
}
