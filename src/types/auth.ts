export type UserRole = 'admin' | 'member' | 'super_admin'

export interface User {
    id: string
    name: string
    email: string
    role: UserRole
    active: boolean
    account_id: string
    photo_url?: string | null
    last_login?: string
    created_at: string
    updated_at: string
}

export interface Account {
    id: string
    name: string
    email: string
    company_name?: string
    description?: string
    active: boolean
    quota_limit: number
    plan_id?: string | null
    total_requests: number
    users_count: number
    api_keys_count: number
    created_at: string
    updated_at: string
}

export interface AuthUser {
    token: string
    user: User & {
        account: Account
    }
}

export interface LoginCredentials {
    email: string
    password: string
}

export interface CreateUserData {
    account_id: string
    name: string
    email: string
    password: string
    role?: UserRole
}

export interface UpdateUserData {
    name?: string
    password?: string
    role?: UserRole
}
