import { useParams } from 'react-router-dom'

export default function AdminAdvanceDetail() {
    const { advanceId } = useParams<{ advanceId: string }>()

    return (
        <div className="page-page">
            <section className="page-block">
                <h2>Admin Advance Detail</h2>
                <p>Inspect review flags, AI summary, and approval options for advance {advanceId}.</p>
            </section>
        </div>
    )
}
