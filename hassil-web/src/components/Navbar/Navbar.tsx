import { useNavigate } from 'react-router-dom'
import Logo from '../Logo'
import '../../styles/Navbar.css'

export default function Navbar() {
    const navigate = useNavigate()

    return (
        <nav className="navbar" id="navbar">
            <div className="container navbar__inner">
                <Logo onClick={() => navigate('/')} />
                <div className="navbar__actions">
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate('/account-type')}
                        id="btn-get-started"
                    >
                        Get Started
                    </button>
                </div>
            </div>
        </nav>
    )
}
