export type Language = 'pt-BR' | 'en'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type Decision = 'allow' | 'review' | 'block'
export type DataType =
    | 'cpf'
    | 'cnpj'
    | 'email'
    | 'phone'
    | 'ip'
    | 'uuid'
    | 'plate'
    | 'pix'
    | 'other'

export type RiskArchetypeId =
    | 'credential_stuffing'
    | 'fraud_network'
    | 'account_takeover'
    | 'device_farm'
    | 'brute_force'
    | 'anonymous_access'
    | 'data_tampering'
    | 'synthetic_identity'
    | 'high_risk_pattern'
    | 'unknown'

export type FactorContribution = {
    component: 'validation' | 'historical' | 'velocity' | 'context' | 'graph' | 'pattern' | 'rules'
    raw_score: number
    weighted_score: number
    contribution_pct: number
}

export type ExplainabilityData = {
    risk_archetype: {
        id: RiskArchetypeId
        confidence: number
    }
    factor_contributions: FactorContribution[]
    narrative: {
        executive_summary: string
        risk_factors: Array<{
            title: string
            description: string
            weight_pct: number
            signal: string
        }>
        recommended_action: string
    }
}

export interface RiskDecision {
    id: string
    decision_id?: string
    group_id: string | null
    type: DataType
    use_case?: string | null
    item_ref?: string
    valueHash: string
    decision: Decision
    riskLevel: RiskLevel
    score: number
    scoring: {
        validation_score: number
        history_score: number
        velocity_score: number
        context_score: number
        pattern_score: number
        graph_score: number
        rule_adjustments: number
        final_score: number
    }
    patterns_detected: string[]
    flags: string[]
    reasons: string[]
    explanation?: {
        final_decision: 'approve' | 'review' | 'block'
        final_decision_reason: string
        recommendation: 'approve' | 'block' | null
        recommendation_confidence: number
        recommendation_reason: string
        decision_floor?: 'validation_review' | 'validation_block' | 'invalid_policy' | null
        floor_override: boolean
        floor_action: 'review' | 'block' | null
        thresholds: {
            review_start: number | null
            review_end: number | null
            position: 'below_review' | 'in_review_band' | 'above_block' | 'unknown'
        }
        top_drivers: Array<{
            label: string
            layer: 'validation' | 'history' | 'velocity' | 'context' | 'graph' | 'pattern' | 'rules'
            delta_score: number
            direction: 'risk_up' | 'risk_down'
        }>
        rules_triggered?: Array<{
            rule_id: string
            rule_name: string
            action: string
            reason?: string
        }>
        signals: {
            validation: { valid: boolean; confidence: number; risk: string }
            intelligence: {
                total_seen: number
                valid_rate: number
                distinct_accounts: number
                recent_24h: number
            }
            velocity: { combined_risk_score: number; flags: string[] }
            graph: {
                cluster_risk_score: number
                fraudulent_connections: number
                suspicious_connections: number
            }
            context?: { risk_score: number; anomalies: string[] }
        }
    }
    explainability?: ExplainabilityData | null
    graph_analysis?: {
        cluster_id: string
        cluster_size: number
        shared_identities: number
        risk_propagation: number
    }
    intelligence: {
        total_seen: number
        distinct_accounts: number
        recent_24h: number
        valid_rate: number
    }
    account_id: string
    api_key_id: string
    created_at: string
    resolved_at?: string
    resolved_by?: string
    resolution?: 'approved' | 'blocked' | 'escalated'
    review_status?: 'approved' | 'blocked' | 'escalated' | null
    reviewed_at?: string | null
    reviewed_by?: string | null
    review_notes?: string | null
}

export interface ReviewCase extends RiskDecision {
    assignee?: string
    priority: number
    notes?: string
}

export interface GraphNode {
    id: string
    type: DataType
    hash: string
    riskScore: number
    connections: number
}

export interface GraphCluster {
    id: string
    nodes: GraphNode[]
    edges: {
        source: string
        target: string
        weight: number
        is_suspicious?: boolean
        is_fraudulent?: boolean
    }[]
    totalRisk: number
    size: number
    created_at: string
    last_activity: string
}

