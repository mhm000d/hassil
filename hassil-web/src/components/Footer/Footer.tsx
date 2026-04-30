import '../../styles/Footer.css'

const footerLinks = [
    { label: 'Compliance', href: '#' },
    { label: 'Legal', href: '#' },
    { label: 'Register Support', href: '#' },
]

export default function Footer() {
    const year = new Date().getFullYear()
    return (
        <footer className="footer" id="footer">
            <div className="container footer__inner">
                <div className="footer__left">
                    <span className="footer__brand">Hassil</span>
                    <span className="footer__copyright">
                        © {year} Hassil Fintech. Regulated by regional financial authorities.
                    </span>
                </div>
                <nav className="footer__links" aria-label="Footer navigation">
                    {footerLinks.map((link) => (
                        <a key={link.label} href={link.href} className="footer__link">{link.label}</a>
                    ))}
                </nav>
            </div>
        </footer>
    )
}
