import type { Language } from '@/contexts/LanguageContext'

export enum ReasonCode {
    ValidationFailed = 'validation_failed',
    LowValidationConfidence = 'low_validation_confidence',
    ValidationFlagsReview = 'validation_flags_review',
    ValidationFlagsBlock = 'validation_flags_block',
    InvalidFormatPolicy = 'invalid_format_policy',
    HighHistoricalInvalidRate = 'high_historical_invalid_rate',
    HighRiskHistory = 'high_risk_history',
    CriticalIncidentHistory = 'critical_incident_history',
    ReusedAcrossAccounts = 'reused_across_accounts',
    HighVolume24h = 'high_volume_24h',
    ActivityBurstDetected = 'activity_burst_detected',
    SuspiciousVelocityPattern = 'suspicious_velocity_pattern',
    HighRiskIp = 'high_risk_ip',
    VpnDetected = 'vpn_detected',
    TorExitNode = 'tor_exit_node_detected',
    ProxyDetected = 'proxy_detected',
    ImpossibleTravel = 'impossible_travel_detected',
    HighRiskDevice = 'high_risk_device',
    SuspiciousCluster = 'suspicious_cluster',
    ConnectionsWithFraud = 'connections_with_fraud',
    SharesIdentities = 'shares_identities',
    MultipleCombinedSignals = 'multiple_combined_risk_signals',
    LowSample = 'low_sample',
    HighVelocity1h = 'high_velocity_1h',
    CrossAccountUsage = 'cross_account_usage',
    SuspiciousPattern = 'suspicious_pattern',
    PoorHistory = 'poor_history',
    MultiLayerDetection = 'multi_layer_detection',
    Burst24h = 'burst_24h',
    BurstUsage = 'burst_usage',
    CrossAccountReuse = 'cross_account_reuse',
    HighInvalidRate = 'high_invalid_rate',
    CriticalHistory = 'critical_history',
    HighSuspiciousConnections = 'high_suspicious_connections',
    FraudulentConnections = 'fraudulent_connections',
    HighIdentitySharing = 'high_identity_sharing',
}

type ReasonParams = Record<string, string | number>
type ReasonTemplate = string | ((params: ReasonParams) => string)

