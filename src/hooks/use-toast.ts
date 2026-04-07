import * as React from 'react'

import type { ToastActionElement, ToastProps } from '@/components/ui/toast'

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

type ToastState = ToastProps & {
    id: string
    title?: React.ReactNode
    description?: React.ReactNode
    action?: ToastActionElement
}

const toastListeners: Array<(state: ToastState[]) => void> = []
let toasts: ToastState[] = []

function emit() {
    toastListeners.forEach((listener) => {
        listener(toasts)
    })
}

function removeToast(id: string) {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
}

function addToast(toast: ToastState) {
    toasts = [toast, ...toasts].slice(0, TOAST_LIMIT)
    emit()
}

function updateToast(id: string, updates: Partial<ToastState>) {
    toasts = toasts.map((t) => (t.id === id ? { ...t, ...updates } : t))
    emit()
}

function generateId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function toast(props: Omit<ToastState, 'id'>) {
    const id = generateId()
    const toastData: ToastState = {
        id,
        open: true,
        onOpenChange: (open) => {
            if (!open) removeToast(id)
        },
        ...props,
    }

    addToast(toastData)

    const timeout = setTimeout(() => {
        removeToast(id)
    }, TOAST_REMOVE_DELAY)

    return {
        id,
        dismiss: () => {
            clearTimeout(timeout)
            removeToast(id)
        },
        update: (updates: Partial<ToastState>) => updateToast(id, updates),
    }
}

export function useToast() {
    const [state, setState] = React.useState<ToastState[]>(toasts)

    React.useEffect(() => {
        const listener = (newState: ToastState[]) => setState(newState)
        toastListeners.push(listener)
        return () => {
            const index = toastListeners.indexOf(listener)
            if (index > -1) toastListeners.splice(index, 1)
        }
    }, [])

    return {
        toasts: state,
        toast,
        dismiss: (id: string) => removeToast(id),
    }
}
