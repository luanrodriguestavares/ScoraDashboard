import type { RiskArchetypeId } from '@/types'
import {
    Zap,
    Network,
    KeyRound,
    Smartphone,
    FlameKindling,
    EyeOff,
    FileWarning,
    Ghost,
    Layers,
    HelpCircle,
} from 'lucide-react'

const ARCHETYPE_META: Record<
    RiskArchetypeId,
    { label: string; description: string; icon: React.ComponentType<{ className?: string }> }
> = {
    credential_stuffing: {
        label: 'Credential Stuffing',
        description: 'Rajada de tentativas com múltiplas credenciais',
        icon: KeyRound,
    },
    fraud_network: {
        label: 'Rede de Fraude',
        description: 'Conectado a entidades com fraude confirmada',
        icon: Network,
    },
    account_takeover: {
        label: 'Account Takeover',
        description: 'Acesso divergente do padrão histórico',
        icon: Zap,
    },
    device_farm: {
        label: 'Fazenda de Dispositivos',
        description: 'Mesmo identificador em múltiplas identidades',
        icon: Smartphone,
    },
    brute_force: {
        label: 'Força Bruta',
        description: 'Pico de atividade em curto intervalo',
        icon: FlameKindling,
    },
    anonymous_access: {
        label: 'Acesso Anônimo',
        description: 'Acesso via Tor, VPN ou datacenter',
        icon: EyeOff,
    },
    data_tampering: {
        label: 'Manipulação de Dados',
        description: 'Dados com sinais de adulteração',
        icon: FileWarning,
    },
    synthetic_identity: {
        label: 'Identidade Sintética',
        description: 'Identificador válido sem histórico real',
        icon: Ghost,
    },
    high_risk_pattern: {
        label: 'Padrão Multifator',
        description: 'Múltiplos sinais de risco em camadas distintas',
        icon: Layers,
    },
    unknown: {
        label: 'Padrão de Risco',
        description: 'Sinais detectados sem classificação específica',
        icon: HelpCircle,
    },
}

interface RiskArchetypeBadgeProps {
    archetypeId: RiskArchetypeId
    confidence: number
    showDescription?: boolean
}

export function RiskArchetypeBadge({
    archetypeId,
    confidence,
    showDescription = false,
}: RiskArchetypeBadgeProps) {
    const meta = ARCHETYPE_META[archetypeId] ?? ARCHETYPE_META.unknown
    const Icon = meta.icon

    const confidenceLabel = confidence >= 0.8 ? 'Alta' : confidence >= 0.6 ? 'Média' : 'Baixa'

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border/60 bg-muted/30 text-xs font-medium">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{meta.label}</span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                    Confiança: <span className="text-foreground">{confidenceLabel}</span>
                    <span className="opacity-50 ml-0.5">({(confidence * 100).toFixed(0)}%)</span>
                </span>
            </div>
            {showDescription && <p className="text-xs text-muted-foreground">{meta.description}</p>}
        </div>
    )
}
