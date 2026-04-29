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
import AccountType from './pages/AccountType'
import AdminLogin from './pages/AdminLogin'
import FreelancerLogin from './pages/FreelancerLogin'
import FreelancerOnboarding from './pages/FreelancerOnboarding'
import HomeFreelancer from './pages/HomeFreelancer'
import CompanyLogin from './pages/CompanyLogin'
import SmallBusinessOnboarding from './pages/SmallBusinessOnboarding'
import HomeCompany from './pages/HomeCompany'

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
                <Route path="/home/freelancer" element={<HomeFreelancer />} />
                <Route path="/home/company" element={<HomeCompany />} />
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
                <Route path="/" element={<LandingPage />} />
                <Route path="/account-type" element={<AccountType />} />
                <Route path="/login/admin" element={<AdminLogin />} />
                <Route path="/login/freelancer" element={<FreelancerLogin />} />
                <Route path="/onboarding/freelancer" element={<FreelancerOnboarding />} />
                <Route path="/login/company" element={<CompanyLogin />} />
                <Route path="/onboarding/SmallBusiness" element={<SmallBusinessOnboarding />} />
                <Route path="/client/confirm/:token" element={<ClientConfirmation />} />
                {/* App shell */}
                <Route path="/*" element={<AppShell />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
