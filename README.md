# Scora Dashboard

Interface administrativa do Scora — Risk Intelligence Engine. Permite monitorar decisões em tempo real, gerenciar filas de revisão, configurar regras, explorar o grafo relacional, acompanhar analytics e administrar contas, usuários e API keys.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS + Radix UI
- TanStack Query
- React Router v6
- pnpm

## Estrutura

```
src/
├── components/       # Componentes compartilhados e UI primitives
│   ├── charts/       # BarChart, LineChart
│   ├── dashboard/    # StatCard, Charts, RiskIndicators, AlertList
│   ├── decisions/    # DecisionDetailsModal
│   ├── explainability/
│   └── ui/           # Radix UI wrappers (shadcn)
├── contexts/         # LanguageContext
├── hooks/            # useAuth, useTheme, useErrorHandler
├── pages/            # Uma página por rota
├── services/         # api.ts, auth.ts
├── types/            # Tipos globais
├── utils/            # export, buildLocalExplainability, decisionRecommendation
└── constants/        # reasonCatalog
```

## Desenvolvimento

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

## Variáveis de ambiente

```env
VITE_API_URL=http://localhost:3000
```

## Autenticação

O dashboard usa JWT com refresh token. O `AuthProvider` gerencia o estado de sessão e renova o token automaticamente. Rotas protegidas são separadas por papel: `user`, `admin` e `super_admin`.

## Páginas principais

| Rota | Acesso | Descrição |
|---|---|---|
| `/dashboard` | user | Overview com métricas e decisões recentes |
| `/dashboard/decisions` | user | Histórico de decisões com filtros |
| `/dashboard/review` | user | Fila de revisão manual |
| `/dashboard/investigation` | user | Investigação por entidade |
| `/dashboard/graph` | user | Grafo relacional de identidade |
| `/dashboard/analytics` | user | Analytics e distribuição de risco |
| `/dashboard/learning` | user | Sistema de aprendizado e feedback |
| `/dashboard/rules` | admin | Motor de regras customizadas |
| `/dashboard/monitoring` | admin | Métricas operacionais e latência |
| `/dashboard/alerting` | admin | Regras e eventos de alertas |
| `/dashboard/users` | admin | Gerenciamento de usuários |
| `/dashboard/api-keys` | admin | API keys da conta |
| `/dashboard/audit` | admin | Logs de auditoria |
| `/dashboard/settings` | admin | Configurações da conta |
| `/admin/overview` | super_admin | Visão geral de todas as contas |
| `/admin/accounts` | super_admin | Gerenciamento de contas |
| `/admin/plans` | super_admin | Planos e limites |
