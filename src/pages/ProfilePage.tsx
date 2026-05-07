import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
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
import { User, Mail, Lock, Key, Eye, EyeOff, Check, AlertTriangle, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'

function getPasswordStrength(pw: string): 'weak' | 'medium' | 'strong' {
    const types = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((r) => r.test(pw)).length
    if (pw.length < 8 || types < 2) return 'weak'
    if (pw.length < 12 || types < 3) return 'medium'
    return 'strong'
}

type StrengthKey = 'weak' | 'medium' | 'strong'
const STRENGTH_BARS: Record<StrengthKey, { bars: number; color: string }> = {
    weak:   { bars: 1, color: 'bg-destructive' },
    medium: { bars: 2, color: 'bg-amber-400' },
    strong: { bars: 3, color: 'bg-primary' },
}

export function ProfilePage() {
    const { t } = useLanguage()
    const { user, refreshUser, isSuperAdmin } = useAuth()

    const strengthLabel: Record<StrengthKey, string> = {
        weak: t.common.passwordWeak,
        medium: t.common.passwordMedium,
        strong: t.common.passwordStrong,
    }
    const [isPasswordOpen, setIsPasswordOpen] = useState(false)
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [profileData, setProfileData] = useState({
        name: user?.name ?? '',
        email: user?.email ?? '',
    })
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
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
                    canvas.getContext('2d')!.drawImage(img, 0, 0, 128, 128)
                    URL.revokeObjectURL(objectUrl)
                    resolve(canvas.toDataURL('image/jpeg', 0.85))
                }
                img.onerror = reject
                img.src = objectUrl
            })
            return usersApi.uploadPhoto(user!.id, dataUrl)
        },
        onSuccess: () => { handleSuccess(t.common.success); refreshUser() },
        onError: (err) => handleApiError(err, t.common.error),
    })

    const updateProfileMutation = useMutation({
        mutationFn: (payload: { name: string; email: string }) => usersApi.update(user!.id, payload),
        onSuccess: () => { handleSuccess(t.common.success); setHasChanges(false); refreshUser() },
        onError: (err) => handleApiError(err, t.common.error),
    })

    const updatePasswordMutation = useMutation({
        mutationFn: (payload: { password: string; currentPassword: string }) => usersApi.update(user!.id, payload),
        onSuccess: () => {
            handleSuccess(t.common.success)
            setPasswords({ current: '', new: '', confirm: '' })
            setIsPasswordOpen(false)
            refreshUser()
        },
        onError: (err) => handleApiError(err, t.common.error),
    })

    const initials = profileData.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

    const roleLabel =
        user?.role === 'super_admin' ? 'Super Admin' :
        user?.role === 'admin' ? 'Admin' : 'Member'

    const passwordStrength = passwords.new ? getPasswordStrength(passwords.new) : null
    const passwordsMatch = passwords.new === passwords.confirm && passwords.new.length >= 8

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold tracking-tight">{t.profile.title}</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">{t.profile.subtitle}</p>
            </div>

            {/* Main two-column grid */}
            <div className="grid gap-6 lg:grid-cols-2">

                {/* Identity card */}
                <div className="rounded-xl border bg-card p-6 space-y-6">
                    <div className="flex items-center gap-2 pb-4 border-b border-border">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <h2 className="text-sm font-medium">{t.profile.personalInfo}</h2>
                    </div>

                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            disabled={uploadPhotoMutation.isPending}
                            className="relative h-16 w-16 shrink-0 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-lg font-bold text-primary ring-2 ring-border hover:ring-primary/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group"
                        >
                            {user?.photo_url ? (
                                <img src={user.photo_url} alt={profileData.name} className="h-full w-full object-cover" />
                            ) : (
                                initials || <User className="h-6 w-6" />
                            )}
                            <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Camera className="h-4 w-4 text-white" />
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
                        <div className="min-w-0">
                            <p className="font-semibold truncate">{profileData.name || '—'}</p>
                            <p className="text-sm text-muted-foreground">{roleLabel}</p>
                            {uploadPhotoMutation.isPending && (
                                <p className="text-xs text-muted-foreground mt-0.5">{t.common.uploading}</p>
                            )}
                        </div>
                    </div>

                    {/* Fields */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name">{t.profile.name}</Label>
                            <Input
                                id="name"
                                value={profileData.name}
                                onChange={(e) => { setProfileData({ ...profileData, name: e.target.value }); setHasChanges(true) }}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="email">{t.profile.email}</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="email"
                                    type="email"
                                    className="pl-9"
                                    value={profileData.email}
                                    onChange={(e) => { setProfileData({ ...profileData, email: e.target.value }); setHasChanges(true) }}
                                />
                            </div>
                        </div>
                    </div>

                    {hasChanges && (
                        <div className="pt-2 flex justify-end">
                            <Button
                                size="sm"
                                onClick={() => updateProfileMutation.mutate(profileData)}
                                disabled={updateProfileMutation.isPending}
                            >
                                <Check className="mr-1.5 h-3.5 w-3.5" />
                                {updateProfileMutation.isPending ? t.common.saving : t.common.save}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Security card */}
                <div className="rounded-xl border bg-card p-6 space-y-6">
                    <div className="flex items-center gap-2 pb-4 border-b border-border">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <h2 className="text-sm font-medium">{t.profile.password}</h2>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{t.profile.passwordDescription}</p>
                        <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Key className="mr-1.5 h-3.5 w-3.5" />
                                    {t.profile.changePassword}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm">
                                <DialogHeader>
                                    <DialogTitle>{t.profile.changePassword}</DialogTitle>
                                    <DialogDescription>{t.profile.changePasswordDescription}</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                    <div className="space-y-1.5">
                                        <Label>{t.profile.currentPassword}</Label>
                                        <div className="relative">
                                            <Input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                value={passwords.current}
                                                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword((v) => !v)}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>{t.profile.newPassword}</Label>
                                        <div className="relative">
                                            <Input
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={passwords.new}
                                                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword((v) => !v)}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {passwordStrength && (
                                            <div className="space-y-1">
                                                <div className="flex gap-1">
                                                    {[1, 2, 3].map((bar) => (
                                                        <div
                                                            key={bar}
                                                            className={cn(
                                                                'h-1 flex-1 rounded-full transition-colors',
                                                                bar <= STRENGTH_BARS[passwordStrength].bars
                                                                    ? STRENGTH_BARS[passwordStrength].color
                                                                    : 'bg-muted'
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                                <p className={cn('text-xs',
                                                    passwordStrength === 'strong' ? 'text-primary' :
                                                    passwordStrength === 'medium' ? 'text-amber-500' : 'text-destructive'
                                                )}>
                                                    {strengthLabel[passwordStrength]}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>{t.profile.confirmPassword}</Label>
                                        <Input
                                            type="password"
                                            value={passwords.confirm}
                                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                        />
                                        {passwords.confirm && !passwordsMatch && (
                                            <p className="text-xs text-destructive">{t.profile.passwordsDoNotMatch}</p>
                                        )}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" size="sm" onClick={() => setIsPasswordOpen(false)}>
                                        {t.common.cancel}
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => updatePasswordMutation.mutate({ password: passwords.new, currentPassword: passwords.current })}
                                        disabled={!passwordsMatch || !passwords.current || updatePasswordMutation.isPending}
                                    >
                                        {updatePasswordMutation.isPending ? t.common.changing : t.profile.updatePassword}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* Danger zone - full width */}
            {!isSuperAdmin && (
                <div className="rounded-xl border border-destructive/30 bg-card p-6">
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-destructive/20">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <h2 className="text-sm font-medium text-destructive">{t.profile.dangerZone}</h2>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                        <div className="space-y-1">
                            <p className="text-sm font-medium">{t.profile.deleteAccount}</p>
                            <p className="text-sm text-muted-foreground">{t.profile.deleteAccountDescription}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t.profile.deleteAccountNote}
                            </p>
                        </div>
                        <Button variant="destructive" size="sm" disabled className="shrink-0">
                            {t.profile.deleteAccount}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
