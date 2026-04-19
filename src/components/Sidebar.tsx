import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import {
    LayoutDashboard,
    ClipboardList,
    ListChecks,
    Network,
    BarChart3,
    Settings,
    Key,
    FileText,
    ChevronLeft,
    ChevronRight,
    Users,
    User,
    X,
    Menu,
    Scale,
    Activity,
    Brain,
    Search,
    FileBarChart,
    Bell,
    Building2,
    Webhook,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface NavItem {
    to: string
    icon: typeof LayoutDashboard
    labelKey: string
    fallbackLabel?: string
    section?: 'main' | 'risk' | 'learning' | 'admin' | 'account'
    requiresAdmin?: boolean
    superAdminOnly?: boolean
}

const navItems: NavItem[] = [
    { to: '/dashboard', icon: LayoutDashboard, labelKey: 'overview', section: 'main' },
    { to: '/dashboard/decisions', icon: ListChecks, labelKey: 'decisions', section: 'main' },
    { to: '/dashboard/graph', icon: Network, labelKey: 'graphExplorer', section: 'main' },
    { to: '/dashboard/analytics', icon: BarChart3, labelKey: 'analytics', section: 'main' },
    {
        to: '/dashboard/rules',
        icon: Scale,
        labelKey: 'rulesEngine',
        section: 'risk',
        requiresAdmin: true,
    },
    {
        to: '/dashboard/monitoring',
        icon: Activity,
        labelKey: 'monitoring',
        section: 'risk',
        requiresAdmin: true,
    },
    { to: '/dashboard/investigation', icon: Search, labelKey: 'investigation', section: 'risk' },
    { to: '/dashboard/review', icon: ClipboardList, labelKey: 'reviewQueue', section: 'learning' },
    {
        to: '/dashboard/reports',
        icon: FileBarChart,
        labelKey: 'reports',
        section: 'risk',
        requiresAdmin: true,
    },
    {
        to: '/dashboard/alerting',
        icon: Bell,
        labelKey: 'alerting',
        section: 'risk',
        requiresAdmin: true,
    },
    {
        to: '/dashboard/webhooks',
        icon: Webhook,
        labelKey: 'webhooks',
        fallbackLabel: 'Webhooks',
        section: 'admin',
        requiresAdmin: true,
    },
    {
        to: '/dashboard/users',
        icon: Users,
        labelKey: 'users',
        section: 'admin',
        requiresAdmin: true,
    },
    {
        to: '/dashboard/settings',
        icon: Settings,
        labelKey: 'settings',
        section: 'admin',
        requiresAdmin: true,
    },
    { to: '/dashboard/learning', icon: Brain, labelKey: 'learning', section: 'learning' },
    {
        to: '/dashboard/api-keys',
        icon: Key,
        labelKey: 'apiKeys',
        section: 'admin',
        requiresAdmin: true,
    },
    {
        to: '/dashboard/audit',
        icon: FileText,
        labelKey: 'auditLogs',
        section: 'admin',
        requiresAdmin: true,
    },
    { to: '/dashboard/profile', icon: User, labelKey: 'profile', section: 'account' },
    {
        to: '/admin/overview',
        icon: LayoutDashboard,
        labelKey: 'overview',
        fallbackLabel: 'Dashboard',
        section: 'main',
        superAdminOnly: true,
    },
    {
        to: '/admin/accounts',
        icon: Building2,
        labelKey: 'accounts',
        fallbackLabel: 'Contas',
        section: 'admin',
        superAdminOnly: true,
    },
    {
        to: '/admin/plans',
        icon: FileBarChart,
        labelKey: 'plan',
        fallbackLabel: 'Planos',
        section: 'admin',
        superAdminOnly: true,
    },
    {
        to: '/admin/profile',
        icon: User,
        labelKey: 'profile',
        fallbackLabel: 'Perfil',
        section: 'account',
        superAdminOnly: true,
    },
]

interface SidebarProps {
    collapsed: boolean
    onCollapse: (collapsed: boolean) => void
    mobileOpen: boolean
    onMobileClose: () => void
}

export function Sidebar({ collapsed, onCollapse, mobileOpen, onMobileClose }: SidebarProps) {
    const { t } = useLanguage()
    const { isAdmin, isSuperAdmin } = useAuth()
    const location = useLocation()

    useEffect(() => {
        onMobileClose()
    }, [location.pathname])

    const renderNavItems = (items: NavItem[]) => {
        return items.map((item) => {
            const Icon = item.icon
            const isActive =
                item.to === '/dashboard'
                    ? location.pathname === '/dashboard'
                    : location.pathname.startsWith(item.to)

            return (
                <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onMobileClose}
                    className={cn(
                        'flex items-center gap-3 py-2 text-sm font-medium transition-colors rounded-md',
                        'border-l-2',
                        collapsed ? 'px-[14px] justify-center' : 'px-3',
                        isActive
                            ? 'border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'border-transparent text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                    )}
                >
                    <Icon
                        className={cn('h-4 w-4 shrink-0', isActive ? 'text-sidebar-primary' : '')}
                    />
                    {!collapsed && (
                        <span className="truncate">
                            {(t.nav[item.labelKey as keyof typeof t.nav] as string | undefined) ||
                                item.fallbackLabel ||
                                item.labelKey}
                        </span>
                    )}
                </NavLink>
            )
        })
    }

    const visibleItems = navItems.filter((item) => {
        if (isSuperAdmin) return !!item.superAdminOnly
        if (item.superAdminOnly) return false
        return !item.requiresAdmin || isAdmin
    })
    const mainItems = visibleItems.filter((i) => i.section === 'main')
    const riskItems = visibleItems.filter((i) => i.section === 'risk')
    const learningItems = visibleItems.filter((i) => i.section === 'learning')
    const adminItems = visibleItems.filter((i) => i.section === 'admin')
    const accountItems = visibleItems.filter((i) => i.section === 'account')

    const sidebarContent = (
        <div className="flex flex-col h-full">
            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-sidebar-foreground/20 hover:scrollbar-thumb-sidebar-foreground/30">
                {renderNavItems(mainItems)}

                {!collapsed && riskItems.length > 0 && (
                    <div className="pt-5 pb-1.5 px-3">
                        <span className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-[0.08em]">
                            Risk Intelligence
                        </span>
                    </div>
                )}
                {renderNavItems(riskItems)}

                {!collapsed && learningItems.length > 0 && (
                    <div className="pt-5 pb-1.5 px-3">
                        <span className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-[0.08em]">
                            {t.learning?.sectionLabel || 'Learning'}
                        </span>
                    </div>
                )}
                {renderNavItems(learningItems)}

                {!collapsed && adminItems.length > 0 && (
                    <div className="pt-5 pb-1.5 px-3">
                        <span className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-[0.08em]">
                            {isSuperAdmin ? 'Super Admin' : 'Admin'}
                        </span>
                    </div>
                )}
                {renderNavItems(adminItems)}

                {!collapsed && accountItems.length > 0 && (
                    <div className="pt-5 pb-1.5 px-3">
                        <span className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-[0.08em]">
                            {t.header.profile}
                        </span>
                    </div>
                )}
                {renderNavItems(accountItems)}
            </nav>

            <div className="hidden md:block px-2 py-3 border-t border-sidebar-border">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCollapse(!collapsed)}
                    className={cn(
                        'w-full text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/60',
                        collapsed ? 'justify-center' : 'justify-start'
                    )}
                >
                    {collapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            {t.common.collapse}
                        </>
                    )}
                </Button>
            </div>
        </div>
    )

    return (
        <>
            {mobileOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onMobileClose} />
            )}

            <aside
                className={cn(
                    'fixed top-14 bottom-0 z-40 bg-sidebar border-r border-sidebar-border transition-all duration-300',
                    'md:left-0',
                    collapsed ? 'md:w-16' : 'md:w-56',
                    mobileOpen ? 'left-0 w-64' : '-left-64 md:left-0'
                )}
            >
                <div className="md:hidden flex items-center justify-between p-3 border-b border-sidebar-border">
                    <span className="font-semibold">Menu</span>
                    <Button variant="ghost" size="icon" onClick={onMobileClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                {sidebarContent}
            </aside>
        </>
    )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
    return (
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onClick}>
            <Menu className="h-5 w-5" />
        </Button>
    )
}
