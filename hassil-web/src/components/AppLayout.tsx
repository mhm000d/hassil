import type { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Icon from './Icon'
import Logo from './Logo'
import { mockUsers, mockApi } from '../data/mockApi'
import { useEffect, useState } from 'react'

interface AppLayoutProps {
    children: ReactNode
}

const currentUser = mockUsers[0]

const pageTitleMap: [string, string][] = [
    ['/invoices/new', 'Create invoice'],
    ['/invoices', 'Invoices'],
    ['/advances', 'Advance detail'],
    ['/cash-flow', 'Cash-flow forecast'],
    ['/ledger', 'Ledger'],
    ['/admin', 'Admin review'],
    ['/client/confirm', 'Client confirmation'],
    ['/dashboard', 'Dashboard'],
]

export default function AppLayout({ children }: AppLayoutProps) {
    const navigate = useNavigate()
    const location = useLocation()
    const path = location.pathname
    const [pendingToken, setPendingToken] = useState<string | null>(null)

    useEffect(() => {
        mockApi.listInvoices().then((res) => {
            const token = res.data.find((inv) => inv.clientConfirmation?.status === 'Pending')?.clientConfirmation?.token ?? null
            setPendingToken(token)
        })
    }, [path]) // refresh on navigation so badge stays current

    const navItems = [
        { path: '/dashboard', label: 'Home', icon: 'home' as const },
        { path: '/invoices', label: 'Invoices', icon: 'invoice' as const },
        { path: '/cash-flow', label: 'Cash Flow', icon: 'cashflow' as const },
        { path: '/ledger', label: 'Ledger', icon: 'ledger' as const },
        { path: '/admin', label: 'Admin', icon: 'admin' as const },
    ]

    const pageTitle = pageTitleMap.find(([key]) => path.startsWith(key))?.[1] ?? 'Hassil'

    const goClientLink = () => {
        if (pendingToken) {
            navigate(`/client/confirm/${pendingToken}`)
        } else {
            // No pending token — go to invoices so user can create one
            navigate('/invoices')
        }
    }

    return (
        <div className="app-layout light-shell">
            <header className="app-header">
                <div className="app-header-main">
                    <div className="brand-cluster">
                        <Logo onClick={() => navigate('/dashboard')} />
                    </div>
                    <div className="header-context">
                        <strong>{pageTitle}</strong>
                        <span>{currentUser.accountType === 'Freelancer' ? 'Invoice Discounting' : 'Invoice Factoring'}</span>
                        <em>Verified profile</em>
                    </div>
                    <div className="top-actions header-actions">
                        <button type="button" className="btn btn-ghost">
                            {currentUser.smallBusinessProfile?.businessName ?? currentUser.freelancerProfile?.fullName ?? currentUser.email}
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => navigate('/invoices/new')}>
                            <Icon name="plus" /> Create Invoice
                        </button>
                    </div>
                </div>
            </header>

            <aside className="app-rail" aria-label="Workspace navigation">
                <div className="rail-profile">
                    <div className="rail-avatar"><Icon name="check" /></div>
                    <div>
                        <strong>{currentUser.smallBusinessProfile?.businessName ?? currentUser.freelancerProfile?.fullName ?? currentUser.email}</strong>
                        <span>Trust score {currentUser.trustScore}</span>
                    </div>
                </div>
                <nav className="rail-nav">
                    {navItems.map((item) => {
                        const isActive =
                            path === item.path ||
                            (item.path !== '/dashboard' && path.startsWith(item.path))
                        return (
                            <button
                                key={item.path}
                                className={isActive ? 'active' : ''}
                                onClick={() => navigate(item.path)}
                            >
                                <Icon name={item.icon} />
                                {item.label}
                            </button>
                        )
                    })}
                    <button
                        className={path.startsWith('/client/confirm') ? 'active' : ''}
                        onClick={goClientLink}
                    >
                        <Icon name="link" />
                        Client Link
                        {pendingToken && <span>1</span>}
                    </button>
                </nav>
                <div className="rail-footer">
                    <button className="rail-link" onClick={() => navigate('/ledger')}>
                        <Icon name="ledger" /> Support trail
                    </button>
                    <button className="btn btn-secondary full-width" onClick={() => navigate('/')}>
                        <Icon name="open" /> Logout
                    </button>
                </div>
            </aside>

            <main className="app-main">
                <div className="page-content">
                    {children}
                </div>
            </main>
        </div>
    )
}
