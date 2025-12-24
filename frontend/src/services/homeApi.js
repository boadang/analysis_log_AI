const API_PREFIX = "http://127.0.0.1:8000/api/v1";

async function request(path, options = {}) {
  const token = localStorage.getItem("authToken");

  if (!token) {
    throw new Error("Chưa đăng nhập hoặc token bị mất");
  }

  const res = await fetch(`${API_PREFIX}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    throw new Error("Token không hợp lệ hoặc đã hết hạn");
  }

  if (!res.ok) {
    let err;
    try {
      err = await res.json();
    } catch {
      throw new Error("API error");
    }

    console.error("API error detail:", err);

    throw err;
  }

    return res.json();
}

export default function getHomeData() {
    return request(`/home/get-data`)
}