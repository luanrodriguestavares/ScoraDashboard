import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { User, Account, LoginCredentials } from '@/types/auth'
import { authApi } from '@/services/api'
import { getAccessToken, setTokens, logout as logoutAuth, refreshSession } from '@/services/auth'

interface AuthContextType {
    user: User | null
    account: Account | null
    isLoading: boolean
    login: (credentials: LoginCredentials) => Promise<User>
    logout: () => Promise<void>
    refreshUser: () => Promise<void>
    isAuthenticated: boolean
    hasRole: (role: string) => boolean
    isSuperAdmin: boolean
    isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
    children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null)
    const [account, setAccount] = useState<Account | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const login = useCallback(async (credentials: LoginCredentials) => {
        try {
            const { token, refreshToken, expiresAt } = await authApi.login(credentials)
            setTokens({ accessToken: token, refreshToken, expiresAt })

            const session = await authApi.me()
            setUser(session.user)
            setAccount(session.account)
            return session.user
        } catch (error) {
            throw new Error('Falha no login')
        }
    }, [])

    const logout = useCallback(async () => {
        await logoutAuth()
        setUser(null)
        setAccount(null)
    }, [])

    const refreshUser = useCallback(async () => {
        const { user, account } = await authApi.me()
        setUser(user)
        setAccount(account)
    }, [])

    useEffect(() => {
        const restoreSession = async () => {
            let token = getAccessToken()
            if (!token) {
                token = await refreshSession()
            }
            if (!token) {
                setIsLoading(false)
                return
            }

            return authApi.me()
        }

        restoreSession()
            .then((session) => {
                if (!session) return
                setUser(session.user)
                setAccount(session.account)
            })
            .catch(() => {
                logoutAuth()
                setUser(null)
                setAccount(null)
            })
            .finally(() => setIsLoading(false))
    }, [])

    useEffect(() => {
        const handleUnauthorized = () => {
            logout()
        }
        window.addEventListener('auth:unauthorized', handleUnauthorized)
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }, [logout])

    const hasRole = (role: string) => {
        return user?.role === role
    }

    const value: AuthContextType = {
        user,
        account,
        isLoading,
        login,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        hasRole,
        isSuperAdmin: user?.role === 'super_admin',
        isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
