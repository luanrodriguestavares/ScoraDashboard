import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { reportsApi } from '@/services/api'
import {
    FileText,
    Download,
    Calendar,
    Clock,
    Mail,
    RefreshCw,
    Plus,
    Shield,
    BarChart3,
    FileJson,
    FileSpreadsheet,
    Check,
    Eye,
    Trash2,
    Settings,
    Send,
    History,
    AlertTriangle,
} from 'lucide-react'

interface Report {
    id: string
    name: string
    type: 'weekly' | 'monthly' | 'custom'
    complianceType?: string | null
    format: 'pdf' | 'csv' | 'json' | 'html'
    status: 'scheduled' | 'generating' | 'completed' | 'failed' | 'skipped'
    lastGenerated?: string
    nextScheduled?: string
    size?: string
    downloadUrl?: string
    recipients: string[]
    enabled: boolean
}

interface ReportCardProps {
    report: Report
    onToggle: (id: string) => void
    onDownload: (report: Report) => void
}

function ReportCard({ report, onToggle, onDownload }: ReportCardProps) {
    const { t } = useLanguage()
    const formatIcon = {
        pdf: FileText,
        csv: FileSpreadsheet,
        json: FileJson,
    }
    const FormatIcon = formatIcon[report.format]

    const complianceColors = {
        lgpd: 'text-green-500 border-green-500 bg-green-500/10',
        soc2: 'text-blue-500 border-blue-500 bg-blue-500/10',
        pci: 'text-purple-500 border-purple-500 bg-purple-500/10',
        gdpr: 'text-yellow-500 border-yellow-500 bg-yellow-500/10',
    }

    return (
        <Card className={cn(!report.enabled && 'opacity-60')}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div
                            className={cn(
                                'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                                report.complianceType ? 'bg-purple-500/10' : 'bg-primary/10'
                            )}
                        >
                            {report.complianceType ? (
                                <Shield className="h-5 w-5 text-purple-500" />
                            ) : (
                                <FormatIcon className="h-5 w-5 text-primary" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium truncate">{report.name}</h4>
                                {report.complianceType && (
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            'text-xs uppercase',
                                            complianceColors[report.complianceType]
                                        )}
                                    >
                                        {report.complianceType}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="secondary" className="text-xs capitalize">
                                    {report.type}
                                </Badge>
                                <span>•</span>
                                <span className="uppercase">{report.format}</span>
                                {report.lastGenerated && (
                                    <>
                                        <span>•</span>
                                        <span>
                                            {t.reports?.lastGenerated || 'Last'}:{' '}
                                            {new Date(report.lastGenerated).toLocaleDateString()}
                                        </span>
                                    </>
                                )}
                                {report.size && (
                                    <>
                                        <span>•</span>
                                        <span>{report.size}</span>
                                    </>
                                )}
                            </div>
                            {report.nextScheduled && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {t.reports?.nextScheduled || 'Next'}:{' '}
                                    {new Date(report.nextScheduled).toLocaleString()}
                                </p>
                            )}
                            {report.recipients.length > 0 && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    <span>{report.recipients.join(', ')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={report.enabled}
                                onCheckedChange={() => onToggle(report.id)}
                                aria-label="Toggle report schedule"
                            />
                            <span className="text-xs text-muted-foreground">
                                {report.enabled ? 'Agendamento ativo' : 'Agendamento pausado'}
                            </span>
                        </div>
                        {report.status === 'completed' && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => onDownload(report)}
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                        )}
                        {report.status === 'generating' && (
                            <Button variant="outline" size="icon" disabled>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            </Button>
                        )}
                        {report.status !== 'generating' && report.status !== 'completed' && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => onDownload(report)}
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function openPrintWindow(html: string, title: string) {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.open()
    win.document.write(html)
    win.document.close()
    win.document.title = title
    const handlePrint = () => {
        win.focus()
        win.print()
    }
    if (win.document.readyState === 'complete') {
        setTimeout(handlePrint, 100)
    } else {
        win.addEventListener('load', () => setTimeout(handlePrint, 100), { once: true })
    }
}

export function ReportsPage() {
    const { t } = useLanguage()
    const queryClient = useQueryClient()
    const reportsQuery = useQuery({ queryKey: ['reports'], queryFn: reportsApi.getAll })
    const historyQuery = useQuery({
        queryKey: ['reports', 'history'],
        queryFn: reportsApi.getHistory,
    })
    const [reports, setReports] = useState<Report[]>([])
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [filter, setFilter] = useState<'all' | 'scheduled' | 'compliance'>('all')

    const [newReportName, setNewReportName] = useState('')
    const [newReportType, setNewReportType] = useState<Report['type']>('weekly')
    const [newReportFormat, setNewReportFormat] = useState<Report['format']>('pdf')
    const [newReportComplianceType, setNewReportComplianceType] = useState<
        Report['complianceType'] | 'none'
    >('none')
    const [newReportRecipients, setNewReportRecipients] = useState('')
    const history =
        (historyQuery.data as Array<{
            id: string
            reportId?: string
            reportName?: string
            generatedAt: string
            size: string
            status: 'completed' | 'failed' | 'skipped'
        }>) || []

    const createMutation = useMutation({
        mutationFn: (payload: Partial<Report>) => reportsApi.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] })
            setIsCreateOpen(false)
            resetForm()
        },
    })
    const generateMutation = useMutation({
        mutationFn: (id: string) => reportsApi.generate(id),
        onSuccess: (updated) => {
            setReports((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)))
            queryClient.invalidateQueries({ queryKey: ['reports', 'history'] })
        },
    })
    const toggleMutation = useMutation({
        mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
            reportsApi.toggle(id, enabled),
        onSuccess: (updated) => {
            setReports((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)))
        },
    })

    useEffect(() => {
        setReports((reportsQuery.data as Report[]) || [])
    }, [reportsQuery.data])

    const handleToggle = (id: string) => {
        const current = reports.find((r) => r.id === id)
        if (!current) return
        const nextEnabled = !current.enabled
        setReports((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: nextEnabled } : r)))
        toggleMutation.mutate(
            { id, enabled: nextEnabled },
            {
                onError: () => {
                    setReports((prev) =>
                        prev.map((r) => (r.id === id ? { ...r, enabled: current.enabled } : r))
                    )
                },
            }
        )
    }

    const handleDownload = async (report: Report) => {
        try {
            setReports((prev) =>
                prev.map((r) => (r.id === report.id ? { ...r, status: 'generating' as const } : r))
            )
            const updated = await generateMutation.mutateAsync(report.id)
            const resolved = updated || report
            if (report.format === 'pdf') {
                const html = await reportsApi.getHtml(report.id)
                openPrintWindow(html, resolved.name || report.name)
                return
            }

            const { blob, filename } = await reportsApi.download(report.id, report.format)
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = filename || `${resolved.name || report.name}.${report.format}`
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Failed to download report', error)
            setReports((prev) =>
                prev.map((r) => (r.id === report.id ? { ...r, status: 'failed' as const } : r))
            )
        }
    }

    const handleCreateReport = () => {
        const newReport: Partial<Report> = {
            name: newReportName,
            type: newReportType,
            complianceType:
                newReportComplianceType === 'none' ? undefined : newReportComplianceType,
            format: newReportFormat,
            recipients: newReportRecipients
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            enabled: true,
            nextScheduled: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }
        createMutation.mutate(newReport)
    }

    const resetForm = () => {
        setNewReportName('')
        setNewReportType('weekly')
        setNewReportFormat('pdf')
        setNewReportComplianceType('none')
        setNewReportRecipients('')
    }

    const filteredReports = reports.filter((r) => {
        if (filter === 'all') return true
        if (filter === 'scheduled') return !r.complianceType
        if (filter === 'compliance') return !!r.complianceType
        return true
    })

    const totalReports = reports.length
    const complianceReports = reports.filter((r) => !!r.complianceType).length
    const activeSchedules = reports.filter((r) => r.enabled && r.nextScheduled).length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading font-bold">
                        {t.reports?.title || 'Reports & Compliance'}
                    </h2>
                    <p className="text-muted-foreground">
                        {t.reports?.subtitle || 'Generate and schedule reports'}
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            {t.reports?.createReport || 'Create Report'}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {t.reports?.createNewReport || 'Create New Report'}
                            </DialogTitle>
                            <DialogDescription>
                                {t.reports?.configureReport ||
                                    'Configure a new report to be generated on demand or scheduled'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    {t.reports?.reportName || 'Report Name'}
                                </label>
                                <Input
                                    value={newReportName}
                                    onChange={(e) => setNewReportName(e.target.value)}
                                    placeholder="e.g., Weekly Risk Summary"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    {t.reports?.type || 'Type'}
                                </label>
                                <Select
                                    value={newReportType}
                                    onValueChange={(v) => setNewReportType(v as Report['type'])}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="weekly">
                                            {t.reports?.weekly || 'Weekly'}
                                        </SelectItem>
                                        <SelectItem value="monthly">
                                            {t.reports?.monthly || 'Monthly'}
                                        </SelectItem>
                                        <SelectItem value="custom">
                                            {t.reports?.customOnDemand || 'Custom/On-demand'}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Compliance Type</label>
                                <Select
                                    value={newReportComplianceType}
                                    onValueChange={(v) =>
                                        setNewReportComplianceType(
                                            v as Report['complianceType'] | 'none'
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhum</SelectItem>
                                        <SelectItem value="lgpd">LGPD</SelectItem>
                                        <SelectItem value="soc2">SOC2</SelectItem>
                                        <SelectItem value="pci">PCI-DSS</SelectItem>
                                        <SelectItem value="gdpr">GDPR</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Format</label>
                                <Select
                                    value={newReportFormat}
                                    onValueChange={(v) => setNewReportFormat(v as Report['format'])}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pdf">PDF</SelectItem>
                                        <SelectItem value="csv">CSV</SelectItem>
                                        <SelectItem value="json">JSON</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Email Recipients (comma-separated)
                                </label>
                                <Input
                                    value={newReportRecipients}
                                    onChange={(e) => setNewReportRecipients(e.target.value)}
                                    placeholder="team@company.com, manager@company.com"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                {t.common?.cancel || 'Cancel'}
                            </Button>
                            <Button onClick={handleCreateReport} disabled={!newReportName}>
                                {t.reports?.createReport || 'Create Report'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {t.reports?.totalReports || 'Total Reports'}
                                </p>
                                <p className="text-2xl font-bold">{totalReports}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {t.reports?.complianceReports || 'Compliance Reports'}
                                </p>
                                <p className="text-2xl font-bold">{complianceReports}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-decision-allow/10 flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-decision-allow" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {t.reports?.activeSchedules || 'Active Schedules'}
                                </p>
                                <p className="text-2xl font-bold">{activeSchedules}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="reports">
                <TabsList>
                    <TabsTrigger value="reports">{t.reports?.reports || 'Reports'}</TabsTrigger>
                    <TabsTrigger value="history">
                        {t.reports?.generationHistory || 'Generation History'}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="reports" className="mt-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Button
                            variant={filter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('all')}
                        >
                            {t.common?.all || 'All'} ({reports.length})
                        </Button>
                        <Button
                            variant={filter === 'scheduled' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('scheduled')}
                        >
                            {t.reports?.scheduled || 'Scheduled'} (
                            {reports.filter((r) => !r.complianceType).length})
                        </Button>
                        <Button
                            variant={filter === 'compliance' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('compliance')}
                        >
                            {t.reports?.compliance || 'Compliance'} ({complianceReports})
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {filteredReports.map((report) => (
                            <ReportCard
                                key={report.id}
                                report={report}
                                onToggle={handleToggle}
                                onDownload={handleDownload}
                            />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <History className="h-4 w-4" />
                                {t.reports?.recentGenerations || 'Recent Generations'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t.reports?.report || 'Report'}</TableHead>
                                        <TableHead>
                                            {t.reports?.generatedAt || 'Generated At'}
                                        </TableHead>
                                        <TableHead>{t.reports?.size || 'Size'}</TableHead>
                                        <TableHead>{t.reports?.status || 'Status'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                {item.reportName ||
                                                    reports.find((r) => r.id === item.reportId)
                                                        ?.name ||
                                                    item.reportId ||
                                                    '-'}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(item.generatedAt).toLocaleString()}
                                            </TableCell>
                                            <TableCell>{item.size}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        item.status === 'completed'
                                                            ? 'default'
                                                            : 'destructive'
                                                    }
                                                >
                                                    {item.status === 'completed' ? (
                                                        <Check className="h-3 w-3 mr-1" />
                                                    ) : (
                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                    )}
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
