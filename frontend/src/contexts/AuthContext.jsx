import React, { createContext, useContext, useState, useEffect } from "react";
import { login as apiLogin, getMe } from "../services/authServices.js";
import { setAuthToken } from "../utils/api";

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // profile object or null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // khi app load, kiểm tra token
    const token = localStorage.getItem("authToken");
    if (token) {
      setAuthToken(token);
      // fetch profile
      getMe()
        .then(profile => setUser(profile))
        .catch(() => {
          // token invalid
          localStorage.removeItem("authToken");
          setAuthToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const data = await apiLogin(credentials);
    // lưu token
    localStorage.setItem("authToken", data.access_token);
    setAuthToken(data.access_token);
    // lấy profile
    const profile = await getMe();
    setUser(profile);
    return profile;
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