export interface DashboardStats {
    period_days?: number
    period_start?: string
    period_end?: string
    comparison_period_start?: string
    comparison_period_end?: string
    total_decisions_today: number
    total_decisions_week: number
    total_decisions_month: number
    pending_reviews: number
    blocked_today: number
    allowed_today: number
    avg_latency_ms: number
    p95_latency_ms: number
    false_positive_rate: number
    model_efficacy?: {
        false_positive_rate: number
        fraud_detection_rate: number
        avg_review_time_minutes: number
        delta_false_positive_rate: number
        delta_fraud_detection_rate: number
        delta_avg_review_time_minutes: number
    }
    decisions_by_hour: { hour: number; count: number; decision: Decision }[]
    decisions_by_type: { type: DataType; allow: number; review: number; block: number }[]
    risk_distribution: { level: RiskLevel; count: number; percentage: number }[]
    score_distribution?: { range: string; count: number }[]
    pattern_distribution: { pattern: string; count: number; percentage: number }[]
}

export interface Alert {
    id: string
    type: 'spike' | 'cluster' | 'pattern' | 'system'
    severity: 'info' | 'warning' | 'critical'
    title: string
    description: string
    created_at: string
    acknowledged: boolean
}

export interface ApiKey {
    id: string
    name: string
    prefix: string
    account_id: string
    usage_current: number
    usage_limit: number
    active: boolean
    expires_at?: string
    created_at: string
    last_used_at?: string
}

export interface RiskSettings {
    thresholds: {
        review_start: number
        review_end: number
    }
    weights: {
        validation: number
        history: number
        pattern: number
        graph: number
    }
    retention_days: number
    security_mode: 'zero_knowledge' | 'encrypted' | 'audit'
}

export type WebhookEvent =
    | 'risk.high'
    | 'risk.critical'
    | 'decision.allow'
    | 'decision.block'
    | 'decision.review'
    | 'velocity.burst'
    | 'anomaly.detected'
    | 'pattern.fraud'
    | 'graph.suspicious_cluster'

export interface Webhook {
    id: string
    name: string
    url: string
    events: WebhookEvent[]
    active: boolean
    secret: string | null
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
    last_triggered_at?: string
}

export interface AuditLog {
    id: string
    action: 'decision' | 'feedback' | 'config' | 'login' | 'api_key' | 'reveal'
    actor_id: string
    actor_type: 'user' | 'system' | 'api'
    details: Record<string, unknown>
    ip_address?: string
    created_at: string
}

export interface User {
    id: string
    name: string
    email: string
    role: 'super_admin' | 'admin' | 'member'
    active: boolean
    account_id: string
    last_login?: string
    created_at: string
    updated_at: string
}

export interface AccountInvitation {
    id: string
    name: string
    email: string
    role: 'admin' | 'member' | 'super_admin'
    token: string
    expires_at: string
    accepted_at?: string | null
}

export interface Account {
    id: string
    name: string
    email: string
    company_name?: string
    description?: string
    active: boolean
    quota_limit: number
    plan_id?: string | null
    plan?: Plan | null
    total_requests: number
    users_count: number
    api_keys_count: number
    pending_invitation?: AccountInvitation | null
    created_at: string
    updated_at: string
}

export interface Plan {
    id: string
    name: string
    display_name: string
    price_monthly: number | null
    monthly_requests: number | null
    max_items_per_request?: number
    rate_limit_per_minute?: number
    rate_limit_per_second?: number
    overage_allowed?: boolean
    overage_price_per_1000?: number | null
    description?: string | null
    active: boolean
    is_custom: boolean
    accounts_count?: number
    created_at: string
    updated_at: string
}

export interface RuleCondition {
    id: string
    field: string
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains' | 'in' | 'not_in'
    value: string | number | string[]
    logicalOperator?: 'AND' | 'OR'
}

export interface RuleAction {
    type: 'block' | 'review' | 'allow' | 'tag'
    config?: Record<string, unknown>
}

export interface Rule {
    id: string
    name: string
    description: string
    conditions: RuleCondition[]
    action: RuleAction
    priority: number
    enabled: boolean
    abTest?: {
        enabled: boolean
        variant: 'A' | 'B'
        trafficPercentage: number
    }
    stats: {
        triggered: number
        lastTriggered?: string
        impactedDecisions: number
    }
    createdAt: string
    updatedAt: string
}

