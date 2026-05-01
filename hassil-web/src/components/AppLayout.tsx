import type { ReactNode } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import Icon from './Icon'
import Logo from './Logo'
import { useAuth, useAdvances } from '../hooks'

interface AppLayoutProps {
    children?: ReactNode
}

const pageTitleMap: [string, string][] = [
    ['/invoices/new', 'Create invoice'],
    ['/invoices', 'Invoices'],
    ['/advances', 'Advances'],
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
    const { user: authUser, logout } = useAuth()
    const { advances } = useAdvances()

    const displayName = authUser?.displayName
        ?? authUser?.name
        ?? authUser?.smallBusinessProfile?.businessName
        ?? authUser?.freelancerProfile?.fullName
        ?? authUser?.email
        ?? 'Hassil user'

    const pendingClientAdvance = advances.find((advance) =>
        advance.status === 'PendingClientConfirmation' && advance.clientConfirmationToken)
    const pendingToken = pendingClientAdvance?.clientConfirmationToken ?? null

    const isAdminPath = path.startsWith('/admin')

    const allNavItems = [
        { path: '/dashboard', label: 'Home', icon: 'home' as const },
        { path: '/invoices', label: 'Invoices', icon: 'invoice' as const },
        { path: '/advances', label: 'Advances', icon: 'advance' as const },
        { path: '/cash-flow', label: 'Cash Flow', icon: 'cashflow' as const },
        { path: '/ledger', label: 'Ledger', icon: 'ledger' as const },
        { path: '/admin', label: 'Admin', icon: 'admin' as const },
        ...(authUser?.accountType === 'SmallBusiness'
            ? [/*{ path: '/client/confirm', label: 'Client Link', icon: 'link' as const }*/]
            : []),
    ]

    const navItems = isAdminPath
        ? allNavItems.filter((item) => item.path === '/admin')
        : allNavItems.filter((item) => item.path !== '/admin')

    const pageTitle = pageTitleMap.find(([key]) => path.startsWith(key))?.[1] ?? 'Hassil'

    const goClientLink = () => {
        navigate(pendingToken ? `/client/confirm/${pendingToken}` : pendingClientAdvance ? `/advances/${pendingClientAdvance.id}` : '/advances')
    }

    return (
        <div className="app-layout light-shell">
            <header className="app-header">
                <div className="app-header-main">
                    <div className="brand-cluster">
                        <Logo onClick={() => navigate('/')} />
                    </div>
                    <div className="header-context">
                        <strong>{pageTitle}</strong>
                        {/*<span>{authUser?.accountType === 'Freelancer' ? 'Invoice Discounting' : 'Invoice Factoring'}</span>*/}
                        {/*<em>Verified profile</em>*/}
                    </div>
                    <div className="top-actions header-actions">
                        {/*<button type="button" className="btn btn-ghost">*/}
                        {/*    {displayName}*/}
                        {/*</button>*/}
                        {!isAdminPath && (
                            <button type="button" className="btn btn-primary" onClick={() => navigate('/invoices/new')}>
                                <Icon name="plus" /> Create Invoice
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <aside className="app-rail" aria-label="Workspace navigation">
                <div className="rail-profile">
                    <div className="rail-avatar"><Icon name="check" /></div>
                    <div>
                        <strong>{isAdminPath ? 'Admin Console' : displayName}</strong>
                        <span>{isAdminPath ? 'System Administrator' : `Trust score ${authUser?.trustScore ?? 0}`}</span>
                    </div>
                </div>
                {/*{!isAdminPath && (*/}
                {/*    <button className="rail-quick-action" onClick={() => navigate('/invoices/new')}>*/}
                {/*        <Icon name="plus" />*/}
                {/*        <div>*/}
                {/*            <strong>New invoice</strong>*/}
                {/*            <span>Add receivable</span>*/}
                {/*        </div>*/}
                {/*    </button>*/}
                {/*)}*/}
                <nav className="rail-nav">
                    {navItems.map((item) => {
                        const isActive =
                            path === item.path ||
                            (item.path !== '/dashboard' && path.startsWith(item.path))
                        const onClick = item.path === '/client/confirm'
                            ? goClientLink
                            : () => navigate(item.path)
                        return (
                            <button
                                key={item.path}
                                className={isActive ? 'active' : ''}
                                onClick={onClick}
                            >
                                <Icon name={item.icon} />
                                {item.label}
                                {item.path === '/client/confirm' && pendingToken && <span>1</span>}
                            </button>
                        )
                    })}
                </nav>
                <div className="rail-footer">
                    {/*{!isAdminPath && (*/}
                    {/*    <button className="rail-link" onClick={() => navigate('/ledger')}>*/}
                    {/*        <Icon name="ledger" /> Support trail*/}
                    {/*    </button>*/}
                    {/*)}*/}
                    <button className="btn btn-secondary full-width" onClick={() => { logout(); navigate('/') }}>
                        <Icon name="open" /> Logout
                    </button>
                </div>
            </aside>

            <main className="app-main">
                <div className="page-content">
                    {children ?? <Outlet />}
                </div>
            </main>
        </div>
    )
}
