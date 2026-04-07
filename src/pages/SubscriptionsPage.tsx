import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { accountsApi, plansApi } from '@/services/api'
import type { Account, Plan } from '@/types'
import { ArrowRightLeft, CreditCard, Users } from 'lucide-react'

function currency(value: number | null | undefined) {
    if (value == null) return 'Sob consulta'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function SubscriptionsPage() {
    const queryClient = useQueryClient()
    const [selectedAccountId, setSelectedAccountId] = useState<string>('')

    const accountsQuery = useQuery({
        queryKey: ['accounts', 'subscriptions'],
        queryFn: () => accountsApi.getAll({ page: 1, limit: 100 }),
    })
    const plansQuery = useQuery({
        queryKey: ['plans'],
        queryFn: plansApi.getAll,
    })

    const assignMutation = useMutation({
        mutationFn: ({ accountId, planId }: { accountId: string; planId: string | null }) =>
            plansApi.assignToAccount(accountId, planId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            queryClient.invalidateQueries({ queryKey: ['accounts', 'subscriptions'] })
        },
    })

    const accounts = accountsQuery.data?.data ?? []
    const plans = plansQuery.data ?? []

    const selectedAccount = accounts.find((account) => account.id === selectedAccountId) ?? null

    const distribution = useMemo(() => {
        const map = new Map<string, { plan: Plan; count: number; accounts: Account[] }>()
        for (const plan of plans) {
            map.set(plan.id, { plan, count: 0, accounts: [] })
        }
        for (const account of accounts) {
            if (!account.plan_id) continue
            const bucket = map.get(account.plan_id)
            if (!bucket) continue
            bucket.count += 1
            bucket.accounts.push(account)
        }
        return Array.from(map.values()).sort((a, b) => b.count - a.count)
    }, [accounts, plans])

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-heading font-bold">Assinaturas</h2>
                <p className="text-muted-foreground">
                    Distribuição de planos e movimentação rápida de contas.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Distribuição por plano</CardTitle>
                        <CardDescription>
                            Quantas contas estão atreladas a cada faixa comercial.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {distribution.map(({ plan, count, accounts: accountsOnPlan }) => (
                            <div key={plan.id} className="rounded-lg border p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{plan.display_name}</span>
                                            <Badge variant="secondary">{count} conta(s)</Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {currency(plan.price_monthly)} · quota{' '}
                                            {plan.monthly_requests ?? 'ilimitada'}
                                        </div>
                                    </div>
                                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {accountsOnPlan.slice(0, 6).map((account) => (
                                        <Badge key={account.id} variant="outline">
                                            {account.name}
                                        </Badge>
                                    ))}
                                    {accountsOnPlan.length > 6 && (
                                        <Badge variant="outline">
                                            +{accountsOnPlan.length - 6}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Troca rápida</CardTitle>
                        <CardDescription>
                            Reatribua o plano de uma conta sem sair da visão comercial.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecionar conta" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map((account) => (
                                    <SelectItem key={account.id} value={account.id}>
                                        {account.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {selectedAccount ? (
                            <>
                                <div className="rounded-lg border p-4">
                                    <div className="font-medium">{selectedAccount.name}</div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                        {selectedAccount.email}
                                    </div>
                                    <div className="mt-3 flex items-center gap-2 text-sm">
                                        <Users className="h-4 w-4" />
                                        <span>{selectedAccount.users_count} usuários</span>
                                    </div>
                                    <div className="mt-2 text-sm text-muted-foreground">
                                        Plano atual:{' '}
                                        <span className="font-medium text-foreground">
                                            {selectedAccount.plan?.display_name || 'Sem plano'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {plans.map((plan) => (
                                        <Button
                                            key={plan.id}
                                            variant={
                                                selectedAccount.plan_id === plan.id
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            className="w-full justify-between"
                                            onClick={() =>
                                                assignMutation.mutate({
                                                    accountId: selectedAccount.id,
                                                    planId: plan.id,
                                                })
                                            }
                                        >
                                            <span>{plan.display_name}</span>
                                            <span>{currency(plan.price_monthly)}</span>
                                        </Button>
                                    ))}
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() =>
                                            assignMutation.mutate({
                                                accountId: selectedAccount.id,
                                                planId: null,
                                            })
                                        }
                                    >
                                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                                        Remover plano
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                                Escolha uma conta para gerir a assinatura.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
