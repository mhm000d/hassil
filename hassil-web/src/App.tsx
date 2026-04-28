import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import Dashboard from './pages/Dashboard'
import { dashboardState, dashboardUser } from './data/dashboardData'

function LaunchScreen() {
  const navigate = useNavigate()

  return (
    <div className="page-content" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
        Open Dashboard
      </button>
    </div>
  )
}

function AppContent() {
  const navigate = useNavigate()
  const go = (target: string, params?: Record<string, unknown>) => {
    if (params) {
      console.log('route params', params)
    }

    switch (target) {
      case 'dashboard':
        navigate('/dashboard')
        break
      case 'invoices':
        navigate('/dashboard')
        break
      default:
        navigate('/dashboard')
    }
  }

  return (
    <AppLayout state={dashboardState} currentUser={dashboardUser} currentPage="dashboard" go={go}>
      <Routes>
        <Route path="/" element={<LaunchScreen />} />
        <Route path="/dashboard" element={<Dashboard state={dashboardState} user={dashboardUser} go={go} />} />
        <Route path="*" element={<LaunchScreen />} />
      </Routes>
    </AppLayout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
