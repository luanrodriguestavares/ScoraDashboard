import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

interface ThemeContextType {
    isDark: boolean
    toggle: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('scora-theme')
            return saved === 'dark'
        }
        return false
    })

    useEffect(() => {
        const root = document.documentElement
        if (isDark) {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }
        localStorage.setItem('scora-theme', isDark ? 'dark' : 'light')
    }, [isDark])

    const toggle = () => setIsDark(!isDark)

    return <ThemeContext.Provider value={{ isDark, toggle }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
