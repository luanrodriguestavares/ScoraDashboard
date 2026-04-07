import type { RiskDecision, ExplainabilityData, RiskArchetypeId, FactorContribution } from '@/types'

const COMPONENT_WEIGHTS = {
    validation: 0.25,
    historical: 0.2,
    velocity: 0.15,
    context: 0.2,
    graph: 0.1,
    pattern: 0.1,
}

const ARCHETYPE_NAMES: Record<RiskArchetypeId, string> = {
    credential_stuffing: 'Credential Stuffing',
    fraud_network: 'Rede de Fraude',
    account_takeover: 'Account Takeover',
    device_farm: 'Fazenda de Dispositivos',
    brute_force: 'Força Bruta',
    anonymous_access: 'Acesso Anônimo',
    data_tampering: 'Manipulação de Dados',
    synthetic_identity: 'Identidade Sintética',
    high_risk_pattern: 'Padrão Multifator',
    unknown: 'Padrão de Risco',
}

const ARCHETYPE_SUMMARIES_BLOCK: Record<RiskArchetypeId, string> = {
    credential_stuffing:
        'Este identificador foi submetido em rajada com alta taxa de falhas em múltiplas contas — padrão característico de Credential Stuffing. A combinação de velocidade anômala, taxa de invalidação e reutilização entre contas eleva o risco de forma determinante.',
    fraud_network:
        'Este identificador possui conexões diretas com entidades previamente confirmadas como fraude na rede Scora. O grafo de identidade revela um ponto de infecção ativo, tornando esta submissão parte de uma rede de fraude conhecida.',
    account_takeover:
        'Os sinais apontam para uma tentativa de tomada de conta (Account Takeover). Foi detectada divergência de dispositivo e/ou localização geográfica incompatível com o histórico deste identificador, sugerindo uso por um agente não autorizado.',
    device_farm:
        'Este dispositivo ou identificador está sendo compartilhado por um número anômalo de identidades distintas — comportamento típico de fazenda de dispositivos ou operação coordenada de fraude.',
    brute_force:
        'Foi detectado um pico de atividade atípico em curto intervalo de tempo, comportamento associado a ataques de força bruta ou varredura automatizada de alto volume.',
    anonymous_access:
        'O acesso está sendo realizado através de infraestrutura de anonimização (Tor, VPN ou datacenter). Combinado com outros sinais adversos, o risco de evasão de controles é considerado alto.',
    data_tampering:
        'Foram detectados sinais claros de manipulação nos dados submetidos — caracteres invisíveis, homoglifos, dados de teste ou ofuscação deliberada — indicando tentativa de burlar as validações do sistema.',
    synthetic_identity:
        'Este identificador possui formato válido, porém sem histórico real de uso ou conexões verificáveis no grafo de identidade. Padrão típico de identidade sintética criada para fraude.',
    high_risk_pattern:
        'Múltiplos sinais de risco foram detectados simultaneamente em diferentes camadas da análise. O efeito combinado dos indicadores gerou pontuação que excede os limiares de segurança.',
    unknown:
        'A análise identificou sinais de risco nesta submissão com intensidade suficiente para o bloqueio preventivo. Os fatores abaixo detalham as contribuições de cada componente para a pontuação final.',
}

