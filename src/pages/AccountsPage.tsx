import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmActionDialog } from '@/components/ConfirmActionDialog'
import { accountsApi, plansApi } from '@/services/api'
import type { Account } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'
import { useToast } from '@/hooks/use-toast'
import {
    Building2,
    Check,
    Copy,
    Key,
    Loader2,
    Mail,
    Plus,
    Power,
    Search,
    Send,
    Users,
} from 'lucide-react'

type AccountForm = {
    name: string
    admin_name: string
    email: string
    company_name: string
    description: string
    quota_limit: string
}

const emptyForm: AccountForm = {
    name: '',
    admin_name: '',
    email: '',
    company_name: '',
    description: '',
    quota_limit: '',
}

function quotaLabel(value: number | null | undefined, language: 'pt-BR' | 'en') {
    if (value == null) return language === 'en' ? 'Unlimited' : 'Ilimitado'
    return new Intl.NumberFormat('pt-BR').format(value)
}

function StatusBadge({
    active,
    activeLabel,
    inactiveLabel,
}: {
    active: boolean
    activeLabel: string
    inactiveLabel: string
}) {
    return (
        <Badge variant="outline" className="gap-1">
            <span
                className={`h-2 w-2 rounded-full ${active ? 'bg-decision-allow' : 'bg-decision-block'}`}
            />
            {active ? activeLabel : inactiveLabel}
        </Badge>
    )
}

