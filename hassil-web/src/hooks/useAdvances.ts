import { useContext } from 'react'
import { AdvanceContext } from '../context/AdvanceContext'

export function useAdvances() {
    const context = useContext(AdvanceContext)
    if (!context) throw new Error('useAdvances must be used within AdvanceProvider')
    return context
}