const ARCHETYPE_SUMMARIES_REVIEW: Record<RiskArchetypeId, string> = {
    credential_stuffing:
        'Sinais de múltiplas tentativas detectados, porém sem confiança suficiente para bloqueio automático. A combinação de velocidade e reutilização entre contas sugere padrão automatizado, mas requer confirmação humana.',
    fraud_network:
        'Conexões suspeitas foram detectadas no grafo de identidade, sem confirmação definitiva de fraude. A análise não é conclusiva — avaliação manual é necessária antes de qualquer decisão.',
    account_takeover:
        'O padrão de acesso diverge do histórico deste identificador. Pode indicar uso legítimo por dispositivo diferente ou uma tentativa de tomada de conta. Verifique a legitimidade do acesso.',
    device_farm:
        'Alto compartilhamento de identidades detectado neste identificador. O nível ainda não configura bloqueio automático, mas requer avaliação do contexto de uso antes de prosseguir.',
    brute_force:
        'Velocidade de acesso acima do esperado foi detectada. Pode ser uso legítimo de alto volume ou tentativa automatizada. Analise o padrão antes de aprovar ou bloquear.',
    anonymous_access:
        'Acesso via infraestrutura anônima (VPN/proxy) foi identificado. Em alguns contextos isso é esperado; em outros pode indicar tentativa de evasão. Avalie o perfil do usuário.',
    data_tampering:
        'Anomalias nos dados submetidos foram detectadas, mas sem nível de certeza para bloqueio imediato. Verifique a autenticidade das informações antes de prosseguir.',
    synthetic_identity:
        'Identificador com histórico limitado e poucas conexões verificáveis. Solicite validação adicional do usuário para confirmar a autenticidade da identidade.',
    high_risk_pattern:
        'Combinação de sinais de risco em múltiplas camadas foi detectada. Nenhum sinal individualmente justifica bloqueio, mas o conjunto requer análise manual cuidadosa.',
    unknown:
        'Sinais ambíguos foram detectados que não permitem uma decisão automática segura. A avaliação humana é recomendada para uma análise mais precisa do contexto.',
}

const ARCHETYPE_SUMMARIES_ALLOW_CLEAN: Record<RiskArchetypeId, string> = {
    credential_stuffing:
        'Aprovado. Sinais de velocidade detectados ficaram abaixo do limiar de bloqueio.',
    fraud_network:
        'Aprovado. Sinais de rede suspeita detectados, mas sem confiança suficiente para bloqueio.',
    account_takeover:
        'Aprovado. Variação de acesso detectada, dentro dos parâmetros aceitáveis para este perfil.',
    device_farm: 'Aprovado. Identificador com múltiplos acessos, mas sem confirmação de fraude.',
    brute_force:
        'Aprovado. Pico de atividade detectado, mas a pontuação final ficou abaixo do limiar de bloqueio.',
    anonymous_access:
        'Aprovado. Acesso via rede anônima detectado, mas sem outros sinais adversos determinantes.',
    data_tampering:
        'Aprovado. Padrões de dados atípicos detectados, mas sem impacto suficiente para bloqueio.',
    synthetic_identity:
        'Aprovado. Identificador com histórico limitado, mas sem sinais de fraude confirmados.',
    high_risk_pattern:
        'Aprovado com ressalva. Múltiplos sinais detectados, mas a combinação não atingiu o limiar de bloqueio.',
    unknown:
        'Aprovado automaticamente. A análise não identificou sinais adversos significativos nesta submissão.',
}

