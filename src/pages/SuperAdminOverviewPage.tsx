import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    BarChart3,
    Building2,
    CheckCircle2,
    Clock3,
    Gauge,
    Layers3,
    Loader2,
    RefreshCw,
    Server,
    ShieldAlert,
    TrendingUp,
    Users,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { accountsApi, dashboardApi, monitoringApi, plansApi } from '@/services/api'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import type { DashboardStats, Plan } from '@/types'

const emptyStats: DashboardStats = {
    total_decisions_today: 0,
    total_decisions_week: 0,
    total_decisions_month: 0,
    pending_reviews: 0,
    blocked_today: 0,
    allowed_today: 0,
    avg_latency_ms: 0,
    p95_latency_ms: 0,
    false_positive_rate: 0,
    decisions_by_hour: [],
    decisions_by_type: [],
    risk_distribution: [],
    pattern_distribution: [],
}

function formatCompactNumber(value: number, locale: 'pt-BR' | 'en') {
    return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'pt-BR').format(value)
}

function formatPercent(value: number, locale: 'pt-BR' | 'en', fractionDigits = 1) {
    return `${new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'pt-BR', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    }).format(value)}%`
}

function formatMs(value: number, locale: 'pt-BR' | 'en') {
    return `${new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'pt-BR', {
        maximumFractionDigits: 0,
    }).format(value)} ms`
}

