export default function Logo({ onClick }: { onClick: () => void }) {
    return (
        <button className="logo-mark clean-button" onClick={onClick}>
            <span className="logo-icon">H</span>
            <span className="logo-text">Has<span>sil</span></span>
        </button>
    )
}