const ARCHETYPE_SUMMARIES_ALLOW_WITH_FLAGS: Record<RiskArchetypeId, string> = {
    credential_stuffing:
        'Aprovado, mas com sinais de alerta. Foram detectados indícios de Credential Stuffing (rajada de tentativas com reutilização entre contas), porém a pontuação final ficou abaixo do limiar de bloqueio. Recomenda-se monitorar este identificador com atenção.',
    fraud_network:
        'Aprovado, mas com sinais de alerta. Conexões suspeitas foram detectadas no grafo de identidade. Embora insuficientes para bloqueio automático, indicam potencial associação com atividades fraudulentas. Monitoramento contínuo é recomendado.',
    account_takeover:
        'Aprovado, mas com sinais de alerta. Foram detectadas inconsistências de dispositivo ou localização que fogem do padrão histórico do identificador. A divergência não foi grave o suficiente para bloqueio, mas indica risco potencial.',
    device_farm:
        'Aprovado, mas com sinais de alerta. Este identificador foi utilizado por múltiplas identidades distintas. O volume detectado ficou abaixo do limiar de bloqueio, mas o comportamento merece atenção.',
    brute_force:
        'Aprovado, mas com sinais de alerta. Foi detectado um pico de atividade fora do padrão esperado. A intensidade não justificou bloqueio automático, mas pode indicar uso automatizado de baixa escala.',
    anonymous_access:
        'Aprovado, mas com sinais de alerta. Acesso via infraestrutura anônima (VPN, Tor ou datacenter) foi detectado. Em contextos sensíveis, mesmo sem outros sinais adversos, isso representa um fator de risco a monitorar.',
    data_tampering:
        'Aprovado, mas com sinais de alerta. Foram detectadas anomalias nos dados submetidos que sugerem possível manipulação. O nível não foi suficiente para bloqueio, mas a autenticidade dos dados deve ser verificada.',
    synthetic_identity:
        'Aprovado, mas com sinais de alerta. O identificador apresenta padrão compatível com identidade sintética (histórico limitado, sem conexões verificáveis). Não há evidência suficiente de fraude para bloqueio, mas atenção extra é recomendada.',
    high_risk_pattern:
        'Aprovado, mas com sinais de alerta. Múltiplos indicadores de risco foram detectados em diferentes camadas da análise. A combinação não atingiu o limiar de bloqueio, mas representa um perfil de risco elevado que deve ser acompanhado.',
    unknown:
        'Aprovado automaticamente. A análise não identificou sinais adversos determinantes, mas alguns indicadores de atenção foram registrados.',
}

const COMPONENT_LABELS: Record<string, string> = {
    validation: 'Qualidade do Dado',
    historical: 'Histórico',
    velocity: 'Velocidade',
    context: 'Contexto de Acesso',
    graph: 'Grafo de Identidade',
    pattern: 'Padrão Comportamental',
    rules: 'Regras Customizadas',
}

function classifyArchetype(decision: RiskDecision): { id: RiskArchetypeId; confidence: number } {
    const reasons = new Set(decision.reasons || [])
    const patterns = new Set(decision.patterns_detected || [])
    const flags = new Set(decision.flags || [])
    const signals = decision.explanation?.signals
    const score = decision.score

    const velocityBurst =
        reasons.has('activity_burst_detected') ||
        reasons.has('burst_usage') ||
        reasons.has('burst_24h') ||
        patterns.has('velocity_burst') ||
        flags.has('burst_24h') ||
        flags.has('burst_usage')
    const highInvalidRate =
        reasons.has('high_historical_invalid_rate') ||
        reasons.has('high_invalid_rate') ||
        patterns.has('high_invalid_rate') ||
        flags.has('high_invalid_rate')
    const crossAccount =
        reasons.has('cross_account_reuse') ||
        reasons.has('cross_account_usage') ||
        patterns.has('cross_account_reuse') ||
        flags.has('cross_account_reuse')
    const fraudConn =
        reasons.has('fraudulent_connections') ||
        flags.has('fraudulent_connections') ||
        (signals?.graph?.fraudulent_connections ?? 0) > 0
    const suspCluster =
        reasons.has('suspicious_cluster') ||
        flags.has('suspicious_cluster') ||
        (signals?.graph?.cluster_risk_score ?? 0) > 0.7
    const deviceChange = flags.has('device_change') || patterns.has('device_change')
    const impossibleTravel =
        reasons.has('impossible_travel_detected') ||
        flags.has('impossible_travel') ||
        patterns.has('impossible_travel')
    const highIdentityShare =
        reasons.has('high_identity_sharing') ||
        flags.has('high_identity_sharing') ||
        patterns.has('high_identity_sharing')
    const tor =
        reasons.has('tor_exit_node_detected') ||
        flags.has('tor_detected') ||
        patterns.has('tor_detected')
    const vpn =
        reasons.has('vpn_detected') || flags.has('vpn_detected') || patterns.has('vpn_detected')
    const datacenter = flags.has('datacenter_ip') || patterns.has('datacenter_ip')
    const formatTamper = flags.has('format_tampering') || patterns.has('format_tampering')
    const testData = flags.has('test_data') || patterns.has('test_data')
    const distinct = decision.intelligence?.distinct_accounts ?? 0
    const totalSeen = decision.intelligence?.total_seen ?? 0

    if (velocityBurst && highInvalidRate && crossAccount)
        return { id: 'credential_stuffing', confidence: 0.85 }
    if (fraudConn || suspCluster) return { id: 'fraud_network', confidence: 0.88 }
    if (
        deviceChange &&
        (impossibleTravel || (signals?.context?.risk_score ?? 0) > 0.7) &&
        totalSeen > 3
    )
        return { id: 'account_takeover', confidence: 0.78 }
    if ((highIdentityShare || crossAccount) && distinct > 3)
        return { id: 'device_farm', confidence: 0.75 }
    if (velocityBurst || flags.has('abnormal_velocity') || flags.has('bot_like_speed'))
        return { id: 'brute_force', confidence: 0.72 }
    if (tor || (vpn && datacenter)) return { id: 'anonymous_access', confidence: tor ? 0.85 : 0.7 }
    if (formatTamper || testData) return { id: 'data_tampering', confidence: 0.8 }
    if (totalSeen < 3 && !fraudConn && score < 0.5)
        return { id: 'synthetic_identity', confidence: 0.55 }
    if (flags.has('multi_signal_risk') || flags.has('combined_signals') || score > 0.7)
        return { id: 'high_risk_pattern', confidence: 0.6 }
    return { id: 'unknown', confidence: 0.4 }
}

