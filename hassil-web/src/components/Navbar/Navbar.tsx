import { useNavigate } from 'react-router-dom'
import Logo from '../Logo'
import './Navbar.css'

export default function Navbar() {
    const navigate = useNavigate()

    return (
        <nav className="navbar" id="navbar">
            <div className="container navbar__inner">
                <Logo onClick={() => navigate('/')} />
                <div className="navbar__actions">
                    <button className="navbar__btn-outline" onClick={() => navigate('/account-type')}>
                        Login as User
                    </button>
                    <button className="navbar__btn-outline" onClick={() => navigate('/login/admin')}>
                        Login as Admin
                    </button>
                </div>
            </div>
        </nav>
    )
}
