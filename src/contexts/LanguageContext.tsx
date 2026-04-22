import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

export type Language = 'pt-BR' | 'en'

type DashboardCopy = {
    nav: {
        overview: string
        reviewQueue: string
        decisions: string
        graphExplorer: string
        analytics: string
        settings: string
        apiKeys: string
        auditLogs: string
        users: string
        profile: string
        logout: string
        rulesEngine: string
        monitoring: string
        learning: string
        investigation: string
        reports: string
        alerting: string
        accounts: string
    }
    header: {
        title: string
        searchPlaceholder: string
        notifications: string
        profile: string
        member: string
    }
    overview: {
        title: string
        subtitle: string
        heroTitle: string
        heroAnalyzed: string
        heroBlocked: string
        heroReview: string
        noDecisionsToday: string
        pendingReviewLabel: string
        autoDecisions: string
        humanReview: string
        impactLabel: string
        streamActive: string
        lastUpdated: string
        investigate: string
        decisionsToday: string
        pendingReviews: string
        blockedToday: string
        avgLatency: string
        decisionsPerHour: string
        riskDistribution: string
        activeAlerts: string
        recentDecisions: string
        viewAll: string
        decisionDetails: string
        low: string
        medium: string
        high: string
        critical: string
        allow: string
        review: string
        block: string
    }
    reviewQueue: {
        title: string
        subtitle: string
        pending: string
        myAssigned: string
        resolvedToday: string
        filters: string
        sortBy: string
        priority: string
        score: string
        time: string
        type: string
        reasons: string
        graphInfo: string
        history: string
        recommendationTitle: string
        recommendationAction: string
        recommendationConfidence: string
        whyInReview: string
        topDrivers: string
        thresholdsLabel: string
        decisionFloor: string
        viewHistory: string
        confidenceHigh: string
        confidenceMedium: string
        confidenceLow: string
        actions: {
            approve: string
            block: string
            requestDocs: string
            escalate: string
            assign: string
        }
        noResults: string
        loading: string
        scoreLabel: string
        clusterLabel: string
        riskPropagation: string
        totalSeen: string
        distinctAccounts: string
        recent24h: string
        validRate: string
        scoringBreakdown: string
        scoreLabels: {
            validation: string
            history: string
            velocity: string
            context: string
            pattern: string
            graph: string
            rules: string
            final: string
        }
        typeAll: string
        typeCpf: string
        typeCnpj: string
        typeEmail: string
        typePhone: string
        typeIp: string
        revealValue: string
        hideValue: string
        revealUnavailable: string
    }
    graph: {
        title: string
        subtitle: string
        searchPlaceholder: string
        howTo: string
        recentClusters: string
        idLabel: string
        clusterInfo: string
        clusterSize: string
        nodesLabel: string
        totalRisk: string
        sharedIdentities: string
        firstConnection: string
        lastActivity: string
        nodeDetails: string
        connections: string
        riskScore: string
        occurrencesLabel: string
        emptyState: string
        legendTitle: string
        legendConnection: string
        legendNodeSize: string
        legendNodeColor: string
        legendFallback: string
        connectedNodes: string
        noCluster: string
        viewAll: string
        allClusters: string
    }
    analytics: {
        title: string
        subtitle: string
        period: string
        last7days: string
        last30days: string
        last90days: string
        modelEfficacy: string
        falsePositives: string
        fraudsDetected: string
        avgReviewTime: string
        avgLatency: string
        topPatterns: string
        scoreDistribution: string
        decisionsByType: string
        trendsOverTime: string
        exportReport: string
        exportPDF: string
        exportCSV: string
        exportJSON: string
        vsPeriod: string
    }
    settings: {
        title: string
        subtitle: string
        thresholds: {
            title: string
            description: string
            reviewStart: string
            reviewEnd: string
            restoreDefault: string
            saveChanges: string
        }
        weights: {
            title: string
            description: string
            validation: string
            history: string
            pattern: string
            graph: string
            autoAdjusted: string
        }
        webhooks: {
            title: string
            description: string
            addWebhook: string
            url: string
            events: string
            active: string
            edit: string
            delete: string
            noWebhooks: string
        }
        security: {
            title: string
            description: string
            mode: string
            zeroKnowledge: string
            zeroKnowledgeDesc: string
            zeroKnowledgeWarning: string
            encrypted: string
            encryptedDesc: string
            encryptedWarning: string
            recommended: string
            compliance: string
            retentionDays: string
            saveSuccess: string
            saveError: string
        }
    }
    apiKeys: {
        title: string
        subtitle: string
        createNew: string
        createDescription: string
        createdTitle: string
        createdHelp: string
        done: string
        name: string
        prefix: string
        usage: string
        status: string
        actions: string
        active: string
        expired: string
        revoked: string
        usageWarning: string
        copyKey: string
        revokeKey: string
        deleteKey: string
        confirmRevoke: string
        confirmDelete: string
        totalKeys: string
        activeKeys: string
        totalUsage: string
        yourKeys: string
        yourKeysDesc: string
        lastUsed: string
        namePlaceholder: string
    }
    auditLogs: {
        title: string
        subtitle: string
        exportCsv: string
        filters: string
        timestamp: string
        action: string
        actor: string
        details: string
        ipAddress: string
        loadMore: string
        noLogs: string
    }
    common: {
        save: string
        cancel: string
        confirm: string
        delete: string
        edit: string
        create: string
        search: string
        filter: string
        refresh: string
        loading: string
        error: string
        success: string
        warning: string
        info: string
        unavailable: string
        noData: string
        noActiveAlerts: string
        ago: string
        minutes: string
        hours: string
        days: string
        minutesShort: string
        hoursShort: string
        daysShort: string
        now: string
        today: string
        yesterday: string
        thisWeek: string
        ofTotal: string
        score: string
        patterns: string
        patternsLabel: string
        typeLabel: string
        decisionLabel: string
        decisionIdLabel: string
        riskLabel: string
        valueHashLabel: string
        reasonsLabel: string
        createdAtLabel: string
        decisionsLabel: string
        p95: string
        collapse: string
        all: string
        active: string
        actions: string
        viewAll: string
    }
    decisions: {
        allow: string
        review: string
        block: string
    }
    decisionsPage: {
        title: string
        subtitle: string
        decisionFilter: string
        noResults: string
        loadMore: string
    }
    risk: {
        low: string
        medium: string
        high: string
        critical: string
    }
    patterns: {
        [key: string]: string
    }
    users: {
        title: string
        subtitle: string
        createUser: string
        createDescription: string
        inviteUser: string
        inviteDescription: string
        sendInvite: string
        email: string
        password: string
        role: string
        roles: {
            superAdmin: string
            admin: string
            member: string
        }
        stats: {
            total: string
            active: string
            admins: string
            pending: string
        }
        pendingInvites: string
        invitedOn: string
        expiresOn: string
        searchPlaceholder: string
        filterByRole: string
        allRoles: string
        user: string
        status: string
        lastLogin: string
        neverLoggedIn: string
        actions: string
        active: string
        inactive: string
        editUser: string
        name: string
    }
    profile: {
        title: string
        subtitle: string
        personalInfo: string
        personalInfoDescription: string
        name: string
        email: string
        password: string
        passwordDescription: string
        changePassword: string
        changePasswordDescription: string
        currentPassword: string
        newPassword: string
        confirmPassword: string
        passwordsDoNotMatch: string
        updatePassword: string
        twoFactor: string
        twoFactorDescription: string
        authenticatorApp: string
        twoFactorEnabled: string
        twoFactorDisabled: string
        enable: string
        disable: string
        setup2FA: string
        setup2FADescription: string
        secretKey: string
        verificationCode: string
        verify: string
        dangerZone: string
        deleteAccount: string
        deleteAccountDescription: string
    }
    errors: {
        networkTitle: string
        networkDescription: string
        serverTitle: string
        serverDescription: string
        notFoundTitle: string
        notFoundDescription: string
        genericTitle: string
        genericDescription: string
        retry: string
    }
    commandPalette: {
        search: string
        placeholder: string
        noResults: string
        navigation: string
        settings: string
        navigate: string
        select: string
        close: string
    }
    rules: {
        title: string
        subtitle: string
        createRule: string
        name: string
        description: string
        priority: string
        conditions: string
        actions: string
        enabled: string
        simulate: string
        abTesting: string
        newRule: string
        newRuleDescription: string
        active: string
        disabled: string
        editRule: string
        duplicate: string
        delete: string
        condition: string
        triggered: string
        last: string
        addCondition: string
        trafficPercentage: string
        allRules: string
        activeRules: string
        withAbTest: string
        simulationResults: string
        impactedDecisions: string
        noRulesFound: string
        totalRules: string
        abTests: string
        totalTriggered: string
        simulateFirst: string
        basedOnLast24h: string
        totalDecisionsAnalyzed: string
        wouldTrigger: string
        ofDecisions: string
        impactBreakdown: string
        estimatedImpact: string
        falsePositives: string
        falseNegatives: string
    }
    monitoring: {
        title: string
        subtitle: string
        systemHealth: string
        healthy: string
        degraded: string
        critical: string
        latency: string
        throughput: string
        errorRate: string
        components: string
        uptime: string
        autoRefresh: string
        connected: string
        disconnected: string
        avgLatency: string
        p50: string
        p95: string
        p99: string
        requestsPerMinute: string
        decisionsDistribution: string
        last30min: string
        now: string
        activeAlerts: string
        dismiss: string
        componentHealth: string
        decisionDistribution: string
        lastMinute: string
        lastUpdate: string
        avgProcessing: string
        p95Processing: string
        componentsDesc: string
        alerts: string
        alertsDesc: string
        noAlerts: string
        status: string
        current: string
    }
    learning: {
        title: string
        subtitle: string
        sectionLabel: string
        feedback: string
        falsePositive: string
        confirmedFraud: string
        drift: string
        recommendations: string
        retraining: string
        recentFeedback: string
        featureDrift: string
        retrainingHistory: string
        applied: string
        pending: string
        original: string
        shouldBe: string
        submitFeedback: string
        addFeedback: string
        selectDecision: string
        selectType: string
        incorrectScore: string
        notesOptional: string
        submit: string
        applyRecommendation: string
        dismissRecommendation: string
        confidence: string
        expectedImpact: string
        currentValue: string
        suggestedValue: string
        triggerRetraining: string
        feedbackCount: string
        completed: string
        running: string
        failed: string
        metricsImprovement: string
        accuracy: string
        noFeedback: string
        dismiss: string
        apply: string
        baselineRecalculation: string
        feedbackItems: string
        falsePositives: string
        confirmedFrauds: string
        pendingApply: string
        criticalDrifts: string
        featureDriftAnalysis: string
        comparingDistributions: string
        noRecommendations: string
        baselineRecalcHistory: string
        automaticRecalculations: string
        feedbackDialogDescription: string
        decisionId: string
        feedbackType: string
        correctDecision: string
        apiIntegration: string
        shouldBeAllowed: string
        shouldBeBlocked: string
    }
    investigation: {
        title: string
        subtitle: string
        timeline: string
        connections: string
        similarCases: string
        notes: string
        resolve: string
        searchPlaceholder: string
        caseDetails: string
        riskScore: string
        status: string
        assignedTo: string
        createdAt: string
        validationScore: string
        historyScore: string
        patternScore: string
        graphScore: string
        occurrences: string
        context: string
        device: string
        country: string
        vpn: string
        tor: string
        linkedIdentities: string
        similarity: string
        addNote: string
        writeNote: string
        markResolved: string
        noCase: string
        history: string
        risk: string
        priority: string
        firstSeen: string
        lastSeen: string
        accounts: string
        falsePositive: string
        confirmedFraud: string
        escalate: string
        needsMoreInfo: string
        completeHistory: string
        connectedIdentities: string
        connectedIdentitiesDesc: string
        similarCasesDesc: string
        analystNotes: string
        changeCase: string
        findCase: string
        searchCaseDesc: string
        noCases: string
        noResults: string
        occurrencesCount: string
        loading: string
        reviewed: string
        cases: string
    }
    reports: {
        title: string
        subtitle: string
        scheduled: string
        compliance: string
        generate: string
        history: string
        createReport: string
        reportName: string
        type: string
        format: string
        recipients: string
        daily: string
        weekly: string
        monthly: string
        custom: string
        lastGenerated: string
        nextScheduled: string
        generationHistory: string
        generatedAt: string
        size: string
        download: string
        generateNow: string
        noReportsFound: string
        createNewReport: string
        configureReport: string
        customOnDemand: string
        totalReports: string
        complianceReports: string
        activeSchedules: string
        reports: string
        recentGenerations: string
        report: string
        status: string
    }
    alerting: {
        title: string
        subtitle: string
        rules: string
        events: string
        mute: string
        unmute: string
        acknowledge: string
        createAlertRule: string
        configureAlertRule: string
        ruleName: string
        description: string
        metric: string
        operator: string
        threshold: string
        timeWindow: string
        severity: string
        channels: string
        escalation: string
        warning: string
        info: string
        muted: string
        activeAlerts: string
        totalRules: string
        criticalRules: string
        mutedRules: string
        muteAlert: string
        muteFor: string
        minutes: string
        hours: string
        triggeredAt: string
        resolvedAt: string
        resolved: string
        acknowledged: string
        eventHistory: string
        alertRules: string
        alertEvents: string
        rule: string
        message: string
        triggered: string
        createAlert: string
        createRule: string
    }
    accounts: {
        title: string
        subtitle: string
        active: string
        suspended: string
        trial: string
        churned: string
        metrics: string
        billing: string
        createAccount: string
        totalAccounts: string
        monthlyMRR: string
        totalRequestsMonth: string
        searchAccounts: string
        allStatus: string
        allPlans: string
        plan: string
        free: string
        starter: string
        professional: string
        enterprise: string
        requestsMonth: string
        fraudsBlocked: string
        users: string
        apiKeys: string
        industry: string
        usage: string
        monthlyLimit: string
        currentPlan: string
        monthlyCost: string
        billingPeriodEnds: string
        suspendAccount: string
        reactivateAccount: string
        noAccountsFound: string
        tryAdjusting: string
        settings: string
        webhookNotifications: string
        mfaRequired: string
        ipWhitelist: string
        noIpRestrictions: string
        viewAllUsers: string
    }
}