function calculateContributions(scoring: RiskDecision['scoring']): FactorContribution[] {
    const components: Array<{
        key: FactorContribution['component']
        score: number
        weight: number
    }> = [
        {
            key: 'validation',
            score: scoring.validation_score ?? 0,
            weight: COMPONENT_WEIGHTS.validation,
        },
        {
            key: 'historical',
            score: scoring.history_score ?? 0,
            weight: COMPONENT_WEIGHTS.historical,
        },
        { key: 'velocity', score: scoring.velocity_score ?? 0, weight: COMPONENT_WEIGHTS.velocity },
        { key: 'context', score: scoring.context_score ?? 0, weight: COMPONENT_WEIGHTS.context },
        { key: 'graph', score: scoring.graph_score ?? 0, weight: COMPONENT_WEIGHTS.graph },
        { key: 'pattern', score: scoring.pattern_score ?? 0, weight: COMPONENT_WEIGHTS.pattern },
    ]

    const ruleAdj = scoring.rule_adjustments ?? 0
    if (Math.abs(ruleAdj) > 0.001) {
        components.push({ key: 'rules', score: ruleAdj, weight: 1 })
    }

    const positiveTotal = components.reduce((sum, c) => {
        const ws = c.score * c.weight
        return sum + (ws > 0 ? ws : 0)
    }, 0)

    return components
        .map((c) => {
            const ws = c.score * c.weight
            const pct = positiveTotal > 0 && ws > 0 ? (ws / positiveTotal) * 100 : 0
            return {
                component: c.key,
                raw_score: Number(c.score.toFixed(4)),
                weighted_score: Number(ws.toFixed(4)),
                contribution_pct: Number(pct.toFixed(1)),
            }
        })
        .sort((a, b) => b.contribution_pct - a.contribution_pct)
}

