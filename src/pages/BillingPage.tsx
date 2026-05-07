import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, X, Zap, CreditCard, AlertCircle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/contexts/LanguageContext'
import { publicPlansApi, billingApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import type { Plan } from '@/types'

const PLAN_ORDER = ['free', 'builder', 'starter', 'growth']

const PLAN_ACCENT: Record<string, { ring: string; badge: string; btn: string }> = {
    free:    { ring: 'ring-border',          badge: 'bg-muted text-muted-foreground',             btn: '' },
    builder: { ring: 'ring-primary/50',      badge: 'bg-primary/10 text-primary',                 btn: 'bg-primary hover:bg-primary/90 text-primary-foreground' },
    starter: { ring: 'ring-primary/50',      badge: 'bg-primary/10 text-primary',                 btn: 'bg-primary hover:bg-primary/90 text-primary-foreground' },
    growth:  { ring: 'ring-primary/70',      badge: 'bg-primary/10 text-primary',                 btn: 'bg-primary hover:bg-primary/90 text-primary-foreground' },
}

function fmt(n: number | null | undefined, lang: string): string {
    if (n == null) return lang === 'en' ? 'Unlimited' : 'Ilimitado'
    return n.toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR')
}

function fmtPrice(price: number | null | undefined, lang: string): string {
    if (price == null) return lang === 'en' ? 'Contact sales' : 'Sob consulta'
    if (price === 0) return lang === 'en' ? 'Free' : 'Grátis'
    if (lang === 'en') {
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0 })}/mo`
    }
    return `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}/mês`
}

function normalizeBillingText(value: string | null | undefined): string {
    if (!value) return ''

    return value
        .replaceAll('Ã§', 'ç')
        .replaceAll('Ã£', 'ã')
        .replaceAll('Ãµ', 'õ')
        .replaceAll('Ã¡', 'á')
        .replaceAll('Ã©', 'é')
        .replaceAll('Ãª', 'ê')
        .replaceAll('Ã­', 'í')
        .replaceAll('Ã³', 'ó')
        .replaceAll('Ãº', 'ú')
        .replaceAll('Ã', 'à')
        .replaceAll('Â ', ' ')
        .replace(/\bNao\b/g, 'Não')
        .replace(/\bnao\b/g, 'não')
        .replace(/\bUsuario\b/g, 'Usuário')
        .replace(/\busuario\b/g, 'usuário')
        .replace(/\bUsuarios\b/g, 'Usuários')
        .replace(/\busuarios\b/g, 'usuários')
        .replace(/\bDisponivel\b/g, 'Disponível')
        .replace(/\bdisponivel\b/g, 'disponível')
        .replace(/\bGratis\b/g, 'Grátis')
        .replace(/\bgratis\b/g, 'grátis')
        .replace(/\bMes\b/g, 'Mês')
        .replace(/\bmes\b/g, 'mês')
}

function UsageRow({ label, used, total, lang }: { label: string; used: number; total: number | null; lang: string }) {
    const hasCap = total != null && total > 0
    const pct = hasCap ? Math.min((used / total!) * 100, 100) : used > 0 ? 100 : 0

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="tabular-nums font-medium text-foreground">
                    {fmt(used, lang)}
                    {total != null && <span className="text-muted-foreground font-normal"> / {fmt(total, lang)}</span>}
                </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    )
}

function FeatureRow({ ok, label }: { ok: boolean; label: string }) {
    return (
        <div className="flex items-center gap-2.5 py-2 border-b border-border/50 last:border-0">
            {ok
                ? <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                : <X className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />}
            <span className={`text-sm ${ok ? 'text-foreground' : 'text-muted-foreground/50'}`}>{label}</span>
        </div>
    )
}

function CheckoutModal({ plan, open, onClose, lang }: { plan: Plan; open: boolean; onClose: () => void; lang: string }) {
    const { user } = useAuth()
    const { toast } = useToast()
    const [taxId, setTaxId] = useState('')
    const [cellphone, setCellphone] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const copy = lang === 'en'
        ? {
            title: `Subscribe to ${plan.display_name}`,
            description: `${fmtPrice(plan.price_monthly, lang)} — fill in your details to continue.`,
            taxLabel: 'Tax ID (CPF / CNPJ)',
            phoneLabel: 'Mobile number',
            phoneOptional: '(optional)',
            submit: 'Proceed to payment',
            waiting: 'Please wait...',
            successMsg: 'Checkout created. Redirecting...',
            errorTitle: 'Failed to start checkout',
        }
        : {
            title: `Assinar plano ${plan.display_name}`,
            description: `${fmtPrice(plan.price_monthly, lang)} — preencha seus dados para continuar.`,
            taxLabel: 'CPF / CNPJ',
            phoneLabel: 'Celular',
            phoneOptional: '(opcional)',
            submit: 'Ir para pagamento',
            waiting: 'Aguarde...',
            successMsg: 'Checkout criado. Redirecionando...',
            errorTitle: 'Erro ao iniciar checkout',
        }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        try {
            const result = await billingApi.createCheckout({
                plan_id: plan.id,
                customer: {
                    tax_id: taxId.replace(/\D/g, ''),
                    name: user?.name,
                    email: user?.email,
                    cellphone: cellphone || undefined,
                },
                return_url: window.location.href,
            })
            if (result.checkout_url) {
                window.location.href = result.checkout_url
            } else {
                toast({ title: copy.successMsg })
                onClose()
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : ''
            toast({ variant: 'warning', title: copy.errorTitle, ...(msg ? { description: msg } : {}) })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{copy.title}</DialogTitle>
                    <DialogDescription>{copy.description}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">{copy.taxLabel}</label>
                        <Input placeholder="000.000.000-00" value={taxId} onChange={(e) => setTaxId(e.target.value)} required minLength={11} disabled={isLoading} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">
                            {copy.phoneLabel} <span className="text-muted-foreground font-normal">{copy.phoneOptional}</span>
                        </label>
                        <Input placeholder="(11) 99999-9999" value={cellphone} onChange={(e) => setCellphone(e.target.value)} disabled={isLoading} />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading || !taxId.replace(/\D/g, '')}>
                        {isLoading
                            ? <><div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current" />{copy.waiting}</>
                            : <><CreditCard className="mr-2 h-4 w-4" />{copy.submit}</>
                        }
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export function BillingPage() {
    const { account } = useAuth()
    const { language } = useLanguage()
    const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null)
    const lang = language

    const copy = lang === 'en'
        ? {
            title: 'Plan & Usage',
            subtitle: 'Track your consumption and manage your subscription.',
            pendingPayment: 'Pending payment — complete now',
            currentPlan: 'Current plan',
            subscriptionActive: 'Active subscription',
            subscriptionPending: 'Pending subscription',
            usageTitle: 'Account usage',
            requestsLabel: 'Processed requests',
            usersLabel: 'Dashboard users',
            apiKeysLabel: 'Active API keys',
            usageFooter: (pct: number) => `${pct}% of monthly quota used`,
            availablePlans: 'Available plans',
            noPlans: 'No plans available at the moment. Please contact support.',
            currentBadge: 'Current plan',
            upgradeBtn: 'Upgrade',
            downgradeNote: 'Downgrade via support',
            freePlanNote: 'Free plan',
            reqPerMonth: 'Req / mo',
            users: 'Users',
            customRules: 'Custom rules',
            webhooks: 'Webhooks',
        }
        : {
            title: 'Plano & Uso',
            subtitle: 'Acompanhe o consumo e gerencie sua assinatura.',
            pendingPayment: 'Pagamento pendente — concluir',
            currentPlan: 'Plano atual',
            subscriptionActive: 'Assinatura ativa',
            subscriptionPending: 'Assinatura pendente',
            usageTitle: 'Consumo da conta',
            requestsLabel: 'Requisições processadas',
            usersLabel: 'Usuários no dashboard',
            apiKeysLabel: 'API Keys ativas',
            usageFooter: (pct: number) => `${pct}% da franquia mensal utilizada`,
            availablePlans: 'Planos disponíveis',
            noPlans: 'Nenhum plano disponível no momento. Entre em contato com o suporte.',
            currentBadge: 'Plano atual',
            upgradeBtn: 'Fazer upgrade',
            downgradeNote: 'Downgrade via suporte',
            freePlanNote: 'Plano gratuito',
            reqPerMonth: 'Req / mês',
            users: 'Usuários',
            customRules: 'Regras custom',
            webhooks: 'Webhooks',
        }

    const { data: plans = [], isLoading: plansLoading } = useQuery({
        queryKey: ['public-plans'],
        queryFn: publicPlansApi.getAll,
        staleTime: 5 * 60 * 1000,
    })

    const { data: subscription } = useQuery({
        queryKey: ['billing-subscription'],
        queryFn: billingApi.getSubscription,
        staleTime: 2 * 60 * 1000,
    })

    const sortedPlans = [...plans].sort((a, b) => {
        const ia = PLAN_ORDER.indexOf(a.name) === -1 ? 99 : PLAN_ORDER.indexOf(a.name)
        const ib = PLAN_ORDER.indexOf(b.name) === -1 ? 99 : PLAN_ORDER.indexOf(b.name)
        return ia - ib
    })

    const currentPlanName = account?.plan?.name ?? 'free'
    const currentPlanIndex = PLAN_ORDER.indexOf(currentPlanName)
    const currentPlan = account?.plan ?? sortedPlans.find(p => p.name === currentPlanName) ?? null

    const accent = PLAN_ACCENT[currentPlanName] ?? PLAN_ACCENT.free
    const usagePct = (account?.total_requests ?? 0) > 0 && (currentPlan?.monthly_requests ?? account?.quota_limit)
        ? Math.round(((account?.total_requests ?? 0) / (currentPlan?.monthly_requests ?? account?.quota_limit ?? 1)) * 100)
        : null

    return (
        <div className="space-y-8">

            {/* Page header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">{copy.title}</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">{copy.subtitle}</p>
                </div>
                {subscription?.status === 'pending' && subscription.checkout_url && (
                    <a
                        href={subscription.checkout_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
                    >
                        <AlertCircle className="h-3.5 w-3.5" />
                        {copy.pendingPayment}
                    </a>
                )}
            </div>

            {/* Current plan + usage */}
            <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">

                {/* Left: plan card */}
                <div className={`rounded-xl border bg-card p-6 ring-1 ${accent.ring}`}>
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copy.currentPlan}</p>
                            <p className="mt-1 text-2xl font-semibold tracking-tight">
                                {normalizeBillingText(currentPlan?.display_name) || 'Free'}
                            </p>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {fmtPrice(currentPlan?.price_monthly, lang)}
                            </p>
                        </div>
                        <span className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${accent.badge}`}>
                            {currentPlanName.toUpperCase()}
                        </span>
                    </div>

                    <div className="mt-5 space-y-1.5">
                        <FeatureRow
                            ok={currentPlan == null || (currentPlan.monthly_requests == null) || (currentPlan.monthly_requests > 0)}
                            label={`${fmt(currentPlan?.monthly_requests, lang)} ${copy.reqPerMonth}`}
                        />
                        <FeatureRow
                            ok={currentPlan == null || currentPlan.max_dashboard_users == null || currentPlan.max_dashboard_users > 1}
                            label={`${fmt(currentPlan?.max_dashboard_users, lang)} ${copy.users}`}
                        />
                        <FeatureRow
                            ok={currentPlan == null || currentPlan.max_custom_rules == null || currentPlan.max_custom_rules > 0}
                            label={`${fmt(currentPlan?.max_custom_rules, lang)} ${copy.customRules}`}
                        />
                        <FeatureRow
                            ok={currentPlan == null || currentPlan.max_webhooks == null || currentPlan.max_webhooks > 0}
                            label={`${fmt(currentPlan?.max_webhooks, lang)} ${copy.webhooks}`}
                        />
                    </div>

                    {subscription && (
                        <div className="mt-5 flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
                            <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                subscription.status === 'active' ? 'bg-green-500' :
                                subscription.status === 'pending' ? 'bg-amber-400' : 'bg-muted-foreground'
                            }`} />
                            <span className="text-xs text-muted-foreground">
                                {subscription.status === 'active' ? copy.subscriptionActive :
                                 subscription.status === 'pending' ? copy.subscriptionPending :
                                 subscription.status}
                            </span>
                        </div>
                    )}
                </div>

                {/* Right: usage */}
                <div className="rounded-xl border bg-card p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">{copy.usageTitle}</p>
                    </div>
                    <div className="space-y-5">
                        <UsageRow
                            label={copy.requestsLabel}
                            used={account?.total_requests ?? 0}
                            total={currentPlan?.monthly_requests ?? account?.quota_limit ?? null}
                            lang={lang}
                        />
                        <UsageRow
                            label={copy.usersLabel}
                            used={account?.users_count ?? 0}
                            total={currentPlan?.max_dashboard_users ?? null}
                            lang={lang}
                        />
                        <UsageRow
                            label={copy.apiKeysLabel}
                            used={account?.api_keys_count ?? 0}
                            total={null}
                            lang={lang}
                        />
                    </div>
                    {usagePct !== null && (
                        <p className="mt-4 text-[11px] text-muted-foreground">
                            {copy.usageFooter(usagePct)}
                        </p>
                    )}
                </div>
            </div>

            {/* Plans comparison */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{copy.availablePlans}</h2>
                </div>

                {plansLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-72 rounded-xl border bg-muted/20 animate-pulse" />
                        ))}
                    </div>
                ) : sortedPlans.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {sortedPlans.map((plan) => {
                            const planIdx = PLAN_ORDER.indexOf(plan.name)
                            const isCurrent = plan.name === currentPlanName
                            const isUpgrade = planIdx > currentPlanIndex || planIdx === -1
                            const isFree = plan.price_monthly === 0
                            const isGrowth = plan.name === 'growth'
                            const pa = PLAN_ACCENT[plan.name] ?? PLAN_ACCENT.free

                            return (
                                <div
                                    key={plan.id}
                                    className={`relative flex flex-col rounded-xl border bg-card p-5 transition-shadow ${
                                        isCurrent
                                            ? `ring-1 ${pa.ring}`
                                            : 'hover:shadow-md'
                                    } ${isGrowth ? 'border-primary/60 shadow-sm shadow-primary/10' : ''}`}
                                >
                                    {isCurrent && (
                                        <span className="absolute -top-2.5 left-4 rounded-full border bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                            {copy.currentBadge}
                                        </span>
                                    )}

                                    <div className="mb-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-semibold">{normalizeBillingText(plan.display_name)}</p>
                                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${pa.badge}`}>
                                                {plan.name.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="mt-1.5 text-xl font-bold tabular-nums tracking-tight">
                                            {fmtPrice(plan.price_monthly, lang)}
                                        </p>
                                        {plan.description && (
                                            <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                                {normalizeBillingText(plan.description)}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-0 divide-y divide-border/50">
                                        {[
                                            { label: copy.reqPerMonth, value: fmt(plan.monthly_requests, lang) },
                                            { label: copy.users, value: fmt(plan.max_dashboard_users, lang) },
                                            { label: copy.customRules, value: fmt(plan.max_custom_rules, lang) },
                                            { label: copy.webhooks, value: fmt(plan.max_webhooks, lang) },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="flex items-center justify-between py-2 text-xs">
                                                <span className="text-muted-foreground">{label}</span>
                                                <span className="font-medium text-foreground">{value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4">
                                        {!isCurrent && isUpgrade && !isFree && (
                                            <button
                                                onClick={() => setCheckoutPlan(plan)}
                                                className={`w-full flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${pa.btn || 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}
                                            >
                                                <Zap className="h-3.5 w-3.5" />
                                                {copy.upgradeBtn}
                                            </button>
                                        )}
                                        {isCurrent && (
                                            <div className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
                                                <Check className="h-3.5 w-3.5" />
                                                {copy.currentBadge}
                                            </div>
                                        )}
                                        {!isCurrent && !isUpgrade && (
                                            <p className="text-center text-xs text-muted-foreground py-2">
                                                {copy.downgradeNote}
                                            </p>
                                        )}
                                        {!isCurrent && isUpgrade && isFree && (
                                            <p className="text-center text-xs text-muted-foreground py-2">
                                                {copy.freePlanNote}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-600 dark:text-amber-400">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {copy.noPlans}
                    </div>
                )}
            </div>

            {checkoutPlan && (
                <CheckoutModal
                    plan={checkoutPlan}
                    open={!!checkoutPlan}
                    onClose={() => setCheckoutPlan(null)}
                    lang={lang}
                />
            )}
        </div>
    )
}
