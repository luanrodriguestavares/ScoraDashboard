import type {
    DashboardStats,
    ReviewCase,
    GraphCluster,
    Alert,
    ApiKey,
    RiskSettings,
    Webhook,
    AuditLog,
    RiskDecision,
    User,
    Account,
    AccountInvitation,
    Plan,
    Rule,
    Feedback,
    DriftMetrics,
    Recommendation,
    RetrainingHistory,
    InvestigationCase,
    Report,
    ReportHistoryEntry,
    AlertRule,
    AlertEvent,
    WebhookEvent,
    DecisionExecutiveSummary,
} from '@/types'
import { getAccessToken, clearTokens, refreshSession } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function withAuthHeaders(token: string | null, options: RequestInit = {}): Record<string, string> {
    const tzOffset = new Date().getTimezoneOffset()
    return {
        'X-Timezone-Offset': tzOffset.toString(),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers as Record<string, string> | undefined),
    }
}

async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getAccessToken()
    const headers = withAuthHeaders(token, options)

    if (options.body !== undefined && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json'
    }

    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    })

    if (response.status === 401) {
        const refreshedToken = await refreshSession()
        if (refreshedToken) {
            const retryHeaders = withAuthHeaders(refreshedToken, options)
            if (options.body !== undefined && !retryHeaders['Content-Type']) {
                retryHeaders['Content-Type'] = 'application/json'
            }
            response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: retryHeaders,
            })
        }
    }

    if (!response.ok) {
        if (response.status === 401) {
            clearTokens()
            window.dispatchEvent(new Event('auth:unauthorized'))
        }
        let message = `API Error: ${response.status}`
        try {
            const body = await response.json()
            if (body.message) message = body.message
            else if (body.error) message = body.error
        } catch {}
        throw new Error(message)
    }

    const json = await response.json()
    if (json && typeof json === 'object' && 'data' in json) {
        return (json as { data: T }).data
    }
    return json
}

function extractFilename(contentDisposition: string | null): string | undefined {
    if (!contentDisposition) return undefined
    const match = contentDisposition.match(/filename\*?=(?:UTF-8''|\")?([^;\"\n]+)/i)
    if (!match?.[1]) return undefined
    return decodeURIComponent(match[1].replace(/\"/g, '').trim())
}

async function fetchWithAuthBlob(
    endpoint: string,
    options: RequestInit = {}
): Promise<{ blob: Blob; filename?: string }> {
    const token = getAccessToken()
    const headers = withAuthHeaders(token, options)

    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    })

    if (response.status === 401) {
        const refreshedToken = await refreshSession()
        if (refreshedToken) {
            response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: withAuthHeaders(refreshedToken, options),
            })
        }
    }

    if (!response.ok) {
        if (response.status === 401) {
            clearTokens()
            window.dispatchEvent(new Event('auth:unauthorized'))
        }
        let message = `API Error: ${response.status}`
        try {
            const body = await response.json()
            if (body.message) message = body.message
            else if (body.error) message = body.error
        } catch {}
        throw new Error(message)
    }

    const blob = await response.blob()
    const filename = extractFilename(response.headers.get('Content-Disposition'))
    return { blob, filename }
}

async function fetchWithAuthText(endpoint: string, options: RequestInit = {}): Promise<string> {
    const token = getAccessToken()
    const headers = withAuthHeaders(token, options)

    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    })

    if (response.status === 401) {
        const refreshedToken = await refreshSession()
        if (refreshedToken) {
            response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: withAuthHeaders(refreshedToken, options),
            })
        }
    }

    if (!response.ok) {
        if (response.status === 401) {
            clearTokens()
            window.dispatchEvent(new Event('auth:unauthorized'))
        }
        let message = `API Error: ${response.status}`
        try {
            const body = await response.json()
            if (body.message) message = body.message
            else if (body.error) message = body.error
        } catch {}
        throw new Error(message)
    }

    return response.text()
}

