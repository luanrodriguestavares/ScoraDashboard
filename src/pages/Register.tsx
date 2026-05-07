import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useToast } from '@/hooks/use-toast'
import { GoogleLogin } from '@react-oauth/google'
import { Eye, EyeOff, UserPlus } from 'lucide-react'

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

const legalContent = {
    terms: {
        title: 'Termos de Uso',
        description: 'Regras, responsabilidades e condições para utilização da plataforma Scora.',
        sections: [
            {
                heading: '1. Aceitação dos termos',
                body: 'Ao acessar ou utilizar o Scora Dashboard, APIs, painéis administrativos ou qualquer serviço relacionado, você concorda com estes Termos de Uso e com a Política de Privacidade vigente.',
            },
            {
                heading: '2. Uso permitido da plataforma',
                body: 'Você concorda em utilizar a plataforma apenas para fins legítimos, respeitando a legislação aplicável, direitos de terceiros e as diretrizes operacionais e técnicas definidas pelo Scora.',
            },
            {
                heading: '3. Responsabilidade pela conta',
                body: 'O usuário é responsável pela segurança e confidencialidade das credenciais de acesso, bem como por todas as atividades realizadas em sua conta, incluindo integrações, tokens de API, usuários convidados e ações administrativas.',
            },
            {
                heading: '4. APIs e integrações',
                body: 'O uso das APIs do Scora deve respeitar limites técnicos, políticas de uso justo, autenticação adequada e práticas de segurança. Tentativas de abuso, automações maliciosas ou exploração de vulnerabilidades poderão resultar em bloqueio imediato.',
            },
            {
                heading: '5. Disponibilidade e modificações',
                body: 'O Scora poderá atualizar, modificar, suspender ou remover funcionalidades, endpoints, limites técnicos, fluxos internos e requisitos operacionais a qualquer momento para evolução da plataforma, segurança, estabilidade e conformidade legal.',
            },
            {
                heading: '6. Propriedade intelectual',
                body: 'Todos os elementos da plataforma, incluindo código, design, identidade visual, documentação, arquitetura, marca e materiais relacionados ao Scora permanecem protegidos por direitos autorais e propriedade intelectual.',
            },
            {
                heading: '7. Limitação de responsabilidade',
                body: 'Embora adotemos boas práticas de segurança, monitoramento e disponibilidade, o Scora não garante operação ininterrupta ou ausência total de falhas, indisponibilidades, atrasos ou perdas indiretas decorrentes do uso da plataforma.',
            },
            {
                heading: '8. Suspensão e encerramento',
                body: 'Contas que violem estes termos, pratiquem atividades abusivas, tentem explorar vulnerabilidades, realizem engenharia reversa ou utilizem o serviço de forma fraudulenta poderão ser suspensas, limitadas ou encerradas preventivamente.',
            },
            {
                heading: '9. Encerramento do uso',
                body: 'O usuário pode deixar de utilizar a plataforma a qualquer momento. Algumas informações poderão ser mantidas temporariamente para cumprimento de obrigações legais, auditoria, prevenção a fraudes e segurança operacional.',
            },
            {
                heading: '10. Atualização dos termos',
                body: 'Os presentes Termos de Uso poderão ser atualizados periodicamente. O uso continuado da plataforma após alterações será considerado como concordância com a versão vigente.',
            },
        ],
    },
    privacy: {
        title: 'Política de Privacidade',
        description: 'Como tratamos dados, informações técnicas e registros relacionados ao uso da plataforma Scora.',
        sections: [
            {
                heading: '1. Coleta de informações',
                body: 'Solicitamos informações pessoais apenas quando realmente necessárias para fornecer nossos serviços. Podemos coletar dados cadastrais como nome, e-mail, empresa, registros de acesso e informações técnicas relacionadas à autenticação, auditoria e segurança da plataforma.',
            },
            {
                heading: '2. Uso e finalidade dos dados',
                body: 'Os dados coletados são utilizados para criar e manter sua conta, permitir o uso do dashboard e da API, prestar suporte, melhorar a experiência da plataforma, reforçar medidas de segurança e cumprir obrigações legais e contratuais.',
            },
            {
                heading: '3. Retenção, armazenamento e proteção',
                body: 'Mantemos os dados apenas pelo tempo necessário para fornecer os serviços contratados ou cumprir exigências legais. As informações armazenadas são protegidas por medidas comercialmente aceitáveis para evitar perda, roubo, acesso não autorizado, divulgação, alteração ou destruição indevida.',
            },
            {
                heading: '4. Compartilhamento de informações',
                body: 'Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei ou quando necessário para a operação do serviço através de provedores e operadores essenciais, sempre respeitando critérios de minimização e necessidade de acesso.',
            },
            {
                heading: '5. Cookies e publicidade',
                body: 'O site pode utilizar cookies e tecnologias similares para melhorar a experiência de navegação, autenticação, métricas e segurança. Serviços de terceiros, como o Google AdSense, podem utilizar cookies para personalização de anúncios e limitação de frequência de exibição.',
            },
            {
                heading: '6. Links externos',
                body: 'Nosso site pode conter links para plataformas e serviços externos que não são operados pelo Scora. Não nos responsabilizamos pelas práticas, políticas ou conteúdos desses serviços de terceiros.',
            },
            {
                heading: '7. Direitos do titular',
                body: 'Você pode solicitar atualização, correção ou exclusão de dados pessoais quando aplicável, observadas as obrigações legais de retenção e os requisitos mínimos necessários para operação e segurança da conta.',
            },
            {
                heading: '8. Compromisso do usuário',
                body: 'O usuário compromete-se a utilizar a plataforma de forma lícita e adequada, não realizando atividades ilegais, abusivas ou que possam comprometer a integridade, disponibilidade e segurança dos sistemas do Scora ou de terceiros.',
            },
            {
                heading: '9. Consentimento e continuidade de uso',
                body: 'O uso continuado da plataforma será considerado como aceitação das práticas descritas nesta Política de Privacidade. Caso tenha dúvidas sobre o tratamento de dados pessoais, entre em contato conosco.',
            },
        ],
    },
} as const

