import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTheme } from '@/hooks/useTheme'
import { useToast } from '@/hooks/use-toast'
import { Moon, Sun, UserPlus, Eye, EyeOff } from 'lucide-react'
import { authApi } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { setTokens } from '@/services/auth'

export default function Register() {
    const [name, setName] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const { isDark, toggle } = useTheme()
    const navigate = useNavigate()
    const { refreshUser } = useAuth()
    const { toast } = useToast()

    const passwordRules = [
        { ok: password.length >= 8 },
        { ok: /[A-Za-z]/.test(password) },
        { ok: /\d/.test(password) },
    ]
    const passwordValid = passwordRules.every((r) => r.ok)
    const strengthPoints =
        (password.length >= 8 ? 1 : 0) +
        (/[A-Za-z]/.test(password) ? 1 : 0) +
        (/\d/.test(password) ? 1 : 0) +
        (/[^A-Za-z0-9]/.test(password) ? 1 : 0)
    const strengthLevel =
        strengthPoints <= 1 ? 'fraca' : strengthPoints === 2 ? 'intermediaria' : 'forte'
    const strengthPercent =
        strengthLevel === 'fraca' ? 33 : strengthLevel === 'intermediaria' ? 66 : 100
    const strengthTip =
        strengthLevel === 'fraca'
            ? 'Use 8+ caracteres com letras e números.'
            : strengthLevel === 'intermediaria'
              ? 'Adicione um símbolo para fortalecer.'
              : 'Senha forte. Evite reutilizar.'

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        if (!passwordValid) {
            toast({
                variant: 'warning',
                title: 'Senha inválida',
                description: 'A senha deve ter ao menos 8 caracteres, 1 letra e 1 número.',
            })
            setIsLoading(false)
            return
        }

        try {
            const response = await authApi.register({
                name,
                email,
                password,
                company_name: companyName || undefined,
                account_name: companyName || name,
            })

            setTokens({
                accessToken: response.token,
                refreshToken: response.refreshToken,
                expiresAt: response.expiresAt,
            })
            await refreshUser()
            navigate(response.user.role === 'super_admin' ? '/admin/overview' : '/dashboard')
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'Falha no cadastro',
                description: err instanceof Error ? err.message : 'Não foi possível criar a conta.',
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="absolute top-4 right-4">
                <Button variant="ghost" size="icon" onClick={toggle} className="w-9 h-9">
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
            </div>

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
                    <CardDescription>Cadastre sua empresa e comece a usar a API</CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium">
                                Nome do responsável
                            </label>
                            <Input
                                id="name"
                                placeholder="Seu nome"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="company" className="text-sm font-medium">
                                Nome da empresa
                            </label>
                            <Input
                                id="company"
                                placeholder="Nome da empresa"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium">
                                Senha
                            </label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {password.length > 0 && (
                                <div className="space-y-2">
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                        <div
                                            className={
                                                strengthLevel === 'fraca'
                                                    ? 'h-full bg-destructive/70'
                                                    : strengthLevel === 'intermediaria'
                                                      ? 'h-full bg-primary/60'
                                                      : 'h-full bg-primary'
                                            }
                                            style={{ width: `${strengthPercent}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {strengthTip}
                                    </div>
                                </div>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                    Criando...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Criar conta
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        <button
                            type="button"
                            className="underline hover:text-foreground"
                            onClick={() => navigate('/login')}
                        >
                            Já tem conta? Entrar
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