function buildRiskFactorDescription(
    component: FactorContribution['component'],
    pct: number,
    rawScore: number,
    decision: RiskDecision,
    decisionType: string
): string {
    const intel = decision.intelligence
    const signals = decision.explanation?.signals
    const isAllow = decisionType === 'allow'
    const suffix = isAllow ? ', mas abaixo do limiar de bloqueio' : ''

    switch (component) {
        case 'validation': {
            const isValid = signals?.validation?.valid ?? true
            const hasLowConf = (signals?.validation?.confidence ?? 1) < 0.8
            if (!isValid)
                return `Formato inválido detectado — contribuição de ${pct.toFixed(0)}% ao score de risco.`
            if (hasLowConf)
                return `Dado formalmente válido, mas com baixa confiança na validação (${pct.toFixed(0)}% do risco${suffix}).`
            return `Dado válido sem alertas de formato — contribuição baixa (${pct.toFixed(0)}%) ao risco.`
        }
        case 'historical': {
            if (!intel || intel.total_seen === 0)
                return `Identificador sem histórico prévio de submissão — sinal de risco por ausência de referência (${pct.toFixed(0)}% do risco${suffix}).`
            const validRatePct = (intel.valid_rate * 100).toFixed(0)
            const invalidNote =
                intel.valid_rate < 0.5
                    ? `Taxa de válidos abaixo de 50% — histórico majoritariamente inválido. `
                    : intel.valid_rate < 0.8
                      ? `Taxa de válidos moderada (${validRatePct}%). `
                      : `Taxa de válidos alta (${validRatePct}%). `
            return `${invalidNote}${intel.total_seen} ocorrência(s) em ${intel.distinct_accounts} conta(s) distintas — representa ${pct.toFixed(0)}% do risco${suffix}.`
        }
        case 'velocity': {
            const recent = intel?.recent_24h ?? 0
            if (recent === 0)
                return `Velocidade de acesso sem picos detectados — contribuição de ${pct.toFixed(0)}% ao risco${suffix}.`
            if (recent > 20)
                return `${recent} ocorrências nas últimas 24h — velocidade muito acima do normal. Forte indicador de automação ou abuso (${pct.toFixed(0)}% do risco${suffix}).`
            return `${recent} ocorrência(s) nas últimas 24h — velocidade acima do esperado, representando ${pct.toFixed(0)}% do risco${suffix}.`
        }
        case 'context': {
            const anomalies = decision.flags || []
            const contextFlags = anomalies.filter((f) =>
                [
                    'vpn_detected',
                    'tor_detected',
                    'datacenter_ip',
                    'impossible_travel',
                    'device_change',
                    'dfp_emulator',
                    'dfp_rooted',
                    'dfp_jailbroken',
                    'dfp_automation',
                    'dfp_unstable_device',
                    'high_risk_ip',
                ].includes(f)
            )
            const count = contextFlags.length
            if (count === 0 && rawScore > 0)
                return `Contexto de acesso com sinais anômalos não específicos — contribuição de ${pct.toFixed(0)}% ao risco${suffix}.`
            if (count === 0) return `Contexto de acesso sem anomalias detectadas.`
            const flagDescriptions: Record<string, string> = {
                vpn_detected: 'VPN',
                tor_detected: 'Tor',
                datacenter_ip: 'IP de datacenter',
                impossible_travel: 'viagem impossível',
                device_change: 'mudança de dispositivo',
                dfp_emulator: 'emulador',
                dfp_rooted: 'dispositivo com root',
                dfp_jailbroken: 'dispositivo com jailbreak',
                dfp_automation: 'automação detectada',
                dfp_unstable_device: 'dispositivo instável',
                high_risk_ip: 'IP de alto risco',
            }
            const desc = contextFlags.map((f) => flagDescriptions[f] ?? f).join(', ')
            return `Anomalias de acesso detectadas: ${desc}. Representa ${pct.toFixed(0)}% do risco${suffix}.`
        }
        case 'graph': {
            const fraudCount = signals?.graph?.fraudulent_connections ?? 0
            const suspCount = signals?.graph?.suspicious_connections ?? 0
            const sharedIdent = decision.graph_analysis?.shared_identities ?? 0
            if (fraudCount > 0)
                return `${fraudCount} conexão(ões) com entidade(s) de fraude confirmada detectada(s) no grafo de identidade — representa ${pct.toFixed(0)}% do risco${suffix}.`
            if (suspCount > 0)
                return `${suspCount} conexão(ões) suspeita(s) no grafo de identidade — ainda sem confirmação de fraude, mas representa ${pct.toFixed(0)}% do risco${suffix}.`
            if (sharedIdent > 3)
                return `Identificador compartilhado com ${sharedIdent} entidades distintas no grafo — representa ${pct.toFixed(0)}% do risco${suffix}.`
            return `Análise do grafo de identidade contribuiu com ${pct.toFixed(0)}% do risco${suffix}.`
        }
        case 'pattern':
            return `Padrões comportamentais anômalos nos dados submetidos foram detectados pelo motor de análise — representam ${pct.toFixed(0)}% do risco${suffix}.`
        case 'rules':
            return `Regras customizadas da conta aplicaram ajuste positivo ao score — impacto de ${pct.toFixed(0)}% no risco total${suffix}.`
        default:
            return `Contribuição de ${pct.toFixed(0)}% ao risco total${suffix}.`
    }
}