const REASON_LABELS: Record<Language, Record<ReasonCode, ReasonTemplate>> = {
    'pt-BR': {
        [ReasonCode.ValidationFailed]: 'Falha na validação',
        [ReasonCode.LowValidationConfidence]: 'Baixa confiança na validação',
        [ReasonCode.ValidationFlagsReview]: 'Sinais de validação exigem revisão',
        [ReasonCode.ValidationFlagsBlock]: 'Sinais de validação exigem bloqueio',
        [ReasonCode.InvalidFormatPolicy]: 'Política de formato inválido',
        [ReasonCode.HighHistoricalInvalidRate]: 'Alta taxa histórica de invalidação',
        [ReasonCode.HighRiskHistory]: 'Histórico de alto risco',
        [ReasonCode.CriticalIncidentHistory]: 'Histórico de incidentes críticos',
        [ReasonCode.ReusedAcrossAccounts]: (p) => `Reutilizado em ${p.count} contas diferentes`,
        [ReasonCode.HighVolume24h]: 'Alto volume nas últimas 24h',
        [ReasonCode.ActivityBurstDetected]: 'Pico de atividade detectado',
        [ReasonCode.SuspiciousVelocityPattern]: 'Padrão de velocidade suspeito',
        [ReasonCode.HighRiskIp]: 'IP de alto risco',
        [ReasonCode.VpnDetected]: 'VPN detectada',
        [ReasonCode.TorExitNode]: 'Saída Tor detectada',
        [ReasonCode.ProxyDetected]: 'Proxy detectado',
        [ReasonCode.ImpossibleTravel]: 'Viagem impossível detectada',
        [ReasonCode.HighRiskDevice]: 'Dispositivo de alto risco',
        [ReasonCode.SuspiciousCluster]: 'Pertence a um cluster suspeito',
        [ReasonCode.ConnectionsWithFraud]: (p) => `${p.count} conexões com fraude confirmada`,
        [ReasonCode.SharesIdentities]: (p) => `Compartilha identidades com ${p.count} entidades`,
        [ReasonCode.MultipleCombinedSignals]: 'Múltiplos sinais de risco combinados',
        [ReasonCode.LowSample]: 'Amostra insuficiente',
        [ReasonCode.HighVelocity1h]: 'Alta velocidade na última hora',
        [ReasonCode.CrossAccountUsage]: 'Uso em múltiplas contas',
        [ReasonCode.SuspiciousPattern]: 'Padrão suspeito detectado',
        [ReasonCode.PoorHistory]: 'Histórico de inválidos elevado',
        [ReasonCode.MultiLayerDetection]: 'Detecção multi-camada',
        [ReasonCode.Burst24h]: 'Burst nas últimas 24h',
        [ReasonCode.BurstUsage]: 'Uso em burst',
        [ReasonCode.CrossAccountReuse]: 'Reuso entre contas',
        [ReasonCode.HighInvalidRate]: 'Alta taxa de inválidos',
        [ReasonCode.CriticalHistory]: 'Histórico crítico',
        [ReasonCode.HighSuspiciousConnections]: 'Conexões suspeitas elevadas',
        [ReasonCode.FraudulentConnections]: 'Conexões fraudulentas',
        [ReasonCode.HighIdentitySharing]: 'Alto compartilhamento de identidades',
    },
    en: {
        [ReasonCode.ValidationFailed]: 'Validation failed',
        [ReasonCode.LowValidationConfidence]: 'Low validation confidence',
        [ReasonCode.ValidationFlagsReview]: 'Validation signals require review',
        [ReasonCode.ValidationFlagsBlock]: 'Validation signals require block',
        [ReasonCode.InvalidFormatPolicy]: 'Invalid format policy',
        [ReasonCode.HighHistoricalInvalidRate]: 'High historical invalidation rate',
        [ReasonCode.HighRiskHistory]: 'High risk history',
        [ReasonCode.CriticalIncidentHistory]: 'Critical incident history',
        [ReasonCode.ReusedAcrossAccounts]: (p) => `Reused across ${p.count} different accounts`,
        [ReasonCode.HighVolume24h]: 'High volume in the last 24 hours',
        [ReasonCode.ActivityBurstDetected]: 'Activity burst detected',
        [ReasonCode.SuspiciousVelocityPattern]: 'Suspicious velocity pattern',
        [ReasonCode.HighRiskIp]: 'High-risk IP address',
        [ReasonCode.VpnDetected]: 'VPN detected',
        [ReasonCode.TorExitNode]: 'Tor exit node detected',
        [ReasonCode.ProxyDetected]: 'Proxy detected',
        [ReasonCode.ImpossibleTravel]: 'Impossible travel detected',
        [ReasonCode.HighRiskDevice]: 'High-risk device',
        [ReasonCode.SuspiciousCluster]: 'Belongs to a suspicious cluster',
        [ReasonCode.ConnectionsWithFraud]: (p) => `${p.count} connections with confirmed fraud`,
        [ReasonCode.SharesIdentities]: (p) => `Shares identities with ${p.count} entities`,
        [ReasonCode.MultipleCombinedSignals]: 'Multiple combined risk signals',
        [ReasonCode.LowSample]: 'Low sample',
        [ReasonCode.HighVelocity1h]: 'High velocity in the last hour',
        [ReasonCode.CrossAccountUsage]: 'Used across multiple accounts',
        [ReasonCode.SuspiciousPattern]: 'Suspicious pattern detected',
        [ReasonCode.PoorHistory]: 'High invalid history',
        [ReasonCode.MultiLayerDetection]: 'Multi-layer detection',
        [ReasonCode.Burst24h]: 'Burst in the last 24h',
        [ReasonCode.BurstUsage]: 'Burst usage',
        [ReasonCode.CrossAccountReuse]: 'Cross-account reuse',
        [ReasonCode.HighInvalidRate]: 'High invalid rate',
        [ReasonCode.CriticalHistory]: 'Critical history',
        [ReasonCode.HighSuspiciousConnections]: 'High suspicious connections',
        [ReasonCode.FraudulentConnections]: 'Fraudulent connections',
        [ReasonCode.HighIdentitySharing]: 'High identity sharing',
    },
}