function HealthBadge({
    status,
    labels,
}: {
    status: 'healthy' | 'degraded' | 'critical'
    labels: { healthy: string; degraded: string; critical: string }
}) {
    const map = {
        healthy: {
            label: labels.healthy,
            className:
                'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        },
        degraded: {
            label: labels.degraded,
            className: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        },
        critical: {
            label: labels.critical,
            className: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
        },
    } as const

    return <Badge className={map[status].className}>{map[status].label}</Badge>
}

export function SuperAdminOverviewPage() {
    const { language } = useLanguage()

    const copy =
        language === 'en'
            ? {
                  title: 'System dashboard',
                  subtitle:
                      'Global visibility for the Scora platform, tenant base and runtime health.',
                  refresh: 'Refresh',
                  tenants: 'Tenants',
                  activeTenants: 'Active tenants',
                  withPlan: 'With active plan',
                  pendingOnboarding: 'Pending onboarding',
                  plans: 'Plans',
                  activePlans: 'Active plans',
                  customPlans: 'Custom plans',
                  assignedPlans: 'Assigned plans',
                  healthTitle: 'API and runtime health',
                  healthDescription:
                      'Live operational posture for the platform endpoints and processing pipeline.',
                  systemHealthy: 'Healthy',
                  systemDegraded: 'Degraded',
                  systemCritical: 'Critical',
                  avgLatency: 'Average latency',
                  p95: 'P95 latency',
                  p99: 'P99 latency',
                  rpm: 'Requests / minute',
                  errors: 'Error rate',
                  productTitle: 'Risk operations volume',
                  productDescription:
                      'Global decision throughput and review pressure across the platform.',
                  decisionsToday: 'Decisions today',
                  decisionsWeek: 'Decisions this week',
                  decisionsMonth: 'Decisions this month',
                  pendingReviews: 'Pending reviews',
                  falsePositive: 'False positive rate',
                  blockedToday: 'Blocked today',
                  allowedToday: 'Allowed today',
                  components: 'Components',
                  componentsDescription: 'Each service surfaced by the monitoring endpoint.',
                  latency: 'Latency',
                  alerts: 'Operational alerts',
                  alertsDescription: 'Current warnings emitted by monitoring.',
                  noAlerts: 'No active alerts right now.',
                  topPlans: 'Tenant distribution by plan',
                  topPlansDescription: 'Commercial footprint of the current tenant base.',
                  noPlan: 'No plan',
                  tenantsCount: 'tenants',
                  quickActions: 'Quick actions',
                  quickActionsDescription:
                      'Jump into the operational areas most used by super-admins.',
                  manageTenants: 'Manage tenants',
                  manageTenantsDescription: 'Provision, onboard and control tenant state.',
                  managePlans: 'Manage plans',
                  managePlansDescription: 'Adjust catalog, quotas and pricing rules.',
                  reviewProfile: 'Review profile',
                  reviewProfileDescription:
                      'Validate the authenticated super-admin identity and access details.',
              }
            : {
                  title: 'Dashboard do sistema',
                  subtitle:
                      'Visibilidade global da plataforma Scora, da base de tenants e da saúde operacional.',
                  refresh: 'Atualizar',
                  tenants: 'Tenants',
                  activeTenants: 'Tenants ativos',
                  withPlan: 'Com plano ativo',
                  pendingOnboarding: 'Onboarding pendente',
                  plans: 'Planos',
                  activePlans: 'Planos ativos',
                  customPlans: 'Planos customizados',
                  assignedPlans: 'Planos atribuídos',
                  healthTitle: 'Saúde da API e da operação',
                  healthDescription:
                      'Postura operacional em tempo real dos endpoints e do pipeline de processamento.',
                  systemHealthy: 'Saudável',
                  systemDegraded: 'Degradado',
                  systemCritical: 'Crítico',
                  avgLatency: 'Latência média',
                  p95: 'Latência P95',
                  p99: 'Latência P99',
                  rpm: 'Requests por minuto',
                  errors: 'Taxa de erro',
                  productTitle: 'Volume de operação de risco',
                  productDescription:
                      'Vazão global de decisões e pressão de revisão em toda a plataforma.',
                  decisionsToday: 'Decisões hoje',
                  decisionsWeek: 'Decisões na semana',
                  decisionsMonth: 'Decisões no mês',
                  pendingReviews: 'Revisões pendentes',
                  falsePositive: 'Taxa de falso positivo',
                  blockedToday: 'Bloqueadas hoje',
                  allowedToday: 'Aprovadas hoje',
                  components: 'Componentes',
                  componentsDescription: 'Cada serviço exposto pelo endpoint de monitoramento.',
                  latency: 'Latência',
                  alerts: 'Alertas operacionais',
                  alertsDescription: 'Avisos atuais emitidos pelo monitoramento.',
                  noAlerts: 'Nenhum alerta ativo no momento.',
                  topPlans: 'Distribuição de tenants por plano',
                  topPlansDescription: 'Pegada comercial da base atual de tenants.',
                  noPlan: 'Sem plano',
                  tenantsCount: 'tenants',
                  quickActions: 'Ações rápidas',
                  quickActionsDescription: 'Acesse as áreas mais usadas pelos super-admins.',
                  manageTenants: 'Gerir tenants',
                  manageTenantsDescription:
                      'Provisionar, ativar onboarding e controlar o estado dos tenants.',
                  managePlans: 'Gerir planos',
                  managePlansDescription: 'Ajustar catálogo, cotas e regras comerciais.',
                  reviewProfile: 'Revisar perfil',
                  reviewProfileDescription:
                      'Validar a identidade do super-admin autenticado e os detalhes de acesso.',
              }

    const accountsQuery = useQuery({
        queryKey: ['super-admin', 'accounts'],
        queryFn: () => accountsApi.getAll({ page: 1, limit: 100 }),
    })
    const plansQuery = useQuery({
        queryKey: ['super-admin', 'plans'],
        queryFn: plansApi.getAll,
    })
    const healthQuery = useQuery({
        queryKey: ['super-admin', 'health'],
        queryFn: monitoringApi.getHealth,
        refetchInterval: 30000,
    })
    const statsQuery = useQuery({
        queryKey: ['super-admin', 'dashboard-stats'],
        queryFn: () => dashboardApi.getStats(),
        refetchInterval: 30000,
    })

    const accounts = accountsQuery.data?.data ?? []
    const plans = plansQuery.data ?? []
    const health = healthQuery.data
    const stats = statsQuery.data ?? emptyStats
    const isRefreshing =
        accountsQuery.isFetching ||
        plansQuery.isFetching ||
        healthQuery.isFetching ||
        statsQuery.isFetching
    const isLoading =
        accountsQuery.isLoading ||
        plansQuery.isLoading ||
        healthQuery.isLoading ||
        statsQuery.isLoading

    const tenantStats = useMemo(
        () => ({
            total: accounts.length,
            active: accounts.filter((account) => account.active).length,
            withPlan: accounts.filter((account) => Boolean(account.plan_id)).length,
            pendingOnboarding: accounts.filter(
                (account) => Boolean(account.pending_invitation) || account.users_count === 0
            ).length,
        }),
        [accounts]
    )

    const planStats = useMemo(
        () => ({
            total: plans.length,
            active: plans.filter((plan) => plan.active).length,
            custom: plans.filter((plan) => plan.is_custom).length,
            assigned: plans.reduce((acc, plan) => acc + (plan.accounts_count ?? 0), 0),
        }),
        [plans]
    )

    const topPlans = useMemo(() => {
        const sorted = [...plans]
            .sort((a, b) => (b.accounts_count ?? 0) - (a.accounts_count ?? 0))
            .slice(0, 5)
        const noPlanCount = accounts.filter((account) => !account.plan_id).length

        if (noPlanCount > 0) {
            sorted.push({
                id: '__no_plan__',
                name: 'no-plan',
                display_name: copy.noPlan,
                price_monthly: null,
                monthly_requests: null,
                active: true,
                is_custom: false,
                accounts_count: noPlanCount,
                created_at: '',
                updated_at: '',
            } as Plan)
        }

        return sorted
    }, [accounts, copy.noPlan, plans])

    const componentStatusSummary = useMemo(
        () => ({
            healthy:
                health?.components.filter((component) => component.status === 'healthy').length ??
                0,
            degraded:
                health?.components.filter((component) => component.status === 'degraded').length ??
                0,
            critical:
                health?.components.filter((component) => component.status === 'critical').length ??
                0,
        }),
        [health]
    )

    const refetchAll = () => {
        accountsQuery.refetch()
        plansQuery.refetch()
        healthQuery.refetch()
        statsQuery.refetch()
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">{copy.title}</h1>
                    <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{copy.subtitle}</p>
                </div>
                <Button variant="outline" onClick={refetchAll} disabled={isRefreshing}>
                    <RefreshCw className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')} />
                    {copy.refresh}
                </Button>
            </div>

            {isLoading ? (
                <Card>
                    <CardContent className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <Card className="border-primary/20 bg-primary/5">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {copy.tenants}
                                        </p>
                                        <p className="mt-2 text-3xl font-semibold">
                                            {formatCompactNumber(tenantStats.total, language)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-primary/10 p-3 text-primary">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                </div>
                                <p className="mt-3 text-sm text-muted-foreground">
                                    {copy.activeTenants}:{' '}
                                    {formatCompactNumber(tenantStats.active, language)}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {copy.withPlan}
                                        </p>
                                        <p className="mt-2 text-3xl font-semibold">
                                            {formatCompactNumber(tenantStats.withPlan, language)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600">
                                        <Layers3 className="h-5 w-5" />
                                    </div>
                                </div>
                                <p className="mt-3 text-sm text-muted-foreground">
                                    {copy.pendingOnboarding}:{' '}
                                    {formatCompactNumber(tenantStats.pendingOnboarding, language)}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {copy.avgLatency}
                                        </p>
                                        <p className="mt-2 text-3xl font-semibold">
                                            {formatMs(
                                                health?.metrics.avg_processing_time_ms ?? 0,
                                                language
                                            )}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600">
                                        <Gauge className="h-5 w-5" />
                                    </div>
                                </div>
                                <p className="mt-3 text-sm text-muted-foreground">
                                    {copy.p95}:{' '}
                                    {formatMs(
                                        health?.metrics.p95_processing_time_ms ?? 0,
                                        language
                                    )}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {copy.healthTitle}
                                        </p>
                                        <div className="mt-2">
                                            <HealthBadge
                                                status={health?.status ?? 'healthy'}
                                                labels={{
                                                    healthy: copy.systemHealthy,
                                                    degraded: copy.systemDegraded,
                                                    critical: copy.systemCritical,
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="rounded-xl bg-sky-500/10 p-3 text-sky-600">
                                        <Server className="h-5 w-5" />
                                    </div>
                                </div>
                                <p className="mt-3 text-sm text-muted-foreground">
                                    {copy.errors}:{' '}
                                    {formatPercent(
                                        (health?.metrics.error_rate ?? 0) * 100,
                                        language,
                                        2
                                    )}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                        <Card>
                            <CardHeader>
                                <CardTitle>{copy.healthTitle}</CardTitle>
                                <CardDescription>{copy.healthDescription}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    <div className="rounded-xl border bg-card p-4">
                                        <div className="flex items-center gap-3">
                                            <Activity className="h-4 w-4 text-primary" />
                                            <span className="text-sm text-muted-foreground">
                                                {copy.avgLatency}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-2xl font-semibold">
                                            {formatMs(
                                                health?.metrics.avg_processing_time_ms ?? 0,
                                                language
                                            )}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border bg-card p-4">
                                        <div className="flex items-center gap-3">
                                            <Clock3 className="h-4 w-4 text-primary" />
                                            <span className="text-sm text-muted-foreground">
                                                {copy.p95}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-2xl font-semibold">
                                            {formatMs(
                                                health?.metrics.p95_processing_time_ms ?? 0,
                                                language
                                            )}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border bg-card p-4">
                                        <div className="flex items-center gap-3">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            <span className="text-sm text-muted-foreground">
                                                {copy.p99}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-2xl font-semibold">
                                            {formatMs(
                                                health?.metrics.p99_processing_time_ms ?? 0,
                                                language
                                            )}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border bg-card p-4">
                                        <div className="flex items-center gap-3">
                                            <BarChart3 className="h-4 w-4 text-primary" />
                                            <span className="text-sm text-muted-foreground">
                                                {copy.rpm}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-2xl font-semibold">
                                            {formatCompactNumber(
                                                health?.metrics.requests_per_minute ?? 0,
                                                language
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-3 md:grid-cols-3">
                                    <div className="rounded-xl border bg-muted/20 p-4">
                                        <p className="text-sm text-muted-foreground">
                                            {copy.systemHealthy}
                                        </p>
                                        <p className="mt-2 text-2xl font-semibold">
                                            {componentStatusSummary.healthy}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border bg-muted/20 p-4">
                                        <p className="text-sm text-muted-foreground">
                                            {copy.systemDegraded}
                                        </p>
                                        <p className="mt-2 text-2xl font-semibold">
                                            {componentStatusSummary.degraded}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border bg-muted/20 p-4">
                                        <p className="text-sm text-muted-foreground">
                                            {copy.systemCritical}
                                        </p>
                                        <p className="mt-2 text-2xl font-semibold">
                                            {componentStatusSummary.critical}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{copy.productTitle}</CardTitle>
                                <CardDescription>{copy.productDescription}</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-xl border bg-card p-4">
                                    <p className="text-sm text-muted-foreground">
                                        {copy.decisionsToday}
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold">
                                        {formatCompactNumber(stats.total_decisions_today, language)}
                                    </p>
                                </div>
                                <div className="rounded-xl border bg-card p-4">
                                    <p className="text-sm text-muted-foreground">
                                        {copy.pendingReviews}
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold">
                                        {formatCompactNumber(stats.pending_reviews, language)}
                                    </p>
                                </div>
                                <div className="rounded-xl border bg-card p-4">
                                    <p className="text-sm text-muted-foreground">
                                        {copy.decisionsWeek}
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold">
                                        {formatCompactNumber(stats.total_decisions_week, language)}
                                    </p>
                                </div>
                                <div className="rounded-xl border bg-card p-4">
                                    <p className="text-sm text-muted-foreground">
                                        {copy.decisionsMonth}
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold">
                                        {formatCompactNumber(stats.total_decisions_month, language)}
                                    </p>
                                </div>
                                <div className="rounded-xl border bg-card p-4">
                                    <p className="text-sm text-muted-foreground">
                                        {copy.falsePositive}
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold">
                                        {formatPercent(
                                            stats.false_positive_rate * 100,
                                            language,
                                            2
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-xl border bg-card p-4">
                                    <p className="text-sm text-muted-foreground">
                                        {copy.blockedToday}
                                    </p>
                                    <p className="mt-2 text-2xl font-semibold">
                                        {formatCompactNumber(stats.blocked_today, language)}
                                    </p>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {copy.allowedToday}:{' '}
                                        {formatCompactNumber(stats.allowed_today, language)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                        <Card>
                            <CardHeader>
                                <CardTitle>{copy.components}</CardTitle>
                                <CardDescription>{copy.componentsDescription}</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-3 md:grid-cols-2">
                                {(health?.components ?? []).map((component) => (
                                    <div
                                        key={component.name}
                                        className="rounded-xl border bg-card p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-medium">{component.name}</p>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {copy.latency}:{' '}
                                                    {formatMs(component.latency_ms ?? 0, language)}
                                                </p>
                                            </div>
                                            <HealthBadge
                                                status={component.status}
                                                labels={{
                                                    healthy: copy.systemHealthy,
                                                    degraded: copy.systemDegraded,
                                                    critical: copy.systemCritical,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{copy.topPlans}</CardTitle>
                                <CardDescription>{copy.topPlansDescription}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl border bg-card p-4">
                                        <p className="text-sm text-muted-foreground">
                                            {copy.plans}
                                        </p>
                                        <p className="mt-2 text-2xl font-semibold">
                                            {formatCompactNumber(planStats.total, language)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border bg-card p-4">
                                        <p className="text-sm text-muted-foreground">
                                            {copy.activePlans}
                                        </p>
                                        <p className="mt-2 text-2xl font-semibold">
                                            {formatCompactNumber(planStats.active, language)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border bg-card p-4">
                                        <p className="text-sm text-muted-foreground">
                                            {copy.customPlans}
                                        </p>
                                        <p className="mt-2 text-2xl font-semibold">
                                            {formatCompactNumber(planStats.custom, language)}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border bg-card p-4">
                                        <p className="text-sm text-muted-foreground">
                                            {copy.assignedPlans}
                                        </p>
                                        <p className="mt-2 text-2xl font-semibold">
                                            {formatCompactNumber(planStats.assigned, language)}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {topPlans.map((plan) => {
                                        const count = plan.accounts_count ?? 0
                                        const percentage = tenantStats.total
                                            ? (count / tenantStats.total) * 100
                                            : 0

                                        return (
                                            <div
                                                key={plan.id}
                                                className="rounded-xl border bg-card p-4"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate font-medium">
                                                            {plan.display_name}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatCompactNumber(count, language)}{' '}
                                                            {copy.tenantsCount}
                                                        </p>
                                                    </div>
                                                    <span className="text-sm font-medium">
                                                        {formatPercent(percentage, language, 0)}
                                                    </span>
                                                </div>
                                                <div className="mt-3 h-2 rounded-full bg-muted">
                                                    <div
                                                        className="h-2 rounded-full bg-primary"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                        <Card>
                            <CardHeader>
                                <CardTitle>{copy.alerts}</CardTitle>
                                <CardDescription>{copy.alertsDescription}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {(health?.alerts?.length ?? 0) === 0 ? (
                                    <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                                        {copy.noAlerts}
                                    </div>
                                ) : (
                                    health?.alerts.map((alert) => (
                                        <div
                                            key={alert.id}
                                            className="rounded-xl border bg-card p-4"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        {alert.severity === 'critical' ? (
                                                            <ShieldAlert className="h-4 w-4 text-rose-500" />
                                                        ) : (
                                                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                        )}
                                                        <p className="font-medium">
                                                            {alert.component}
                                                        </p>
                                                    </div>
                                                    <p className="mt-2 text-sm text-muted-foreground">
                                                        {alert.message}
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className="capitalize">
                                                    {alert.severity}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{copy.quickActions}</CardTitle>
                                <CardDescription>{copy.quickActionsDescription}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Link to="/admin/accounts" className="block">
                                    <div className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 font-medium">
                                                    <Users className="h-4 w-4 text-primary" />
                                                    {copy.manageTenants}
                                                </div>
                                                <p className="mt-2 text-sm text-muted-foreground">
                                                    {copy.manageTenantsDescription}
                                                </p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                </Link>

                                <Link to="/admin/plans" className="block">
                                    <div className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 font-medium">
                                                    <Layers3 className="h-4 w-4 text-primary" />
                                                    {copy.managePlans}
                                                </div>
                                                <p className="mt-2 text-sm text-muted-foreground">
                                                    {copy.managePlansDescription}
                                                </p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                </Link>

                                <Link to="/admin/profile" className="block">
                                    <div className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 font-medium">
                                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                                    {copy.reviewProfile}
                                                </div>
                                                <p className="mt-2 text-sm text-muted-foreground">
                                                    {copy.reviewProfileDescription}
                                                </p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    )
}
