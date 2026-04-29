import type { DashboardAppState, DashboardUser } from '../types'
import { mockUsers, mockInvoices, mockAdvanceRequests, mockTransactions } from './mockApi'

const ahmed = mockUsers[0]

export const dashboardUser: DashboardUser = {
    id: ahmed.id,
    firstName: ahmed.smallBusinessProfile?.businessName?.split(' ')[0] ?? 'Ahmed',
    lastName: ahmed.smallBusinessProfile?.businessName?.split(' ')[1] ?? 'Studio',
    accountType: ahmed.accountType,
    role: ahmed.role,
    email: ahmed.email,
    trustScore: ahmed.trustScore,
    status: ahmed.status,
    createdAt: ahmed.createdAt,
}

export const dashboardState: DashboardAppState = {
    invoices: mockInvoices
        .filter((inv) => inv.userId === ahmed.id)
        .map((inv) => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            userId: inv.userId,
            client: { name: inv.client.name },
            amount: inv.amount,
            currency: inv.currency,
            status: inv.status,
            advanceRequestId: inv.advanceRequestId,
        })),
    advanceRequests: mockAdvanceRequests
        .filter((adv) => adv.userId === ahmed.id)
        .map((adv) => ({
            id: adv.id,
            userId: adv.userId,
            status: adv.status,
            advanceAmount: adv.advanceAmount,
            financingModel: adv.financingModel,
        })),
    transactions: mockTransactions
        .filter((tx) => tx.userId === ahmed.id)
        .map((tx) => ({
            id: tx.id,
            userId: tx.userId,
            type: tx.type,
            direction: tx.direction,
            amount: tx.amount,
            description: tx.description ?? '',
            date: new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        })),
}
