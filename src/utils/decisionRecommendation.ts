import type { RiskDecision } from '@/types'

export type RecommendationAction = 'approve' | 'block' | 'review'

export function getRecommendationAction(
    explanation?: RiskDecision['explanation']
): RecommendationAction | null {
    if (!explanation) return null
    if (explanation.recommendation) {
        return explanation.recommendation === 'block' ? 'block' : 'approve'
    }
    if (explanation.final_decision) {
        return explanation.final_decision
    }
    if (explanation.floor_action) {
        return explanation.floor_action
    }
    return null
}
