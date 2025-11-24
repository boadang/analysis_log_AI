import api, { setAuthToken } from "../utils/api";

const API_URL = "http://127.0.0.1:8000/api/v1/auth/";

export async function login({ email, password }) {
  const res = await api.post(`${API_URL}login`, { email, password });
  return res.data;
}

export async function register(payload) {
  const res = await api.post(`${API_URL}register`, payload);
  return res.data;
}

export async function getMe() {
  const res = await api.get(`${API_URL}me`);
  return res.data;
}
