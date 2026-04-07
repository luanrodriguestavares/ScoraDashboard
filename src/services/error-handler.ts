import { toast } from '@/hooks/use-toast'

export interface ApiErrorResponse {
    message?: string
    error?: string
    status?: number
}

function normalizeErrorMessage(error: unknown, fallback: string): string {
    const message = error instanceof Error ? error.message : fallback
    const lower = message.toLowerCase()

    if (
        lower.includes('only administrators can perform this action') ||
        lower.includes('forbidden') ||
        lower.includes('permission')
    ) {
        return 'Você não tem permissão para executar esta ação.'
    }

    return message
}

export function handleApiError(
    error: unknown,
    defaultMessage: string = 'An error occurred',
    title?: string
): void {
    const message = normalizeErrorMessage(error, defaultMessage)

    toast({
        title: title ?? 'Error',
        description: message,
        variant: 'destructive',
    })
}

export function handleSuccess(message: string, title?: string): void {
    toast({
        title: title ?? 'Success',
        description: message,
        variant: 'default',
    })
}

export function handleWarning(message: string, title?: string): void {
    toast({
        title: title ?? 'Warning',
        description: message,
        variant: 'default',
    })
}

export function handleInfo(message: string, title?: string): void {
    toast({
        title: title ?? 'Info',
        description: message,
        variant: 'default',
    })
}