const dashboardCopy: Record<Language, DashboardCopy> = {
    'pt-BR': {
        nav: {
            overview: 'Visão Geral',
            reviewQueue: 'Fila de Revisão',
            decisions: 'Decisões',
            graphExplorer: 'Explorador de Grafo',
            analytics: 'Analytics',
            settings: 'Configurações',
            apiKeys: 'API Keys',
            auditLogs: 'Logs de Auditoria',
            users: 'Usuários',
            profile: 'Perfil',
            logout: 'Sair',
            rulesEngine: 'Motor de Regras',
            monitoring: 'Monitoramento',
            learning: 'Aprendizado',
            investigation: 'Investigação',
            reports: 'Relatórios',
            alerting: 'Alertas',
            accounts: 'Contas',
            webhooks: 'Webhooks',
        },
        header: {
            title: 'Scora Panel',
            searchPlaceholder: 'Buscar decisões, clusters...',
            notifications: 'Notificações',
            profile: 'Perfil',
            member: 'Membro',
        },
        overview: {
            title: 'Visão Geral',
            subtitle: 'Monitoramento em tempo real das decisões de risco',
            heroTitle: 'Resumo Executivo',
            heroAnalyzed: 'o Scora analisou',
            heroBlocked: 'bloqueou',
            heroReview: 'enviou para revisão',
            noDecisionsToday: 'Nenhuma decisão registrada hoje',
            pendingReviewLabel: 'Pendentes em revisão',
            autoDecisions: 'Decisões automáticas',
            humanReview: 'Revisão humana',
            impactLabel: 'Impacto estimado',
            streamActive: 'Stream ativo',
            lastUpdated: 'Atualizado',
            investigate: 'Investigar',
            decisionsToday: 'Decisões Hoje',
            pendingReviews: 'Revisões Pendentes',
            blockedToday: 'Bloqueados Hoje',
            avgLatency: 'Latência Média',
            decisionsPerHour: 'Decisões por Hora',
            riskDistribution: 'Distribuição de Risco',
            activeAlerts: 'Alertas Ativos',
            recentDecisions: 'Decisões Recentes',
            viewAll: 'Ver Todos',
            decisionDetails: 'Detalhes da Decisão',
            low: 'Baixo',
            medium: 'Médio',
            high: 'Alto',
            critical: 'Crítico',
            allow: 'Aprovado',
            review: 'Revisão',
            block: 'Bloqueado',
        },
        reviewQueue: {
            title: 'Fila de Revisão',
            subtitle: 'Casos aguardando análise manual',
            pending: 'Pendentes',
            myAssigned: 'Meus Casos',
            resolvedToday: 'Resolvidos Hoje',
            filters: 'Filtros',
            sortBy: 'Ordenar por',
            priority: 'Prioridade',
            score: 'Score',
            time: 'Tempo',
            type: 'Tipo',
            reasons: 'Motivos',
            graphInfo: 'Info do Grafo',
            history: 'Histórico',
            recommendationTitle: 'Recomendação',
            recommendationAction: 'Sugerido',
            recommendationConfidence: 'Confiança',
            whyInReview: 'Por que está em revisão?',
            topDrivers: 'Principais drivers',
            thresholdsLabel: 'Thresholds',
            decisionFloor: 'Decisão forçada',
            viewHistory: 'Ver histórico completo',
            confidenceHigh: 'Alta',
            confidenceMedium: 'Média',
            confidenceLow: 'Baixa',
            actions: {
                approve: 'Aprovar',
                block: 'Bloquear',
                requestDocs: 'Solicitar Docs',
                escalate: 'Escalar',
                assign: 'Atribuir',
            },
            noResults: 'Nenhum caso pendente',
            loading: 'Carregando casos...',
            scoreLabel: 'Score',
            clusterLabel: 'Cluster',
            riskPropagation: 'Propagação de Risco',
            totalSeen: 'Total visto',
            distinctAccounts: 'Contas distintas',
            recent24h: 'Últimas 24h',
            validRate: 'Taxa válida',
            scoringBreakdown: 'Detalhamento do Score',
            scoreLabels: {
                validation: 'Validação',
                history: 'Histórico',
                velocity: 'Velocidade',
                context: 'Contexto',
                pattern: 'Padrão',
                graph: 'Grafo',
                rules: 'Regras',
                final: 'Final',
            },
            typeAll: 'Todos os Tipos',
            typeCpf: 'CPF',
            typeCnpj: 'CNPJ',
            typeEmail: 'Email',
            typePhone: 'Telefone',
            typeIp: 'IP',
            revealValue: 'Revelar valor',
            hideValue: 'Ocultar valor',
            revealUnavailable: 'Valor indisponível para revelar',
        },
        graph: {
            title: 'Explorador de Grafo',
            subtitle: 'Visualize conexões entre identidades',
            searchPlaceholder: 'Buscar por hash ou cluster ID...',
            howTo: 'Como usar: escolha um cluster recente e clique em um nó para destacar conexões. Clique com o botão direito no nó para ver detalhes completos. Os rótulos são anonimizados.',
            recentClusters: 'Clusters recentes',
            idLabel: 'ID',
            clusterInfo: 'Informações do Cluster',
            clusterSize: 'Tamanho',
            nodesLabel: 'nós',
            totalRisk: 'Risco Total',
            sharedIdentities: 'Identidades Compartilhadas',
            firstConnection: 'Primeira Conexão',
            lastActivity: 'Última Atividade',
            nodeDetails: 'Detalhes do Nó',
            connections: 'Conexões',
            riskScore: 'Score de Risco',
            occurrencesLabel: 'ocorrências',
            emptyState: 'Selecione um cluster ou busque uma identidade',
            legendTitle: 'Legenda',
            legendConnection: 'Conexões indicam relação observada entre identidades',
            legendNodeSize: 'Tamanho do nó = volume de ocorrências',
            legendNodeColor: 'Cor = tipo de dado (CPF, e-mail, IP, etc.)',
            legendFallback: 'Sem grafo real? Exibimos um cluster recente por coorte',
            connectedNodes: 'Nós conectados',
            noCluster: 'Selecione um cluster ou busque uma identidade',
            viewAll: 'Ver todos os clusters',
            allClusters: 'Todos os Clusters',
        },
        analytics: {
            title: 'Analytics',
            subtitle: 'Métricas e performance do modelo',
            period: 'Período',
            last7days: 'Últimos 7 dias',
            last30days: 'Últimos 30 dias',
            last90days: 'Últimos 90 dias',
            modelEfficacy: 'Eficácia do Modelo',
            falsePositives: 'Falsos Positivos',
            fraudsDetected: 'Fraudes Detectadas',
            avgReviewTime: 'Tempo Médio de Review',
            avgLatency: 'Latência Média',
            topPatterns: 'Top Padrões Detectados',
            scoreDistribution: 'Distribuição de Scores',
            decisionsByType: 'Decisões por Tipo de Dado',
            trendsOverTime: 'Tendências ao Longo do Tempo',
            exportReport: 'Exportar Relatório',
            exportPDF: 'Exportar PDF',
            exportCSV: 'Exportar CSV',
            exportJSON: 'Exportar JSON',
            vsPeriod: 'vs período anterior',
        },
        settings: {
            title: 'Configurações',
            subtitle: 'Ajuste thresholds, pesos e webhooks',
            thresholds: {
                title: 'Thresholds de Decisão',
                description: 'Defina os limites para cada tipo de decisão',
                reviewStart: 'Início de Review',
                reviewEnd: 'Fim de Review',
                restoreDefault: 'Restaurar Padrão',
                saveChanges: 'Salvar Alterações',
            },
            weights: {
                title: 'Pesos por Camada',
                description: 'Ajuste a importância de cada camada de análise',
                validation: 'Validação Sintática',
                history: 'Histórico',
                pattern: 'Detecção de Padrões',
                graph: 'Grafo de Identidade',
                autoAdjusted: 'Pesos ajustados automaticamente pelo sistema de aprendizado',
            },
            webhooks: {
                title: 'Webhooks',
                description: 'Configure notificações para eventos de risco',
                addWebhook: 'Adicionar Webhook',
                url: 'URL',
                events: 'Eventos',
                active: 'Ativo',
                edit: 'Editar',
                delete: 'Excluir',
                noWebhooks: 'Nenhum webhook configurado',
            },
            security: {
                title: 'Segurança',
                description: 'Modo de armazenamento e retenção de dados',
                mode: 'Modo de Segurança',
                zeroKnowledge: 'Zero-Knowledge',
                zeroKnowledgeDesc:
                    'Nenhum valor é armazenado. Apenas hashes e metadados não-identificadores. O sistema aprende padrões sem nunca conhecer os dados reais. Conformidade com LGPD por padrão.',
                zeroKnowledgeWarning: "O botão 'Revelar valor' não estará disponível neste modo.",
                encrypted: 'Criptografado (AES-256-GCM)',
                encryptedDesc:
                    'Valores armazenados com criptografia AES-256-GCM. Administradores autorizados podem recuperar o valor original quando necessário. Todo acesso é registrado no audit log.',
                encryptedWarning: "Necessário para usar o botão 'Revelar valor' nas decisões.",
                recommended: 'Recomendado',
                compliance: 'Compliance',
                retentionDays: 'Dias de Retenção',
                saveSuccess: 'Configurações salvas com sucesso.',
                saveError: 'Erro ao salvar configurações. Tente novamente.',
            },
        },
        apiKeys: {
            title: 'API Keys',
            subtitle: 'Gerencie suas chaves de API',
            createNew: 'Nova API Key',
            createDescription: 'Crie uma nova chave para integrar sua aplicação',
            createdTitle: 'API Key criada com sucesso!',
            createdHelp: 'Copie sua chave agora. Ela não ficará disponível novamente.',
            done: 'Concluir',
            name: 'Nome',
            prefix: 'Prefixo',
            usage: 'Uso Mensal',
            status: 'Status',
            actions: 'Ações',
            active: 'Ativa',
            expired: 'Expirada',
            revoked: 'Revogada',
            usageWarning: 'Você está próximo do limite',
            copyKey: 'Copiar Chave',
            revokeKey: 'Revogar',
            deleteKey: 'Excluir',
            confirmRevoke: 'Tem certeza que deseja revogar esta chave?',
            confirmDelete: 'Tem certeza que deseja excluir esta chave?',
            totalKeys: 'Total de Chaves',
            activeKeys: 'Chaves Ativas',
            totalUsage: 'Uso Total',
            yourKeys: 'Suas API Keys',
            yourKeysDesc:
                'Visualize e gerencie suas API Keys. Mantenha-as seguras e nunca as compartilhe publicamente.',
            lastUsed: 'Último Uso',
            namePlaceholder: 'Chave API de Produção',
        },
        auditLogs: {
            title: 'Logs de Auditoria',
            subtitle: 'Histórico completo de operações',
            exportCsv: 'Exportar CSV',
            filters: 'Filtros',
            timestamp: 'Data/Hora',
            action: 'Ação',
            actor: 'Autor',
            details: 'Detalhes',
            ipAddress: 'IP',
            loadMore: 'Carregar mais',
            noLogs: 'Nenhum log encontrado',
        },
        common: {
            save: 'Salvar',
            cancel: 'Cancelar',
            confirm: 'Confirmar',
            delete: 'Excluir',
            edit: 'Editar',
            create: 'Criar',
            search: 'Buscar',
            filter: 'Filtrar',
            refresh: 'Atualizar',
            loading: 'Carregando...',
            error: 'Erro',
            success: 'Sucesso',
            warning: 'Aviso',
            info: 'Info',
            unavailable: 'Indisponível',
            noData: 'Sem dados',
            noActiveAlerts: 'Nenhum alerta ativo',
            ago: 'atrás',
            minutes: 'minutos',
            hours: 'horas',
            days: 'dias',
            minutesShort: 'min',
            hoursShort: 'h',
            daysShort: 'd',
            now: 'agora',
            today: 'Hoje',
            yesterday: 'Ontem',
            thisWeek: 'nesta semana',
            ofTotal: 'do total',
            score: 'Score',
            patterns: 'padrões',
            patternsLabel: 'Padrões',
            typeLabel: 'Tipo',
            decisionLabel: 'Decisão',
            decisionIdLabel: 'Decision ID',
            riskLabel: 'Risco',
            valueHashLabel: 'Item Ref',
            reasonsLabel: 'Motivos',
            createdAtLabel: 'Criado em',
            decisionsLabel: 'decisões',
            p95: 'P95',
            collapse: 'Recolher',
            all: 'Todos',
            active: 'Ativo',
            actions: 'Ações',
            viewAll: 'Ver mais',
        },
        decisions: {
            allow: 'Aprovar',
            review: 'Revisar',
            block: 'Bloquear',
        },
        decisionsPage: {
            title: 'Decisões',
            subtitle: 'Histórico completo de decisões',
            decisionFilter: 'Decisão',
            noResults: 'Nenhuma decisão encontrada',
            loadMore: 'Carregar mais',
        },
        risk: {
            low: 'Baixo',
            medium: 'Médio',
            high: 'Alto',
            critical: 'Crítico',
        },
        patterns: {
            high_invalid_rate: 'Alta taxa de inválidos',
            high_risk_history: 'Histórico de alto risco',
            critical_history: 'Histórico crítico',
            cross_account_reuse: 'Reuso entre contas',
            burst_24h: 'Burst nas últimas 24h',
            burst_usage: 'Uso em burst',
            velocity_spike: 'Pico de velocidade',
            velocity_burst: 'Burst de velocidade',
            abnormal_velocity: 'Velocidade anômala',
            bot_like_speed: 'Velocidade de bot',
            high_speed: 'Velocidade elevada',
            automated_pattern: 'Padrão automatizado',
            high_volume: 'Volume alto',
            suspicious_velocity_pattern: 'Padrão de velocidade suspeito',
            suspicious_day: 'Atividade suspeita no dia',
            suspicious_hour: 'Atividade suspeita na hora',
            suspicious_minute: 'Atividade suspeita no minuto',
            vpn_detected: 'VPN detectada',
            tor_detected: 'Tor detectado',
            datacenter_ip: 'IP de datacenter',
            impossible_travel: 'Viagem impossível',
            device_change: 'Mudança de dispositivo',
            dfp_emulator: 'Emulador detectado',
            dfp_rooted: 'Dispositivo com root',
            dfp_jailbroken: 'Dispositivo com jailbreak',
            dfp_automation: 'Automação de dispositivo',
            dfp_unstable_device: 'Dispositivo instável',
            high_risk_ip: 'IP de alto risco',
            suspicious_cluster: 'Cluster suspeito',
            fraudulent_connections: 'Conexões fraudulentas',
            high_suspicious_connections: 'Conexões suspeitas elevadas',
            high_identity_sharing: 'Alto compartilhamento de identidades',
            identity_cluster: 'Cluster de identidade',
            format_tampering: 'Adulteração de formato',
            test_data: 'Dados de teste',
            low_entropy: 'Baixa entropia',
            high_entropy: 'Alta entropia',
            repeated_pattern: 'Padrão repetido',
            regional_inconsistency: 'Inconsistência regional',
            multi_signal_risk: 'Múltiplos sinais de risco',
            combined_signals: 'Sinais combinados',
            synthetic_identity: 'Identidade sintética',
            device_fingerprint: 'Fingerprint de dispositivo',
            geo_anomaly: 'Anomalia geográfica',
        },
        users: {
            title: 'Usuários',
            subtitle: 'Gerencie usuários e permissões da sua equipe',
            createUser: 'Criar Usuário',
            createDescription: 'Crie um usuário e defina a senha de acesso',
            inviteUser: 'Convidar Usuário',
            inviteDescription: 'Envie um convite por email para adicionar um novo membro à equipe',
            sendInvite: 'Enviar Convite',
            email: 'Email',
            password: 'Senha',
            role: 'Função',
            roles: {
                superAdmin: 'Super Admin',
                admin: 'Administrador',
                member: 'Membro',
            },
            stats: {
                total: 'Total de Usuários',
                active: 'Usuários Ativos',
                admins: 'Administradores',
                pending: 'Convites Pendentes',
            },
            pendingInvites: 'Convites Pendentes',
            invitedOn: 'Convidado em',
            expiresOn: 'Expira em',
            searchPlaceholder: 'Buscar usuários...',
            filterByRole: 'Filtrar por função',
            allRoles: 'Todas as funções',
            user: 'Usuário',
            status: 'Status',
            lastLogin: 'Último acesso',
            neverLoggedIn: 'Nunca acessou',
            actions: 'Ações',
            active: 'Ativo',
            inactive: 'Inativo',
            editUser: 'Editar Usuário',
            name: 'Nome',
        },
        profile: {
            title: 'Meu Perfil',
            subtitle: 'Gerencie suas informações pessoais e segurança',
            personalInfo: 'Informações Pessoais',
            personalInfoDescription: 'Atualize seu nome e email',
            name: 'Nome',
            email: 'Email',
            password: 'Senha',
            passwordDescription: 'Atualize sua senha de acesso',
            changePassword: 'Alterar Senha',
            changePasswordDescription: 'Escolha uma senha forte com pelo menos 8 caracteres',
            currentPassword: 'Senha Atual',
            newPassword: 'Nova Senha',
            confirmPassword: 'Confirmar Senha',
            passwordsDoNotMatch: 'As senhas não coincidem',
            updatePassword: 'Atualizar Senha',
            twoFactor: 'Autenticação de Dois Fatores',
            twoFactorDescription: 'Adicione uma camada extra de segurança à sua conta',
            authenticatorApp: 'Aplicativo Autenticador',
            twoFactorEnabled: 'Ativado e funcionando',
            twoFactorDisabled: 'Não configurado',
            enable: 'Ativar',
            disable: 'Desativar',
            setup2FA: 'Configurar 2FA',
            setup2FADescription: 'Escaneie o QR code com seu aplicativo autenticador',
            secretKey: 'Chave Secreta',
            verificationCode: 'Código de Verificação',
            verify: 'Verificar',
            dangerZone: 'Zona de Perigo',
            deleteAccount: 'Excluir Conta',
            deleteAccountDescription: 'Esta ação é irreversível e excluirá todos os seus dados',
        },
        errors: {
            networkTitle: 'Erro de Conexão',
            networkDescription: 'Não foi possível conectar ao servidor. Verifique sua internet.',
            serverTitle: 'Erro do Servidor',
            serverDescription: 'Ocorreu um erro interno. Tente novamente em alguns minutos.',
            notFoundTitle: 'Não Encontrado',
            notFoundDescription: 'O recurso que você procura não existe ou foi movido.',
            genericTitle: 'Algo deu errado',
            genericDescription: 'Ocorreu um erro inesperado. Tente novamente.',
            retry: 'Tentar Novamente',
        },
        commandPalette: {
            search: 'Buscar',
            placeholder: 'Digite para buscar...',
            noResults: 'Nenhum resultado encontrado',
            navigation: 'Navegação',
            settings: 'Configurações',
            navigate: 'Navegar',
            select: 'Selecionar',
            close: 'Fechar',
        },
        rules: {
            title: 'Motor de Regras',
            subtitle: 'Crie e gerencie regras de risco personalizadas',
            createRule: 'Criar Regra',
            name: 'Nome',
            description: 'Descrição',
            priority: 'Prioridade',
            conditions: 'Condições',
            actions: 'Ações',
            enabled: 'Ativo',
            simulate: 'Simular',
            abTesting: 'Teste A/B',
            newRule: 'Nova Regra',
            newRuleDescription: 'Defina condições e ações para sua regra',
            active: 'Ativo',
            disabled: 'Desativado',
            editRule: 'Editar Regra',
            duplicate: 'Duplicar',
            delete: 'Excluir',
            condition: 'condição',
            triggered: 'Disparado',
            last: 'Último',
            addCondition: 'Adicionar Condição',
            trafficPercentage: '% do tráfego',
            allRules: 'Todas',
            activeRules: 'Ativas',
            withAbTest: 'Teste A/B',
            simulationResults: 'Resultados da Simulação',
            impactedDecisions: 'Decisões Impactadas',
            noRulesFound: 'Nenhuma regra encontrada',
            totalRules: 'Total de Regras',
            abTests: 'Testes A/B',
            totalTriggered: 'Total Disparado',
            simulateFirst: 'Simular Primeiro',
            basedOnLast24h: 'Baseado nas últimas 24 horas de decisões',
            totalDecisionsAnalyzed: 'Total de Decisões Analisadas',
            wouldTrigger: 'Seria Disparado',
            ofDecisions: 'das decisões',
            impactBreakdown: 'Detalhamento do Impacto',
            estimatedImpact: 'Impacto Estimado nas Métricas',
            falsePositives: 'Falsos Positivos',
            falseNegatives: 'Falsos Negativos',
        },
        monitoring: {
            title: 'Monitoramento em Tempo Real',
            subtitle: 'Acompanhe a saúde e performance do sistema',
            systemHealth: 'Saúde do Sistema',
            healthy: 'Saudável',
            degraded: 'Degradado',
            critical: 'Crítico',
            latency: 'Latência',
            throughput: 'Throughput',
            errorRate: 'Taxa de Erro',
            components: 'Componentes',
            uptime: 'Uptime',
            autoRefresh: 'Atualização Automática',
            connected: 'Conectado',
            disconnected: 'Desconectado',
            avgLatency: 'Latência Média',
            p50: 'P50',
            p95: 'P95',
            p99: 'P99',
            requestsPerMinute: 'Requisições/min',
            decisionsDistribution: 'Distribuição de Decisões',
            last30min: '30 min atrás',
            now: 'Agora',
            activeAlerts: 'Alertas Ativos',
            dismiss: 'Dispensar',
            componentHealth: 'Saúde dos Componentes',
            decisionDistribution: 'Distribuição de Decisões',
            lastMinute: 'Último Minuto',
            lastUpdate: 'Última atualização',
            avgProcessing: 'Processamento médio',
            p95Processing: 'P95 processamento',
            componentsDesc: 'Visão geral da saúde dos serviços',
            alerts: 'Alertas',
            alertsDesc: 'Alertas recentes do sistema',
            noAlerts: 'Nenhum alerta no momento',
            status: 'Status',
            current: 'Atual',
        },
        learning: {
            title: 'Aprendizado & Feedback',
            subtitle:
                'Registre feedback, acompanhe drift e consulte recomendações do backend atual',
            sectionLabel: 'Aprendizado',
            feedback: 'Feedback',
            falsePositive: 'Falso Positivo',
            confirmedFraud: 'Fraude Confirmada',
            drift: 'Drift de Features',
            recommendations: 'Recomendações',
            retraining: 'Retreinamento',
            recentFeedback: 'Feedback Recente',
            featureDrift: 'Drift de Features',
            retrainingHistory: 'Histórico de Retreinamento',
            applied: 'Aplicado',
            pending: 'Pendente',
            original: 'Original',
            shouldBe: 'Deveria ser',
            submitFeedback: 'Enviar Feedback',
            addFeedback: 'Adicionar Feedback',
            selectDecision: 'Selecionar Decisão',
            selectType: 'Selecionar Tipo',
            incorrectScore: 'Score Incorreto',
            notesOptional: 'Notas (opcional)',
            submit: 'Enviar',
            applyRecommendation: 'Aplicar',
            dismissRecommendation: 'Dispensar',
            confidence: 'Confiança',
            expectedImpact: 'Impacto Esperado',
            currentValue: 'Valor Atual',
            suggestedValue: 'Valor Sugerido',
            triggerRetraining: 'Iniciar Retreinamento',
            feedbackCount: 'Feedbacks',
            completed: 'Concluído',
            running: 'Em Execução',
            failed: 'Falhou',
            metricsImprovement: 'Melhoria de Métricas',
            accuracy: 'Acurácia',
            noFeedback: 'Nenhum feedback ainda',
            dismiss: 'Dispensar',
            apply: 'Aplicar',
            baselineRecalculation: 'Recalculação de Baseline',
            feedbackItems: 'itens de feedback',
            falsePositives: 'Falsos Positivos',
            confirmedFrauds: 'Fraudes Confirmadas',
            pendingApply: 'Aguardando Incorporação',
            criticalDrifts: 'Drifts Críticos',
            featureDriftAnalysis: 'Análise de Drift de Features',
            comparingDistributions:
                'Comparando distribuições atuais com baselines (últimos 7 dias)',
            noRecommendations: 'Nenhuma recomendação no momento',
            baselineRecalcHistory: 'Histórico de Recalculação de Baseline',
            automaticRecalculations:
                'O backend atual ainda não executa recalibrações automáticas com histórico persistido',
            feedbackDialogDescription:
                'Reportar falso positivo ou confirmar fraude para melhorar a precisão do modelo',
            decisionId: 'ID da Decisão',
            feedbackType: 'Tipo de Feedback',
            correctDecision: 'Decisão correta',
            apiIntegration: 'Integração via API',
            shouldBeAllowed: 'deveria ser permitido',
            shouldBeBlocked: 'deveria ser bloqueado',
        },
        investigation: {
            title: 'Investigação de Casos',
            subtitle: 'Análise profunda de casos suspeitos',
            timeline: 'Linha do Tempo',
            connections: 'Conexões',
            similarCases: 'Casos Similares',
            notes: 'Notas',
            resolve: 'Resolver',
            searchPlaceholder: 'Buscar por hash ou ID de caso...',
            caseDetails: 'Detalhes do Caso',
            riskScore: 'Score de Risco',
            status: 'Status',
            assignedTo: 'Atribuído a',
            createdAt: 'Criado em',
            validationScore: 'Validação',
            historyScore: 'Histórico',
            patternScore: 'Padrão',
            graphScore: 'Grafo',
            occurrences: 'Ocorrências',
            context: 'Contexto',
            device: 'Dispositivo',
            country: 'País',
            vpn: 'VPN',
            tor: 'Tor',
            linkedIdentities: 'Identidades Vinculadas',
            similarity: 'Similaridade',
            addNote: 'Adicionar Nota',
            writeNote: 'Escreva uma nota...',
            markResolved: 'Marcar como Resolvido',
            noCase: 'Busque um caso para investigar',
            history: 'Histórico',
            risk: 'risco',
            priority: 'Prioridade',
            firstSeen: 'Primeira vez',
            lastSeen: 'Última vez',
            accounts: 'contas',
            falsePositive: 'Falso Positivo',
            confirmedFraud: 'Fraude Confirmada',
            escalate: 'Escalar',
            needsMoreInfo: 'Precisa de Mais Info',
            completeHistory: 'Histórico Completo',
            connectedIdentities: 'Identidades Conectadas',
            connectedIdentitiesDesc: 'Outros valores vinculados a esta identidade no grafo',
            similarCasesDesc: 'Casos com padrões e características similares',
            analystNotes: 'Notas do Analista',
            changeCase: 'Trocar Caso',
            findCase: 'Buscar Caso',
            searchCaseDesc: 'Busque por hash, tipo ou ID',
            noCases: 'Nenhum caso disponível',
            noResults: 'Nenhum caso encontrado',
            occurrencesCount: 'ocorrências',
            loading: 'Carregando casos...',
            reviewed: 'Revisado',
            cases: 'Casos',
        },
        reports: {
            title: 'Relatórios & Compliance',
            subtitle: 'Gere e agende relatórios',
            scheduled: 'Agendados',
            compliance: 'Compliance',
            generate: 'Gerar Agora',
            history: 'Histórico',
            createReport: 'Criar Relatório',
            reportName: 'Nome do Relatório',
            type: 'Tipo',
            format: 'Formato',
            recipients: 'Destinatários (separados por vírgula)',
            daily: 'Diário',
            weekly: 'Semanal',
            monthly: 'Mensal',
            custom: 'Personalizado',
            lastGenerated: 'Última geração',
            nextScheduled: 'Próxima geração',
            generationHistory: 'Histórico de Geração',
            generatedAt: 'Gerado em',
            size: 'Tamanho',
            download: 'Baixar',
            generateNow: 'Gerar Agora',
            noReportsFound: 'Nenhum relatório encontrado',
            createNewReport: 'Criar Novo Relatório',
            configureReport: 'Configure um novo relatório sob demanda ou agendado',
            customOnDemand: 'Personalizado/Sob Demanda',
            totalReports: 'Total de Relatórios',
            complianceReports: 'Relatórios de Compliance',
            activeSchedules: 'Agendamentos Ativos',
            reports: 'Relatórios',
            recentGenerations: 'Gerações Recentes',
            report: 'Relatório',
            status: 'Status',
        },
        alerting: {
            title: 'Sistema de Alertas',
            subtitle: 'Configure alertas e notificações',
            rules: 'Regras',
            events: 'Eventos',
            mute: 'Silenciar',
            unmute: 'Reativar',
            acknowledge: 'Reconhecer',
            createAlertRule: 'Criar Regra de Alerta',
            configureAlertRule: 'Configure uma nova regra para monitorar o sistema',
            ruleName: 'Nome da Regra',
            description: 'Descrição',
            metric: 'Métrica',
            operator: 'Operador',
            threshold: 'Limite',
            timeWindow: 'Janela de Tempo',
            severity: 'Severidade',
            channels: 'Canais',
            escalation: 'Escalação',
            warning: 'Aviso',
            info: 'Informação',
            muted: 'Silenciado',
            activeAlerts: 'Alertas Ativos',
            totalRules: 'Total de Regras',
            criticalRules: 'Regras Críticas',
            mutedRules: 'Regras Silenciadas',
            muteAlert: 'Silenciar Alerta',
            muteFor: 'Por quanto tempo silenciar?',
            minutes: 'minutos',
            hours: 'horas',
            triggeredAt: 'Disparado em',
            resolvedAt: 'Resolvido em',
            resolved: 'Resolvido',
            acknowledged: 'Reconhecido',
            eventHistory: 'Histórico de Eventos',
            alertRules: 'Regras de Alerta',
            alertEvents: 'Eventos de Alerta',
            rule: 'Regra',
            message: 'Mensagem',
            triggered: 'Disparado',
            createAlert: 'Criar Alerta',
            createRule: 'Criar Regra',
        },
        accounts: {
            title: 'Gestão de Contas',
            subtitle: 'Gerencie contas de clientes',
            active: 'Ativa',
            suspended: 'Suspensa',
            trial: 'Trial',
            churned: 'Churned',
            metrics: 'Métricas',
            billing: 'Faturamento',
            createAccount: 'Criar Conta',
            totalAccounts: 'Total de Contas',
            monthlyMRR: 'MRR Mensal',
            totalRequestsMonth: 'Requisições/mês',
            searchAccounts: 'Buscar contas...',
            allStatus: 'Todos os Status',
            allPlans: 'Todos os Planos',
            plan: 'Plano',
            free: 'Gratuito',
            starter: 'Starter',
            professional: 'Profissional',
            enterprise: 'Enterprise',
            requestsMonth: 'Requisições/mês',
            fraudsBlocked: 'Fraudes Bloqueadas',
            users: 'Usuários',
            apiKeys: 'API Keys',
            industry: 'Indústria',
            usage: 'Uso',
            monthlyLimit: 'Limite Mensal',
            currentPlan: 'Plano Atual',
            monthlyCost: 'Custo Mensal',
            billingPeriodEnds: 'Período de Faturamento Termina',
            suspendAccount: 'Suspender Conta',
            reactivateAccount: 'Reativar Conta',
            noAccountsFound: 'Nenhuma conta encontrada',
            tryAdjusting: 'Tente ajustar sua busca ou filtros',
            settings: 'Configurações',
            webhookNotifications: 'Notificações Webhook',
            mfaRequired: 'MFA Obrigatório',
            ipWhitelist: 'Lista de IPs Permitidos',
            noIpRestrictions: 'Sem restrições de IP configuradas',
            viewAllUsers: 'Ver Todos os Usuários',
        },
    },
    en: {
        nav: {
            overview: 'Overview',
            reviewQueue: 'Review Queue',
            decisions: 'Decisions',
            graphExplorer: 'Graph Explorer',
            analytics: 'Analytics',
            settings: 'Settings',
            apiKeys: 'API Keys',
            auditLogs: 'Audit Logs',
            users: 'Users',
            profile: 'Profile',
            logout: 'Logout',
            rulesEngine: 'Rules Engine',
            monitoring: 'Monitoring',
            learning: 'Learning',
            investigation: 'Investigation',
            reports: 'Reports',
            alerting: 'Alerting',
            accounts: 'Accounts',
            webhooks: 'Webhooks',
        },
        header: {
            title: 'Scora Panel',
            searchPlaceholder: 'Search decisions, clusters...',
            notifications: 'Notifications',
            profile: 'Profile',
            member: 'Member',
        },
        overview: {
            title: 'Overview',
            subtitle: 'Real-time risk decision monitoring',
            heroTitle: 'Executive Summary',
            heroAnalyzed: 'Scora analyzed',
            heroBlocked: 'blocked',
            heroReview: 'sent to review',
            noDecisionsToday: 'No decisions recorded today',
            pendingReviewLabel: 'Pending in review',
            autoDecisions: 'Automated decisions',
            humanReview: 'Human review',
            impactLabel: 'Estimated impact',
            streamActive: 'Stream active',
            lastUpdated: 'Last updated',
            investigate: 'Investigate',
            decisionsToday: 'Decisions Today',
            pendingReviews: 'Pending Reviews',
            blockedToday: 'Blocked Today',
            avgLatency: 'Avg Latency',
            decisionsPerHour: 'Decisions per Hour',
            riskDistribution: 'Risk Distribution',
            activeAlerts: 'Active Alerts',
            recentDecisions: 'Recent Decisions',
            viewAll: 'View All',
            decisionDetails: 'Decision Details',
            low: 'Low',
            medium: 'Medium',
            high: 'High',
            critical: 'Critical',
            allow: 'Allowed',
            review: 'Review',
            block: 'Blocked',
        },
        reviewQueue: {
            title: 'Review Queue',
            subtitle: 'Cases awaiting manual analysis',
            pending: 'Pending',
            myAssigned: 'My Cases',
            resolvedToday: 'Resolved Today',
            filters: 'Filters',
            sortBy: 'Sort by',
            priority: 'Priority',
            score: 'Score',
            time: 'Time',
            type: 'Type',
            reasons: 'Reasons',
            graphInfo: 'Graph Info',
            history: 'History',
            recommendationTitle: 'Recommendation',
            recommendationAction: 'Suggested',
            recommendationConfidence: 'Confidence',
            whyInReview: 'Why is this in review?',
            topDrivers: 'Top drivers',
            thresholdsLabel: 'Thresholds',
            decisionFloor: 'Forced decision',
            viewHistory: 'View full history',
            confidenceHigh: 'High',
            confidenceMedium: 'Medium',
            confidenceLow: 'Low',
            actions: {
                approve: 'Approve',
                block: 'Block',
                requestDocs: 'Request Docs',
                escalate: 'Escalate',
                assign: 'Assign',
            },
            noResults: 'No pending cases',
            loading: 'Loading cases...',
            scoreLabel: 'Score',
            clusterLabel: 'Cluster',
            riskPropagation: 'Risk Propagation',
            totalSeen: 'Total seen',
            distinctAccounts: 'Distinct accounts',
            recent24h: 'Last 24h',
            validRate: 'Valid rate',
            scoringBreakdown: 'Scoring Breakdown',
            scoreLabels: {
                validation: 'Validation',
                history: 'History',
                velocity: 'Velocity',
                context: 'Context',
                pattern: 'Pattern',
                graph: 'Graph',
                rules: 'Rules',
                final: 'Final',
            },
            typeAll: 'All Types',
            typeCpf: 'CPF',
            typeCnpj: 'CNPJ',
            typeEmail: 'Email',
            typePhone: 'Phone',
            typeIp: 'IP',
            revealValue: 'Reveal value',
            hideValue: 'Hide value',
            revealUnavailable: 'Value unavailable to reveal',
        },
        graph: {
            title: 'Graph Explorer',
            subtitle: 'Visualize connections between identities',
            searchPlaceholder: 'Search by hash or cluster ID...',
            howTo: 'How to use: choose a recent cluster and click a node to highlight connections. Right-click a node to see full details. Labels are anonymized.',
            recentClusters: 'Recent clusters',
            idLabel: 'ID',
            clusterInfo: 'Cluster Information',
            clusterSize: 'Size',
            nodesLabel: 'nodes',
            totalRisk: 'Total Risk',
            sharedIdentities: 'Shared Identities',
            firstConnection: 'First Connection',
            lastActivity: 'Last Activity',
            nodeDetails: 'Node Details',
            connections: 'Connections',
            riskScore: 'Risk Score',
            occurrencesLabel: 'occurrences',
            emptyState: 'Select a cluster or search for an identity',
            legendTitle: 'Legend',
            legendConnection: 'Connections show observed relationships between identities',
            legendNodeSize: 'Node size = volume of occurrences',
            legendNodeColor: 'Color = data type (CPF, email, IP, etc.)',
            legendFallback: 'No real graph? We show a recent cohort cluster',
            connectedNodes: 'Connected nodes',
            noCluster: 'Select a cluster or search for an identity',
            viewAll: 'View all clusters',
            allClusters: 'All Clusters',
        },
        analytics: {
            title: 'Analytics',
            subtitle: 'Model metrics and performance',
            period: 'Period',
            last7days: 'Last 7 days',
            last30days: 'Last 30 days',
            last90days: 'Last 90 days',
            modelEfficacy: 'Model Efficacy',
            falsePositives: 'False Positives',
            fraudsDetected: 'Frauds Detected',
            avgReviewTime: 'Avg Review Time',
            avgLatency: 'Avg Latency',
            topPatterns: 'Top Patterns Detected',
            scoreDistribution: 'Score Distribution',
            decisionsByType: 'Decisions by Data Type',
            trendsOverTime: 'Trends Over Time',
            exportReport: 'Export Report',
            exportPDF: 'Export PDF',
            exportCSV: 'Export CSV',
            exportJSON: 'Export JSON',
            vsPeriod: 'vs last period',
        },
        settings: {
            title: 'Settings',
            subtitle: 'Adjust thresholds, weights, and webhooks',
            thresholds: {
                title: 'Decision Thresholds',
                description: 'Set the limits for each decision type',
                reviewStart: 'Review Start',
                reviewEnd: 'Review End',
                restoreDefault: 'Restore Default',
                saveChanges: 'Save Changes',
            },
            weights: {
                title: 'Layer Weights',
                description: 'Adjust the importance of each analysis layer',
                validation: 'Syntactic Validation',
                history: 'History',
                pattern: 'Pattern Detection',
                graph: 'Identity Graph',
                autoAdjusted: 'Weights automatically adjusted by the learning system',
            },
            webhooks: {
                title: 'Webhooks',
                description: 'Configure notifications for risk events',
                addWebhook: 'Add Webhook',
                url: 'URL',
                events: 'Events',
                active: 'Active',
                edit: 'Edit',
                delete: 'Delete',
                noWebhooks: 'No webhooks configured',
            },
            security: {
                title: 'Security',
                description: 'Data storage mode and retention policy',
                mode: 'Security Mode',
                zeroKnowledge: 'Zero-Knowledge',
                zeroKnowledgeDesc:
                    'No values are stored. Only hashes and non-identifying metadata. The system learns patterns without ever knowing the real data. LGPD/GDPR compliant by default.',
                zeroKnowledgeWarning:
                    "The 'Reveal value' button will not be available in this mode.",
                encrypted: 'Encrypted (AES-256-GCM)',
                encryptedDesc:
                    'Values stored with AES-256-GCM encryption. Authorized administrators can recover the original value when needed. All access is recorded in the audit log.',
                encryptedWarning: "Required to use the 'Reveal value' button on decisions.",
                recommended: 'Recommended',
                compliance: 'Compliance',
                retentionDays: 'Retention Days',
                saveSuccess: 'Settings saved successfully.',
                saveError: 'Failed to save settings. Please try again.',
            },
        },
        apiKeys: {
            title: 'API Keys',
            subtitle: 'Manage your API keys',
            createNew: 'New API Key',
            createDescription: 'Create a new API key for your application',
            createdTitle: 'API Key created successfully!',
            createdHelp: "Copy your key now. You won't be able to see it again.",
            done: 'Done',
            name: 'Name',
            prefix: 'Prefix',
            usage: 'Monthly Usage',
            status: 'Status',
            actions: 'Actions',
            active: 'Active',
            expired: 'Expired',
            revoked: 'Revoked',
            usageWarning: "You're approaching the limit",
            copyKey: 'Copy Key',
            revokeKey: 'Revoke',
            deleteKey: 'Delete',
            confirmRevoke: 'Are you sure you want to revoke this key?',
            confirmDelete: 'Are you sure you want to delete this key?',
            totalKeys: 'Total Keys',
            activeKeys: 'Active Keys',
            totalUsage: 'Total Usage',
            yourKeys: 'Your API Keys',
            yourKeysDesc:
                'View and manage your API keys. Keep them secure and never share them publicly.',
            lastUsed: 'Last Used',
            namePlaceholder: 'Production API Key',
        },
        auditLogs: {
            title: 'Audit Logs',
            subtitle: 'Complete operation history',
            exportCsv: 'Export CSV',
            filters: 'Filters',
            timestamp: 'Timestamp',
            action: 'Action',
            actor: 'Actor',
            details: 'Details',
            ipAddress: 'IP',
            loadMore: 'Load more',
            noLogs: 'No logs found',
        },
        common: {
            save: 'Save',
            cancel: 'Cancel',
            confirm: 'Confirm',
            delete: 'Delete',
            edit: 'Edit',
            create: 'Create',
            search: 'Search',
            filter: 'Filter',
            refresh: 'Refresh',
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
            warning: 'Warning',
            info: 'Info',
            unavailable: 'Unavailable',
            noData: 'No data',
            noActiveAlerts: 'No active alerts',
            ago: 'ago',
            minutes: 'minutes',
            hours: 'hours',
            days: 'days',
            minutesShort: 'min',
            hoursShort: 'h',
            daysShort: 'd',
            now: 'now',
            today: 'Today',
            yesterday: 'Yesterday',
            thisWeek: 'this week',
            ofTotal: 'of total',
            score: 'Score',
            patterns: 'patterns',
            patternsLabel: 'Patterns',
            typeLabel: 'Type',
            decisionLabel: 'Decision',
            decisionIdLabel: 'Decision ID',
            riskLabel: 'Risk',
            valueHashLabel: 'Item Ref',
            reasonsLabel: 'Reasons',
            createdAtLabel: 'Created at',
            decisionsLabel: 'decisions',
            p95: 'P95',
            collapse: 'Collapse',
            all: 'All',
            active: 'Active',
            actions: 'Actions',
            viewAll: 'View more',
        },
        decisions: {
            allow: 'Allow',
            review: 'Review',
            block: 'Block',
        },
        decisionsPage: {
            title: 'Decisions',
            subtitle: 'Complete decision history',
            decisionFilter: 'Decision',
            noResults: 'No decisions found',
            loadMore: 'Load more',
        },
        risk: {
            low: 'Low',
            medium: 'Medium',
            high: 'High',
            critical: 'Critical',
        },
        patterns: {
            high_invalid_rate: 'High invalid rate',
            high_risk_history: 'High risk history',
            critical_history: 'Critical history',
            cross_account_reuse: 'Cross-account reuse',
            burst_24h: 'Burst in last 24h',
            burst_usage: 'Burst usage',
            velocity_spike: 'Velocity spike',
            velocity_burst: 'Velocity burst',
            abnormal_velocity: 'Abnormal velocity',
            bot_like_speed: 'Bot-like speed',
            high_speed: 'High speed',
            automated_pattern: 'Automated pattern',
            high_volume: 'High volume',
            suspicious_velocity_pattern: 'Suspicious velocity pattern',
            suspicious_day: 'Suspicious daily activity',
            suspicious_hour: 'Suspicious hourly activity',
            suspicious_minute: 'Suspicious minute activity',
            vpn_detected: 'VPN detected',
            tor_detected: 'Tor detected',
            datacenter_ip: 'Datacenter IP',
            impossible_travel: 'Impossible travel',
            device_change: 'Device change',
            dfp_emulator: 'Emulator detected',
            dfp_rooted: 'Rooted device',
            dfp_jailbroken: 'Jailbroken device',
            dfp_automation: 'Device automation',
            dfp_unstable_device: 'Unstable device',
            high_risk_ip: 'High-risk IP',
            suspicious_cluster: 'Suspicious cluster',
            fraudulent_connections: 'Fraudulent connections',
            high_suspicious_connections: 'High suspicious connections',
            high_identity_sharing: 'High identity sharing',
            identity_cluster: 'Identity cluster',
            format_tampering: 'Format tampering',
            test_data: 'Test data',
            low_entropy: 'Low entropy',
            high_entropy: 'High entropy',
            repeated_pattern: 'Repeated pattern',
            regional_inconsistency: 'Regional inconsistency',
            multi_signal_risk: 'Multi-signal risk',
            combined_signals: 'Combined signals',
            synthetic_identity: 'Synthetic identity',
            device_fingerprint: 'Device fingerprint',
            geo_anomaly: 'Geo anomaly',
        },
        users: {
            title: 'Users',
            subtitle: 'Manage your team users and permissions',
            createUser: 'Create User',
            createDescription: 'Create a user and set an access password',
            inviteUser: 'Invite User',
            inviteDescription: 'Send an email invite to add a new team member',
            sendInvite: 'Send Invite',
            email: 'Email',
            password: 'Password',
            role: 'Role',
            roles: {
                superAdmin: 'Super Admin',
                admin: 'Administrator',
                member: 'Member',
            },
            stats: {
                total: 'Total Users',
                active: 'Active Users',
                admins: 'Administrators',
                pending: 'Pending Invites',
            },
            pendingInvites: 'Pending Invites',
            invitedOn: 'Invited on',
            expiresOn: 'Expires on',
            searchPlaceholder: 'Search users...',
            filterByRole: 'Filter by role',
            allRoles: 'All roles',
            user: 'User',
            status: 'Status',
            lastLogin: 'Last login',
            neverLoggedIn: 'Never logged in',
            actions: 'Actions',
            active: 'Active',
            inactive: 'Inactive',
            editUser: 'Edit User',
            name: 'Name',
        },
        profile: {
            title: 'My Profile',
            subtitle: 'Manage your personal information and security',
            personalInfo: 'Personal Information',
            personalInfoDescription: 'Update your name and email',
            name: 'Name',
            email: 'Email',
            password: 'Password',
            passwordDescription: 'Update your access password',
            changePassword: 'Change Password',
            changePasswordDescription: 'Choose a strong password with at least 8 characters',
            currentPassword: 'Current Password',
            newPassword: 'New Password',
            confirmPassword: 'Confirm Password',
            passwordsDoNotMatch: 'Passwords do not match',
            updatePassword: 'Update Password',
            twoFactor: 'Two-Factor Authentication',
            twoFactorDescription: 'Add an extra layer of security to your account',
            authenticatorApp: 'Authenticator App',
            twoFactorEnabled: 'Enabled and working',
            twoFactorDisabled: 'Not configured',
            enable: 'Enable',
            disable: 'Disable',
            setup2FA: 'Setup 2FA',
            setup2FADescription: 'Scan the QR code with your authenticator app',
            secretKey: 'Secret Key',
            verificationCode: 'Verification Code',
            verify: 'Verify',
            dangerZone: 'Danger Zone',
            deleteAccount: 'Delete Account',
            deleteAccountDescription: 'This action is irreversible and will delete all your data',
        },
        errors: {
            networkTitle: 'Connection Error',
            networkDescription: 'Could not connect to the server. Check your internet connection.',
            serverTitle: 'Server Error',
            serverDescription: 'An internal error occurred. Please try again in a few minutes.',
            notFoundTitle: 'Not Found',
            notFoundDescription: "The resource you're looking for doesn't exist or has been moved.",
            genericTitle: 'Something went wrong',
            genericDescription: 'An unexpected error occurred. Please try again.',
            retry: 'Try Again',
        },
        commandPalette: {
            search: 'Search',
            placeholder: 'Type to search...',
            noResults: 'No results found',
            navigation: 'Navigation',
            settings: 'Settings',
            navigate: 'Navigate',
            select: 'Select',
            close: 'Close',
        },
        rules: {
            title: 'Rules Engine',
            subtitle: 'Create and manage custom risk rules',
            createRule: 'Create Rule',
            name: 'Name',
            description: 'Description',
            priority: 'Priority',
            conditions: 'Conditions',
            actions: 'Actions',
            enabled: 'Enabled',
            simulate: 'Simulate',
            abTesting: 'A/B Testing',
            newRule: 'New Rule',
            newRuleDescription: 'Define conditions and actions for your rule',
            active: 'Active',
            disabled: 'Disabled',
            editRule: 'Edit Rule',
            duplicate: 'Duplicate',
            delete: 'Delete',
            condition: 'condition',
            triggered: 'Triggered',
            last: 'Last',
            addCondition: 'Add Condition',
            trafficPercentage: '% of traffic',
            allRules: 'All',
            activeRules: 'Active',
            withAbTest: 'With A/B Test',
            simulationResults: 'Simulation Results',
            impactedDecisions: 'Impacted Decisions',
            noRulesFound: 'No rules found',
            totalRules: 'Total Rules',
            abTests: 'A/B Tests',
            totalTriggered: 'Total Triggered',
            simulateFirst: 'Simulate First',
            basedOnLast24h: 'Based on the last 24 hours of decisions',
            totalDecisionsAnalyzed: 'Total Decisions Analyzed',
            wouldTrigger: 'Would Trigger',
            ofDecisions: 'of decisions',
            impactBreakdown: 'Impact Breakdown',
            estimatedImpact: 'Estimated Impact on Metrics',
            falsePositives: 'False Positives',
            falseNegatives: 'False Negatives',
        },
        monitoring: {
            title: 'Real-time Monitoring',
            subtitle: 'Track system health and performance',
            systemHealth: 'System Health',
            healthy: 'Healthy',
            degraded: 'Degraded',
            critical: 'Critical',
            latency: 'Latency',
            throughput: 'Throughput',
            errorRate: 'Error Rate',
            components: 'Components',
            uptime: 'Uptime',
            autoRefresh: 'Auto Refresh',
            connected: 'Connected',
            disconnected: 'Disconnected',
            avgLatency: 'Avg Latency',
            p50: 'P50',
            p95: 'P95',
            p99: 'P99',
            requestsPerMinute: 'Requests/min',
            decisionsDistribution: 'Decisions Distribution',
            last30min: '30 min ago',
            now: 'Now',
            activeAlerts: 'Active Alerts',
            dismiss: 'Dismiss',
            componentHealth: 'Component Health',
            decisionDistribution: 'Decision Distribution',
            lastMinute: 'Last Minute',
            lastUpdate: 'Last update',
            avgProcessing: 'Avg processing',
            p95Processing: 'P95 processing',
            componentsDesc: 'Service health overview',
            alerts: 'Alerts',
            alertsDesc: 'Recent system alerts',
            noAlerts: 'No alerts at the moment',
            status: 'Status',
            current: 'Current',
        },
        learning: {
            title: 'Learning & Feedback',
            subtitle:
                'Record feedback, monitor drift, and review recommendations from the current backend',
            sectionLabel: 'Learning',
            feedback: 'Feedback',
            falsePositive: 'False Positive',
            confirmedFraud: 'Confirmed Fraud',
            drift: 'Feature Drift',
            recommendations: 'Recommendations',
            retraining: 'Retraining',
            recentFeedback: 'Recent Feedback',
            featureDrift: 'Feature Drift',
            retrainingHistory: 'Retraining History',
            applied: 'Applied',
            pending: 'Pending',
            original: 'Original',
            shouldBe: 'Should be',
            submitFeedback: 'Submit Feedback',
            addFeedback: 'Add Feedback',
            selectDecision: 'Select Decision',
            selectType: 'Select Type',
            incorrectScore: 'Incorrect Score',
            notesOptional: 'Notes (optional)',
            submit: 'Submit',
            applyRecommendation: 'Apply',
            dismissRecommendation: 'Dismiss',
            confidence: 'Confidence',
            expectedImpact: 'Expected Impact',
            currentValue: 'Current Value',
            suggestedValue: 'Suggested Value',
            triggerRetraining: 'Trigger Retraining',
            feedbackCount: 'Feedback',
            completed: 'Completed',
            running: 'Running',
            failed: 'Failed',
            metricsImprovement: 'Metrics Improvement',
            accuracy: 'Accuracy',
            noFeedback: 'No feedback yet',
            dismiss: 'Dismiss',
            apply: 'Apply',
            baselineRecalculation: 'Baseline Recalculation',
            feedbackItems: 'feedback items',
            falsePositives: 'False Positives',
            confirmedFrauds: 'Confirmed Frauds',
            pendingApply: 'Awaiting Incorporation',
            criticalDrifts: 'Critical Drifts',
            featureDriftAnalysis: 'Feature Drift Analysis',
            comparingDistributions:
                'Comparing current feature distributions against baselines (last 7 days)',
            noRecommendations: 'No recommendations at this time',
            baselineRecalcHistory: 'Baseline Recalculation History',
            automaticRecalculations:
                'The current backend does not yet run automatic recalibrations with persisted history',
            feedbackDialogDescription:
                'Report a false positive or confirm a fraud to improve model accuracy',
            decisionId: 'Decision ID',
            feedbackType: 'Feedback Type',
            correctDecision: 'Correct Decision',
            apiIntegration: 'API Integration',
            shouldBeAllowed: 'should be allowed',
            shouldBeBlocked: 'should be blocked',
        },
        investigation: {
            title: 'Case Investigation',
            subtitle: 'Deep analysis of suspicious cases',
            timeline: 'Timeline',
            connections: 'Connections',
            similarCases: 'Similar Cases',
            notes: 'Notes',
            resolve: 'Resolve',
            searchPlaceholder: 'Search by hash or case ID...',
            caseDetails: 'Case Details',
            riskScore: 'Risk Score',
            status: 'Status',
            assignedTo: 'Assigned to',
            createdAt: 'Created at',
            validationScore: 'Validation',
            historyScore: 'History',
            patternScore: 'Pattern',
            graphScore: 'Graph',
            occurrences: 'Occurrences',
            context: 'Context',
            device: 'Device',
            country: 'Country',
            vpn: 'VPN',
            tor: 'Tor',
            linkedIdentities: 'Linked Identities',
            similarity: 'Similarity',
            addNote: 'Add Note',
            writeNote: 'Write a note...',
            markResolved: 'Mark as Resolved',
            noCase: 'Search for a case to investigate',
            history: 'History',
            risk: 'risk',
            priority: 'Priority',
            firstSeen: 'First seen',
            lastSeen: 'Last seen',
            accounts: 'accounts',
            falsePositive: 'False Positive',
            confirmedFraud: 'Confirmed Fraud',
            escalate: 'Escalate',
            needsMoreInfo: 'Needs More Info',
            completeHistory: 'Complete History',
            connectedIdentities: 'Connected Identities',
            connectedIdentitiesDesc: 'Other values linked to this identity in the graph',
            similarCasesDesc: 'Cases with similar patterns and characteristics',
            analystNotes: 'Analyst Notes',
            changeCase: 'Change Case',
            findCase: 'Find Case',
            searchCaseDesc: 'Search by hash, type or ID',
            noCases: 'No cases available',
            noResults: 'No cases found',
            occurrencesCount: 'occurrences',
            loading: 'Loading cases...',
            reviewed: 'Reviewed',
            cases: 'Cases',
        },
        reports: {
            title: 'Reports & Compliance',
            subtitle: 'Generate and schedule reports',
            scheduled: 'Scheduled',
            compliance: 'Compliance',
            generate: 'Generate Now',
            history: 'History',
            createReport: 'Create Report',
            reportName: 'Report Name',
            type: 'Type',
            format: 'Format',
            recipients: 'Email Recipients (comma-separated)',
            daily: 'Daily',
            weekly: 'Weekly',
            monthly: 'Monthly',
            custom: 'Custom/On-demand',
            lastGenerated: 'Last generated',
            nextScheduled: 'Next scheduled',
            generationHistory: 'Generation History',
            generatedAt: 'Generated at',
            size: 'Size',
            download: 'Download',
            generateNow: 'Generate Now',
            noReportsFound: 'No reports found',
            createNewReport: 'Create New Report',
            configureReport: 'Configure a new report on demand or scheduled',
            customOnDemand: 'Custom/On-demand',
            totalReports: 'Total Reports',
            complianceReports: 'Compliance Reports',
            activeSchedules: 'Active Schedules',
            reports: 'Reports',
            recentGenerations: 'Recent Generations',
            report: 'Report',
            status: 'Status',
        },
        alerting: {
            title: 'Alerting System',
            subtitle: 'Configure alerts and notifications',
            rules: 'Rules',
            events: 'Events',
            mute: 'Mute',
            unmute: 'Unmute',
            acknowledge: 'Acknowledge',
            createAlertRule: 'Create Alert Rule',
            configureAlertRule: 'Configure a new alert rule to monitor your system',
            ruleName: 'Rule Name',
            description: 'Description',
            metric: 'Metric',
            operator: 'Operator',
            threshold: 'Threshold',
            timeWindow: 'Time Window',
            severity: 'Severity',
            channels: 'Channels',
            escalation: 'Escalation',
            warning: 'Warning',
            info: 'Info',
            muted: 'Muted',
            activeAlerts: 'Active Alerts',
            totalRules: 'Total Rules',
            criticalRules: 'Critical Rules',
            mutedRules: 'Muted Rules',
            muteAlert: 'Mute Alert',
            muteFor: 'How long do you want to mute this alert?',
            minutes: 'minutes',
            hours: 'hours',
            triggeredAt: 'Triggered at',
            resolvedAt: 'Resolved at',
            resolved: 'Resolved',
            acknowledged: 'Acknowledged',
            eventHistory: 'Event History',
            alertRules: 'Alert Rules',
            alertEvents: 'Alert Events',
            rule: 'Rule',
            message: 'Message',
            triggered: 'Triggered',
            createAlert: 'Create Alert',
            createRule: 'Create Rule',
        },
        accounts: {
            title: 'Accounts Management',
            subtitle: 'Manage customer accounts',
            active: 'Active',
            suspended: 'Suspended',
            trial: 'Trial',
            churned: 'Churned',
            metrics: 'Metrics',
            billing: 'Billing',
            createAccount: 'Create Account',
            totalAccounts: 'Total Accounts',
            monthlyMRR: 'Monthly MRR',
            totalRequestsMonth: 'Total Requests/mo',
            searchAccounts: 'Search accounts...',
            allStatus: 'All Status',
            allPlans: 'All Plans',
            plan: 'Plan',
            free: 'Free',
            starter: 'Starter',
            professional: 'Professional',
            enterprise: 'Enterprise',
            requestsMonth: 'Requests/mo',
            fraudsBlocked: 'Frauds Blocked',
            users: 'Users',
            apiKeys: 'API Keys',
            industry: 'Industry',
            usage: 'Usage',
            monthlyLimit: 'Monthly Limit',
            currentPlan: 'Current Plan',
            monthlyCost: 'Monthly Cost',
            billingPeriodEnds: 'Billing Period Ends',
            suspendAccount: 'Suspend Account',
            reactivateAccount: 'Reactivate Account',
            noAccountsFound: 'No accounts found',
            tryAdjusting: 'Try adjusting your search or filters',
            settings: 'Settings',
            webhookNotifications: 'Webhook Notifications',
            mfaRequired: 'MFA Required',
            ipWhitelist: 'IP Whitelist',
            noIpRestrictions: 'No IP restrictions configured',
            viewAllUsers: 'View All Users',
        },
    },
}

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: DashboardCopy
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>(() => {
        const stored = localStorage.getItem('scora_dashboard_lang')
        return (stored as Language) || 'pt-BR'
    })

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang)
        localStorage.setItem('scora_dashboard_lang', lang)
    }, [])

    const value: LanguageContextType = {
        language,
        setLanguage,
        t: dashboardCopy[language],
    }

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}
