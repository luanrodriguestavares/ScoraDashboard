import { useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { accountsApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'

export function CompanySetupModal() {
    const { account, refreshUser, isAdmin, isSuperAdmin } = useAuth()
    const { toast } = useToast()
    const [company, setCompany] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const open = !!account && !account.company_name && isAdmin && !isSuperAdmin

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const trimmed = company.trim()
        if (!account || !trimmed) return
        setIsLoading(true)
        try {
            await accountsApi.update(account.id, { company_name: trimmed })
            await refreshUser()
        } catch {
            toast({ variant: 'warning', title: 'Erro ao salvar. Tente novamente.' })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <DialogPrimitive.Root open={open}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm" />
                <DialogPrimitive.Content
                    className="fixed left-1/2 top-1/2 z-[201] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg"
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                >
                    <div className="flex flex-col items-center gap-4 text-center mb-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Qual é o nome da sua empresa?</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Precisamos disso para finalizar a configuração da sua conta.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            placeholder="Minha Empresa Ltda"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            required
                            minLength={2}
                            disabled={isLoading}
                            autoFocus
                        />
                        <Button type="submit" className="w-full" disabled={isLoading || !company.trim()}>
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                                    Salvando...
                                </>
                            ) : (
                                'Continuar'
                            )}
                        </Button>
                    </form>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}
