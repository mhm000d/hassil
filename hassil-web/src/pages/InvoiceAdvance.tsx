import { useParams } from 'react-router-dom'

export default function InvoiceAdvance() {
    const { invoiceId } = useParams<{ invoiceId: string }>()

    return (
        <div className="page-page">
            <section className="page-block">
                <h2>Advance Quote</h2>
                <p>Review the advance quote and terms for invoice {invoiceId}.</p>
            </section>
        </div>
    )
}