export default function Register() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [legalModal, setLegalModal] = useState<keyof typeof legalContent | null>(null)

    const { register, loginWithGoogle } = useAuth()
    const { isDark } = useTheme()
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

    const activeLegalContent = legalModal ? legalContent[legalModal] : null

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
                                placeholder="Seu nome"
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
                                placeholder="seu@email.com"
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
                        <button
                            type="button"
                            className="underline underline-offset-2 hover:text-foreground"
                            onClick={() => setLegalModal('terms')}
                        >
                            Termos de Uso
                        </button>
                        {' '}e a{' '}
                        <button
                            type="button"
                            className="underline underline-offset-2 hover:text-foreground"
                            onClick={() => setLegalModal('privacy')}
                        >
                            Política de Privacidade
                        </button>.
                    </p>
                </CardContent>
            </Card>

            <Dialog open={!!legalModal} onOpenChange={(open) => !open && setLegalModal(null)}>
                <DialogContent className="flex max-w-2xl max-h-[85vh] flex-col overflow-hidden">
                    {activeLegalContent && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{activeLegalContent.title}</DialogTitle>
                                <DialogDescription>{activeLegalContent.description}</DialogDescription>
                            </DialogHeader>
                            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-2 text-sm leading-6 text-muted-foreground scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/25 hover:scrollbar-thumb-muted-foreground/40">
                                {activeLegalContent.sections.map((section) => (
                                    <section key={section.heading} className="space-y-1">
                                        <h3 className="text-sm font-semibold text-foreground">{section.heading}</h3>
                                        <p>{section.body}</p>
                                    </section>
                                ))}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
