import { useParams } from 'react-router-dom'

export default function ClientConfirmation() {
    const { token } = useParams<{ token: string }>()

    return (
        <div className="page-page">
            <section className="page-block">
                <h2>Client Confirmation</h2>
                <p>Confirm or dispute the invoice using token {token}.</p>
            </section>
        </div>
    )
}
