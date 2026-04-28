import { useParams } from 'react-router-dom'

export default function AdvanceDetail() {
    const { advanceId } = useParams<{ advanceId: string }>()

    return (
        <div className="page-page">
            <section className="page-block">
                <h2>Advance Detail</h2>
                <p>Track lifecycle and repayment for advance {advanceId}.</p>
            </section>
        </div>
    )
}