function getExecutiveSummary(
    archetypeId: RiskArchetypeId,
    decisionType: string,
    hasFlags: boolean
): string {
    if (decisionType === 'block') return ARCHETYPE_SUMMARIES_BLOCK[archetypeId]
    if (decisionType === 'review') return ARCHETYPE_SUMMARIES_REVIEW[archetypeId]
    if (hasFlags && archetypeId !== 'unknown')
        return ARCHETYPE_SUMMARIES_ALLOW_WITH_FLAGS[archetypeId]
    return ARCHETYPE_SUMMARIES_ALLOW_CLEAN[archetypeId]
}

function getRecommendedAction(
    decision: RiskDecision,
    archetypeId: RiskArchetypeId,
    hasFlags: boolean
): string {
    const score = decision.score.toFixed(2)
    const archetypeName = ARCHETYPE_NAMES[archetypeId]

    if (decision.decision === 'block') {
        return `Manter bloqueio. Score ${score} — padrão de ${archetypeName} detectado com grau de certeza suficiente para bloqueio preventivo.`
    }

    if (decision.decision === 'review') {
        return `Avaliação manual necessária. Score ${score} está na faixa de revisão — os sinais detectados (${archetypeName}) são ambíguos para uma decisão automática segura. Analise o contexto antes de aprovar ou bloquear.`
    }

    if (hasFlags && archetypeId !== 'unknown') {
        return `Aprovado com monitoramento recomendado. Score ${score} ficou abaixo do limiar de bloqueio, mas foram detectados sinais de ${archetypeName}. Acompanhe a evolução deste identificador para identificar escalada de risco.`
    }
    return `Aprovado automaticamente. Score ${score} — nenhum sinal adverso determinante foi identificado nesta análise. Submissão dentro dos parâmetros de segurança.`
}

export function buildLocalExplainability(decision: RiskDecision): ExplainabilityData {
    const archetype = classifyArchetype(decision)
    const contributions = calculateContributions(decision.scoring)

    const hasFlags =
        (decision.flags?.length ?? 0) > 0 ||
        (decision.patterns_detected?.length ?? 0) > 0 ||
        (decision.reasons?.length ?? 0) > 0

    const executive_summary = getExecutiveSummary(archetype.id, decision.decision, hasFlags)

    const minPct =
        decision.decision === 'allow' && !hasFlags ? 10 : decision.decision === 'allow' ? 5 : 0
    const topContributions = contributions
        .filter((c) => c.contribution_pct > minPct)
        .slice(0, decision.decision === 'allow' ? 4 : 3)

    const risk_factors = topContributions.map((c) => ({
        title: COMPONENT_LABELS[c.component] ?? c.component,
        description: buildRiskFactorDescription(
            c.component,
            c.contribution_pct,
            c.raw_score,
            decision,
            decision.decision
        ),
        weight_pct: c.contribution_pct,
        signal: c.component,
    }))

    const recommended_action = getRecommendedAction(decision, archetype.id, hasFlags)

    return {
        risk_archetype: archetype,
        factor_contributions: contributions,
        narrative: { executive_summary, risk_factors, recommended_action },
    }
}
