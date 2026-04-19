import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { DecisionDetailsModal } from '@/components/decisions/DecisionDetailsModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useLanguage } from '@/contexts/LanguageContext'
import { Filter, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import type { RiskDecision } from '@/types'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { decisionApi } from '@/services/api'
import { formatReason } from '@/constants/reasonCatalog'

export function DecisionsPage() {
    const { t, language } = useLanguage()
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [items, setItems] = useState<RiskDecision[]>([])
    const [total, setTotal] = useState(0)
    const [decisionFilter, setDecisionFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [selectedDecision, setSelectedDecision] = useState<RiskDecision | null>(null)

    const decisionsQuery = useQuery<{ items: RiskDecision[]; total: number }>({
        queryKey: ['decisions', page, decisionFilter, typeFilter, pageSize],
        queryFn: () =>
            decisionApi.list({
                page,
                limit: pageSize,
                decision:
                    decisionFilter === 'all'
                        ? undefined
                        : (decisionFilter as 'allow' | 'review' | 'block'),
                type: typeFilter === 'all' ? undefined : typeFilter,
            }),
        placeholderData: keepPreviousData,
    })

    useEffect(() => {
        if (!decisionsQuery.data) return
        setItems(decisionsQuery.data.items)
        setTotal(decisionsQuery.data.total)
    }, [decisionsQuery.data])

    useEffect(() => {
        setPage(1)
    }, [decisionFilter, typeFilter, pageSize])

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / (1000 * 60))

        if (diffMins < 1) return t.common.now
        if (diffMins < 60) return `${diffMins}${t.common.minutesShort}`
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}${t.common.hoursShort}`
        return `${Math.floor(diffMins / 1440)}${t.common.daysShort}`
    }

    const totalPages = Math.max(1, Math.ceil(total / pageSize))
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

    return (
        <div className="flex h-full flex-col gap-6">
            <div>
                <h2 className="text-3xl font-heading font-bold">{t.decisionsPage.title}</h2>
                <p className="text-muted-foreground">{t.decisionsPage.subtitle}</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                <Select value={decisionFilter} onValueChange={setDecisionFilter}>
                    <SelectTrigger className="w-[140px] pl-10">
                        <Filter className="absolute left-3 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder={t.decisionsPage.decisionFilter} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t.common.all}</SelectItem>
                        <SelectItem value="allow">{t.decisions.allow}</SelectItem>
                        <SelectItem value="review">{t.decisions.review}</SelectItem>
                        <SelectItem value="block">{t.decisions.block}</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t.common.all}</SelectItem>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="ip">IP</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <ScrollArea className="flex-1 min-h-0">
                <div className="grid grid-cols-2 gap-3 pr-4 pb-6">
                    {items.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <p className="text-muted-foreground">{t.decisionsPage.noResults}</p>
                            </CardContent>
                        </Card>
                    ) : (
                        items.map((decision) => (
                            <Card
                                key={decision.id}
                                className="cursor-pointer hover:bg-muted/40 transition-colors"
                                onClick={() => setSelectedDecision(decision)}
                            >
                                <div className="p-3 space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                                            <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                #{decision.id.slice(0, 8)}
                                            </span>
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {decision.type.toUpperCase()}
                                            </Badge>
                                            {decision.use_case && (
                                                <Badge variant="secondary" className="font-mono text-xs">
                                                    {decision.use_case}
                                                </Badge>
                                            )}
                                            <Badge
                                                className={`text-xs font-semibold uppercase ${
                                                    decision.decision === 'block'
                                                        ? 'bg-decision-block/10 text-decision-block border-decision-block/30'
                                                        : decision.decision === 'review'
                                                          ? 'bg-decision-review/10 text-decision-review border-decision-review/30'
                                                          : 'bg-decision-allow/10 text-decision-allow border-decision-allow/30'
                                                }`}
                                                variant="outline"
                                            >
                                                {decision.decision === 'block'
                                                    ? 'Bloqueado'
                                                    : decision.decision === 'review'
                                                      ? 'Em revisao'
                                                      : 'Aprovado'}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-col items-end shrink-0">
                                            <span className="text-[10px] text-muted-foreground">
                                                Score
                                            </span>
                                            <span className="text-lg font-bold text-foreground">
                                                {decision.score.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 text-xs">
                                        <span className="font-mono text-muted-foreground truncate max-w-[260px]">
                                            {decision.valueHash.slice(0, 18)}...
                                        </span>
                                        <span className="text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                                            <Clock className="h-3 w-3" />
                                            {formatTime(decision.created_at)}
                                        </span>
                                    </div>

                                    {(decision.patterns_detected.length > 0 ||
                                        decision.explanation?.top_drivers?.[0]) && (
                                        <div className="flex items-center gap-2 flex-wrap text-xs pt-2 border-t border-border/30">
                                            {decision.patterns_detected.length > 0 && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {decision.patterns_detected.length} padrao
                                                    {decision.patterns_detected.length === 1
                                                        ? ''
                                                        : 's'}{' '}
                                                    de risco
                                                </Badge>
                                            )}
                                            {decision.explanation?.top_drivers?.[0] && (
                                                <span className="text-muted-foreground text-xs truncate">
                                                    {formatReason(
                                                        decision.explanation.top_drivers[0].label,
                                                        language
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </ScrollArea>

            <div className="flex items-center justify-center gap-2 pb-6">
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
                <Button
                    variant="outline"
                    size="icon"
                    disabled={page === 1 || decisionsQuery.isFetching}
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
                        disabled={decisionsQuery.isFetching}
                        onClick={() => setPage(p)}
                    >
                        {p}
                    </Button>
                ))}
                <Button
                    variant="outline"
                    size="icon"
                    disabled={page === totalPages || decisionsQuery.isFetching}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="ml-2 text-xs text-muted-foreground font-mono">
                    {page}/{totalPages}
                </span>
            </div>

            <DecisionDetailsModal
                open={!!selectedDecision}
                onOpenChange={() => setSelectedDecision(null)}
                decision={selectedDecision}
            />
        </div>
    )
}
