import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Textarea } from '@/components/ui/textarea'
import { ConfirmActionDialog } from '@/components/ConfirmActionDialog'
import { useLanguage } from '@/contexts/LanguageContext'
import { plansApi } from '@/services/api'
import type { Plan } from '@/types'
import { CreditCard, Edit, Plus, RefreshCw, Trash2 } from 'lucide-react'

type PlanForm = {
    id?: string
    name: string
    display_name: string
    price_monthly: string
    monthly_requests: string
    max_items_per_request: string
    rate_limit_per_second: string
    overage_price_per_1000: string
    description: string
    overage_allowed: boolean
    is_custom: boolean
    active: boolean
}

const emptyForm: PlanForm = {
    name: '',
    display_name: '',
    price_monthly: '',
    monthly_requests: '',
    max_items_per_request: '100',
    rate_limit_per_second: '10',
    overage_price_per_1000: '',
    description: '',
    overage_allowed: false,
    is_custom: true,
    active: true,
}

function currency(value: number | null | undefined, language: 'pt-BR' | 'en') {
    if (value == null) return language === 'en' ? 'Contact sales' : 'Sob consulta'
    return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'pt-BR', {
        style: 'currency',
        currency: language === 'en' ? 'USD' : 'BRL',
    }).format(value)
}

function numberLabel(value: number | null | undefined, language: 'pt-BR' | 'en') {
    if (value == null) return language === 'en' ? 'Unlimited' : 'Ilimitado'
    return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'pt-BR').format(value)
}

function toForm(plan: Plan): PlanForm {
    return {
        id: plan.id,
        name: plan.name,
        display_name: plan.display_name,
        price_monthly: plan.price_monthly != null ? String(plan.price_monthly) : '',
        monthly_requests: plan.monthly_requests != null ? String(plan.monthly_requests) : '',
        max_items_per_request: String(plan.max_items_per_request ?? 100),
        rate_limit_per_second: String(plan.rate_limit_per_second ?? 10),
        overage_price_per_1000:
            plan.overage_price_per_1000 != null ? String(plan.overage_price_per_1000) : '',
        description: plan.description || '',
        overage_allowed: !!plan.overage_allowed,
        is_custom: !!plan.is_custom,
        active: !!plan.active,
    }
}

