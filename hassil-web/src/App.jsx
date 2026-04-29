import { HashRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import FreelancerLogin from './pages/FreelancerLogin'
import FreelancerOnboarding from './pages/FreelancerOnboarding'
import HomeFreelancer from './pages/HomeFreelancer'
import CompanyLogin from './pages/CompanyLogin'
import SmallBusinessOnboarding from './pages/SmallBusinessOnboarding'
import HomeCompany from './pages/HomeCompany'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login/freelancer" element={<FreelancerLogin />} />
        <Route path="/onboarding/freelancer" element={<FreelancerOnboarding />} />
        <Route path="/home/freelancer" element={<HomeFreelancer />} />
        <Route path="/login/company" element={<CompanyLogin />} />
        <Route path="/onboarding/SmallBusiness" element={<SmallBusinessOnboarding />} />
        <Route path="/home/company" element={<HomeCompany />} />
      </Routes>
    </HashRouter>
  )
}
