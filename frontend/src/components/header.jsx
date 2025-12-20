import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function Header() {
    const { user, loading, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const isAuthenticated = !!user && !loading;

    console.log("Header - isAuthenticated:", isAuthenticated);
    console.log("Header - user:", user);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const buttonClasses = "px-4 py-2 text-white rounded-lg transition-colors duration-200";

    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

                {/* Logo */}
                <Link to="/" className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
                    MyApp
                </Link>

                {/* Desktop Menu */}
                <ul className="hidden md:flex gap-6 text-gray-700 font-medium">
                    <li><Link to="/" className="hover:text-blue-600 transition-colors">Home</Link></li>
                    <li><Link to="/ai-analysis" className="hover:text-blue-600 transition-colors">AI Analysis</Link></li>
                    <li><Link to="/threat-hunt" className="hover:text-blue-600 transition-colors">Threat Hunting</Link></li>
                    <li><Link to="/logs" className="hover:text-blue-600 transition-colors">Logs</Link></li>
                    <li><Link to="/settings" className="hover:text-blue-600 transition-colors">Settings</Link></li>
                </ul>

                {/* Right Side */}
                <div className="flex items-center gap-4">
                    {isAuthenticated ? (
                        <>
                            <span className="hidden sm:block font-medium text-gray-700">
                                Welcome, {user?.username}
                            </span>
                            <button
                                className={`${buttonClasses} bg-red-600 hover:bg-red-700`}
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <Link to="/auth" className={`${buttonClasses} bg-blue-600 hover:bg-blue-700`}>
                            Login
                        </Link>
                    )}

                    {/* Hamburger Menu (Mobile) */}
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
                        <li><Link to="/" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-600">Home</Link></li>
                        <li><Link to="/aiAnalysis" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-600">AI analysis</Link></li>
                        <li><Link to="/report" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-600">Report</Link></li>

                        {/* Mobile Login/Logout */}
                        {isAuthenticated ? (
                            <button
                                onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                                className={`${buttonClasses} bg-red-600 hover:bg-red-700 w-full text-center`}
                            >
                                Logout
                            </button>
                        ) : (
                            <Link to="/auth" onClick={() => setIsMenuOpen(false)}
                                className={`${buttonClasses} bg-blue-600 hover:bg-blue-700 text-center`}
                            >
                                Login
                            </Link>
                        )}
                    </ul>
                </div>
            )}
        </header>
    );
}
