import type { ReactNode } from 'react'
import type { DashboardAppState, DashboardUser, PageName } from '../types'
import Icon from './Icon'
import Logo from './Logo'

interface AppLayoutProps {
    state: DashboardAppState
    currentUser: DashboardUser
    currentPage: PageName
    go: (target: string, params?: Record<string, unknown>) => void
    children: ReactNode
}

export default function AppLayout({ state, currentUser, currentPage, go, children }: AppLayoutProps) {
    const model = currentUser.accountType === 'Freelancer' ? 'Invoice Discounting' : 'Invoice Factoring'
    const pendingReviews = state.advanceRequests.filter((adv) => adv.status === 'Pending').length
    const navItems = [
        { page: 'dashboard' as const, label: 'Home', active: currentPage === 'dashboard' },
        { page: 'invoices' as const, label: 'Invoices', active: ['invoices', 'invoiceDetail', 'advanceRequest', 'advanceDetail', 'newInvoice'].includes(currentPage) },
        { page: 'cashFlow' as const, label: 'Cash Flow', active: currentPage === 'cashFlow' },
        { page: 'ledger' as const, label: 'Ledger', active: currentPage === 'ledger' },
        { page: 'adminReview' as const, label: 'Admin', active: currentPage === 'adminReview', badge: pendingReviews },
        { page: 'clientConfirmation' as const, label: 'Client Link', active: currentPage === 'clientConfirmation', badge: 1 },
    ]

    const pageTitleMap: Record<PageName, string> = {
        landing: 'Landing',
        selectType: 'Select account type',
        onboarding: 'Complete profile',
        dashboard: 'Dashboard',
        invoices: 'Invoices',
        newInvoice: 'Create invoice',
        invoiceDetail: 'Invoice detail',
        advanceRequest: 'Advance quote',
        advanceDetail: 'Advance detail',
        clientConfirmation: 'Client link',
        adminReview: 'Admin review',
        ledger: 'Ledger',
    }

    return (
        <div className="app-layout light-shell">
            <header className="app-header">
                <div className="app-header-main">
                    <div className="brand-cluster">
                        <Logo onClick={() => go('dashboard')} />
                    </div>

                    <div className="header-context">
                        <strong>{pageTitleMap[currentPage] || 'Dashboard'}</strong>
                        <span>{model}</span>
                        <em>Verified profile</em>
                    </div>

                    <div className="top-actions header-actions">
                        <button type="button" className="btn btn-ghost">
                            {currentUser.firstName} {currentUser.lastName}
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => go('newInvoice')}>
                            <Icon name="plus" /> Create Invoice
                        </button>
                    </div>
                </div>
            </header>

            <aside className="app-rail" aria-label="Workspace navigation">
                <div className="rail-profile">
                    <div className="rail-avatar"><Icon name="check" /></div>
                    <div>
                        <strong>{currentUser.firstName} {currentUser.lastName}</strong>
                        <span>Trust score {currentUser.trustScore}</span>
                    </div>
                </div>
                <nav className="rail-nav">
                    {navItems.map((item) => {
                        const iconMap: Record<string, import('./Icon').IconName> = {
                            dashboard: 'home',
                            invoices: 'invoice',
                            cashFlow: 'cashflow',
                            ledger: 'ledger',
                            adminReview: 'admin',
                            clientConfirmation: 'link',
                        }
                        return (
                            <button key={item.page} className={item.active ? 'active' : ''} onClick={() => go(item.page)}>
                                <Icon name={iconMap[item.page] ?? 'chart'} />
                                {item.label}
                                {!!item.badge && <span>{item.badge}</span>}
                            </button>
                        )
                    })}
                </nav>
                <div className="rail-footer">
                    <button className="btn btn-primary full-width" onClick={() => go('newInvoice')}><Icon name="plus" /> New Invoice</button>
                    <button className="rail-link" onClick={() => go('ledger')}><Icon name="open" /> Support trail</button>
                </div>
            </aside>

            <main className="app-main">
                <div className="page-content">
                    <DemoGuide state={state} currentUser={currentUser} go={go} />
                    {children}
                </div>
            </main>
        </div>
    )
}

function DemoGuide({ state, currentUser, go }: { state: DashboardAppState; currentUser: DashboardUser; go: (target: string, params?: Record<string, unknown>) => void }) {
    const userInvoices = state.invoices.filter((invoice) => invoice.userId === currentUser.id)
    const openInvoice = userInvoices.find((invoice) => !invoice.advanceRequestId && invoice.status !== 'Paid' && invoice.status !== 'Rejected')
    const activeAdvance = state.advanceRequests.find((advance) => advance.userId === currentUser.id && advance.status === 'Pending')

    let label = 'Create an invoice'
    let description = 'Start with a receivable, then review the available advance.'
    let action = () => go('newInvoice')

    if (activeAdvance) {
        label = 'Continue advance'
        description = 'Move the active request through funding and settlement.'
        action = () => go('advanceDetail', { advanceId: activeAdvance.id })
    } else if (openInvoice) {
        label = 'Request advance'
        description = 'Use the open invoice to generate a quote.'
        action = () => go('advanceRequest', { invoiceId: openInvoice.id })
    }

    return (
        <div className="demo-guide">
            <div>
                <span className="small-label">Next demo action</span>
                <strong>{label}</strong>
                <p>{description}</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={action}><Icon name="next" /> Continue</button>
        </div>
    )
}
