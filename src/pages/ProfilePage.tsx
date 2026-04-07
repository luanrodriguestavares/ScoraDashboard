import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/hooks/useAuth'
import { usersApi } from '@/services/api'
import { handleApiError, handleSuccess } from '@/services/error-handler'
import { User, Mail, Lock, Key, Eye, EyeOff, Check, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ProfilePage() {
    const { t } = useLanguage()
    const { user, refreshUser, isSuperAdmin } = useAuth()
    const [isPasswordOpen, setIsPasswordOpen] = useState(false)
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [profileData, setProfileData] = useState({
        name: user?.name || 'João Silva',
        email: user?.email || 'joao@empresa.com',
    })
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: '',
    })
    const [hasChanges, setHasChanges] = useState(false)
    const photoInputRef = useRef<HTMLInputElement>(null)

    const uploadPhotoMutation = useMutation({
        mutationFn: async (file: File) => {
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const img = new Image()
                const objectUrl = URL.createObjectURL(file)
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    canvas.width = 128
                    canvas.height = 128
                    const ctx = canvas.getContext('2d')!
                    ctx.drawImage(img, 0, 0, 128, 128)
                    URL.revokeObjectURL(objectUrl)
                    resolve(canvas.toDataURL('image/jpeg', 0.85))
                }
                img.onerror = reject
                img.src = objectUrl
            })
            return usersApi.uploadPhoto(user!.id, dataUrl)
        },
        onSuccess: () => {
            handleSuccess('Foto atualizada com sucesso')
            refreshUser()
        },
        onError: (err) => handleApiError(err, 'Erro ao atualizar foto'),
    })

    const updateProfileMutation = useMutation({
        mutationFn: (payload: { name: string; email: string }) =>
            usersApi.update(user!.id, payload),
        onSuccess: () => {
            handleSuccess('Perfil atualizado com sucesso')
            setHasChanges(false)
            refreshUser()
        },
        onError: (err) => handleApiError(err, 'Erro ao atualizar perfil'),
    })

    const updatePasswordMutation = useMutation({
        mutationFn: (payload: { password: string; currentPassword: string }) =>
            usersApi.update(user!.id, payload),
        onSuccess: () => {
            handleSuccess('Senha alterada com sucesso')
            setPasswords({ current: '', new: '', confirm: '' })
            setIsPasswordOpen(false)
            refreshUser()
        },
        onError: (err) => handleApiError(err, 'Erro ao alterar senha'),
    })

    const handleProfileChange = (field: string, value: string) => {
        setProfileData({ ...profileData, [field]: value })
        setHasChanges(true)
    }

    const handleSaveProfile = () => {
        if (!user?.id) return
        updateProfileMutation.mutate({
            name: profileData.name,
            email: profileData.email,
        })
    }

    const handleChangePassword = () => {
        if (!user?.id) return
        updatePasswordMutation.mutate({
            password: passwords.new,
            currentPassword: passwords.current,
        })
    }

    const passwordsMatch = passwords.new === passwords.confirm && passwords.new.length >= 8
    const passwordStrength =
        passwords.new.length >= 12 ? 'strong' : passwords.new.length >= 8 ? 'medium' : 'weak'

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h2 className="text-3xl font-heading font-bold">{t.profile.title}</h2>
                <p className="text-muted-foreground">{t.profile.subtitle}</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {t.profile.personalInfo}
                    </CardTitle>
                    <CardDescription>{t.profile.personalInfoDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            className="relative h-16 w-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-xl font-bold text-primary hover:opacity-80 transition-opacity group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            title="Clique para alterar a foto"
                        >
                            {user?.photo_url ? (
                                <img
                                    src={user.photo_url}
                                    alt={profileData.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                profileData.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .slice(0, 2)
                            )}
                            <span className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center text-[11px] text-white font-normal">
                                Editar
                            </span>
                        </button>
                        <input
                            ref={photoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) uploadPhotoMutation.mutate(file)
                                e.target.value = ''
                            }}
                        />
                        <div>
                            <p className="font-medium">{profileData.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {user?.role === 'super_admin'
                                    ? 'Super Admin'
                                    : user?.role === 'admin'
                                      ? 'Admin'
                                      : 'Member'}
                            </p>
                            {uploadPhotoMutation.isPending && (
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Enviando foto...
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t.profile.name}</Label>
                            <Input
                                id="name"
                                value={profileData.name}
                                onChange={(e) => handleProfileChange('name', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">{t.profile.email}</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    className="pl-10"
                                    value={profileData.email}
                                    onChange={(e) => handleProfileChange('email', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {hasChanges && (
                        <div className="flex justify-end">
                            <Button
                                onClick={handleSaveProfile}
                                disabled={updateProfileMutation.isPending}
                            >
                                <Check className="h-4 w-4 mr-2" />
                                {updateProfileMutation.isPending ? 'Salvando...' : t.common.save}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        {t.profile.password}
                    </CardTitle>
                    <CardDescription>{t.profile.passwordDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Key className="h-4 w-4 mr-2" />
                                {t.profile.changePassword}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t.profile.changePassword}</DialogTitle>
                                <DialogDescription>
                                    {t.profile.changePasswordDescription}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>{t.profile.currentPassword}</Label>
                                    <div className="relative">
                                        <Input
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={passwords.current}
                                            onChange={(e) =>
                                                setPasswords({
                                                    ...passwords,
                                                    current: e.target.value,
                                                })
                                            }
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full"
                                            onClick={() =>
                                                setShowCurrentPassword(!showCurrentPassword)
                                            }
                                        >
                                            {showCurrentPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t.profile.newPassword}</Label>
                                    <div className="relative">
                                        <Input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={passwords.new}
                                            onChange={(e) =>
                                                setPasswords({ ...passwords, new: e.target.value })
                                            }
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    {passwords.new && (
                                        <div className="flex gap-1 mt-2">
                                            <div
                                                className={cn(
                                                    'h-1 flex-1 rounded',
                                                    passwordStrength === 'weak'
                                                        ? 'bg-destructive'
                                                        : 'bg-decision-allow'
                                                )}
                                            />
                                            <div
                                                className={cn(
                                                    'h-1 flex-1 rounded',
                                                    passwordStrength === 'weak'
                                                        ? 'bg-muted'
                                                        : passwordStrength === 'medium'
                                                          ? 'bg-decision-review'
                                                          : 'bg-decision-allow'
                                                )}
                                            />
                                            <div
                                                className={cn(
                                                    'h-1 flex-1 rounded',
                                                    passwordStrength === 'strong'
                                                        ? 'bg-decision-allow'
                                                        : 'bg-muted'
                                                )}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>{t.profile.confirmPassword}</Label>
                                    <Input
                                        type="password"
                                        value={passwords.confirm}
                                        onChange={(e) =>
                                            setPasswords({ ...passwords, confirm: e.target.value })
                                        }
                                    />
                                    {passwords.confirm && !passwordsMatch && (
                                        <p className="text-sm text-destructive">
                                            {t.profile.passwordsDoNotMatch}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsPasswordOpen(false)}>
                                    {t.common.cancel}
                                </Button>
                                <Button
                                    onClick={handleChangePassword}
                                    disabled={
                                        !passwordsMatch ||
                                        !passwords.current ||
                                        updatePasswordMutation.isPending
                                    }
                                >
                                    {updatePasswordMutation.isPending
                                        ? 'Alterando...'
                                        : t.profile.updatePassword}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>

            {!isSuperAdmin && (
                <Card className="border-destructive/50">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            {t.profile.dangerZone}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="font-medium">{t.profile.deleteAccount}</p>
                                <p className="text-sm text-muted-foreground">
                                    {t.profile.deleteAccountDescription}
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    A autogestão de exclusão ainda não está disponível nesta API.
                                    Hoje a exclusão exige operação administrativa controlada.
                                </p>
                            </div>
                            <Button variant="destructive" disabled>
                                {t.profile.deleteAccount}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
