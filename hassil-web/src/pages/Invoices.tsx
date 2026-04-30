import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatDate } from '../data/mockApi'
import { useInvoices } from '../hooks'
import PageHeading from '../components/PageHeading'
import StatusBadge from '../components/StatusBadge'
import Table from '../components/Table'
import Icon from '../components/Icon'

export default function Invoices() {
    const navigate = useNavigate()
    const { invoices, refetch } = useInvoices()

    // Always fetch fresh data when this page mounts so admin decisions
    // (approve / reject) are immediately visible to the invoice owner.
    useEffect(() => {
        refetch()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <>
            <PageHeading title="Invoices" description="Manage receivables, evidence, and advance requests." />
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Invoice portfolio</h2>
                    <button className="btn btn-primary" onClick={() => navigate('/invoices/new')}>
                        <Icon name="plus" /> Create Invoice
                    </button>
                </div>
                <Table
                    headers={['Invoice', 'Source', 'Client', 'Due date', 'Amount', 'Status', 'Advance']}
                    emptyTitle="No invoices yet"
                    emptyDescription="Create your first invoice to request an advance."
                    emptyAction={
                        <button className="btn btn-primary btn-sm" onClick={() => navigate('/invoices/new')}>
                            <Icon name="plus" /> Create invoice
                        </button>
                    }
                    rows={invoices.map((invoice) => [
                        <button className="link-button" key="num" onClick={() => navigate(`/invoices/${invoice.id}`)}>
                            {invoice.invoiceNumber}
                        </button>,
                        invoice.receivableSource === 'DirectClientInvoice' ? 'Direct client' : 'Platform payout',
                        invoice.client.name,
                        formatDate(invoice.dueDate),
                        formatCurrency(invoice.amount, invoice.currency),
                        <StatusBadge key="status" status={invoice.status} />,
                        invoice.advanceRequestId ? (
                            <button
                                key="action"
                                className="btn btn-secondary btn-sm"
                                onClick={() => navigate(`/advances/${invoice.advanceRequestId}`)}
                            >
                                <Icon name="open" /> View advance
                            </button>
                        ) : (
                            <button
                                key="action"
                                className="btn btn-primary btn-sm"
                                onClick={() => navigate(`/invoices/${invoice.id}/advance`)}
                            >
                                <Icon name="advance" /> Request
                            </button>
                        ),
                    ])}
                />
            </div>
        </>
    )
}