const RAW_TO_CODE: Record<string, ReasonCode> = {
    'Validation failed': ReasonCode.ValidationFailed,
    'Low validation confidence': ReasonCode.LowValidationConfidence,
    'Validation flags require review': ReasonCode.ValidationFlagsReview,
    'Validation flags require block': ReasonCode.ValidationFlagsBlock,
    'Invalid format policy': ReasonCode.InvalidFormatPolicy,
    'High historical invalidation rate': ReasonCode.HighHistoricalInvalidRate,
    'High risk history': ReasonCode.HighRiskHistory,
    'Critical incident history': ReasonCode.CriticalIncidentHistory,
    'High volume in the last 24 hours': ReasonCode.HighVolume24h,
    'Activity burst detected': ReasonCode.ActivityBurstDetected,
    'Suspicious velocity pattern': ReasonCode.SuspiciousVelocityPattern,
    'High-risk IP address': ReasonCode.HighRiskIp,
    'VPN detected': ReasonCode.VpnDetected,
    'Tor exit node detected': ReasonCode.TorExitNode,
    'Proxy detected': ReasonCode.ProxyDetected,
    'Impossible travel detected': ReasonCode.ImpossibleTravel,
    'High-risk device': ReasonCode.HighRiskDevice,
    'Belongs to a suspicious cluster': ReasonCode.SuspiciousCluster,
    'Multiple combined risk signals': ReasonCode.MultipleCombinedSignals,
    multi_layer_detection: ReasonCode.MultiLayerDetection,
    low_sample: ReasonCode.LowSample,
    burst_24h: ReasonCode.Burst24h,
    burst_usage: ReasonCode.BurstUsage,
    cross_account_reuse: ReasonCode.CrossAccountReuse,
    high_invalid_rate: ReasonCode.HighInvalidRate,
    critical_history: ReasonCode.CriticalHistory,
    high_suspicious_connections: ReasonCode.HighSuspiciousConnections,
    fraudulent_connections: ReasonCode.FraudulentConnections,
    high_identity_sharing: ReasonCode.HighIdentitySharing,
}

const REUSED_ACCOUNTS = /^Reused across (\d+) different accounts$/i
const FRAUD_CONNECTIONS = /^(\d+) connections with confirmed fraud$/i
const SHARED_IDENTITIES = /^Shares identities with (\d+) entities$/i

type NormalizedReason = { code: ReasonCode; params?: ReasonParams } | { raw: string }

export function normalizeReason(raw: string): NormalizedReason {
    const trimmed = raw.trim()
    if ((Object.values(ReasonCode) as string[]).includes(trimmed)) {
        return { code: trimmed as ReasonCode }
    }

    const direct = RAW_TO_CODE[trimmed as keyof typeof RAW_TO_CODE]
    if (direct) return { code: direct }

    const reused = trimmed.match(REUSED_ACCOUNTS)
    if (reused)
        return { code: ReasonCode.ReusedAcrossAccounts, params: { count: Number(reused[1]) } }

    const fraud = trimmed.match(FRAUD_CONNECTIONS)
    if (fraud) return { code: ReasonCode.ConnectionsWithFraud, params: { count: Number(fraud[1]) } }

    const shared = trimmed.match(SHARED_IDENTITIES)
    if (shared) return { code: ReasonCode.SharesIdentities, params: { count: Number(shared[1]) } }

    return { raw: trimmed }
}

export function formatReason(raw: string, language: Language): string {
    const normalized = normalizeReason(raw)
    if ('raw' in normalized) return normalized.raw

    const template = REASON_LABELS[language][normalized.code]
    if (typeof template === 'function') return template(normalized.params ?? {})
    return template || raw
}
