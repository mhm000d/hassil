import { useParams } from 'react-router-dom'

export default function InvoiceDetail() {
    const { invoiceId } = useParams<{ invoiceId: string }>()

    return (
        <div className="page-page">
            <section className="page-block">
                <h2>Invoice Detail</h2>
                <p>Details for invoice {invoiceId}</p>
            </section>
        </div>
    )
}
