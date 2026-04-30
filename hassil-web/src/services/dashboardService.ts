import { api } from './apiClient'
import { mapTransaction, type ApiTransactionResponse } from './transactionService'
import type {
    AccountType,
    DashboardMoneyMetric,
    DashboardReviewState,
    DashboardSummary,
    FinancingModel,
} from '../types'

interface ApiDashboardMoneyMetricResponse {
    count: number
    amount: number
}

interface ApiDashboardReviewStateResponse {
    pendingClientConfirmation: number
    pendingReview: number
    approvedReadyForDisbursement: number
}

interface ApiDashboardSummaryResponse {
    accountType: string
    financingModel: string
    trustScore: number
    ledgerBalance: number
    outstandingInvoices: ApiDashboardMoneyMetricResponse
    activeAdvances: ApiDashboardMoneyMetricResponse
    expectedRepayments: ApiDashboardMoneyMetricResponse
    reviewStates: ApiDashboardReviewStateResponse
    recentTransactions: ApiTransactionResponse[]
}

function mapMoneyMetric(response: ApiDashboardMoneyMetricResponse): DashboardMoneyMetric {
    return {
        count: response.count,
        amount: response.amount,
    }
}

function mapReviewState(response: ApiDashboardReviewStateResponse): DashboardReviewState {
    return {
        pendingClientConfirmation: response.pendingClientConfirmation,
        pendingReview: response.pendingReview,
        approvedReadyForDisbursement: response.approvedReadyForDisbursement,
    }
}

function mapSummary(response: ApiDashboardSummaryResponse): DashboardSummary {
    return {
        accountType: response.accountType as AccountType,
        financingModel: response.financingModel as FinancingModel,
        trustScore: response.trustScore,
        ledgerBalance: response.ledgerBalance,
        outstandingInvoices: mapMoneyMetric(response.outstandingInvoices),
        activeAdvances: mapMoneyMetric(response.activeAdvances),
        expectedRepayments: mapMoneyMetric(response.expectedRepayments),
        reviewStates: mapReviewState(response.reviewStates),
        recentTransactions: response.recentTransactions.map(mapTransaction),
    }
}

export const DashboardService = {
    summary: async () => {
        const response = await api.get<ApiDashboardSummaryResponse>('/dashboard/summary')
        return mapSummary(response)
    },
}
