const TOKEN_KEY = 'scora_token'
const REFRESH_TOKEN_KEY = 'scora_refresh_token'
const TOKEN_EXPIRY_KEY = 'scora_token_expiry'
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface AuthTokens {
    accessToken: string
    refreshToken?: string
    expiresAt?: number
}

export function getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getAccessToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return null

    if (isTokenExpired(token)) {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(TOKEN_EXPIRY_KEY)
        return null
    }

    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY)
    if (expiryTime) {
        const expiresAt = parseInt(expiryTime, 10)
        if (Number.isFinite(expiresAt) && Date.now() >= expiresAt) {
            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem(TOKEN_EXPIRY_KEY)
            return null
        }
    }

    return token
}

export function setTokens(tokens: AuthTokens): void {
    localStorage.setItem(TOKEN_KEY, tokens.accessToken)

    if (tokens.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
    }

    const tokenExpiry = getTokenExpiry(tokens.accessToken)
    const expiresAt = tokens.expiresAt || (tokenExpiry ? tokenExpiry * 1000 : Date.now() + 3600000)
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString())
}

export function clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
}

export function isAuthenticated(): boolean {
    return getAccessToken() !== null
}

export function decodeToken(token: string): Record<string, any> | null {
    try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
                .join('')
        )
        return JSON.parse(jsonPayload)
    } catch {
        return null
    }
}

export function isTokenExpired(token: string): boolean {
    const decoded = decodeToken(token)
    if (!decoded || !decoded.exp) return true

    return Date.now() >= decoded.exp * 1000
}

export function getTokenExpiry(token: string): number | null {
    const decoded = decodeToken(token)
    return decoded?.exp || null
}

export async function logout(): Promise<void> {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
        try {
            await fetch(`${API_BASE_URL}/v1/admin/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            })
        } catch {
        }
    }
    clearTokens()
}

export async function refreshSession(): Promise<string | null> {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
        clearTokens()
        return null
    }

    try {
        const response = await fetch(`${API_BASE_URL}/v1/admin/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        })

        if (!response.ok) {
            clearTokens()
            return null
        }

        const payload = await response.json()
        const data = payload?.data ?? {}
        if (!data.token) {
            clearTokens()
            return null
        }

        setTokens({
            accessToken: data.token,
            refreshToken: data.refreshToken,
            expiresAt: data.expiresAt,
        })

        return data.token
    } catch {
        clearTokens()
        return null
    }
}
