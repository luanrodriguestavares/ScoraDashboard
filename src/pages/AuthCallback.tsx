import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { setTokens } from '@/services/auth'

export default function AuthCallback() {
    const [searchParams] = useSearchParams()

    useEffect(() => {
        const token = searchParams.get('token')

        if (!token) {
            window.location.href = '/login'
            return
        }

        const refreshToken = searchParams.get('refreshToken')
        const expiresAt = searchParams.get('expiresAt')

        setTokens({
            accessToken: token,
            refreshToken: refreshToken ?? undefined,
            expiresAt: expiresAt ? Number(expiresAt) : undefined,
        })

        window.location.href = '/dashboard/api-keys'
    }, [searchParams])

    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <p className="text-sm text-muted-foreground">Configurando sua conta...</p>
            </div>
        </div>
    )
}
