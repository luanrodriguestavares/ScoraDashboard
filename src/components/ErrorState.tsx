import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'
import { AlertCircle, RefreshCw, WifiOff, ServerCrash, FileWarning } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
    type?: 'network' | 'server' | 'notFound' | 'generic'
    title?: string
    description?: string
    onRetry?: () => void
    className?: string
}

export function ErrorState({
    type = 'generic',
    title,
    description,
    onRetry,
    className,
}: ErrorStateProps) {
    const { t } = useLanguage()

    const config = {
        network: {
            icon: WifiOff,
            title: t.errors.networkTitle,
            description: t.errors.networkDescription,
        },
        server: {
            icon: ServerCrash,
            title: t.errors.serverTitle,
            description: t.errors.serverDescription,
        },
        notFound: {
            icon: FileWarning,
            title: t.errors.notFoundTitle,
            description: t.errors.notFoundDescription,
        },
        generic: {
            icon: AlertCircle,
            title: t.errors.genericTitle,
            description: t.errors.genericDescription,
        },
    }

    const errorConfig = config[type]
    const Icon = errorConfig.icon

    return (
        <Card className={cn('border-destructive/30', className)}>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <Icon className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title || errorConfig.title}</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                    {description || errorConfig.description}
                </p>
                {onRetry && (
                    <Button onClick={onRetry} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {t.errors.retry}
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}

interface EmptyStateProps {
    icon?: typeof AlertCircle
    title: string
    description?: string
    action?: {
        label: string
        onClick: () => void
    }
    className?: string
}

export function EmptyState({
    icon: Icon = FileWarning,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <Card className={className}>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Icon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                {description && (
                    <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
                )}
                {action && <Button onClick={action.onClick}>{action.label}</Button>}
            </CardContent>
        </Card>
    )
}