async function fetchWithAuthRaw<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getAccessToken()
    const headers = withAuthHeaders(token, options)

    if (options.body !== undefined && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json'
    }

    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    })

    if (response.status === 401) {
        const refreshedToken = await refreshSession()
        if (refreshedToken) {
            const retryHeaders = withAuthHeaders(refreshedToken, options)
            if (options.body !== undefined && !retryHeaders['Content-Type']) {
                retryHeaders['Content-Type'] = 'application/json'
            }
            response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: retryHeaders,
            })
        }
    }

    if (!response.ok) {
        if (response.status === 401) {
            clearTokens()
            window.dispatchEvent(new Event('auth:unauthorized'))
        }
        let message = `API Error: ${response.status}`
        try {
            const body = await response.json()
            if (body.message) message = body.message
            else if (body.error) message = body.error
        } catch {}
        throw new Error(message)
    }

    return response.json()
}

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const tzOffset = new Date().getTimezoneOffset()
    const headers: Record<string, string> = {
        'X-Timezone-Offset': tzOffset.toString(),
        ...(options.headers as Record<string, string> | undefined),
    }

    if (options.body !== undefined && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    })

    if (!response.ok) {
        let message = `API Error: ${response.status}`
        try {
            const body = await response.json()
            if (body.message) message = body.message
            else if (body.error) message = body.error
        } catch {}
        throw new Error(message)
    }

    const json = await response.json()
    if (json && typeof json === 'object' && 'data' in json) {
        return (json as { data: T }).data
    }
    return json
}

type WebhookResponse = {
    id: string
    name: string
    url: string
    events: WebhookEvent[]
    secret: string | null
    is_active: boolean
    filter_validation_types: string[] | null
    filter_risk_levels: string[] | null
    filter_decisions: string[] | null
    filter_min_score: number | null
    timeout_ms: number
    max_retries: number
    headers: Record<string, string> | null
    total_sent: number
    total_failed: number
    created_at: string
    last_triggered_at?: string | null
}

function mapWebhook(webhook: WebhookResponse): Webhook {
    return {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        active: webhook.is_active,
        secret: webhook.secret,
        filter_validation_types: webhook.filter_validation_types ?? null,
        filter_risk_levels: webhook.filter_risk_levels ?? null,
        filter_decisions: webhook.filter_decisions ?? null,
        filter_min_score: webhook.filter_min_score ?? null,
        timeout_ms: webhook.timeout_ms ?? 5000,
        max_retries: webhook.max_retries ?? 3,
        headers: webhook.headers ?? null,
        total_sent: webhook.total_sent ?? 0,
        total_failed: webhook.total_failed ?? 0,
        created_at: webhook.created_at,
        last_triggered_at: webhook.last_triggered_at ?? undefined,
    }
}

