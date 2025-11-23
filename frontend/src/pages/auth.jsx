import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import axios from 'axios';

// Component Input chung để giảm trùng lặp
const Input = ({ type, placeholder, value, onChange, required, label }) => (
    <div>
        <label className="sr-only">{label}</label> {/* Hidden label cho accessibility */}
        <input
            type={type}
            placeholder={placeholder}
            className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            value={value}
            onChange={onChange}
            required={required}
        />
    </div>
);

export default function AuthPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isLoginForm, setIsLoginForm] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [registerData, setRegisterData] = useState({
        username: '', password: '', email: '', full_name: ''
    });

    // Nếu đã login → redirect
    useEffect(() => {
        if (localStorage.getItem("authToken")) {
            navigate("/");
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isLoginForm) {
                await login(loginData);
                navigate("/");
            } else {
                await axios.post("http://127.0.0.1:8000/auth/register", registerData);
                setError("Register successful! Please login.");
                setIsLoginForm(true);
                setRegisterData({ username: '', password: '', email: '', fullname: '' });
            }
        } catch (err) {
            setError(err.response?.data?.detail || "An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleForm = () => {
        setIsLoginForm(!isLoginForm);
        setError(''); // Clear error khi toggle
    };

    return (
        <>
            <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
                <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                        {isLoginForm ? "Login" : "Register"}
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {isLoginForm ? (
                            <>
                                <Input
                                    type="text"
                                    placeholder="Email"
                                    label="Email"
                                    value={loginData.email}
                                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                    required
                                />
                                <Input
                                    type="password"
                                    placeholder="Password"
                                    label="Password"
                                    value={loginData.password}
                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                    required
                                />
                            </>
                        ) : (
                            <>
                                <Input
                                    type="text"
                                    placeholder="Username"
                                    label="Username"
                                    value={registerData.username}
                                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                                    required
                                />
                                <Input
                                    type="email"
                                    placeholder="Email"
                                    label="Email"
                                    value={registerData.email}
                                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                    required
                                />
                                <Input
                                    type="password"
                                    placeholder="Password"
                                    label="Password"
                                    value={registerData.password}
                                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                    required
                                />
                                <Input
                                    type="text"
                                    placeholder="Full Name"
                                    label="Full Name"
                                    value={registerData.full_name}
                                    onChange={(e) => setRegisterData({ ...registerData, full_name: e.target.value })}
                                    required
                                />
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Processing..." : (isLoginForm ? "Login" : "Register")}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600">
                        {isLoginForm ? "Don't have an account?" : "Already have an account?"}{" "}
                        <button
                            onClick={toggleForm}
                            className="text-blue-500 hover:text-blue-700 underline transition-colors duration-200"
                        >
                            {isLoginForm ? "Register here" : "Login here"}
                        </button>
                    </p>
                </div>
            </main>
        </>
    );
}