export interface Feedback {
    id: string
    decisionId: string
    valueHash: string
    type: string
    originalDecision: 'allow' | 'review' | 'block'
    feedback: 'false_positive' | 'confirmed_fraud' | 'incorrect_score' | 'confirmed_legitimate'
    feedbackBy: string
    feedbackAt: string
    notes?: string
    impactApplied: boolean
}

export interface DriftMetrics {
    feature: string
    baseline: number
    current: number
    drift: number
    status: 'stable' | 'warning' | 'critical'
    trend: 'up' | 'down' | 'stable'
}

export interface Recommendation {
    id: string
    type: 'threshold' | 'rule' | 'weight' | 'alert'
    priority: 'low' | 'medium' | 'high'
    title: string
    description: string
    currentValue?: string
    suggestedValue?: string
    expectedImpact: string
    confidence: number
}

export interface RetrainingHistory {
    id: string
    triggeredAt: string
    completedAt?: string
    status: 'pending' | 'running' | 'completed' | 'failed'
    feedbackCount: number
    metricsImprovement?: {
        falsePositives: number
        falseNegatives: number
        accuracy: number
    }
}

export interface InvestigationNote {
    id: string
    author: string
    content: string
    timestamp: string
}

export interface InvestigationTimelineEvent {
    id: string
    timestamp: string
    type: 'decision' | 'review' | 'feedback' | 'escalation' | 'note' | 'resolution'
    decision?: Decision
    score?: number
    accountId?: string
    actor?: string
    content?: string
    context?: {
        ip: string
        country: string
        device: string
        isVpn: boolean
        isTor: boolean
    }
}

export interface InvestigationConnection {
    id: string
    type: string
    item_ref?: string
    hash: string
    riskScore: number
    decision: Decision
    seenCount: number
    lastSeen: string
}

export interface InvestigationSimilarCase {
    id: string
    item_ref?: string
    valueHash: string
    type: string
    score: number
    decision: Decision
    resolution?: 'confirmed_fraud' | 'false_positive' | 'monitor'
    similarity: number
    timestamp: string
}

export interface InvestigationCase {
    id: string
    item_ref?: string
    valueHash: string
    type: string
    currentScore: number
    currentDecision: Decision
    riskLevel: RiskLevel
    firstSeen: string
    lastSeen: string
    totalOccurrences: number
    distinctAccounts: number
    flagged: boolean
    priority: number
    status: 'open' | 'investigating' | 'resolved' | 'escalated'
    scoring: {
        validation: number
        history: number
        pattern: number
        graph: number
    }
    patterns: string[]
    explanation?: RiskDecision['explanation']
    notes: InvestigationNote[]
    timeline: InvestigationTimelineEvent[]
    connections: InvestigationConnection[]
    similarCases: InvestigationSimilarCase[]
}

export interface Report {
    id: string
    name: string
    type: 'weekly' | 'monthly' | 'custom'
    complianceType?: string | null
    format: 'pdf' | 'csv' | 'json' | 'html'
    status: 'scheduled' | 'generating' | 'completed' | 'failed' | 'skipped'
    lastGenerated?: string | null
    nextScheduled?: string | null
    size?: string | null
    downloadUrl?: string | null
    recipients: string[]
    enabled: boolean
}

export interface ReportHistoryEntry {
    id: string
    reportId: string
    generatedAt: string
    status: 'completed' | 'failed' | 'skipped'
    size?: string | null
    summary: Record<string, unknown>
}

export interface AlertRule {
    id: string
    name: string
    description?: string
    condition: string
    severity: 'info' | 'warning' | 'error' | 'critical'
    channels: string[]
    escalation?: Record<string, unknown> | null
    enabled: boolean
    muted?: boolean
    triggerCount?: number
    created_at: string
    updated_at: string
}

export interface AlertEvent {
    id: string
    severity: 'info' | 'warning' | 'error' | 'critical'
    component?: string
    message: string
    metric?: string
    current_value?: number
    threshold?: number
    timestamp: string
}
