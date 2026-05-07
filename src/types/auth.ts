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

export interface AccountPlan {
    id: string
    name: string
    display_name: string
    price_monthly: number | null
    monthly_requests: number | null
    max_dashboard_users: number | null
    max_custom_rules: number | null
    max_webhooks: number | null
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
    plan?: AccountPlan | null
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
