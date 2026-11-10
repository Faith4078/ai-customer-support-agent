const STORAGE_KEY = "dashboard-auth"

function getAuth(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export function saveLogin(username: string, password: string) {
  localStorage.setItem(STORAGE_KEY, btoa(`${username}:${password}`))
}

export function isLoggedIn(): boolean {
  return getAuth() !== null
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY)
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const auth = getAuth()
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      ...(auth ? { Authorization: `Basic ${auth}` } : {}),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  })
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}
