import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { DecisionBadge, RiskBadge } from '@/components/dashboard/RiskIndicators'
import { DecisionDetailsModal } from '@/components/decisions/DecisionDetailsModal'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { formatReason } from '@/constants/reasonCatalog'
import { Search, Filter, Clock, CheckCircle, User, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReviewCase } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { decisionApi, reviewApi } from '@/services/api'
import { getRecommendationAction } from '@/utils/decisionRecommendation'

function getItemLabel(reviewCase: Pick<ReviewCase, 'item_ref' | 'valueHash'>) {
    return reviewCase.item_ref || reviewCase.valueHash
}

export function ReviewQueuePage() {
    const { t, language } = useLanguage()
    const { isAdmin, user } = useAuth()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState('score')
    const [filterType, setFilterType] = useState('all')
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [selectedDecision, setSelectedDecision] = useState<ReviewCase | null>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [revealedValue, setRevealedValue] = useState<string | null>(null)
    const [isRevealing, setIsRevealing] = useState(false)

    const queueQuery = useQuery({
        queryKey: ['review-queue', sortBy, filterType, page, pageSize],
        queryFn: () =>
            reviewApi.getQueue({
                page,
                limit: pageSize,
                sortBy,
                type: filterType === 'all' ? undefined : filterType,
            }),
    })

    const decideMutation = useMutation({
        mutationFn: ({
            id,
            decision,
        }: {
            id: string
            decision: 'approved' | 'blocked' | 'escalated'
        }) => reviewApi.decide(id, decision),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['review-queue'] })
        },
    })

    const assignMutation = useMutation({
        mutationFn: ({ id, userId }: { id: string; userId: string }) =>
            reviewApi.assign(id, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['review-queue'] })
        },
    })

    const cases = queueQuery.data?.items ?? []

    const filteredCases = useMemo(() => {
        return cases
            .filter((c) => {
                if (filterType !== 'all' && c.type !== filterType) return false
                if (searchQuery) {
                    const query = searchQuery.toLowerCase()
                    return (
                        c.id.toLowerCase().includes(query) ||
                        (c.item_ref || '').toLowerCase().includes(query) ||
                        c.valueHash.toLowerCase().includes(query) ||
                        c.type.toLowerCase().includes(query)
                    )
                }
                return true
            })
            .sort((a, b) => {
                if (sortBy === 'score') return b.score - a.score
                if (sortBy === 'time')
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                if (sortBy === 'priority') return a.priority - b.priority
                return 0
            })
    }, [cases, filterType, searchQuery, sortBy])

    const pendingCount = queueQuery.data?.total ?? cases.length
    const myAssignedCount = cases.filter((c) => c.assignee === user?.id).length
    const totalPages = Math.max(1, Math.ceil((queueQuery.data?.total ?? cases.length) / pageSize))
    const visiblePages = useMemo(() => {
        const maxVisible = 5
        let start = Math.max(1, page - Math.floor(maxVisible / 2))
        let end = Math.min(totalPages, start + maxVisible - 1)
        start = Math.max(1, end - maxVisible + 1)
        return Array.from({ length: end - start + 1 }, (_, i) => start + i)
    }, [page, totalPages])

    useEffect(() => {
        if (page > totalPages) setPage(totalPages)
    }, [page, totalPages])

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / (1000 * 60))

        if (diffMins < 60) return `${diffMins} ${t.common.minutes}`
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)} ${t.common.hours}`
        return `${Math.floor(diffMins / 1440)} ${t.common.days}`
    }

    const openDecision = (decision: ReviewCase) => {
        setSelectedDecision(decision)
        setModalOpen(true)
        setRevealedValue(null)
    }

    const handleModalChange = (open: boolean) => {
        setModalOpen(open)
        if (!open) {
            setSelectedDecision(null)
            setRevealedValue(null)
            setIsRevealing(false)
        }
    }

    const handleToggleReveal = async () => {
        if (!selectedDecision) return
        if (revealedValue) {
            setRevealedValue(null)
            return
        }

        setIsRevealing(true)
        try {
            const res = await decisionApi.reveal(selectedDecision.id)
            if (res?.available && res.value) {
                setRevealedValue(res.value)
            } else {
                toast({
                    description: t.reviewQueue.revealUnavailable,
                    variant: 'warning',
                })
            }
        } catch {
            toast({
                description: t.reviewQueue.revealUnavailable,
                variant: 'warning',
            })
        } finally {
            setIsRevealing(false)
        }
    }

    const handleDecide = (decision: 'approved' | 'blocked' | 'escalated') => {
        if (!selectedDecision) return
        decideMutation.mutate(
            { id: selectedDecision.id, decision },
            {
                onSuccess: () => {
                    handleModalChange(false)
                },
            }
        )
    }

    const handleAssignToMe = (id: string) => {
        if (!user?.id) return
        assignMutation.mutate({ id, userId: user.id })
    }

    return (
        <div className="flex h-full flex-col gap-6">
            <div>
                <h2 className="text-3xl font-heading font-bold">{t.reviewQueue.title}</h2>
                <p className="text-muted-foreground">{t.reviewQueue.subtitle}</p>
            </div>

            <div className="flex items-center gap-4">
                <Card className="flex-1">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">{t.reviewQueue.pending}</p>
                            <p className="text-2xl font-bold">{pendingCount}</p>
                        </div>
                        <Clock className="h-8 w-8 text-decision-review opacity-50" />
                    </CardContent>
                </Card>
                <Card className="flex-1">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {t.reviewQueue.myAssigned}
                            </p>
                            <p className="text-2xl font-bold">{myAssignedCount}</p>
                        </div>
                        <User className="h-8 w-8 text-primary opacity-50" />
                    </CardContent>
                </Card>
                <Card className="flex-1">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {t.reviewQueue.resolvedToday}
                            </p>
                            <p className="text-2xl font-bold">—</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-decision-allow opacity-50" />
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t.common.search + '...'}
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select
                    value={filterType}
                    onValueChange={(value) => {
                        setFilterType(value)
                        setPage(1)
                    }}
                >
                    <SelectTrigger className="w-[150px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder={t.reviewQueue.type} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t.reviewQueue.typeAll}</SelectItem>
                        <SelectItem value="cpf">{t.reviewQueue.typeCpf}</SelectItem>
                        <SelectItem value="cnpj">{t.reviewQueue.typeCnpj}</SelectItem>
                        <SelectItem value="email">{t.reviewQueue.typeEmail}</SelectItem>
                        <SelectItem value="phone">{t.reviewQueue.typePhone}</SelectItem>
                        <SelectItem value="ip">{t.reviewQueue.typeIp}</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={sortBy}
                    onValueChange={(value) => {
                        setSortBy(value)
                        setPage(1)
                    }}
                >
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder={t.reviewQueue.sortBy} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="score">{t.reviewQueue.score}</SelectItem>
                        <SelectItem value="time">{t.reviewQueue.time}</SelectItem>
                        <SelectItem value="priority">{t.reviewQueue.priority}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <ScrollArea className="flex-1 min-h-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pr-4 pb-6">
                    {filteredCases.length === 0 ? (
                        <Card className="col-span-full">
                            <CardContent className="p-8 text-center">
                                <CheckCircle className="h-12 w-12 text-decision-allow mx-auto mb-4 opacity-50" />
                                <p className="text-muted-foreground">{t.reviewQueue.noResults}</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredCases.map((reviewCase) => (
                            <Card
                                key={reviewCase.id}
                                className="cursor-pointer hover:bg-muted/40 transition-colors"
                                onClick={() => openDecision(reviewCase)}
                            >
                                <div className="p-3 space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                                            <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                #
                                                {reviewCase.id.split('_')[1] ||
                                                    reviewCase.id.slice(0, 8)}
                                            </span>
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {reviewCase.type.toUpperCase()}
                                            </Badge>
                                            {reviewCase.use_case && (
                                                <Badge variant="secondary" className="font-mono text-xs">
                                                    {reviewCase.use_case}
                                                </Badge>
                                            )}
                                            <DecisionBadge decision={reviewCase.decision} />
                                            <span className="text-[10px] uppercase text-muted-foreground">
                                                {t.common?.riskLabel ?? 'Risco'}:
                                            </span>
                                            <RiskBadge level={reviewCase.riskLevel} />
                                        </div>
                                        <div className="flex flex-col items-end shrink-0">
                                            <span className="text-[10px] text-muted-foreground">
                                                {t.reviewQueue.scoreLabel}
                                            </span>
                                            <span className="text-lg font-semibold">
                                                {reviewCase.score.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 text-xs">
                                        <span className="font-mono text-muted-foreground truncate max-w-[260px]">
                                            {getItemLabel(reviewCase)}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {reviewCase.assignee === user?.id ? (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] uppercase"
                                                >
                                                    {t.reviewQueue.myAssigned}
                                                </Badge>
                                            ) : user?.id ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-6 px-2 text-[10px]"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleAssignToMe(reviewCase.id)
                                                    }}
                                                    disabled={assignMutation.isPending}
                                                >
                                                    Atribuir para mim
                                                </Button>
                                            ) : null}
                                            <span className="text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                                                <Clock className="h-3 w-3" />
                                                {formatTime(reviewCase.created_at)} {t.common.ago}
                                            </span>
                                        </div>
                                    </div>

                                    {(reviewCase.explanation?.top_drivers?.[0] ||
                                        reviewCase.explanation) && (
                                        <div className="flex items-center gap-2 flex-wrap text-xs pt-2 border-t border-border/30">
                                            {reviewCase.explanation &&
                                                (() => {
                                                    const recommendationAction =
                                                        getRecommendationAction(
                                                            reviewCase.explanation
                                                        )
                                                    if (!recommendationAction) return null
                                                    return (
                                                        <Badge
                                                            variant={
                                                                recommendationAction === 'block'
                                                                    ? 'destructive'
                                                                    : 'default'
                                                            }
                                                            className="capitalize text-xs"
                                                        >
                                                            {t.reviewQueue.recommendationAction}:{' '}
                                                            {recommendationAction === 'block'
                                                                ? t.reviewQueue.actions.block
                                                                : recommendationAction === 'approve'
                                                                  ? t.reviewQueue.actions.approve
                                                                  : t.decisions.review}
                                                        </Badge>
                                                    )
                                                })()}
                                            {reviewCase.explanation?.top_drivers?.[0] && (
                                                <span className="text-muted-foreground text-xs truncate">
                                                    {formatReason(
                                                        reviewCase.explanation.top_drivers[0].label,
                                                        language
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {reviewCase.explanation &&
                                    reviewCase.explanation.thresholds.review_start !== null &&
                                    reviewCase.explanation.thresholds.review_end !== null && (
                                        <div className="px-3 pb-3">
                                            <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="absolute top-0 bottom-0 w-0.5 bg-decision-review"
                                                    style={{
                                                        left: `${reviewCase.explanation.thresholds.review_start * 100}%`,
                                                    }}
                                                />
                                                <div
                                                    className="absolute top-0 bottom-0 w-0.5 bg-decision-block"
                                                    style={{
                                                        left: `${reviewCase.explanation.thresholds.review_end * 100}%`,
                                                    }}
                                                />
                                                <div
                                                    className="absolute -top-0.5 h-2.5 w-1.5 bg-primary rounded-full"
                                                    style={{ left: `${reviewCase.score * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                            </Card>
                        ))
                    )}
                </div>
            </ScrollArea>

            <div className="flex items-center justify-center pb-6">
                <div className="flex items-center gap-2">
                    <Select
                        value={String(pageSize)}
                        onValueChange={(value) => {
                            setPageSize(Number(value))
                            setPage(1)
                        }}
                    >
                        <SelectTrigger className="w-[110px] h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[10, 20, 30, 50].map((size) => (
                                <SelectItem key={size} value={String(size)}>
                                    {size}/pag
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={page === 1 || queueQuery.isFetching}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {visiblePages.map((p) => (
                            <Button
                                key={p}
                                variant={p === page ? 'default' : 'outline'}
                                size="sm"
                                disabled={queueQuery.isFetching}
                                onClick={() => setPage(p)}
                            >
                                {p}
                            </Button>
                        ))}
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={page === totalPages || queueQuery.isFetching}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            aria-label="Next page"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <span className="ml-2 text-xs text-muted-foreground font-mono">
                            {page}/{totalPages}
                        </span>
                    </div>
                </div>
            </div>

            <DecisionDetailsModal
                open={modalOpen}
                onOpenChange={handleModalChange}
                decision={selectedDecision}
                reveal={
                    selectedDecision
                        ? {
                              canReveal: isAdmin,
                              isRevealing,
                              revealedValue,
                              onToggleReveal: handleToggleReveal,
                          }
                        : undefined
                }
                actions={
                    selectedDecision
                        ? {
                              onApprove: () => handleDecide('approved'),
                              onBlock: () => handleDecide('blocked'),
                          }
                        : undefined
                }
            />
        </div>
    )
}
