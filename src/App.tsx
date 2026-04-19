import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/hooks/useTheme'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { Header } from '@/components/Header'
import { AlertsDropdown } from '@/components/dashboard/AlertsDropdown'
import { Sidebar, MobileMenuButton } from '@/components/Sidebar'
import { CommandPalette } from '@/components/CommandPalette'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import { AcceptInvitationPage } from '@/pages/AcceptInvitationPage'
import { OverviewPage } from '@/pages/OverviewPage'
import { ReviewQueuePage } from '@/pages/ReviewQueuePage'
import { DecisionsPage } from '@/pages/DecisionsPage'
import { GraphExplorerPage } from '@/pages/GraphExplorerPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ApiKeysPage } from '@/pages/ApiKeysPage'
import { AuditLogsPage } from '@/pages/AuditLogsPage'
import { UsersPage } from '@/pages/UsersPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { RulesEnginePage } from '@/pages/RulesEnginePage'
import { WebhooksPage } from '@/pages/WebhooksPage'
import { MonitoringPage } from '@/pages/MonitoringPage'
import { LearningPage } from '@/pages/LearningPage'
import { InvestigationPage } from '@/pages/InvestigationPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { AlertingPage } from '@/pages/AlertingPage'
import { AccountsPage } from '@/pages/AccountsPage'
import { PlansPage } from '@/pages/PlansPage'
import { SuperAdminOverviewPage } from '@/pages/SuperAdminOverviewPage'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/toaster'
import { ErrorBoundaryProvider } from '@/components/ErrorBoundary'

const queryClient = new QueryClient()

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, isSuperAdmin } = useAuth()

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />
    if (isSuperAdmin) return <Navigate to="/admin/overview" replace />
    return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, isAdmin, isSuperAdmin } = useAuth()

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />
    if (isSuperAdmin) return <Navigate to="/admin/overview" replace />
    return isAdmin ? <>{children}</> : <Navigate to="/dashboard" replace />
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading, isSuperAdmin } = useAuth()

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />
    return isSuperAdmin ? <>{children}</> : <Navigate to="/dashboard" replace />
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isSuperAdmin } = useAuth()
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <div className="min-h-screen bg-background">
            <Header
                leftContent={<MobileMenuButton onClick={() => setMobileMenuOpen(true)} />}
                rightContent={
                    <div className="flex items-center gap-1">
                        {!isSuperAdmin && <AlertsDropdown />}
                        <CommandPalette />
                    </div>
                }
            />
            <Sidebar
                collapsed={sidebarCollapsed}
                onCollapse={setSidebarCollapsed}
                mobileOpen={mobileMenuOpen}
                onMobileClose={() => setMobileMenuOpen(false)}
            />
            <main
                className={cn(
                    'pt-14 transition-all duration-300',
                    sidebarCollapsed ? 'md:pl-16' : 'md:pl-56'
                )}
            >
                <div className="p-4 md:p-6">{children}</div>
            </main>
            <Toaster />
        </div>
    )
}

function AppRouter() {
    const { isSuperAdmin } = useAuth()

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/accept-invite/:token" element={<AcceptInvitationPage />} />
            <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
            <Route
                path="/admin/overview"
                element={
                    <SuperAdminRoute>
                        <DashboardLayout>
                            <SuperAdminOverviewPage />
                        </DashboardLayout>
                    </SuperAdminRoute>
                }
            />
            <Route
                path="/admin/accounts"
                element={
                    <SuperAdminRoute>
                        <DashboardLayout>
                            <AccountsPage />
                        </DashboardLayout>
                    </SuperAdminRoute>
                }
            />
            <Route
                path="/admin/plans"
                element={
                    <SuperAdminRoute>
                        <DashboardLayout>
                            <PlansPage />
                        </DashboardLayout>
                    </SuperAdminRoute>
                }
            />
            <Route
                path="/admin/profile"
                element={
                    <SuperAdminRoute>
                        <DashboardLayout>
                            <ProfilePage />
                        </DashboardLayout>
                    </SuperAdminRoute>
                }
            />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <DashboardLayout>
                            <OverviewPage />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/review"
                element={
                    <ProtectedRoute>
                        <DashboardLayout>
                            <ReviewQueuePage />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/decisions"
                element={
                    <ProtectedRoute>
                        <DashboardLayout>
                            <DecisionsPage />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/graph"
                element={
                    <ProtectedRoute>
                        <DashboardLayout>
                            <GraphExplorerPage />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/analytics"
                element={
                    <ProtectedRoute>
                        <DashboardLayout>
                            <AnalyticsPage />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/users"
                element={
                    <AdminRoute>
                        <DashboardLayout>
                            <UsersPage />
                        </DashboardLayout>
                    </AdminRoute>
                }
            />
            <Route
                path="/dashboard/settings"
                element={
                    <AdminRoute>
                        <DashboardLayout>
                            <SettingsPage />
                        </DashboardLayout>
                    </AdminRoute>
                }
            />
            <Route
                path="/dashboard/api-keys"
                element={
                    <AdminRoute>
                        <DashboardLayout>
                            <ApiKeysPage />
                        </DashboardLayout>
                    </AdminRoute>
                }
            />
            <Route
                path="/dashboard/audit"
                element={
                    <AdminRoute>
                        <DashboardLayout>
                            <AuditLogsPage />
                        </DashboardLayout>
                    </AdminRoute>
                }
            />
            <Route
                path="/dashboard/profile"
                element={
                    <ProtectedRoute>
                        <DashboardLayout>
                            <ProfilePage />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/rules"
                element={
                    <AdminRoute>
                        <DashboardLayout>
                            <RulesEnginePage />
                        </DashboardLayout>
                    </AdminRoute>
                }
            />
            <Route
                path="/dashboard/monitoring"
                element={
                    <AdminRoute>
                        <DashboardLayout>
                            <MonitoringPage />
                        </DashboardLayout>
                    </AdminRoute>
                }
            />
            <Route
                path="/dashboard/learning"
                element={
                    <ProtectedRoute>
                        <DashboardLayout>
                            <LearningPage />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/investigation"
                element={
                    <ProtectedRoute>
                        <DashboardLayout>
                            <InvestigationPage />
                        </DashboardLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/dashboard/reports"
                element={
                    <AdminRoute>
                        <DashboardLayout>
                            <ReportsPage />
                        </DashboardLayout>
                    </AdminRoute>
                }
            />
            <Route
                path="/dashboard/alerting"
                element={
                    <AdminRoute>
                        <DashboardLayout>
                            <AlertingPage />
                        </DashboardLayout>
                    </AdminRoute>
                }
            />
            <Route
                path="/dashboard/webhooks"
                element={
                    <AdminRoute>
                        <DashboardLayout>
                            <WebhooksPage />
                        </DashboardLayout>
                    </AdminRoute>
                }
            />
            <Route
                path="/"
                element={<Navigate to={isSuperAdmin ? '/admin/overview' : '/dashboard'} replace />}
            />
        </Routes>
    )
}

function App() {
    return (
        <ErrorBoundaryProvider>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    <LanguageProvider>
                        <AuthProvider>
                            <BrowserRouter>
                                <AppRouter />
                                <Toaster />
                            </BrowserRouter>
                        </AuthProvider>
                    </LanguageProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </ErrorBoundaryProvider>
    )
}

export default App