export const authApi = {
    login: (credentials: { email: string; password: string }) =>
        fetchJson<{
            token: string
            refreshToken: string
            expiresAt: number
            user: User & { account?: Account }
        }>('/v1/admin/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        }),

    register: (payload: {
        name: string
        email: string
        password: string
        account_name?: string
        company_name?: string
        description?: string
    }) =>
        fetchJson<{
            token: string
            refreshToken: string
            expiresAt: number
            user: User
            account: Account
        }>('/v1/admin/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    getInvitation: (token: string) =>
        fetchJson<{
            id: string
            token: string
            name: string
            email: string
            role: User['role']
            expires_at: string
            account: {
                id: string
                name: string
                company_name?: string
            }
        }>(`/v1/admin/auth/invitations/${encodeURIComponent(token)}`),

    acceptInvitation: (token: string, payload: { password: string }) =>
        fetchJson<{
            token: string
            refreshToken: string
            expiresAt: number
            user: User
            account: Account
        }>(`/v1/admin/auth/invitations/${encodeURIComponent(token)}/accept`, {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    me: () => fetchWithAuth<{ user: User; account: Account }>('/v1/admin/auth/me'),

    loginWithGoogle: (credential: string) =>
        fetchJson<{
            token: string
            refreshToken: string
            expiresAt: number
            user: User
            account: Account
        }>('/v1/admin/auth/google', {
            method: 'POST',
            body: JSON.stringify({ credential }),
        }),
}

export const dashboardApi = {
    getStats: (params?: { periodDays?: 7 | 30 | 90 }) => {
        const searchParams = new URLSearchParams()
        if (params?.periodDays) searchParams.set('period_days', params.periodDays.toString())
        const query = searchParams.toString()
        return fetchWithAuth<DashboardStats>(`/v1/admin/dashboard/stats${query ? `?${query}` : ''}`)
    },

    getAlerts: () => fetchWithAuth<Alert[]>('/v1/admin/alerts'),

    acknowledgeAlert: (id: string) =>
        fetchWithAuth<void>(`/v1/admin/alerts/${id}/acknowledge`, { method: 'POST' }),
}

export const reviewApi = {
    getQueue: (params?: { page?: number; limit?: number; sortBy?: string; type?: string }) => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.set('page', params.page.toString())
        if (params?.limit) searchParams.set('limit', params.limit.toString())
        if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
        if (params?.type) searchParams.set('type', params.type)
        return fetchWithAuth<{ items: ReviewCase[]; total: number }>(
            `/v1/admin/review-queue?${searchParams}`
        )
    },

    getCase: (id: string) => fetchWithAuth<ReviewCase>(`/v1/admin/review-queue/${id}`),

    decide: (id: string, decision: 'approved' | 'blocked' | 'escalated', notes?: string) =>
        fetchWithAuth<void>(`/v1/admin/review-queue/${id}/decide`, {
            method: 'POST',
            body: JSON.stringify({ decision, notes }),
        }),

    assign: (id: string, userId: string) =>
        fetchWithAuth<void>(`/v1/admin/review-queue/${id}/assign`, {
            method: 'POST',
            body: JSON.stringify({ userId }),
        }),
}

export const graphApi = {
    search: (query: string) =>
        fetchWithAuth<GraphCluster[]>(`/v1/admin/graph/search?q=${encodeURIComponent(query)}`),

    getCluster: (id: string) => fetchWithAuth<GraphCluster>(`/v1/admin/graph/cluster/${id}`),

    sendEdgeFeedback: (payload: {
        sourceId: string
        targetId: string
        status: 'suspicious' | 'fraudulent' | 'clear'
    }) =>
        fetchWithAuth<void>(`/v1/admin/graph/edge/feedback`, {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
}

export const rulesApi = {
    getAll: () => fetchWithAuth<Rule[]>(`/v1/admin/rules`),
    create: (payload: any) =>
        fetchWithAuth<{ id: string }>(`/v1/admin/rules`, {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
    update: (id: string, payload: any) =>
        fetchWithAuth<void>(`/v1/admin/rules/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }),
    activate: (id: string) =>
        fetchWithAuth<void>(`/v1/admin/rules/${id}/activate`, { method: 'PATCH' }),
    deactivate: (id: string) =>
        fetchWithAuth<void>(`/v1/admin/rules/${id}/deactivate`, { method: 'PATCH' }),
    delete: (id: string) => fetchWithAuth<void>(`/v1/admin/rules/${id}`, { method: 'DELETE' }),
    simulate: (payload: any) =>
        fetchWithAuth<{
            totalDecisions: number
            wouldTrigger: number
            breakdown: { allow: number; review: number; block: number }
            impactOnFalsePositives: number
            impactOnFalseNegatives: number
        }>(`/v1/admin/rules/simulate`, {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
}

export const monitoringApi = {
    getHealth: () =>
        fetchWithAuth<{
            status: 'healthy' | 'degraded' | 'critical'
            timestamp: string
            components: Array<{
                name: string
                status: 'healthy' | 'degraded' | 'critical'
                latency_ms?: number
                error_rate?: number
                uptime?: number
                details?: Record<string, unknown>
            }>
            metrics: {
                avg_processing_time_ms: number
                p50_processing_time_ms: number
                p95_processing_time_ms: number
                p99_processing_time_ms: number
                requests_per_minute: number
                error_rate: number
                decision_distribution: Record<string, number>
            }
            alerts: Array<{
                id: string
                severity: 'warning' | 'error' | 'critical'
                component: string
                message: string
                metric?: string
                current_value?: number
                threshold?: number
                timestamp: string
            }>
        }>(`/v1/admin/monitoring/health`),

    getAsyncJobs: () =>
        fetchWithAuth<{
            redis_ready: boolean
            queue: {
                ready: number
                delayed: number
                dead_letter: number
            }
            oldest_age_seconds: {
                ready: number
                delayed: number
            }
        }>(`/v1/admin/monitoring/async-jobs`),

    getDeadLetterJobs: (limit = 20) =>
        fetchWithAuth<{
            total: number
            jobs: Array<{
                id: string
                type?: string
                payload?: Record<string, unknown>
                created_at?: string
                failed_at?: string
                error?: string
            }>
        }>(`/v1/admin/monitoring/async-jobs/dead-letter?limit=${limit}`),

    requeueDeadLetterJob: (id: string) =>
        fetchWithAuth<{ success: boolean; requeued_job_id: string }>(
            `/v1/admin/monitoring/async-jobs/dead-letter/${encodeURIComponent(id)}/requeue`,
            { method: 'POST' }
        ),
}

export const learningApi = {
    getFeedback: () => fetchWithAuth<Feedback[]>(`/v1/admin/learning/feedback`),
    getDriftMetrics: () => fetchWithAuth<DriftMetrics[]>(`/v1/admin/learning/drift-metrics`),
    getRecommendations: () => fetchWithAuth<Recommendation[]>(`/v1/admin/learning/recommendations`),
    getRetrainingHistory: () =>
        fetchWithAuth<RetrainingHistory[]>(`/v1/admin/learning/retraining-history`),
    submitFeedback: (payload: {
        decisionId: string
        feedback: 'false_positive' | 'confirmed_fraud'
        notes?: string
    }) =>
        fetchWithAuth<void>(`/v1/admin/learning/feedback`, {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
}

export const investigationsApi = {
    getCases: (selectedCaseId?: string) => {
        const url = selectedCaseId
            ? `/v1/admin/investigations/cases?selectedCaseId=${encodeURIComponent(selectedCaseId)}`
            : `/v1/admin/investigations/cases`
        return fetchWithAuth<InvestigationCase[]>(url)
    },
    updateStatus: (
        caseId: string,
        payload: {
            status: 'open' | 'investigating' | 'resolved' | 'escalated'
            resolution?: 'confirmed_fraud' | 'false_positive' | 'monitor'
            notes?: string
        }
    ) =>
        fetchWithAuth<{
            success: boolean
            status: 'open' | 'investigating' | 'resolved' | 'escalated'
            resolution?: 'confirmed_fraud' | 'false_positive' | 'monitor'
            reviewedAt: string
            reviewedBy: string
        }>(`/v1/admin/investigations/cases/${caseId}/status`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }),
    addNote: (caseId: string, content: string) =>
        fetchWithAuth<{ id: string; author: string; content: string; timestamp: string }>(
            `/v1/admin/investigations/cases/${caseId}/notes`,
            { method: 'POST', body: JSON.stringify({ content }) }
        ),
}

export const reportsApi = {
    getAll: () => fetchWithAuth<Report[]>(`/v1/admin/reports`),
    getHistory: () => fetchWithAuth<ReportHistoryEntry[]>(`/v1/admin/reports/history`),
    create: (payload: any) =>
        fetchWithAuth<Report>(`/v1/admin/reports`, {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
    generate: (id: string) =>
        fetchWithAuth<Report>(`/v1/admin/reports/${id}/generate`, {
            method: 'POST',
        }),
    toggle: (id: string, enabled: boolean) =>
        fetchWithAuth<Report>(`/v1/admin/reports/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ enabled }),
        }),
    download: (id: string, format?: string) =>
        fetchWithAuthBlob(
            `/v1/admin/reports/${id}/download${format ? `?format=${encodeURIComponent(format)}` : ''}`
        ),
    getHtml: (id: string) => fetchWithAuthText(`/v1/admin/reports/${id}/html`),
    delete: (id: string) => fetchWithAuth<void>(`/v1/admin/reports/${id}`, { method: 'DELETE' }),
}

export const alertingApi = {
    getRules: () => fetchWithAuth<AlertRule[]>(`/v1/admin/alerts/rules`),
    createRule: (payload: any) =>
        fetchWithAuth<any>(`/v1/admin/alerts/rules`, {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
    updateRule: (id: string, payload: any) =>
        fetchWithAuth<void>(`/v1/admin/alerts/rules/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }),
    deleteRule: (id: string) =>
        fetchWithAuth<void>(`/v1/admin/alerts/rules/${id}`, { method: 'DELETE' }),
    getEvents: () => fetchWithAuth<AlertEvent[]>(`/v1/admin/alerts/events`),
}
export const analyticsApi = {
    getStats: (params?: { periodDays?: 7 | 30 | 90 }) => dashboardApi.getStats(params),
}

export const settingsApi = {
    getSettings: () => fetchWithAuth<RiskSettings>('/v1/admin/settings'),

    updateThresholds: (thresholds: RiskSettings['thresholds']) =>
        fetchWithAuth<void>('/v1/admin/settings/thresholds', {
            method: 'PUT',
            body: JSON.stringify(thresholds),
        }),

    updateWeights: (weights: RiskSettings['weights']) =>
        fetchWithAuth<void>('/v1/admin/settings/weights', {
            method: 'PUT',
            body: JSON.stringify(weights),
        }),

    updateSecurity: (payload: {
        security_mode: RiskSettings['security_mode']
        retention_days?: number
    }) =>
        fetchWithAuth<void>('/v1/admin/settings/security', {
            method: 'PUT',
            body: JSON.stringify(payload),
        }),

    getWebhooks: async () => {
        const webhooks = await fetchWithAuth<WebhookResponse[]>('/v1/admin/webhooks')
        return webhooks.map(mapWebhook)
    },

    createWebhook: async (webhook: {
        name: string
        url: string
        events: Webhook['events']
        active?: boolean
        filter_validation_types?: string[] | null
        filter_risk_levels?: string[] | null
        filter_decisions?: string[] | null
        filter_min_score?: number | null
        timeout_ms?: number
        max_retries?: number
        headers?: Record<string, string> | null
    }) => {
        const created = await fetchWithAuth<WebhookResponse>('/v1/admin/webhooks', {
            method: 'POST',
            body: JSON.stringify({
                name: webhook.name,
                url: webhook.url,
                events: webhook.events,
                is_active: webhook.active ?? true,
                filter_validation_types: webhook.filter_validation_types ?? null,
                filter_risk_levels: webhook.filter_risk_levels ?? null,
                filter_decisions: webhook.filter_decisions ?? null,
                filter_min_score: webhook.filter_min_score ?? null,
                timeout_ms: webhook.timeout_ms ?? 5000,
                max_retries: webhook.max_retries ?? 3,
                headers: webhook.headers ?? null,
            }),
        })
        return mapWebhook(created)
    },

    updateWebhook: async (
        id: string,
        webhook: Partial<{
            name: string
            url: string
            events: Webhook['events']
            active: boolean
            filter_validation_types: string[] | null
            filter_risk_levels: string[] | null
            filter_decisions: string[] | null
            filter_min_score: number | null
            timeout_ms: number
            max_retries: number
            headers: Record<string, string> | null
        }>
    ) => {
        const body: Record<string, unknown> = {}
        if (webhook.name !== undefined) body.name = webhook.name
        if (webhook.url !== undefined) body.url = webhook.url
        if (webhook.events !== undefined) body.events = webhook.events
        if (webhook.active !== undefined) body.is_active = webhook.active
        if (webhook.filter_validation_types !== undefined) body.filter_validation_types = webhook.filter_validation_types
        if (webhook.filter_risk_levels !== undefined) body.filter_risk_levels = webhook.filter_risk_levels
        if (webhook.filter_decisions !== undefined) body.filter_decisions = webhook.filter_decisions
        if (webhook.filter_min_score !== undefined) body.filter_min_score = webhook.filter_min_score
        if (webhook.timeout_ms !== undefined) body.timeout_ms = webhook.timeout_ms
        if (webhook.max_retries !== undefined) body.max_retries = webhook.max_retries
        if (webhook.headers !== undefined) body.headers = webhook.headers
        const updated = await fetchWithAuth<WebhookResponse>(`/v1/admin/webhooks/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
        })
        return mapWebhook(updated)
    },

    testWebhook: (id: string) =>
        fetchWithAuth<{
            success: boolean
            status_code?: number
            attempts: number
            error?: string | null
        }>(`/v1/admin/webhooks/${id}/test`, { method: 'POST' }),

    deleteWebhook: (id: string) =>
        fetchWithAuth<void>(`/v1/admin/webhooks/${id}`, { method: 'DELETE' }),
}

export const apiKeyApi = {
    getAll: () => fetchWithAuth<ApiKey[]>('/v1/admin/api-keys'),

    create: (name: string) =>
        fetchWithAuth<ApiKey & { key: string }>('/v1/admin/api-keys', {
            method: 'POST',
            body: JSON.stringify({ name }),
        }),

    revoke: (id: string) =>
        fetchWithAuth<void>(`/v1/admin/api-keys/${id}/deactivate`, { method: 'PATCH' }),

    delete: (id: string) => fetchWithAuth<void>(`/v1/admin/api-keys/${id}`, { method: 'DELETE' }),
}

export const usersApi = {
    getAll: (params?: { page?: number; limit?: number }) => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.set('page', params.page.toString())
        if (params?.limit) searchParams.set('limit', params.limit.toString())
        return fetchWithAuthRaw<{
            success: boolean
            data: User[]
            total: number
            page: number
            limit: number
        }>(`/v1/admin/users?${searchParams}`)
    },

    create: (payload: {
        account_id: string
        name: string
        email: string
        password: string
        role?: User['role']
    }) =>
        fetchWithAuth<User>('/v1/admin/users', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    update: (
        id: string,
        payload: {
            name?: string
            email?: string
            password?: string
            currentPassword?: string
            role?: User['role']
        }
    ) =>
        fetchWithAuth<void>(`/v1/admin/users/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }),

    uploadPhoto: (id: string, photo_url: string) =>
        fetchWithAuth<void>(`/v1/admin/users/${id}/photo`, {
            method: 'PATCH',
            body: JSON.stringify({ photo_url }),
        }),

    deactivate: (id: string) =>
        fetchWithAuth<void>(`/v1/admin/users/${id}/deactivate`, { method: 'PATCH' }),

    activate: (id: string) =>
        fetchWithAuth<void>(`/v1/admin/users/${id}/activate`, { method: 'PATCH' }),

    delete: (id: string) => fetchWithAuth<void>(`/v1/admin/users/${id}`, { method: 'DELETE' }),
}

export const accountsApi = {
    getAll: (params?: { page?: number; limit?: number }) => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.set('page', params.page.toString())
        if (params?.limit) searchParams.set('limit', params.limit.toString())
        return fetchWithAuthRaw<{
            success: boolean
            data: Account[]
            total: number
            page: number
            limit: number
        }>(`/v1/admin/accounts?${searchParams}`)
    },

    getById: (id: string) => fetchWithAuth<Account>(`/v1/admin/accounts/${id}`),

    create: (payload: {
        name: string
        email: string
        admin_name: string
        company_name?: string
        description?: string
        quota_limit?: number
    }) =>
        fetchWithAuth<
            Account & {
                pending_invitation?: AccountInvitation | null
                invitation_email_sent?: boolean
            }
        >(`/v1/admin/accounts`, {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    update: (
        id: string,
        payload: Partial<{
            name: string
            company_name: string
            description: string
            quota_limit: number
        }>
    ) =>
        fetchWithAuth<void>(`/v1/admin/accounts/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }),

    deactivate: (id: string) =>
        fetchWithAuth<void>(`/v1/admin/accounts/${id}/deactivate`, { method: 'PATCH' }),

    activate: (id: string) =>
        fetchWithAuth<void>(`/v1/admin/accounts/${id}/activate`, { method: 'PATCH' }),

    resendInvitation: (id: string) =>
        fetchWithAuth<{
            account_id: string
            pending_invitation: AccountInvitation | null
            invitation_email_sent?: boolean
        }>(`/v1/admin/accounts/${id}/resend-invitation`, { method: 'POST' }),
}

export const plansApi = {
    getAll: () => fetchWithAuth<Plan[]>(`/v1/admin/plans`),

    getById: (id: string) => fetchWithAuth<Plan>(`/v1/admin/plans/${id}`),

    create: (payload: {
        name: string
        display_name: string
        price_monthly?: number | null
        monthly_requests?: number | null
        max_items_per_request?: number
        rate_limit_per_second?: number
        overage_allowed?: boolean
        overage_price_per_1000?: number | null
        description?: string | null
        is_custom?: boolean
    }) =>
        fetchWithAuth<Plan>(`/v1/admin/plans`, {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    update: (
        id: string,
        payload: Partial<{
            name: string
            display_name: string
            price_monthly: number | null
            monthly_requests: number | null
            max_items_per_request: number
            rate_limit_per_second: number
            overage_allowed: boolean
            overage_price_per_1000: number | null
            description: string | null
            is_custom: boolean
            active: boolean
        }>
    ) =>
        fetchWithAuth<void>(`/v1/admin/plans/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }),

    delete: (id: string) => fetchWithAuth<void>(`/v1/admin/plans/${id}`, { method: 'DELETE' }),

    assignToAccount: (account_id: string, plan_id: string | null) =>
        fetchWithAuth<{ account_id: string; plan_id: string | null }>(`/v1/admin/plans/assign`, {
            method: 'POST',
            body: JSON.stringify({ account_id, plan_id }),
        }),

    seedDefaults: () =>
        fetchWithAuth<{ created: string[]; skipped: string[] }>(`/v1/admin/plans/seed`, {
            method: 'POST',
        }),
}

export const auditApi = {
    getLogs: (params?: {
        page?: number
        limit?: number
        action?: string
        startDate?: string
        endDate?: string
    }) => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.set('page', params.page.toString())
        if (params?.limit) searchParams.set('limit', params.limit.toString())
        if (params?.action) searchParams.set('action', params.action)
        if (params?.startDate) searchParams.set('startDate', params.startDate)
        if (params?.endDate) searchParams.set('endDate', params.endDate)
        return fetchWithAuth<{ items: AuditLog[]; total: number }>(
            `/v1/admin/audit-logs?${searchParams}`
        )
    },

    exportCsv: (params?: { startDate?: string; endDate?: string; action?: string }) => {
        const searchParams = new URLSearchParams()
        if (params?.startDate) searchParams.set('startDate', params.startDate)
        if (params?.endDate) searchParams.set('endDate', params.endDate)
        if (params?.action) searchParams.set('action', params.action)
        return fetchWithAuthBlob(`/v1/admin/audit-logs/export?${searchParams}`)
    },
}

export const decisionApi = {
    list: (params?: {
        page?: number
        limit?: number
        decision?: 'allow' | 'review' | 'block'
        type?: string
    }) => {
        const searchParams = new URLSearchParams()
        if (params?.page) searchParams.set('page', params.page.toString())
        if (params?.limit) searchParams.set('limit', params.limit.toString())
        if (params?.decision) searchParams.set('decision', params.decision)
        if (params?.type) searchParams.set('type', params.type)
        return fetchWithAuth<{ items: RiskDecision[]; total: number }>(
            `/v1/admin/decisions?${searchParams}`
        )
    },

    getRecent: (limit = 10) =>
        fetchWithAuth<RiskDecision[]>(`/v1/admin/decisions/recent?limit=${limit}`),

    getById: (id: string) => fetchWithAuth<RiskDecision>(`/v1/admin/decisions/${id}`),

    getExecutiveSummary: (id: string) =>
        fetchWithAuth<DecisionExecutiveSummary>(`/v1/admin/decisions/${id}/executive-summary`),

    reveal: (id: string) =>
        fetchWithAuth<{ available: boolean; value: string | null; storage_mode: string }>(
            `/v1/admin/decisions/${id}/reveal`
        ),
}

export const publicPlansApi = {
    getAll: async (): Promise<import('@/types').Plan[]> => {
        const res = await fetch(`${API_BASE_URL}/v1/plans/public`)
        if (!res.ok) throw new Error('Failed to load plans')
        const json = await res.json()
        return json.data ?? []
    },
}

export const billingApi = {
    getSubscription: () =>
        fetchWithAuth<{
            id: string
            plan_id: string
            status: string
            cycle: string
            amount_cents: number
            checkout_url: string | null
            activated_at: string | null
            last_payment_at: string | null
            cancelled_at: string | null
        } | null>('/v1/admin/billing/subscription'),

    createCheckout: (payload: {
        plan_id: string
        customer: { tax_id: string; name?: string; email?: string; cellphone?: string }
        return_url?: string
        completion_url?: string
    }) =>
        fetchWithAuth<{ id: string; checkout_url: string | null; status: string }>(
            '/v1/admin/billing/subscriptions/checkout',
            { method: 'POST', body: JSON.stringify(payload) }
        ),
}
