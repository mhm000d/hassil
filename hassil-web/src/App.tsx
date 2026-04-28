import { useState } from 'react'
import './App.css'
import Home from './pages/Home'
import Invoices from './pages/Invoices'
import Advances from './pages/Advances'
import Transactions from './pages/Transactions'
import Profile from './pages/Profile'
import Settings from './pages/Settings'

const pages = [
  'Home',
  'Invoices',
  'Advances',
  'Transactions',
  'Profile',
  'Settings',
] as const

type PageName = (typeof pages)[number]

function App() {
  const [activePage, setActivePage] = useState<PageName>('Home')

  const renderPage = () => {
    switch (activePage) {
      case 'Invoices':
        return <Invoices />
      case 'Advances':
        return <Advances />
      case 'Transactions':
        return <Transactions />
      case 'Profile':
        return <Profile />
      case 'Settings':
        return <Settings />
      default:
        return <Home />
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">Hassil</div>
        <nav className="app-nav" aria-label="Main navigation">
          {pages.map((page) => (
            <button
              key={page}
              type="button"
              className={page === activePage ? 'nav-item active' : 'nav-item'}
              onClick={() => setActivePage(page)}
            >
              {page}
            </button>
          ))}
        </nav>
      </header>
      <main className="app-content">{renderPage()}</main>
      <footer className="app-footer">
        <span>© {new Date().getFullYear()} Hassil</span>
        <span>Designed for fast cash flow clarity</span>
      </footer>
    </div>
  )
}

export default App
