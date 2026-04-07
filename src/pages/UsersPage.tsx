import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { useLanguage } from '@/contexts/LanguageContext'
import { Search, Shield, User as UserIcon, Crown, Trash2, Edit, UserPlus } from 'lucide-react'
import type { User } from '@/types'
import { cn } from '@/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'

function RoleBadge({ role }: { role: User['role'] }) {
    const roleConfig = {
        super_admin: {
            icon: Crown,
            label: 'Super Admin',
            className: 'bg-decision-review/10 text-decision-review border-decision-review/30',
        },
        admin: {
            icon: Shield,
            label: 'Admin',
            className: 'bg-primary/10 text-primary border-primary/30',
        },
        member: {
            icon: UserIcon,
            label: 'Member',
            className: 'bg-muted text-muted-foreground border-border',
        },
    }

    const config = roleConfig[role]
    const Icon = config.icon

    return (
        <Badge variant="outline" className={cn('gap-1', config.className)}>
            <Icon className="h-3 w-3" />
            {config.label}
        </Badge>
    )
}

function UserCard({
    user,
    onEdit,
    onToggle,
    onDelete,
}: {
    user: User
    onEdit: () => void
    onToggle: (active: boolean) => void
    onDelete: () => void
}) {
    const { t } = useLanguage()

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString()
    }

    return (
        <Card className="md:hidden">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                'h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium',
                                user.active
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-muted text-muted-foreground'
                            )}
                        >
                            {user.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)}
                        </div>
                        <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                    <Switch checked={user.active} onCheckedChange={onToggle} />
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <RoleBadge role={user.role} />
                    <span className="text-xs text-muted-foreground">
                        {user.last_login
                            ? `${t.users.lastLogin}: ${formatDate(user.last_login)}`
                            : t.users.neverLoggedIn}
                    </span>
                </div>
                <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
                        <Edit className="h-4 w-4 mr-1" />
                        {t.common.edit}
                    </Button>
                    <Button variant="outline" size="sm" onClick={onDelete}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export function UsersPage() {
    const { t } = useLanguage()
    const { account } = useAuth()
    const queryClient = useQueryClient()
    const [searchQuery, setSearchQuery] = useState('')
    const [filterRole, setFilterRole] = useState('all')
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'member' as User['role'],
    })
    const [editPassword, setEditPassword] = useState('')

    const usersQuery = useQuery({
        queryKey: ['users'],
        queryFn: () => usersApi.getAll({ page: 1, limit: 100 }),
    })

    const createMutation = useMutation({
        mutationFn: () => {
            if (!account?.id) throw new Error('Missing account')
            return usersApi.create({
                account_id: account.id,
                name: newUser.name,
                email: newUser.email,
                password: newUser.password,
                role: newUser.role,
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            setNewUser({ name: '', email: '', password: '', role: 'member' })
            setIsCreateOpen(false)
        },
    })

    const updateMutation = useMutation({
        mutationFn: (payload: {
            id: string
            name?: string
            email?: string
            role?: User['role']
            password?: string
        }) =>
            usersApi.update(payload.id, {
                name: payload.name,
                email: payload.email,
                role: payload.role,
                password: payload.password,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            setIsEditOpen(false)
            setSelectedUser(null)
            setEditPassword('')
        },
    })

    const activateMutation = useMutation({
        mutationFn: (id: string) => usersApi.activate(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    })

    const deactivateMutation = useMutation({
        mutationFn: (id: string) => usersApi.deactivate(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => usersApi.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    })

    const users = usersQuery.data?.data ?? []

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            if (filterRole !== 'all' && user.role !== filterRole) return false
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                return (
                    user.name.toLowerCase().includes(query) ||
                    user.email.toLowerCase().includes(query)
                )
            }
            return true
        })
    }, [users, filterRole, searchQuery])

    const handleToggleActive = (userId: string, active: boolean) => {
        if (active) {
            activateMutation.mutate(userId)
        } else {
            deactivateMutation.mutate(userId)
        }
    }

    const handleDeleteUser = (userId: string) => {
        deleteMutation.mutate(userId)
    }

    const handleEditUser = (user: User) => {
        setSelectedUser(user)
        setIsEditOpen(true)
    }

    const handleSaveUser = () => {
        if (!selectedUser) return
        updateMutation.mutate({
            id: selectedUser.id,
            name: selectedUser.name,
            email: selectedUser.email,
            role: selectedUser.role,
            password: editPassword || undefined,
        })
    }

    const handleCreateUser = () => {
        if (!newUser.email || !newUser.password || !newUser.name) return
        createMutation.mutate()
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString()
    }

    const stats = {
        total: users.length,
        active: users.filter((u) => u.active).length,
        admins: users.filter((u) => u.role === 'admin').length,
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading font-bold">{t.users.title}</h2>
                    <p className="text-muted-foreground">{t.users.subtitle}</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="h-4 w-4 mr-2" />
                            {t.users.createUser}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t.users.createUser}</DialogTitle>
                            <DialogDescription>{t.users.createDescription}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>{t.users.name}</Label>
                                <Input
                                    value={newUser.name}
                                    onChange={(e) =>
                                        setNewUser({ ...newUser, name: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t.users.email}</Label>
                                <Input
                                    type="email"
                                    placeholder="email@example.com"
                                    value={newUser.email}
                                    onChange={(e) =>
                                        setNewUser({ ...newUser, email: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t.users.password}</Label>
                                <Input
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) =>
                                        setNewUser({ ...newUser, password: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t.users.role}</Label>
                                <Select
                                    value={newUser.role}
                                    onValueChange={(value) =>
                                        setNewUser({ ...newUser, role: value as User['role'] })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="member">
                                            {t.users.roles.member}
                                        </SelectItem>
                                        <SelectItem value="admin">{t.users.roles.admin}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                {t.common.cancel}
                            </Button>
                            <Button
                                onClick={handleCreateUser}
                                disabled={!newUser.email || !newUser.password || !newUser.name}
                            >
                                {t.common.create}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">{t.users.stats.total}</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">{t.users.stats.active}</p>
                        <p className="text-2xl font-bold text-decision-allow">{stats.active}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">{t.users.stats.admins}</p>
                        <p className="text-2xl font-bold text-blue-500">{stats.admins}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t.users.searchPlaceholder}
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder={t.users.filterByRole} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t.users.allRoles}</SelectItem>
                        <SelectItem value="admin">{t.users.roles.admin}</SelectItem>
                        <SelectItem value="member">{t.users.roles.member}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="hidden md:block">
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t.users.user}</TableHead>
                                    <TableHead>{t.users.role}</TableHead>
                                    <TableHead>{t.users.status}</TableHead>
                                    <TableHead>{t.users.lastLogin}</TableHead>
                                    <TableHead className="text-right">{t.users.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={cn(
                                                        'h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium',
                                                        user.active
                                                            ? 'bg-primary/10 text-primary'
                                                            : 'bg-muted text-muted-foreground'
                                                    )}
                                                >
                                                    {user.name
                                                        .split(' ')
                                                        .map((n) => n[0])
                                                        .join('')
                                                        .slice(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <RoleBadge role={user.role} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={user.active}
                                                    onCheckedChange={(checked) =>
                                                        handleToggleActive(user.id, checked)
                                                    }
                                                />
                                                <span
                                                    className={cn(
                                                        'text-sm',
                                                        user.active
                                                            ? 'text-decision-allow'
                                                            : 'text-muted-foreground'
                                                    )}
                                                >
                                                    {user.active
                                                        ? t.users.active
                                                        : t.users.inactive}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {user.last_login ? (
                                                formatDate(user.last_login)
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    {t.users.neverLoggedIn}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditUser(user)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteUser(user.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <div className="md:hidden space-y-3">
                {filteredUsers.map((user) => (
                    <UserCard
                        key={user.id}
                        user={user}
                        onEdit={() => handleEditUser(user)}
                        onToggle={(active) => handleToggleActive(user.id, active)}
                        onDelete={() => handleDeleteUser(user.id)}
                    />
                ))}
            </div>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t.users.editUser}</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>{t.users.name}</Label>
                                <Input
                                    value={selectedUser.name}
                                    onChange={(e) =>
                                        setSelectedUser({ ...selectedUser, name: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t.users.email}</Label>
                                <Input
                                    type="email"
                                    value={selectedUser.email}
                                    onChange={(e) =>
                                        setSelectedUser({ ...selectedUser, email: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t.users.password}</Label>
                                <Input
                                    type="password"
                                    value={editPassword}
                                    onChange={(e) => setEditPassword(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t.users.role}</Label>
                                <Select
                                    value={selectedUser.role}
                                    onValueChange={(value) =>
                                        setSelectedUser({
                                            ...selectedUser,
                                            role: value as User['role'],
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="member">
                                            {t.users.roles.member}
                                        </SelectItem>
                                        <SelectItem value="admin">{t.users.roles.admin}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                            {t.common.cancel}
                        </Button>
                        <Button onClick={handleSaveUser}>{t.common.save}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
