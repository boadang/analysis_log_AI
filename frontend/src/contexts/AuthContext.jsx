// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { login as apiLogin, getMe } from "../services/authServices.js";
import { setAuthToken } from "../utils/api";

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khi app load, kiểm tra token
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    console.log(`[AUTH CONTEXT] token: ${token}`)
    if (token) {
      setAuthToken(token);
      getMe()
        .then(profile => {
          console.log("getMe response:", profile);
          setUser(profile);
        })
        .catch(err => {
          console.error("getMe failed:", err);
          localStorage.removeItem("authToken");
          setAuthToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      const data = await apiLogin(credentials);
      localStorage.setItem("authToken", data.access_token);
      setAuthToken(data.access_token);

      const profile = await getMe();
      setUser(profile);
      console.log("AuthProvider - logged in, user:", profile);
      return profile;
    } catch (err) {
      console.error("AuthProvider - login failed:", err);
      throw err;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("authToken");
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook tiện lợi
export function useAuth() {
  return useContext(AuthContext);
}
