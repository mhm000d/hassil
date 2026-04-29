import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider, InvoiceProvider, AdvanceProvider, TransactionProvider } from './context'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <InvoiceProvider>
        <AdvanceProvider>
          <TransactionProvider>
            <App />
          </TransactionProvider>
        </AdvanceProvider>
      </InvoiceProvider>
    </AuthProvider>
  </StrictMode>,
)
