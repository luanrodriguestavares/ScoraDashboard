import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useToast } from '@/hooks/use-toast'
import { GoogleLogin } from '@react-oauth/google'
import { UserPlus, Eye, EyeOff } from 'lucide-react'

function getPasswordStrength(password: string): 'empty' | 'weak' | 'medium' | 'strong' {
    if (!password) return 'empty'
    const hasLower = /[a-z]/.test(password)
    const hasUpper = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecial = /[^a-zA-Z0-9]/.test(password)
    const types = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length
    if (password.length < 8 || types < 2) return 'weak'
    if (password.length < 12 || types < 3) return 'medium'
    return 'strong'
}

export default function Register() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { register, loginWithGoogle } = useAuth()
    const { isDark, toggle } = useTheme()
    const { toast } = useToast()
    const navigate = useNavigate()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        try {
            await register({ name, email, password })
            navigate('/dashboard')
        } catch (err) {
            const msg = err instanceof Error ? err.message : ''
            if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('conflict')) {
                setError('Este email já está cadastrado.')
            } else {
                setError(msg || 'Erro ao criar conta.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    async function handleGoogle(credential: string) {
        setIsLoading(true)
        setError(null)
        try {
            const user = await loginWithGoogle(credential)
            navigate(user.role === 'super_admin' ? '/admin/overview' : '/dashboard')
        } catch {
            toast({ variant: 'warning', title: 'Falha ao entrar com Google' })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 items-center justify-center">
                        <img
                            src={isDark ? '/img/ScoraLogo.png' : '/img/ScoraLogoDark.png'}
                            alt="Scora"
                            className="h-10 w-auto"
                        />
                    </div>
                    <CardTitle className="text-2xl font-heading">Criar conta</CardTitle>
                    <CardDescription>Em menos de 5 minutos sua API estará pronta para integração.</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium">Nome completo</label>
                            <Input
                                id="name"
                                placeholder="João Silva"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                minLength={3}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">Email</label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="joao@empresa.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium">Senha</label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Mínimo 8 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    className="pr-10"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {(() => {
                                const strength = getPasswordStrength(password)
                                if (strength === 'empty') return null
                                const widths = { weak: 'w-1/3', medium: 'w-2/3', strong: 'w-full' }
                                const colors = { weak: 'bg-red-500', medium: 'bg-yellow-400', strong: 'bg-green-500' }
                                const labels = { weak: 'Fraca', medium: 'Média', strong: 'Forte' }
                                return (
                                    <div className="space-y-1">
                                        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-300 ${widths[strength]} ${colors[strength]}`} />
                                        </div>
                                        <p className={`text-xs ${colors[strength].replace('bg-', 'text-')}`}>{labels[strength]}</p>
                                    </div>
                                )
                            })()}
                        </div>

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                                    Criando conta...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Criar conta
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-card px-2 text-muted-foreground">ou</span>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={(res) => res.credential && handleGoogle(res.credential)}
                            onError={() => toast({ variant: 'warning', title: 'Falha ao entrar com Google' })}
                            width="352"
                            text="signup_with"
                            shape="rectangular"
                        />
                    </div>

                    <div className="text-center text-sm text-muted-foreground">
                        <button
                            type="button"
                            className="underline hover:text-foreground"
                            onClick={() => navigate('/login')}
                        >
                            Já tem conta? Entrar
                        </button>
                    </div>

                    <p className="text-center text-xs text-muted-foreground leading-relaxed">
                        Ao criar sua conta, você concorda com os{' '}
                        <span className="underline underline-offset-2 cursor-pointer hover:text-foreground">Termos de Uso</span>
                        {' '}e a{' '}
                        <span className="underline underline-offset-2 cursor-pointer hover:text-foreground">Política de Privacidade</span>.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
