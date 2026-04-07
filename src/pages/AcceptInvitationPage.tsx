import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/services/api'
import { setTokens } from '@/services/auth'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, Loader2, Mail, ShieldCheck } from 'lucide-react'

export function AcceptInvitationPage() {
    const { token } = useParams<{ token: string }>()
    const navigate = useNavigate()
    const { refreshUser } = useAuth()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [invitation, setInvitation] = useState<null | {
        id: string
        token: string
        name: string
        email: string
        role: string
        expires_at: string
        account: {
            id: string
            name: string
            company_name?: string
        }
    }>(null)
    const [errorState, setErrorState] = useState<string | null>(null)

    useEffect(() => {
        if (!token) {
            setErrorState('Token de convite não encontrado.')
            setIsLoading(false)
            return
        }

        authApi
            .getInvitation(token)
            .then((data) => setInvitation(data))
            .catch((error) =>
                setErrorState(
                    error instanceof Error ? error.message : 'Não foi possível carregar o convite.'
                )
            )
            .finally(() => setIsLoading(false))
    }, [token])

    const passwordValid = useMemo(
        () => password.length >= 8 && password === confirmPassword,
        [password, confirmPassword]
    )

    const handleAccept = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!token || !passwordValid) return

        setIsSubmitting(true)
        try {
            const response = await authApi.acceptInvitation(token, { password })
            setTokens({
                accessToken: response.token,
                refreshToken: response.refreshToken,
                expiresAt: response.expiresAt,
            })
            await refreshUser()
            toast({
                title: 'Convite aceito',
                description: 'Seu acesso administrativo foi ativado.',
            })
            navigate('/dashboard')
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Falha ao aceitar convite',
                description: error instanceof Error ? error.message : 'Tente novamente.',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-heading">
                        Ative seu acesso administrativo
                    </CardTitle>
                    <CardDescription>
                        Defina sua senha para concluir o onboarding inicial.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : errorState ? (
                        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                            {errorState}
                        </div>
                    ) : invitation ? (
                        <form className="space-y-4" onSubmit={handleAccept}>
                            <div className="rounded-xl border bg-muted/20 p-4">
                                <p className="text-sm font-medium">{invitation.account.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {invitation.account.company_name || invitation.name}
                                </p>
                                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                                    <Mail className="h-4 w-4" />
                                    <span>{invitation.email}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Nome</Label>
                                <Input value={invitation.name} disabled />
                            </div>

                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input value={invitation.email} disabled />
                            </div>

                            <div className="space-y-2">
                                <Label>Senha</Label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Pelo menos 8 caracteres"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((value) => !value)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Confirmar senha</Label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repita sua senha"
                                />
                                {confirmPassword && !passwordValid && (
                                    <p className="text-sm text-destructive">
                                        As senhas devem coincidir e conter pelo menos 8 caracteres.
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={!passwordValid || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Ativando...
                                    </>
                                ) : (
                                    'Ativar acesso'
                                )}
                            </Button>
                        </form>
                    ) : null}
                </CardContent>
            </Card>
        </div>
    )
}
