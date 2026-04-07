import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useLanguage, Language } from '@/contexts/LanguageContext'
import { Moon, Sun, LogOut, Globe, User, Check } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNavigate } from 'react-router-dom'
import { ReactNode } from 'react'

interface HeaderProps {
    leftContent?: ReactNode
    rightContent?: ReactNode
}

function UserMenu() {
    const { user, logout } = useAuth()
    const { isDark, toggle } = useTheme()
    const { language, setLanguage, t } = useLanguage()
    const navigate = useNavigate()

    if (!user) return null

    const initials = user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <button className="h-8 w-8 rounded-full overflow-hidden border border-border bg-primary/10 flex items-center justify-center text-[12px] font-semibold text-primary hover:ring-2 hover:ring-primary/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {user.photo_url ? (
                        <img
                            src={user.photo_url}
                            alt={user.name}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        initials || <User className="h-4 w-4" />
                    )}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal py-2">
                    <p className="text-[13px] font-semibold leading-none">{user.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 truncate">{user.email}</p>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
                    <User className="h-4 w-4 mr-2" />
                    {t.header.profile}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={toggle}>
                    {isDark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                    {isDark
                        ? language === 'pt-BR'
                            ? 'Tema Claro'
                            : 'Light Theme'
                        : language === 'pt-BR'
                          ? 'Tema Escuro'
                          : 'Dark Theme'}
                </DropdownMenuItem>

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Globe className="h-4 w-4 mr-2" />
                        {language === 'pt-BR' ? 'Idioma' : 'Language'}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => setLanguage('pt-BR')}>
                            {language === 'pt-BR' && <Check className="h-3.5 w-3.5 mr-2" />}
                            <span className={language !== 'pt-BR' ? 'ml-5' : ''}>Português</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLanguage('en' as Language)}>
                            {language === 'en' && <Check className="h-3.5 w-3.5 mr-2" />}
                            <span className={language !== 'en' ? 'ml-5' : ''}>English</span>
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={logout}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t.nav.logout}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export function Header({ leftContent, rightContent }: HeaderProps) {
    const { isDark } = useTheme()

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-sidebar-border bg-sidebar backdrop-blur-sm">
            <div className="flex h-14 items-center justify-between px-4 md:px-5">
                <div className="flex items-center gap-2 md:gap-3">
                    {leftContent}
                    <div className="flex items-center">
                        <img
                            src={isDark ? '/img/ScoraLogo.png' : '/img/ScoraLogoDark.png'}
                            alt="Scora"
                            className="h-10 w-auto"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-0.5 md:gap-1 pr-[8px]">
                    {rightContent}
                    <UserMenu />
                </div>
            </div>
        </header>
    )
}
