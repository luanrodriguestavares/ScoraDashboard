import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/contexts/LanguageContext'
import {
    LayoutDashboard,
    ClipboardList,
    Network,
    BarChart3,
    Settings,
    Key,
    FileText,
    Users,
    User,
    Search,
    ListChecks,
    Scale,
    Activity,
    FileBarChart,
    Bell,
    Brain,
    SearchIcon,
    Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

interface CommandItem {
    id: string
    label: string
    icon: typeof LayoutDashboard
    action: () => void
    keywords: string[]
    category: 'navigation' | 'actions' | 'settings'
    requiresAdmin?: boolean
    superAdminOnly?: boolean
}

export function CommandPalette() {
    const { t, language } = useLanguage()
    const { isAdmin, isSuperAdmin } = useAuth()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)

    const commands: CommandItem[] = [
        {
            id: 'overview',
            label: t.nav.overview,
            icon: LayoutDashboard,
            action: () => navigate('/dashboard'),
            keywords: ['home', 'dashboard', 'inicio', 'visao geral'],
            category: 'navigation',
        },
        {
            id: 'decisions',
            label: t.nav.decisions,
            icon: ListChecks,
            action: () => navigate('/dashboard/decisions'),
            keywords: ['decisions', 'decisoes', 'history', 'historico'],
            category: 'navigation',
        },
        {
            id: 'review',
            label: t.nav.reviewQueue,
            icon: ClipboardList,
            action: () => navigate('/dashboard/review'),
            keywords: ['review', 'queue', 'fila', 'revisao', 'pending'],
            category: 'navigation',
        },
        {
            id: 'graph',
            label: t.nav.graphExplorer,
            icon: Network,
            action: () => navigate('/dashboard/graph'),
            keywords: ['graph', 'grafo', 'cluster', 'connections', 'network'],
            category: 'navigation',
        },
        {
            id: 'analytics',
            label: t.nav.analytics,
            icon: BarChart3,
            action: () => navigate('/dashboard/analytics'),
            keywords: ['analytics', 'metrics', 'metricas', 'relatorios'],
            category: 'navigation',
        },
        {
            id: 'rules',
            label: t.nav.rulesEngine,
            icon: Scale,
            action: () => navigate('/dashboard/rules'),
            keywords: ['rules', 'regras', 'engine', 'motor', 'custom'],
            category: 'navigation',
            requiresAdmin: true,
        },
        {
            id: 'monitoring',
            label: t.nav.monitoring,
            icon: Activity,
            action: () => navigate('/dashboard/monitoring'),
            keywords: ['monitoring', 'monitoramento', 'health', 'saude', 'status'],
            category: 'navigation',
            requiresAdmin: true,
        },
        {
            id: 'investigation',
            label: t.nav.investigation,
            icon: SearchIcon,
            action: () => navigate('/dashboard/investigation'),
            keywords: ['investigation', 'investigacao', 'cases', 'casos', 'fraud'],
            category: 'navigation',
        },
        {
            id: 'reports',
            label: t.nav.reports,
            icon: FileBarChart,
            action: () => navigate('/dashboard/reports'),
            keywords: ['reports', 'relatorios', 'export', 'compliance'],
            category: 'navigation',
            requiresAdmin: true,
        },
        {
            id: 'alerting',
            label: t.nav.alerting,
            icon: Bell,
            action: () => navigate('/dashboard/alerting'),
            keywords: ['alerts', 'alertas', 'notifications', 'notificacoes'],
            category: 'navigation',
            requiresAdmin: true,
        },
        {
            id: 'learning',
            label: t.nav.learning,
            icon: Brain,
            action: () => navigate('/dashboard/learning'),
            keywords: ['learning', 'aprendizado', 'feedback', 'drift', 'model'],
            category: 'navigation',
        },
        {
            id: 'settings',
            label: t.nav.settings,
            icon: Settings,
            action: () => navigate('/dashboard/settings'),
            keywords: ['settings', 'config', 'configuracoes', 'preferences'],
            category: 'settings',
            requiresAdmin: true,
        },
        {
            id: 'api-keys',
            label: t.nav.apiKeys,
            icon: Key,
            action: () => navigate('/dashboard/api-keys'),
            keywords: ['api', 'keys', 'chaves', 'tokens'],
            category: 'settings',
            requiresAdmin: true,
        },
        {
            id: 'audit',
            label: t.nav.auditLogs,
            icon: FileText,
            action: () => navigate('/dashboard/audit'),
            keywords: ['audit', 'logs', 'auditoria', 'history', 'historico'],
            category: 'settings',
            requiresAdmin: true,
        },
        {
            id: 'users',
            label: t.nav.users,
            icon: Users,
            action: () => navigate('/dashboard/users'),
            keywords: ['users', 'usuarios', 'team', 'equipe', 'members'],
            category: 'settings',
            requiresAdmin: true,
        },
        {
            id: 'profile',
            label: t.nav.profile,
            icon: User,
            action: () => navigate(isSuperAdmin ? '/admin/profile' : '/dashboard/profile'),
            keywords: ['profile', 'perfil', 'account', 'conta', 'me'],
            category: 'settings',
        },
        {
            id: 'super-admin-overview',
            label: language === 'en' ? 'System dashboard' : 'Dashboard do sistema',
            icon: LayoutDashboard,
            action: () => navigate('/admin/overview'),
            keywords: ['system', 'dashboard', 'super', 'admin', 'saude', 'health', 'overview'],
            category: 'navigation',
            superAdminOnly: true,
        },
        {
            id: 'accounts-admin',
            label: 'Contas',
            icon: Building2,
            action: () => navigate('/admin/accounts'),
            keywords: ['accounts', 'contas', 'tenants', 'clientes'],
            category: 'navigation',
            superAdminOnly: true,
        },
        {
            id: 'plans-admin',
            label: 'Planos',
            icon: FileBarChart,
            action: () => navigate('/admin/plans'),
            keywords: ['plans', 'planos', 'pricing', 'catalogo'],
            category: 'settings',
            superAdminOnly: true,
        },
    ]

    const visibleCommands = commands.filter((cmd) => {
        if (isSuperAdmin) return !!cmd.superAdminOnly || cmd.id === 'profile'
        if (cmd.superAdminOnly) return false
        return !cmd.requiresAdmin || isAdmin
    })

    const filteredCommands = visibleCommands.filter((cmd) => {
        if (!query) return true
        const q = query.toLowerCase()
        return cmd.label.toLowerCase().includes(q) || cmd.keywords.some((k) => k.includes(q))
    })

    const groupedCommands = {
        navigation: filteredCommands.filter((c) => c.category === 'navigation'),
        settings: filteredCommands.filter((c) => c.category === 'settings'),
    }

    const flatCommands = [...groupedCommands.navigation, ...groupedCommands.settings]

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [])

    useEffect(() => {
        if (open) {
            setQuery('')
            setSelectedIndex(0)
        }
    }, [open])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex((i) => (i + 1) % flatCommands.length)
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex((i) => (i - 1 + flatCommands.length) % flatCommands.length)
            } else if (e.key === 'Enter') {
                e.preventDefault()
                const cmd = flatCommands[selectedIndex]
                if (cmd) {
                    cmd.action()
                    setOpen(false)
                }
            }
        },
        [flatCommands, selectedIndex]
    )

    const handleSelect = (cmd: CommandItem) => {
        cmd.action()
        setOpen(false)
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 h-9 min-w-[220px] text-sm text-muted-foreground hover:text-foreground bg-background hover:bg-muted/70 rounded-md border border-border transition-colors"
            >
                <Search className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 text-left">{t.commandPalette.search}</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden bg-card text-card-foreground border-border/60 shadow-none">
                    <div className="flex items-center border-b px-3">
                        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input
                            placeholder={t.commandPalette.placeholder}
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value)
                                setSelectedIndex(0)
                            }}
                            onKeyDown={handleKeyDown}
                            className="border-0 focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12 bg-transparent px-2 shadow-none outline-none"
                            autoFocus
                        />
                    </div>

                    <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 hover:scrollbar-thumb-muted-foreground/50">
                        {flatCommands.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                {t.commandPalette.noResults}
                            </div>
                        ) : (
                            <>
                                {groupedCommands.navigation.length > 0 && (
                                    <div className="mb-2">
                                        <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                            {t.commandPalette.navigation}
                                        </p>
                                        {groupedCommands.navigation.map((cmd, i) => {
                                            const Icon = cmd.icon
                                            const globalIndex = i
                                            return (
                                                <button
                                                    key={cmd.id}
                                                    onClick={() => handleSelect(cmd)}
                                                    className={cn(
                                                        'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors',
                                                        selectedIndex === globalIndex
                                                            ? 'bg-accent text-accent-foreground'
                                                            : 'hover:bg-accent/50'
                                                    )}
                                                >
                                                    <Icon className="h-4 w-4" />
                                                    <span>{cmd.label}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}

                                {groupedCommands.settings.length > 0 && (
                                    <div>
                                        <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                            {t.commandPalette.settings}
                                        </p>
                                        {groupedCommands.settings.map((cmd, i) => {
                                            const Icon = cmd.icon
                                            const globalIndex =
                                                groupedCommands.navigation.length + i
                                            return (
                                                <button
                                                    key={cmd.id}
                                                    onClick={() => handleSelect(cmd)}
                                                    className={cn(
                                                        'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors',
                                                        selectedIndex === globalIndex
                                                            ? 'bg-accent text-accent-foreground'
                                                            : 'hover:bg-accent/50'
                                                    )}
                                                >
                                                    <Icon className="h-4 w-4" />
                                                    <span>{cmd.label}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
                        <div className="flex gap-2">
                            <kbd className="rounded border px-1.5 py-0.5">↑↓</kbd>
                            <span>{t.commandPalette.navigate}</span>
                        </div>
                        <div className="flex gap-2">
                            <kbd className="rounded border px-1.5 py-0.5">↵</kbd>
                            <span>{t.commandPalette.select}</span>
                        </div>
                        <div className="flex gap-2">
                            <kbd className="rounded border px-1.5 py-0.5">esc</kbd>
                            <span>{t.commandPalette.close}</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
