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
import LandingPage from './pages/LandingPage'
import Register from './pages/Register'
import Login from './pages/Login'
import AccountType from './pages/AccountType'
import AdminLogin from './pages/AdminLogin'
import FreelancerOnboarding from './pages/FreelancerOnboarding'
import SmallBusinessOnboarding from './pages/SmallBusinessOnboarding'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public — no shell */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/account-type" element={<AccountType />} />
                <Route path="/login/admin" element={<AdminLogin />} />
                <Route path="/onboarding/freelancer" element={<FreelancerOnboarding />} />
                <Route path="/onboarding/SmallBusiness" element={<SmallBusinessOnboarding />} />
                <Route path="/client/confirm/:token" element={<ClientConfirmation />} />
                <Route path="/home/freelancer" element={<Navigate to="/dashboard" replace />} />
                <Route path="/home/company" element={<Navigate to="/dashboard" replace />} />

                {/* App shell — all authenticated routes */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/invoices" element={<Invoices />} />
                        <Route path="/invoices/new" element={<NewInvoice />} />
                        <Route path="/invoices/:id" element={<InvoiceDetail />} />
                        <Route path="/invoices/:id/advance" element={<InvoiceAdvance />} />
                        <Route path="/advances/:id" element={<AdvanceDetail />} />
                        <Route element={<AdminRoute />}>
                            <Route path="/admin" element={<AdminReview />} />
                            <Route path="/admin/:advanceId" element={<AdminReview />} />
                        </Route>
                        <Route path="/ledger" element={<Ledger />} />
                        <Route path="/cash-flow" element={<CashFlow />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App
