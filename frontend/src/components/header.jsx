import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Header() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false); // State cho hamburger menu
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (token) {
            const username = localStorage.getItem("username");
            setIsLoggedIn(true);
            setUserData({ name: username });
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("username");
        setIsLoggedIn(false);
        setUserData(null);
        navigate("/"); // Điều hướng về home thay vì reload
    };

    const buttonClasses = "px-4 py-2 text-white rounded-lg transition-colors duration-200"; // Class chung cho buttons

    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                
                {/* Logo */}
                <Link to="/" className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
                    MyApp
                </Link>

                {/* Menu Desktop */}
                <ul className="hidden md:flex gap-6 text-gray-700 font-medium">
                    <li><Link to="/" className="hover:text-blue-600 transition-colors">Home</Link></li>
                    <li><Link to="/about" className="hover:text-blue-600 transition-colors">About</Link></li>
                    <li><Link to="/contact" className="hover:text-blue-600 transition-colors">Contact</Link></li>
                </ul>

                {/* Right side */}
                <div className="flex items-center gap-4">
                    {isLoggedIn ? (
                        <>
                            <span className="hidden sm:block font-medium text-gray-700">
                                Welcome, {userData?.name}
                            </span>
                            <button
                                className={`${buttonClasses} bg-red-600 hover:bg-red-700`}
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/auth" className={`${buttonClasses} bg-blue-600 hover:bg-blue-700`}>
                                Login
                            </Link>
                        </>
                    )}

                    {/* Hamburger Menu Button (Mobile) */}
                    <button
                        className="md:hidden text-gray-700 focus:outline-none"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t shadow-md px-6 py-4">
                    <ul className="flex flex-col gap-4 text-gray-700 font-medium">
                        <li><Link to="/" className="hover:text-blue-600 transition-colors" onClick={() => setIsMenuOpen(false)}>Home</Link></li>
                        <li><Link to="/about" className="hover:text-blue-600 transition-colors" onClick={() => setIsMenuOpen(false)}>About</Link></li>
                        <li><Link to="/contact" className="hover:text-blue-600 transition-colors" onClick={() => setIsMenuOpen(false)}>Contact</Link></li>
                    </ul>
                </div>
            )}
        </header>
    );
}
