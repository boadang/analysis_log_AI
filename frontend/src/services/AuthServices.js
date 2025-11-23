import api, { setAuthToken } from "../utils/api";

export async function login({ email, password }) {
  const res = await api.post("http://127.0.0.1:8000/auth/login", { email, password });
  return res.data; // giả sử { access_token, token_type }
}

export async function register(payload) {
  const res = await api.post("/auth/register", payload);
  return res.data;
}

export async function getMe() {
  const res = await api.get("http://127.0.0.1:8000/auth/me"); // hoặc /users/me tùy BE
  return res.data; // profile
}
