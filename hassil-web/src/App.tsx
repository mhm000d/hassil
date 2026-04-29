import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import Dashboard from './pages/Dashboard'
import Invoices from './pages/Invoices'
import NewInvoice from './pages/NewInvoice'
import InvoiceDetail from './pages/InvoiceDetail'
import InvoiceAdvance from './pages/InvoiceAdvance'
import AdvanceDetail from './pages/AdvanceDetail'
import AdminReview from './pages/AdminReview'
import Ledger from './pages/Ledger'
import CashFlow from './pages/CashFlow'
import ClientConfirmation from './pages/ClientConfirmation'
import Landing from './pages/Landing'

function AppShell() {
    return (
        <AppLayout>
            <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/invoices/new" element={<NewInvoice />} />
                <Route path="/invoices/:id" element={<InvoiceDetail />} />
                <Route path="/invoices/:id/advance" element={<InvoiceAdvance />} />
                <Route path="/advances/:id" element={<AdvanceDetail />} />
                <Route path="/admin" element={<AdminReview />} />
                <Route path="/admin/:advanceId" element={<AdminReview />} />
                <Route path="/ledger" element={<Ledger />} />
                <Route path="/cash-flow" element={<CashFlow />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </AppLayout>
    )
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public — no shell */}
                <Route path="/" element={<Landing />} />
                <Route path="/client/confirm/:token" element={<ClientConfirmation />} />
                {/* App shell */}
                <Route path="/*" element={<AppShell />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
