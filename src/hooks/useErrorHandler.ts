import { useCallback } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { handleApiError, handleSuccess, handleWarning, handleInfo } from '@/services/error-handler'

export function useErrorHandler() {
    const { t } = useLanguage()

    const onError = useCallback(
        (error: unknown, defaultMessage?: string) => {
            handleApiError(
                error,
                defaultMessage ?? t.errors.genericDescription,
                t.errors.genericTitle
            )
        },
        [t]
    )

    const onSuccess = useCallback(
        (message: string) => {
            handleSuccess(message, t.common?.success ?? 'Success')
        },
        [t]
    )

    const onWarning = useCallback(
        (message: string) => {
            handleWarning(message, t.common?.warning ?? 'Warning')
        },
        [t]
    )

    const onInfo = useCallback(
        (message: string) => {
            handleInfo(message, t.common?.info ?? 'Info')
        },
        [t]
    )

    return { onError, onSuccess, onWarning, onInfo }
}
