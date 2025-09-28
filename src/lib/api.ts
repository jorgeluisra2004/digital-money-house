const BASE_URL = "https://api.digitalhouse.com"; // ⚠️ reemplazar con el link real del Swagger

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Error en login");
  return res.json();
}

export async function register(user: { email: string; password: string; name: string }) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error("Error en registro");
  return res.json();
}
