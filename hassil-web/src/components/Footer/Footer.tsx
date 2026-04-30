import { Link } from 'react-router-dom'
import '../../styles/Footer.css'

type FooterLink =
    | { label: string; href: string; kind: 'anchor' }
    | { label: string; to: string; kind: 'route' }

const footerLinks: FooterLink[] = [
    { label: 'How it works', href: '/#bridging', kind: 'anchor' },
    { label: 'Compliance', to: '/compliance', kind: 'route' },
    { label: 'Legal', to: '/legal', kind: 'route' },
    { label: 'Support', to: '/support', kind: 'route' },
]

export default function Footer() {
    const year = new Date().getFullYear()
    return (
        <footer className="footer" id="footer">
            <div className="container footer__inner">
                <div className="footer__left">
                    <span className="footer__brand">Hassil</span>
                    <span className="footer__copyright">
                        © {year} Hassil. Clear cash-flow access for finished work.
                    </span>
                </div>
                <nav className="footer__links" aria-label="Footer navigation">
                    {footerLinks.map((link) => (
                        link.kind === 'route'
                            ? <Link key={link.label} to={link.to} className="footer__link">{link.label}</Link>
                            : <a key={link.label} href={link.href} className="footer__link">{link.label}</a>
                    ))}
                </nav>
            </div>
        </footer>
    )
}
