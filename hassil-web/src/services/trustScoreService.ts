import { api } from './apiClient'
import type { TrustScoreEvent } from '../types'

export interface TrustScoreHistory {
    currentScore: number
    events: TrustScoreEvent[]
}

interface ApiTrustScoreEventResponse {
    id: string
    oldScore: number
    newScore: number
    delta: number
    reason: string
    createdAt: string
}

interface ApiTrustScoreHistoryResponse {
    currentScore: number
    events: ApiTrustScoreEventResponse[]
}

function mapEvent(response: ApiTrustScoreEventResponse): TrustScoreEvent {
    return {
        id: response.id,
        userId: '',
        oldScore: response.oldScore,
        newScore: response.newScore,
        delta: response.delta,
        reason: response.reason,
        createdAt: response.createdAt,
    }
}

export const TrustScoreService = {
    history: async (): Promise<TrustScoreHistory> => {
        const response = await api.get<ApiTrustScoreHistoryResponse>('/trust-score/events')
        return {
            currentScore: response.currentScore,
            events: response.events.map(mapEvent),
        }
    },
}
