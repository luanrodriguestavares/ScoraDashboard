import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
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
import { Key, Plus, Copy, Eye, EyeOff, Trash2, AlertTriangle, Check } from 'lucide-react'
import type { ApiKey } from '@/types'
import { cn } from '@/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiKeyApi } from '@/services/api'

interface ApiKeyRowProps {
    apiKey: ApiKey
    onRevoke: (id: string) => void
    onDelete: (id: string) => void
}

function ApiKeyRow({ apiKey, onRevoke, onDelete }: ApiKeyRowProps) {
    const { t } = useLanguage()
    const [copied, setCopied] = useState(false)

    const isExpired = apiKey.expires_at && new Date(apiKey.expires_at) < new Date()
    const usagePercent = apiKey.usage_limit ? (apiKey.usage_current / apiKey.usage_limit) * 100 : 0
    const isNearLimit = usagePercent > 90

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString()
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(apiKey.prefix + '***')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <TableRow>
            <TableCell>
                <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{apiKey.name}</span>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {apiKey.prefix}***
                    </code>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
                        {copied ? (
                            <Check className="h-3 w-3 text-decision-allow" />
                        ) : (
                            <Copy className="h-3 w-3" />
                        )}
                    </Button>
                </div>
            </TableCell>
            <TableCell>
                <div className="space-y-1 w-40">
                    <div className="flex items-center justify-between text-xs">
                        <span>
                            {apiKey.usage_current.toLocaleString()} /{' '}
                            {apiKey.usage_limit.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">{usagePercent.toFixed(0)}%</span>
                    </div>
                    <Progress
                        value={usagePercent}
                        className="h-1.5"
                        indicatorClassName={cn(isNearLimit ? 'bg-decision-block' : 'bg-primary')}
                    />
                    {isNearLimit && (
                        <div className="flex items-center gap-1 text-xs text-decision-block">
                            <AlertTriangle className="h-3 w-3" />
                            {t.apiKeys.usageWarning}
                        </div>
                    )}
                </div>
            </TableCell>
            <TableCell>
                <Badge
                    variant={isExpired ? 'destructive' : apiKey.active ? 'default' : 'secondary'}
                    className="capitalize"
                >
                    {isExpired
                        ? t.apiKeys.expired
                        : apiKey.active
                          ? t.apiKeys.active
                          : t.apiKeys.revoked}
                </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
                {apiKey.last_used_at ? formatDate(apiKey.last_used_at) : '-'}
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-1">
                    {apiKey.active && !isExpired && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-decision-block hover:text-decision-block"
                            onClick={() => onRevoke(apiKey.id)}
                        >
                            {t.apiKeys.revokeKey}
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => onDelete(apiKey.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    )
}

export function ApiKeysPage() {
    const { t } = useLanguage()
    const queryClient = useQueryClient()
    const [newKeyName, setNewKeyName] = useState('')
    const [createdKey, setCreatedKey] = useState<string | null>(null)
    const [showKey, setShowKey] = useState(false)
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    const apiKeysQuery = useQuery({
        queryKey: ['api-keys'],
        queryFn: apiKeyApi.getAll,
    })

    const createMutation = useMutation({
        mutationFn: (name: string) => apiKeyApi.create(name),
        onSuccess: (data) => {
            setCreatedKey(data.key)
            setNewKeyName('')
            queryClient.invalidateQueries({ queryKey: ['api-keys'] })
        },
    })

    const revokeMutation = useMutation({
        mutationFn: (id: string) => apiKeyApi.revoke(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiKeyApi.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
    })

    const apiKeys = apiKeysQuery.data ?? []

    const handleCreate = () => {
        if (!newKeyName) return
        createMutation.mutate(newKeyName)
    }

    const handleRevoke = (id: string) => {
        revokeMutation.mutate(id)
    }

    const handleDelete = (id: string) => {
        deleteMutation.mutate(id)
    }

    const closeCreateDialog = () => {
        setIsCreateOpen(false)
        setCreatedKey(null)
        setShowKey(false)
    }

    const totalUsage = apiKeys.reduce((sum, key) => sum + key.usage_current, 0)
    const totalLimit = apiKeys.reduce((sum, key) => sum + key.usage_limit, 0)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-heading font-bold">{t.apiKeys.title}</h2>
                    <p className="text-muted-foreground">{t.apiKeys.subtitle}</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            {t.apiKeys.createNew}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{t.apiKeys.createNew}</DialogTitle>
                            <DialogDescription>{t.apiKeys.createDescription}</DialogDescription>
                        </DialogHeader>

                        {createdKey ? (
                            <div className="space-y-4 py-4">
                                <div className="p-4 bg-decision-allow/10 border border-decision-allow/30 rounded-lg">
                                    <p className="text-sm text-decision-allow font-medium mb-2">
                                        {t.apiKeys.createdTitle}
                                    </p>
                                    <p className="text-xs text-muted-foreground mb-4">
                                        {t.apiKeys.createdHelp}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 text-sm bg-background px-3 py-2 rounded border font-mono break-all">
                                            {showKey ? createdKey : 'sk_live_' + '*'.repeat(20)}
                                        </code>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setShowKey(!showKey)}
                                        >
                                            {showKey ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() =>
                                                navigator.clipboard.writeText(createdKey)
                                            }
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t.apiKeys.name}</label>
                                    <Input
                                        placeholder={t.apiKeys.namePlaceholder}
                                        value={newKeyName}
                                        onChange={(e) => setNewKeyName(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            {createdKey ? (
                                <Button onClick={closeCreateDialog}>{t.apiKeys.done}</Button>
                            ) : (
                                <Button
                                    onClick={handleCreate}
                                    disabled={!newKeyName || createMutation.isPending}
                                >
                                    {t.common.create}
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {t.apiKeys.totalKeys}
                                </p>
                                <p className="text-2xl font-bold">{apiKeys.length}</p>
                            </div>
                            <Key className="h-8 w-8 text-primary opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {t.apiKeys.activeKeys}
                                </p>
                                <p className="text-2xl font-bold">
                                    {apiKeys.filter((k) => k.active).length}
                                </p>
                            </div>
                            <Check className="h-8 w-8 text-decision-allow opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div>
                            <p className="text-sm text-muted-foreground">{t.apiKeys.totalUsage}</p>
                            <p className="text-2xl font-bold">
                                {totalUsage.toLocaleString()} / {totalLimit.toLocaleString()}
                            </p>
                        </div>
                        <Progress
                            value={totalLimit ? (totalUsage / totalLimit) * 100 : 0}
                            className="h-1.5 mt-2"
                        />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{t.apiKeys.yourKeys}</CardTitle>
                    <CardDescription>{t.apiKeys.yourKeysDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t.apiKeys.name}</TableHead>
                                <TableHead>{t.apiKeys.prefix}</TableHead>
                                <TableHead>{t.apiKeys.usage}</TableHead>
                                <TableHead>{t.apiKeys.status}</TableHead>
                                <TableHead>{t.apiKeys.lastUsed}</TableHead>
                                <TableHead>{t.apiKeys.actions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {apiKeys.map((apiKey) => (
                                <ApiKeyRow
                                    key={apiKey.id}
                                    apiKey={apiKey}
                                    onRevoke={handleRevoke}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
