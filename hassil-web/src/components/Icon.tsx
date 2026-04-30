import type { ReactNode } from 'react'

export type IconName =
    | 'plus'
    | 'open'
    | 'advance'
    | 'back'
    | 'chart'
    | 'check'
    | 'next'
    | 'review'
    | 'home'
    | 'invoice'
    | 'cashflow'
    | 'ledger'
    | 'admin'
    | 'link'
    | 'settings'
    | 'user'
    | 'document'
    | 'upload'
    | 'chevron-down'

const iconPaths: Record<IconName, ReactNode> = {
    plus:      <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    open:      <><path d="M7 17 17 7" /><path d="M9 7h8v8" /></>,
    advance:   <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    back:      <><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></>,
    chart:     <><path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 15v-4" /><path d="M12 15V8" /><path d="M16 15v-6" /></>,
    check:     <><path d="m5 12 4 4L19 6" /></>,
    next:      <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    review:    <><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    home:      <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
    invoice:   <><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 7h8" /><path d="M8 11h8" /><path d="M8 15h5" /></>,
    cashflow:  <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
    ledger:    <><path d="M4 4h16v16H4z" /><path d="M4 9h16" /><path d="M4 14h16" /><path d="M9 4v16" /></>,
    admin:     <><path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2z" /><path d="M2 20a10 10 0 0 1 20 0" /></>,
    link:      <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>,
    settings:  <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
    user:      <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    document:  <><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 7h8" /><path d="M8 11h8" /><path d="M8 15h5" /></>,
    upload:       <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>,
    'chevron-down': <path d="m6 9 6 6 6-6" />,
}

export default function Icon({ name }: { name: IconName }) {
    return (
        <svg className="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {iconPaths[name]}
        </svg>
    )
}
