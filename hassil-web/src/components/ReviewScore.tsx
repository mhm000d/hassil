export default function ReviewScore({ score, flags }: { score: number; flags: string[] }) {
    const color = score >= 75 ? 'var(--teal)' : score >= 50 ? 'var(--amber)' : 'var(--red)'
    return (
        <div className="review-score-bar mt-18">
            <div className="space-between">
                <span className="small-label">Review score</span>
                <strong>{score}/100</strong>
            </div>
            <div className="review-score-track">
                <div className="review-score-fill" style={{ width: `${score}%`, background: color }} />
            </div>
            <div className="risk-flags mt-12">
                {flags.length === 0 ? (
                    <div className="risk-flag-item success">No high-risk flags detected</div>
                ) : (
                    flags.map((flag) => (
                        <div className="risk-flag-item" key={flag}>
                            {flag}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