export function PlansPage() {
    const { language } = useLanguage()
    const queryClient = useQueryClient()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
    const [form, setForm] = useState<PlanForm>(emptyForm)
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean
        title: string
        description: string
        confirmLabel: string
        confirmVariant?: 'default' | 'destructive'
        onConfirm: () => void
    }>({
        open: false,
        title: '',
        description: '',
        confirmLabel: '',
        confirmVariant: 'default',
        onConfirm: () => undefined,
    })

    const plansQuery = useQuery({
        queryKey: ['plans'],
        queryFn: plansApi.getAll,
    })

    const createMutation = useMutation({
        mutationFn: () =>
            plansApi.create({
                name: form.name,
                display_name: form.display_name,
                price_monthly: form.price_monthly ? Number(form.price_monthly) : null,
                monthly_requests: form.monthly_requests ? Number(form.monthly_requests) : null,
                max_items_per_request: Number(form.max_items_per_request || 100),
                rate_limit_per_second: Number(form.rate_limit_per_second || 10),
                overage_allowed: form.overage_allowed,
                overage_price_per_1000: form.overage_price_per_1000
                    ? Number(form.overage_price_per_1000)
                    : null,
                description: form.description || null,
                is_custom: form.is_custom,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plans'] })
            setDialogOpen(false)
            setForm(emptyForm)
        },
    })

    const updateMutation = useMutation({
        mutationFn: () =>
            plansApi.update(editingPlan!.id, {
                name: form.name,
                display_name: form.display_name,
                price_monthly: form.price_monthly ? Number(form.price_monthly) : null,
                monthly_requests: form.monthly_requests ? Number(form.monthly_requests) : null,
                max_items_per_request: Number(form.max_items_per_request || 100),
                rate_limit_per_second: Number(form.rate_limit_per_second || 10),
                overage_allowed: form.overage_allowed,
                overage_price_per_1000: form.overage_price_per_1000
                    ? Number(form.overage_price_per_1000)
                    : null,
                description: form.description || null,
                is_custom: form.is_custom,
                active: form.active,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plans'] })
            setDialogOpen(false)
            setEditingPlan(null)
            setForm(emptyForm)
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => plansApi.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
    })

    const seedMutation = useMutation({
        mutationFn: () => plansApi.seedDefaults(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
    })

    const plans = plansQuery.data ?? []
    const stats = useMemo(
        () => ({
            total: plans.length,
            active: plans.filter((plan) => plan.active).length,
            custom: plans.filter((plan) => plan.is_custom).length,
        }),
        [plans]
    )

    const copy =
        language === 'en'
            ? {
                  title: 'Plans',
                  subtitle: 'Commercial catalog and contractual limits for the platform.',
                  seedDefaults: 'Seed defaults',
                  newPlan: 'New plan',
                  editPlan: 'Edit plan',
                  createPlan: 'Create plan',
                  editDescription: 'Adjust name, pricing, limits and plan state.',
                  createDescription: 'Register a new commercial plan.',
                  identityTitle: 'Plan identity',
                  identityDescription:
                      'Define the internal slug, public name and commercial positioning.',
                  slug: 'Plan slug',
                  slugPlaceholder: 'starter',
                  displayName: 'Display name',
                  displayNamePlaceholder: 'Starter',
                  descriptionLabel: 'Description',
                  descriptionPlaceholder:
                      'Plan for accounts starting operations, with moderate limits and controlled cost.',
                  pricingTitle: 'Pricing and capacity',
                  pricingDescription:
                      'Configure recurring price, monthly volume and technical limits for this plan.',
                  monthlyPrice: 'Monthly price',
                  monthlyPricePlaceholder: '199',
                  monthlyRequests: 'Monthly requests',
                  monthlyRequestsPlaceholder: '50000',
                  itemsPerRequest: 'Items per request',
                  itemsPerRequestPlaceholder: '100',
                  rateLimit: 'Rate limit per second',
                  rateLimitPlaceholder: '10',
                  overagePrice: 'Overage price per 1000 requests',
                  overagePricePlaceholder: '29.90',
                  rulesTitle: 'State and rules',
                  rulesDescription:
                      'Define how the plan should appear and whether it is available for new accounts.',
                  overageEnabled: 'Overage enabled',
                  overageEnabledDesc: 'Allows charging usage above the monthly quota.',
                  customPlan: 'Custom plan',
                  customPlanDesc: 'Use for special contracts and tailored negotiations.',
                  activePlan: 'Plan active',
                  activePlanDesc: 'When inactive, it is no longer eligible for new assignments.',
                  cancel: 'Cancel',
                  saveChanges: 'Save changes',
                  saving: 'Saving...',
                  creating: 'Creating...',
                  confirmEditTitle: 'Confirm plan update',
                  confirmEditDescription:
                      'Do you want to save the changes made to this commercial plan?',
                  confirmDeleteTitle: 'Confirm plan deletion',
                  confirmDeleteDescription: 'This plan will be removed from the catalog. Continue?',
                  confirmEdit: 'Save plan',
                  confirmDelete: 'Delete plan',
                  total: 'Plans',
                  active: 'Active',
                  custom: 'Custom',
                  customBadge: 'Custom',
                  standard: 'Standard',
                  activeBadge: 'Active',
                  inactive: 'Inactive',
                  slugCard: 'Slug',
                  priceCard: 'Price',
                  quotaCard: 'Quota',
                  rateLimitCard: 'Rate limit',
                  disabled: 'disabled',
                  edit: 'Edit',
                  delete: 'Delete',
                  itemsPerRequestCard: 'Items/request',
              }
            : {
                  title: 'Planos',
                  subtitle: 'Catalogo comercial e limites contratuais da plataforma.',
                  seedDefaults: 'Popular padroes',
                  newPlan: 'Novo plano',
                  editPlan: 'Editar plano',
                  createPlan: 'Criar plano',
                  editDescription: 'Ajuste nome, valores, limites e estado do plano.',
                  createDescription: 'Cadastre um novo plano comercial.',
                  identityTitle: 'Identidade do plano',
                  identityDescription:
                      'Defina nome interno, nome publico e posicionamento comercial.',
                  slug: 'Slug do plano',
                  slugPlaceholder: 'starter',
                  displayName: 'Nome de exibicao',
                  displayNamePlaceholder: 'Starter',
                  descriptionLabel: 'Descricao',
                  descriptionPlaceholder:
                      'Plano para contas em inicio de operacao, com limites moderados e custo controlado.',
                  pricingTitle: 'Preco e capacidade',
                  pricingDescription:
                      'Configure preco recorrente, volume mensal e limites tecnicos do plano.',
                  monthlyPrice: 'Preco mensal',
                  monthlyPricePlaceholder: '199',
                  monthlyRequests: 'Requests mensais',
                  monthlyRequestsPlaceholder: '50000',
                  itemsPerRequest: 'Itens por request',
                  itemsPerRequestPlaceholder: '100',
                  rateLimit: 'Rate limit por segundo',
                  rateLimitPlaceholder: '10',
                  overagePrice: 'Preco de overage por 1000 requests',
                  overagePricePlaceholder: '29.90',
                  rulesTitle: 'Estado e regras',
                  rulesDescription:
                      'Defina como o plano deve aparecer e se esta disponivel para novas contas.',
                  overageEnabled: 'Overage habilitado',
                  overageEnabledDesc: 'Permite cobrar excedente alem da quota mensal.',
                  customPlan: 'Plano customizado',
                  customPlanDesc: 'Use para contratos especiais e negociacoes sob medida.',
                  activePlan: 'Plano ativo',
                  activePlanDesc: 'Quando inativo, deixa de ser elegivel para novos vinculos.',
                  cancel: 'Cancelar',
                  saveChanges: 'Salvar alteracoes',
                  saving: 'Salvando...',
                  creating: 'Criando...',
                  confirmEditTitle: 'Confirmar edicao do plano',
                  confirmEditDescription:
                      'Deseja salvar as alteracoes feitas neste plano comercial?',
                  confirmDeleteTitle: 'Confirmar exclusao do plano',
                  confirmDeleteDescription:
                      'Este plano sera removido do catalogo. Deseja continuar?',
                  confirmEdit: 'Salvar plano',
                  confirmDelete: 'Excluir plano',
                  total: 'Planos',
                  active: 'Ativos',
                  custom: 'Customizados',
                  customBadge: 'Customizado',
                  standard: 'Padrao',
                  activeBadge: 'Ativo',
                  inactive: 'Inativo',
                  slugCard: 'Slug',
                  priceCard: 'Preco',
                  quotaCard: 'Quota',
                  rateLimitCard: 'Rate limit',
                  disabled: 'desligado',
                  edit: 'Editar',
                  delete: 'Excluir',
                  itemsPerRequestCard: 'Itens/request',
              }

    const openCreate = () => {
        setEditingPlan(null)
        setForm(emptyForm)
        setDialogOpen(true)
    }

    const openEdit = (plan: Plan) => {
        setEditingPlan(plan)
        setForm(toForm(plan))
        setDialogOpen(true)
    }

    return (
        <div className="space-y-6">
            <ConfirmActionDialog
                open={confirmDialog.open}
                onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
                title={confirmDialog.title}
                description={confirmDialog.description}
                confirmLabel={confirmDialog.confirmLabel}
                cancelLabel={copy.cancel}
                confirmVariant={confirmDialog.confirmVariant}
                onConfirm={confirmDialog.onConfirm}
            />

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-3xl font-heading font-bold">{copy.title}</h2>
                    <p className="text-muted-foreground">{copy.subtitle}</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => seedMutation.mutate()}
                        disabled={seedMutation.isPending}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {copy.seedDefaults}
                    </Button>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={openCreate}>
                                <Plus className="mr-2 h-4 w-4" />
                                {copy.newPlan}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="flex max-w-2xl max-h-[84vh] flex-col overflow-hidden">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingPlan ? copy.editPlan : copy.createPlan}
                                </DialogTitle>
                                <DialogDescription>
                                    {editingPlan ? copy.editDescription : copy.createDescription}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="min-h-0 flex-1 overflow-y-auto py-4 pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/25 hover:scrollbar-thumb-muted-foreground/40">
                                <div className="space-y-5">
                                    <div className="rounded-xl border bg-muted/20 p-4">
                                        <div className="mb-4">
                                            <h3 className="text-sm font-semibold">
                                                {copy.identityTitle}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {copy.identityDescription}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="plan-name">{copy.slug}</Label>
                                                <Input
                                                    id="plan-name"
                                                    placeholder={copy.slugPlaceholder}
                                                    value={form.name}
                                                    onChange={(e) =>
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            name: e.target.value,
                                                        }))
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="plan-display-name">
                                                    {copy.displayName}
                                                </Label>
                                                <Input
                                                    id="plan-display-name"
                                                    placeholder={copy.displayNamePlaceholder}
                                                    value={form.display_name}
                                                    onChange={(e) =>
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            display_name: e.target.value,
                                                        }))
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="plan-description">
                                                    {copy.descriptionLabel}
                                                </Label>
                                                <Textarea
                                                    id="plan-description"
                                                    placeholder={copy.descriptionPlaceholder}
                                                    rows={4}
                                                    value={form.description}
                                                    onChange={(e) =>
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            description: e.target.value,
                                                        }))
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border bg-muted/20 p-4">
                                        <div className="mb-4">
                                            <h3 className="text-sm font-semibold">
                                                {copy.pricingTitle}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {copy.pricingDescription}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="plan-price">
                                                    {copy.monthlyPrice}
                                                </Label>
                                                <Input
                                                    id="plan-price"
                                                    placeholder={copy.monthlyPricePlaceholder}
                                                    type="number"
                                                    value={form.price_monthly}
                                                    onChange={(e) =>
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            price_monthly: e.target.value,
                                                        }))
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="plan-requests">
                                                    {copy.monthlyRequests}
                                                </Label>
                                                <Input
                                                    id="plan-requests"
                                                    placeholder={copy.monthlyRequestsPlaceholder}
                                                    type="number"
                                                    value={form.monthly_requests}
                                                    onChange={(e) =>
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            monthly_requests: e.target.value,
                                                        }))
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="plan-items">
                                                    {copy.itemsPerRequest}
                                                </Label>
                                                <Input
                                                    id="plan-items"
                                                    placeholder={copy.itemsPerRequestPlaceholder}
                                                    type="number"
                                                    value={form.max_items_per_request}
                                                    onChange={(e) =>
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            max_items_per_request: e.target.value,
                                                        }))
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="plan-rate">{copy.rateLimit}</Label>
                                                <Input
                                                    id="plan-rate"
                                                    placeholder={copy.rateLimitPlaceholder}
                                                    type="number"
                                                    value={form.rate_limit_per_second}
                                                    onChange={(e) =>
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            rate_limit_per_second: e.target.value,
                                                        }))
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="plan-overage-price">
                                                    {copy.overagePrice}
                                                </Label>
                                                <Input
                                                    id="plan-overage-price"
                                                    placeholder={copy.overagePricePlaceholder}
                                                    type="number"
                                                    value={form.overage_price_per_1000}
                                                    onChange={(e) =>
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            overage_price_per_1000: e.target.value,
                                                        }))
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border bg-muted/20 p-4">
                                        <div className="mb-4">
                                            <h3 className="text-sm font-semibold">
                                                {copy.rulesTitle}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {copy.rulesDescription}
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {copy.overageEnabled}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {copy.overageEnabledDesc}
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={form.overage_allowed}
                                                    onCheckedChange={(checked) =>
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            overage_allowed: checked,
                                                        }))
                                                    }
                                                />
                                            </div>
                                            <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {copy.customPlan}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {copy.customPlanDesc}
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={form.is_custom}
                                                    onCheckedChange={(checked) =>
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            is_custom: checked,
                                                        }))
                                                    }
                                                />
                                            </div>
                                            <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {copy.activePlan}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {copy.activePlanDesc}
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={form.active}
                                                    onCheckedChange={(checked) =>
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            active: checked,
                                                        }))
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                    {copy.cancel}
                                </Button>
                                <Button
                                    onClick={() =>
                                        editingPlan
                                            ? setConfirmDialog({
                                                  open: true,
                                                  title: copy.confirmEditTitle,
                                                  description: copy.confirmEditDescription,
                                                  confirmLabel: copy.confirmEdit,
                                                  confirmVariant: 'default',
                                                  onConfirm: () => updateMutation.mutate(),
                                              })
                                            : createMutation.mutate()
                                    }
                                    disabled={
                                        !form.name ||
                                        !form.display_name ||
                                        createMutation.isPending ||
                                        updateMutation.isPending
                                    }
                                >
                                    {editingPlan
                                        ? updateMutation.isPending
                                            ? copy.saving
                                            : copy.saveChanges
                                        : createMutation.isPending
                                          ? copy.creating
                                          : copy.createPlan}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">{copy.total}</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">{copy.active}</p>
                        <p className="text-2xl font-bold">{stats.active}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">{copy.custom}</p>
                        <p className="text-2xl font-bold">{stats.custom}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {plans.map((plan) => (
                    <Card key={plan.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5" />
                                        {plan.display_name}
                                    </CardTitle>
                                    <CardDescription>
                                        {plan.description || plan.name}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">
                                        {plan.is_custom ? copy.customBadge : copy.standard}
                                    </Badge>
                                    <Badge variant="outline">
                                        {plan.active ? copy.activeBadge : copy.inactive}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-lg border p-3">
                                    <p className="text-muted-foreground">{copy.slugCard}</p>
                                    <p className="text-lg font-semibold">{plan.name}</p>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <p className="text-muted-foreground">{copy.priceCard}</p>
                                    <p className="text-lg font-semibold">
                                        {currency(plan.price_monthly, language)}
                                    </p>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <p className="text-muted-foreground">{copy.quotaCard}</p>
                                    <p className="text-lg font-semibold">
                                        {numberLabel(plan.monthly_requests, language)}
                                    </p>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <p className="text-muted-foreground">{copy.rateLimitCard}</p>
                                    <p className="text-lg font-semibold">
                                        {plan.rate_limit_per_second ?? '-'}/s
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>
                                    Overage:{' '}
                                    {plan.overage_allowed
                                        ? currency(plan.overage_price_per_1000, language)
                                        : copy.disabled}
                                </span>
                                <span>
                                    {copy.itemsPerRequestCard}: {plan.max_items_per_request ?? '-'}
                                </span>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => openEdit(plan)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    {copy.edit}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setConfirmDialog({
                                            open: true,
                                            title: copy.confirmDeleteTitle,
                                            description: copy.confirmDeleteDescription,
                                            confirmLabel: copy.confirmDelete,
                                            confirmVariant: 'destructive',
                                            onConfirm: () => deleteMutation.mutate(plan.id),
                                        })
                                    }
                                    disabled={deleteMutation.isPending}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {copy.delete}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
