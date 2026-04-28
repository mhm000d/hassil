export default function Breadcrumbs({ items }: { items: { label: string; onClick?: () => void }[] }) {
    return (
        <nav className="breadcrumbs" aria-label="Breadcrumb">
            {items.map((item, index) => (
                <span key={`${item.label}-${index}`} className="breadcrumb-item">
                    {item.onClick ? (
                        <button onClick={item.onClick}>{item.label}</button>
                    ) : (
                        <strong>{item.label}</strong>
                    )}
                </span>
            ))}
        </nav>
    )
}