export function AccountsPage() {
    const { language } = useLanguage()
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [createForm, setCreateForm] = useState<AccountForm>(emptyForm)
    const [editForm, setEditForm] = useState<AccountForm>(emptyForm)
    const [latestInviteLink, setLatestInviteLink] = useState<string | null>(null)
    const [latestInviteEmailSent, setLatestInviteEmailSent] = useState<boolean | null>(null)
    const [copiedInviteToken, setCopiedInviteToken] = useState<string | null>(null)
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

    const accountsQuery = useQuery({
        queryKey: ['accounts'],
        queryFn: () => accountsApi.getAll({ page: 1, limit: 100 }),
    })
    const plansQuery = useQuery({
        queryKey: ['plans'],
        queryFn: plansApi.getAll,
    })
    const selectedAccountQuery = useQuery({
        queryKey: ['account', selectedAccountId],
        queryFn: () => accountsApi.getById(selectedAccountId!),
        enabled: !!selectedAccountId,
    })

    const accounts = accountsQuery.data?.data ?? []
    const plans = plansQuery.data ?? []
    const selectedAccount = selectedAccountQuery.data ?? null

    useEffect(() => {
        if (!selectedAccount && accounts.length > 0 && !selectedAccountId) {
            setSelectedAccountId(accounts[0].id)
        }
    }, [accounts, selectedAccount, selectedAccountId])

    useEffect(() => {
        if (!selectedAccount) return
        setEditForm({
            name: selectedAccount.name,
            admin_name: '',
            email: selectedAccount.email,
            company_name: selectedAccount.company_name || '',
            description: selectedAccount.description || '',
            quota_limit: String(selectedAccount.quota_limit ?? ''),
        })
    }, [selectedAccount])

    const createMutation = useMutation({
        mutationFn: () =>
            accountsApi.create({
                name: createForm.name,
                admin_name: createForm.admin_name,
                email: createForm.email,
                company_name: createForm.company_name || undefined,
                description: createForm.description || undefined,
                quota_limit: createForm.quota_limit ? Number(createForm.quota_limit) : undefined,
            }),
        onSuccess: (account) => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            if (account.pending_invitation?.token) {
                setLatestInviteLink(
                    `${window.location.origin}/accept-invite/${account.pending_invitation.token}`
                )
            }
            setLatestInviteEmailSent(account.invitation_email_sent ?? false)
            setCreateForm(emptyForm)
            setIsCreateOpen(false)
        },
    })

    const assignPlanMutation = useMutation({
        mutationFn: ({ accountId, planId }: { accountId: string; planId: string | null }) =>
            plansApi.assignToAccount(accountId, planId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            queryClient.invalidateQueries({ queryKey: ['account', selectedAccountId] })
        },
    })

    const updateAccountMutation = useMutation({
        mutationFn: () =>
            accountsApi.update(selectedAccount!.id, {
                name: editForm.name,
                company_name: editForm.company_name || undefined,
                description: editForm.description || undefined,
                quota_limit: editForm.quota_limit ? Number(editForm.quota_limit) : undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            queryClient.invalidateQueries({ queryKey: ['account', selectedAccountId] })
        },
    })

    const activateMutation = useMutation({
        mutationFn: (id: string) => accountsApi.activate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            queryClient.invalidateQueries({ queryKey: ['account', selectedAccountId] })
        },
    })

    const deactivateMutation = useMutation({
        mutationFn: (id: string) => accountsApi.deactivate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            queryClient.invalidateQueries({ queryKey: ['account', selectedAccountId] })
        },
    })

    const resendInvitationMutation = useMutation({
        mutationFn: (id: string) => accountsApi.resendInvitation(id),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] })
            queryClient.invalidateQueries({ queryKey: ['account', selectedAccountId] })
            const token = result.pending_invitation?.token
            const inviteLink = token ? `${window.location.origin}/accept-invite/${token}` : null
            if (inviteLink) {
                setLatestInviteLink(inviteLink)
                setLatestInviteEmailSent(result.invitation_email_sent ?? false)
                navigator.clipboard.writeText(inviteLink).catch(() => undefined)
            }
            toast({
                title: language === 'en' ? 'Invite processed' : 'Convite processado',
                description: result.invitation_email_sent
                    ? language === 'en'
                        ? 'The activation email was sent and the link was copied when possible.'
                        : 'O email de ativacao foi enviado e o link foi copiado quando possivel.'
                    : language === 'en'
                      ? 'The invitation link was generated, but email sending is not configured or failed.'
                      : 'O link do convite foi gerado, mas o envio de email nao esta configurado ou falhou.',
            })
        },
    })

    const copyInviteLink = async (token: string) => {
        const inviteLink = `${window.location.origin}/accept-invite/${token}`
        await navigator.clipboard.writeText(inviteLink)
        setCopiedInviteToken(token)
        toast({
            title: language === 'en' ? 'Invite link copied' : 'Link do convite copiado',
            description:
                language === 'en'
                    ? 'The activation link is now in your clipboard.'
                    : 'O link de ativacao foi copiado para a area de transferencia.',
        })
        window.setTimeout(() => {
            setCopiedInviteToken((current) => (current === token ? null : current))
        }, 2000)
    }

    const filteredAccounts = useMemo(
        () =>
            accounts.filter((account) => {
                const q = searchQuery.toLowerCase()
                return (
                    !q ||
                    account.name.toLowerCase().includes(q) ||
                    account.email.toLowerCase().includes(q) ||
                    account.company_name?.toLowerCase().includes(q)
                )
            }),
        [accounts, searchQuery]
    )

    const copy =
        language === 'en'
            ? {
                  title: 'Accounts',
                  subtitle:
                      'Manage tenants, activation state, current plan and contracted capacity.',
                  newAccount: 'New account',
                  createTitle: 'Create account',
                  createDescription:
                      'Register a new tenant with clear identity and an initial operating capacity.',
                  identityTitle: 'Account identity',
                  identityDescription:
                      'These details define the tenant and how it appears to operators.',
                  capacityTitle: 'Initial capacity',
                  capacityDescription: 'Define the initial quota before assigning a plan.',
                  accountName: 'Account name',
                  accountNamePlaceholder: 'Acme Risk Ops',
                  email: 'Primary admin email',
                  emailPlaceholder: 'ops@acme.com',
                  adminName: 'Initial admin name',
                  adminNamePlaceholder: 'Alex Morgan',
                  company: 'Company',
                  companyPlaceholder: 'Acme Ltd.',
                  quota: 'Monthly quota',
                  quotaPlaceholder: '100000',
                  description: 'Operational context',
                  descriptionPlaceholder:
                      'Dedicated tenant for the LATAM anti-fraud team, focused on onboarding and login validations.',
                  cancel: 'Cancel',
                  create: 'Create account',
                  creating: 'Creating...',
                  inviteReady: 'Invitation ready',
                  inviteReadyDescription:
                      'Send this link to the initial tenant admin so they can define their password and activate access.',
                  inviteEmailSent: 'Activation email sent successfully.',
                  inviteEmailFallback:
                      'Email was not sent. Copy the link below and send it manually.',
                  copyInvite: 'Copy invite link',
                  inviteCopied: 'Copied',
                  clearInvite: 'Dismiss',
                  total: 'Total',
                  active: 'Active',
                  withPlan: 'With plan',
                  accountsBase: 'Accounts list',
                  selectHint: 'Select an account to operate.',
                  searchPlaceholder: 'Search by name, company or email',
                  users: 'users',
                  keys: 'keys',
                  withoutPlan: 'No plan',
                  accountOps: 'Account operations',
                  accountOpsSubtitle: 'Core data, active plan and operational controls.',
                  selectAccount: 'Select an account to view its details.',
                  noAccount: 'No account selected.',
                  deactivate: 'Deactivate account',
                  activate: 'Activate account',
                  requests: 'Requests',
                  companyLabel: 'Company',
                  saveAccount: 'Save account',
                  saving: 'Saving...',
                  confirmSaveTitle: 'Confirm account update',
                  confirmSaveDescription:
                      "Apply the changes made to this tenant's operational data?",
                  confirmActivateTitle: 'Confirm account activation',
                  confirmActivateDescription:
                      'This tenant will become active again and available for operations.',
                  confirmDeactivateTitle: 'Confirm account deactivation',
                  confirmDeactivateDescription:
                      'This tenant will be suspended from operations until reactivated.',
                  confirmPlanTitle: 'Confirm plan change',
                  confirmPlanDescription: 'Apply the selected commercial plan to this tenant now?',
                  confirmSave: 'Confirm changes',
                  confirmActivate: 'Activate account',
                  confirmDeactivate: 'Deactivate account',
                  confirmPlan: 'Apply plan',
                  pendingInvite: 'Pending admin invite',
                  pendingInviteDescription:
                      'The initial tenant admin has not activated access yet.',
                  inviteExpires: 'Invite expires',
                  copyInviteFromAccount: 'Copy invite',
                  resendInvite: 'Resend invite',
                  createInvite: 'Generate invite',
                  resendingInvite: 'Regenerating...',
                  onboardingTitle: 'Admin onboarding',
                  onboardingDescription:
                      'This tenant still needs an initial admin to activate access and define a password.',
                  onboardingActions: 'Invite actions',
                  onboardingLink: 'Activation link',
                  onboardingEmail: 'Admin email',
                  currentPlan: 'Current plan',
                  currentPlanHint: 'Assign the tenant to the commercial plan catalog here.',
                  currentPlanEmpty: 'No linked plan',
                  currentPlanEmptyDesc:
                      'Assign a plan to apply commercial policy and operational limits.',
                  overview: 'Overview',
                  settings: 'Settings',
                  tenantData: 'Tenant data',
                  tenantDataDesc: 'Review the current operating shape of this account.',
                  planAndLimits: 'Plan and limits',
                  planAndLimitsDesc: 'Change descriptive fields and plan assignment.',
                  monthlyQuota: 'Monthly quota',
                  overviewCards: {
                      users: 'Users',
                      keys: 'API keys',
                      requests: 'Requests',
                      quota: 'Quota',
                  },
                  activeBadge: 'Active',
                  inactiveBadge: 'Inactive',
                  noPlanOption: 'No plan',
              }
            : {
                  title: 'Contas',
                  subtitle: 'Gestão de tenants, ativação, plano atual e capacidade contratada.',
                  newAccount: 'Nova conta',
                  createTitle: 'Criar conta',
                  createDescription:
                      'Cadastre um novo tenant com identidade clara e capacidade inicial definida.',
                  identityTitle: 'Identidade da conta',
                  identityDescription:
                      'Esses dados definem o tenant e como ele aparece na operação.',
                  capacityTitle: 'Capacidade inicial',
                  capacityDescription:
                      'Defina a quota operacional inicial antes de vincular um plano.',
                  accountName: 'Nome da conta',
                  accountNamePlaceholder: 'Acme Risk Ops',
                  email: 'E-mail do admin principal',
                  emailPlaceholder: 'ops@acme.com',
                  adminName: 'Nome do admin inicial',
                  adminNamePlaceholder: 'Alex Morgan',
                  company: 'Empresa',
                  companyPlaceholder: 'Acme Ltda.',
                  quota: 'Quota mensal',
                  quotaPlaceholder: '100000',
                  description: 'Contexto operacional',
                  descriptionPlaceholder:
                      'Tenant dedicado ao time antifraude da operação LATAM, com foco em validações de onboarding e login.',
                  cancel: 'Cancelar',
                  create: 'Criar conta',
                  creating: 'Criando...',
                  inviteReady: 'Convite pronto',
                  inviteReadyDescription:
                      'Envie este link para o admin inicial do tenant definir a senha e ativar o acesso.',
                  inviteEmailSent: 'Email de ativação enviado com sucesso.',
                  inviteEmailFallback:
                      'O email não foi enviado. Copie o link abaixo e envie manualmente.',
                  copyInvite: 'Copiar link do convite',
                  inviteCopied: 'Copiado',
                  clearInvite: 'Dispensar',
                  total: 'Total',
                  active: 'Ativas',
                  withPlan: 'Com plano',
                  accountsBase: 'Base de contas',
                  selectHint: 'Selecione uma conta para operar.',
                  searchPlaceholder: 'Buscar por nome, empresa ou e-mail',
                  users: 'usuários',
                  keys: 'chaves',
                  withoutPlan: 'Sem plano',
                  accountOps: 'Operação da conta',
                  accountOpsSubtitle: 'Dados principais, plano ativo e controles operacionais.',
                  selectAccount: 'Selecione uma conta para visualizar os detalhes.',
                  noAccount: 'Nenhuma conta selecionada.',
                  deactivate: 'Desativar conta',
                  activate: 'Ativar conta',
                  requests: 'Requests',
                  companyLabel: 'Empresa',
                  saveAccount: 'Salvar conta',
                  saving: 'Salvando...',
                  confirmSaveTitle: 'Confirmar edição da conta',
                  confirmSaveDescription:
                      'Deseja aplicar as alterações feitas nos dados operacionais deste tenant?',
                  confirmActivateTitle: 'Confirmar ativação da conta',
                  confirmActivateDescription:
                      'Este tenant voltará a ficar ativo e disponível para operação.',
                  confirmDeactivateTitle: 'Confirmar desativação da conta',
                  confirmDeactivateDescription:
                      'Este tenant será suspenso da operação até ser reativado.',
                  confirmPlanTitle: 'Confirmar troca de plano',
                  confirmPlanDescription:
                      'Deseja aplicar agora o plano comercial selecionado para este tenant?',
                  confirmSave: 'Confirmar alteracoes',
                  confirmActivate: 'Ativar conta',
                  confirmDeactivate: 'Desativar conta',
                  confirmPlan: 'Aplicar plano',
                  pendingInvite: 'Convite de admin pendente',
                  pendingInviteDescription: 'O admin inicial do tenant ainda não ativou o acesso.',
                  inviteExpires: 'Convite expira em',
                  copyInviteFromAccount: 'Copiar convite',
                  resendInvite: 'Reenviar convite',
                  createInvite: 'Gerar convite',
                  resendingInvite: 'Regenerando...',
                  onboardingTitle: 'Onboarding do admin',
                  onboardingDescription:
                      'Este tenant ainda precisa de um admin inicial para ativar o acesso e definir a senha.',
                  onboardingActions: 'Ações do convite',
                  onboardingLink: 'Link de ativação',
                  onboardingEmail: 'Email do admin',
                  currentPlan: 'Plano atual',
                  currentPlanHint:
                      'Faça aqui o vínculo operacional da conta com o catálogo de planos.',
                  currentPlanEmpty: 'Sem plano vinculado',
                  currentPlanEmptyDesc: 'Defina o plano para aplicar política comercial e limites.',
                  overview: 'Visão geral',
                  settings: 'Configurações',
                  tenantData: 'Dados do tenant',
                  tenantDataDesc: 'Revise o formato operacional atual desta conta.',
                  planAndLimits: 'Plano e limites',
                  planAndLimitsDesc: 'Ajuste campos descritivos e o vínculo comercial.',
                  monthlyQuota: 'Quota mensal',
                  overviewCards: {
                      users: 'Usuários',
                      keys: 'API keys',
                      requests: 'Requests',
                      quota: 'Quota',
                  },
                  activeBadge: 'Ativa',
                  inactiveBadge: 'Inativa',
                  noPlanOption: 'Sem plano',
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
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            {copy.newAccount}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="flex max-w-xl max-h-[84vh] flex-col overflow-hidden">
                        <DialogHeader>
                            <DialogTitle>{copy.createTitle}</DialogTitle>
                            <DialogDescription>{copy.createDescription}</DialogDescription>
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
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="account-name">{copy.accountName}</Label>
                                            <Input
                                                id="account-name"
                                                placeholder={copy.accountNamePlaceholder}
                                                value={createForm.name}
                                                onChange={(e) =>
                                                    setCreateForm((prev) => ({
                                                        ...prev,
                                                        name: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="account-admin-name">
                                                {copy.adminName}
                                            </Label>
                                            <Input
                                                id="account-admin-name"
                                                placeholder={copy.adminNamePlaceholder}
                                                value={createForm.admin_name}
                                                onChange={(e) =>
                                                    setCreateForm((prev) => ({
                                                        ...prev,
                                                        admin_name: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="account-email">{copy.email}</Label>
                                            <Input
                                                id="account-email"
                                                placeholder={copy.emailPlaceholder}
                                                type="email"
                                                value={createForm.email}
                                                onChange={(e) =>
                                                    setCreateForm((prev) => ({
                                                        ...prev,
                                                        email: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="account-company">{copy.company}</Label>
                                            <Input
                                                id="account-company"
                                                placeholder={copy.companyPlaceholder}
                                                value={createForm.company_name}
                                                onChange={(e) =>
                                                    setCreateForm((prev) => ({
                                                        ...prev,
                                                        company_name: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-xl border bg-muted/20 p-4">
                                    <div className="mb-4">
                                        <h3 className="text-sm font-semibold">
                                            {copy.capacityTitle}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {copy.capacityDescription}
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="account-quota">{copy.quota}</Label>
                                            <Input
                                                id="account-quota"
                                                placeholder={copy.quotaPlaceholder}
                                                type="number"
                                                value={createForm.quota_limit}
                                                onChange={(e) =>
                                                    setCreateForm((prev) => ({
                                                        ...prev,
                                                        quota_limit: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="account-description">
                                                {copy.description}
                                            </Label>
                                            <Textarea
                                                id="account-description"
                                                placeholder={copy.descriptionPlaceholder}
                                                value={createForm.description}
                                                onChange={(e) =>
                                                    setCreateForm((prev) => ({
                                                        ...prev,
                                                        description: e.target.value,
                                                    }))
                                                }
                                                rows={4}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                {copy.cancel}
                            </Button>
                            <Button
                                onClick={() => createMutation.mutate()}
                                disabled={
                                    !createForm.name ||
                                    !createForm.admin_name ||
                                    !createForm.email ||
                                    createMutation.isPending
                                }
                            >
                                {createMutation.isPending ? copy.creating : copy.create}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {latestInviteLink && (
                <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <p className="font-medium">{copy.inviteReady}</p>
                            <p className="text-sm text-muted-foreground">
                                {copy.inviteReadyDescription}
                            </p>
                            <p className="mt-2 text-sm">
                                {latestInviteEmailSent
                                    ? copy.inviteEmailSent
                                    : copy.inviteEmailFallback}
                            </p>
                            <p className="mt-2 break-all rounded-md border bg-card px-3 py-2 text-sm">
                                {latestInviteLink}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={async () => {
                                    await navigator.clipboard.writeText(latestInviteLink)
                                }}
                            >
                                {copy.copyInvite}
                            </Button>
                            <Button variant="ghost" onClick={() => setLatestInviteLink(null)}>
                                {copy.clearInvite}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>{copy.accountsBase}</CardTitle>
                        <CardDescription>{copy.selectHint}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                className="pl-9"
                                placeholder={copy.searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            {accountsQuery.isLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                filteredAccounts.map((account) => (
                                    <button
                                        key={account.id}
                                        className={`w-full rounded-lg border p-4 text-left transition-colors ${selectedAccountId === account.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'}`}
                                        onClick={() => setSelectedAccountId(account.id)}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">
                                                        {account.name}
                                                    </span>
                                                    <StatusBadge
                                                        active={account.active}
                                                        activeLabel={copy.activeBadge}
                                                        inactiveLabel={copy.inactiveBadge}
                                                    />
                                                </div>
                                                <div className="mt-1 text-sm text-muted-foreground">
                                                    {account.company_name || account.email}
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" />{' '}
                                                        {account.users_count} {copy.users}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Key className="h-3 w-3" />{' '}
                                                        {account.api_keys_count} {copy.keys}
                                                    </span>
                                                    <Badge variant="secondary">
                                                        {account.plan?.display_name ||
                                                            copy.withoutPlan}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{copy.accountOps}</CardTitle>
                        <CardDescription>
                            {selectedAccount ? copy.accountOpsSubtitle : copy.selectAccount}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {selectedAccountQuery.isFetching ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : !selectedAccount ? (
                            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                                {copy.noAccount}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                                            <Building2 className="h-7 w-7 text-primary" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-2xl font-semibold">
                                                    {selectedAccount.name}
                                                </h3>
                                                <StatusBadge
                                                    active={selectedAccount.active}
                                                    activeLabel={copy.activeBadge}
                                                    inactiveLabel={copy.inactiveBadge}
                                                />
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {selectedAccount.email}
                                            </p>
                                            {selectedAccount.company_name && (
                                                <p className="text-sm text-muted-foreground">
                                                    {selectedAccount.company_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            variant={
                                                selectedAccount.active ? 'destructive' : 'default'
                                            }
                                            onClick={() =>
                                                setConfirmDialog({
                                                    open: true,
                                                    title: selectedAccount.active
                                                        ? copy.confirmDeactivateTitle
                                                        : copy.confirmActivateTitle,
                                                    description: selectedAccount.active
                                                        ? copy.confirmDeactivateDescription
                                                        : copy.confirmActivateDescription,
                                                    confirmLabel: selectedAccount.active
                                                        ? copy.confirmDeactivate
                                                        : copy.confirmActivate,
                                                    confirmVariant: selectedAccount.active
                                                        ? 'destructive'
                                                        : 'default',
                                                    onConfirm: () =>
                                                        selectedAccount.active
                                                            ? deactivateMutation.mutate(
                                                                  selectedAccount.id
                                                              )
                                                            : activateMutation.mutate(
                                                                  selectedAccount.id
                                                              ),
                                                })
                                            }
                                            disabled={
                                                activateMutation.isPending ||
                                                deactivateMutation.isPending
                                            }
                                        >
                                            <Power className="mr-2 h-4 w-4" />
                                            {selectedAccount.active
                                                ? copy.deactivate
                                                : copy.activate}
                                        </Button>
                                    </div>
                                </div>
                                {(selectedAccount.pending_invitation ||
                                    selectedAccount.users_count === 0) && (
                                    <Card className="overflow-hidden border-primary/25 bg-primary/5 shadow-sm">
                                        <CardContent className="p-5">
                                            <div className="flex flex-col gap-5">
                                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                                                            <Mail className="h-6 w-6" />
                                                        </div>
                                                        <div className="max-w-2xl">
                                                            <p className="text-base font-semibold">
                                                                {copy.onboardingTitle}
                                                            </p>
                                                            <p className="mt-1 text-sm text-muted-foreground">
                                                                {copy.onboardingDescription}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex shrink-0 flex-wrap gap-2">
                                                        {selectedAccount.pending_invitation && (
                                                            <Button
                                                                variant="outline"
                                                                onClick={() =>
                                                                    copyInviteLink(
                                                                        selectedAccount
                                                                            .pending_invitation!
                                                                            .token
                                                                    )
                                                                }
                                                            >
                                                                {copiedInviteToken ===
                                                                selectedAccount.pending_invitation
                                                                    .token ? (
                                                                    <>
                                                                        <Check className="mr-2 h-4 w-4" />
                                                                        {copy.inviteCopied}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Copy className="mr-2 h-4 w-4" />
                                                                        {copy.copyInviteFromAccount}
                                                                    </>
                                                                )}
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="default"
                                                            onClick={() =>
                                                                resendInvitationMutation.mutate(
                                                                    selectedAccount.id
                                                                )
                                                            }
                                                            disabled={
                                                                resendInvitationMutation.isPending
                                                            }
                                                        >
                                                            {resendInvitationMutation.isPending ? (
                                                                <>
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    {copy.resendingInvite}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Send className="mr-2 h-4 w-4" />
                                                                    {selectedAccount.pending_invitation
                                                                        ? copy.resendInvite
                                                                        : copy.createInvite}
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                                                    <div className="rounded-xl border bg-card p-4">
                                                        <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                                                            {copy.onboardingLink}
                                                        </p>
                                                        {selectedAccount.pending_invitation ? (
                                                            <>
                                                                <p className="mt-3 break-all rounded-lg border bg-background px-3 py-3 text-sm leading-6">
                                                                    {`${window.location.origin}/accept-invite/${selectedAccount.pending_invitation.token}`}
                                                                </p>
                                                                <p className="mt-3 text-sm">
                                                                    {latestInviteEmailSent
                                                                        ? copy.inviteEmailSent
                                                                        : copy.inviteEmailFallback}
                                                                </p>
                                                            </>
                                                        ) : (
                                                            <p className="mt-3 text-sm text-muted-foreground">
                                                                {copy.pendingInviteDescription}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="rounded-xl border bg-card p-4">
                                                        <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                                                            {copy.onboardingActions}
                                                        </p>
                                                        <div className="mt-3 space-y-3">
                                                            <div className="rounded-lg bg-muted/40 px-3 py-3">
                                                                <p className="text-xs text-muted-foreground">
                                                                    {copy.onboardingEmail}
                                                                </p>
                                                                <p className="mt-1 break-all text-sm font-medium leading-6">
                                                                    {selectedAccount
                                                                        .pending_invitation
                                                                        ?.email ||
                                                                        selectedAccount.email}
                                                                </p>
                                                            </div>
                                                            <div className="rounded-lg bg-muted/40 px-3 py-3">
                                                                <p className="text-xs text-muted-foreground">
                                                                    {copy.inviteExpires}
                                                                </p>
                                                                <p className="mt-1 text-sm font-medium">
                                                                    {selectedAccount.pending_invitation
                                                                        ? new Date(
                                                                              selectedAccount
                                                                                  .pending_invitation
                                                                                  .expires_at
                                                                          ).toLocaleDateString(
                                                                              language === 'en'
                                                                                  ? 'en-US'
                                                                                  : 'pt-BR'
                                                                          )
                                                                        : '-'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                                <Tabs defaultValue="overview" className="space-y-4">
                                    <TabsList>
                                        <TabsTrigger value="overview">{copy.overview}</TabsTrigger>
                                        <TabsTrigger value="settings">{copy.settings}</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="overview" className="space-y-4">
                                        <div className="rounded-xl border bg-muted/20 p-4">
                                            <div className="mb-4">
                                                <h3 className="text-sm font-semibold">
                                                    {copy.tenantData}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {copy.tenantDataDesc}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                                                <Card>
                                                    <CardContent className="p-4">
                                                        <p className="text-xs text-muted-foreground">
                                                            {copy.overviewCards.users}
                                                        </p>
                                                        <p className="text-xl font-semibold">
                                                            {selectedAccount.users_count}
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardContent className="p-4">
                                                        <p className="text-xs text-muted-foreground">
                                                            {copy.overviewCards.keys}
                                                        </p>
                                                        <p className="text-xl font-semibold">
                                                            {selectedAccount.api_keys_count}
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardContent className="p-4">
                                                        <p className="text-xs text-muted-foreground">
                                                            {copy.overviewCards.requests}
                                                        </p>
                                                        <p className="text-xl font-semibold">
                                                            {quotaLabel(
                                                                selectedAccount.total_requests,
                                                                language
                                                            )}
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardContent className="p-4">
                                                        <p className="text-xs text-muted-foreground">
                                                            {copy.overviewCards.quota}
                                                        </p>
                                                        <p className="text-xl font-semibold">
                                                            {quotaLabel(
                                                                selectedAccount.quota_limit,
                                                                language
                                                            )}
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
                                            <div className="rounded-xl border bg-muted/20 p-4">
                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                    <div>
                                                        <p className="mb-2 text-sm font-medium">
                                                            {copy.accountName}
                                                        </p>
                                                        <div className="rounded-md border bg-card px-3 py-2 text-sm">
                                                            {selectedAccount.name}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="mb-2 text-sm font-medium">
                                                            {copy.email}
                                                        </p>
                                                        <div className="rounded-md border bg-card px-3 py-2 text-sm">
                                                            {selectedAccount.email}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="mb-2 text-sm font-medium">
                                                            {copy.companyLabel}
                                                        </p>
                                                        <div className="rounded-md border bg-card px-3 py-2 text-sm">
                                                            {selectedAccount.company_name || '-'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="mb-2 text-sm font-medium">
                                                            {copy.monthlyQuota}
                                                        </p>
                                                        <div className="rounded-md border bg-card px-3 py-2 text-sm">
                                                            {quotaLabel(
                                                                selectedAccount.quota_limit,
                                                                language
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="rounded-xl border bg-muted/20 p-4">
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {copy.currentPlan}
                                                    </p>
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        {copy.currentPlanHint}
                                                    </p>
                                                </div>
                                                <div className="mt-4 rounded-lg bg-card p-3 text-sm">
                                                    <div className="font-medium">
                                                        {selectedAccount.plan?.display_name ||
                                                            copy.currentPlanEmpty}
                                                    </div>
                                                    <div className="mt-1 text-muted-foreground">
                                                        {selectedAccount.plan?.description ||
                                                            copy.currentPlanEmptyDesc}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="settings" className="space-y-4">
                                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
                                            <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                                                <div>
                                                    <h3 className="text-sm font-semibold">
                                                        {copy.planAndLimits}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {copy.planAndLimitsDesc}
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                    <div>
                                                        <p className="mb-2 text-sm font-medium">
                                                            {copy.accountName}
                                                        </p>
                                                        <Input
                                                            value={editForm.name}
                                                            onChange={(e) =>
                                                                setEditForm((prev) => ({
                                                                    ...prev,
                                                                    name: e.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="mb-2 text-sm font-medium">
                                                            {copy.email}
                                                        </p>
                                                        <Input value={editForm.email} disabled />
                                                    </div>
                                                    <div>
                                                        <p className="mb-2 text-sm font-medium">
                                                            {copy.company}
                                                        </p>
                                                        <Input
                                                            value={editForm.company_name}
                                                            onChange={(e) =>
                                                                setEditForm((prev) => ({
                                                                    ...prev,
                                                                    company_name: e.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="mb-2 text-sm font-medium">
                                                            {copy.quota}
                                                        </p>
                                                        <Input
                                                            value={editForm.quota_limit}
                                                            type="number"
                                                            onChange={(e) =>
                                                                setEditForm((prev) => ({
                                                                    ...prev,
                                                                    quota_limit: e.target.value,
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="mb-2 text-sm font-medium">
                                                        {copy.description}
                                                    </p>
                                                    <Textarea
                                                        rows={4}
                                                        value={editForm.description}
                                                        onChange={(e) =>
                                                            setEditForm((prev) => ({
                                                                ...prev,
                                                                description: e.target.value,
                                                            }))
                                                        }
                                                    />
                                                </div>
                                                <div className="flex justify-end">
                                                    <Button
                                                        onClick={() =>
                                                            setConfirmDialog({
                                                                open: true,
                                                                title: copy.confirmSaveTitle,
                                                                description:
                                                                    copy.confirmSaveDescription,
                                                                confirmLabel: copy.confirmSave,
                                                                confirmVariant: 'default',
                                                                onConfirm: () =>
                                                                    updateAccountMutation.mutate(),
                                                            })
                                                        }
                                                        disabled={updateAccountMutation.isPending}
                                                    >
                                                        {updateAccountMutation.isPending
                                                            ? copy.saving
                                                            : copy.saveAccount}
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {copy.currentPlan}
                                                    </p>
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        {copy.currentPlanHint}
                                                    </p>
                                                </div>
                                                <Select
                                                    value={selectedAccount.plan_id ?? '__none__'}
                                                    onValueChange={(value) =>
                                                        setConfirmDialog({
                                                            open: true,
                                                            title: copy.confirmPlanTitle,
                                                            description:
                                                                copy.confirmPlanDescription,
                                                            confirmLabel: copy.confirmPlan,
                                                            confirmVariant: 'default',
                                                            onConfirm: () =>
                                                                assignPlanMutation.mutate({
                                                                    accountId: selectedAccount.id,
                                                                    planId:
                                                                        value === '__none__'
                                                                            ? null
                                                                            : value,
                                                                }),
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="__none__">
                                                            {copy.noPlanOption}
                                                        </SelectItem>
                                                        {plans.map((plan) => (
                                                            <SelectItem
                                                                key={plan.id}
                                                                value={plan.id}
                                                            >
                                                                {plan.display_name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <div className="rounded-lg bg-card p-3 text-sm">
                                                    <div className="font-medium">
                                                        {selectedAccount.plan?.display_name ||
                                                            copy.currentPlanEmpty}
                                                    </div>
                                                    <div className="mt-1 text-muted-foreground">
                                                        {selectedAccount.plan?.description ||
                                                            copy.currentPlanEmptyDesc}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
