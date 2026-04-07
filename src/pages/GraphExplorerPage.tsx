import { useState, useMemo, useEffect, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import { Search, Network, Maximize2, ZoomIn, ZoomOut, Activity, ChevronRight } from 'lucide-react'
import type { GraphCluster, GraphNode } from '@/types'
import { graphApi } from '@/services/api'

const formatHash = (hash?: string | null) => {
    if (!hash) return ''
    if (hash.length <= 12) return hash
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`
}

function GraphTooltip({ x, y, node }: { x: number; y: number; node: GraphNode }) {
    const { t } = useLanguage()
    return (
        <div
            className="absolute z-20 rounded-md border bg-background/95 shadow-sm px-2 py-1 text-[11px] pointer-events-none"
            style={{ left: x, top: y, transform: 'translate(-50%, -120%)' }}
        >
            <div className="font-medium">{node.type.toUpperCase()}</div>
            <div className="text-muted-foreground">{formatHash(node.hash)}</div>
            <div className="text-muted-foreground">
                {t.graph.occurrencesLabel}:{' '}
                <span className="text-foreground">{node.connections}</span>
            </div>
            <div className="text-muted-foreground">
                {t.graph.riskScore}:{' '}
                <span className="text-foreground">{(node.riskScore * 100).toFixed(0)}%</span>
            </div>
        </div>
    )
}

interface GraphVisualizationProps {
    cluster: GraphCluster | null
    selectedNode: string | null
    onSelectNode: (id: string | null) => void
    onOpenDetails: (node: GraphNode) => void
    containerRef: React.RefObject<HTMLDivElement>
}

function GraphVisualization({
    cluster,
    selectedNode,
    onSelectNode,
    onOpenDetails,
    containerRef,
}: GraphVisualizationProps) {
    const { t } = useLanguage()
    const [zoom, setZoom] = useState(0.7)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const dragStartRef = useRef<{ x: number; y: number } | null>(null)
    const offsetStartRef = useRef<{ x: number; y: number } | null>(null)
    const [hoverNode, setHoverNode] = useState<{ node: GraphNode; x: number; y: number } | null>(
        null
    )
    const MAX_ZOOM = 1.4
    const MIN_ZOOM = 0.5

    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const onWheel = (event: WheelEvent) => {
            event.preventDefault()
            event.stopPropagation()
            const direction = event.deltaY > 0 ? -1 : 1
            const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + direction * 0.1))
            applyZoom(next)
        }

        el.addEventListener('wheel', onWheel, { passive: false })
        return () => {
            el.removeEventListener('wheel', onWheel)
        }
    }, [containerRef, zoom])

    const clampOffset = (nextOffset: { x: number; y: number }, nextZoom: number) => {
        const el = containerRef.current
        if (!el) return nextOffset
        const width = el.clientWidth
        const height = el.clientHeight
        if (!width || !height) return nextOffset

        const extraX = width * 0.2
        const extraY = height * 0.2
        const maxX = Math.max(extraX, (width * (nextZoom - 1)) / 2)
        const maxY = Math.max(extraY, (height * (nextZoom - 1)) / 2)

        return {
            x: Math.min(maxX, Math.max(-maxX, nextOffset.x)),
            y: Math.min(maxY, Math.max(-maxY, nextOffset.y)),
        }
    }

    const applyZoom = (nextZoom: number) => {
        setZoom(nextZoom)
        setOffset((prev) => clampOffset(prev, nextZoom))
    }

    const nodePositions = useMemo(() => {
        if (!cluster) return {}
        const positions: Record<string, { x: number; y: number }> = {}
        const centerX = 200
        const centerY = 150
        const radius = 100

        cluster.nodes.forEach((node, index) => {
            const angle = (index / cluster.nodes.length) * Math.PI * 2 - Math.PI / 2
            positions[node.id] = {
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
            }
        })

        return positions
    }, [cluster])

    const connectedNodeIds = useMemo(() => {
        if (!cluster || !selectedNode) return new Set<string>()
        const ids = new Set<string>()
        ids.add(selectedNode)
        cluster.edges.forEach((edge) => {
            if (edge.source === selectedNode) ids.add(edge.target)
            if (edge.target === selectedNode) ids.add(edge.source)
        })
        return ids
    }, [cluster, selectedNode])

    if (!cluster) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                    <Network className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p>{t.graph.emptyState}</p>
                </div>
            </div>
        )
    }

    const typeColors: Record<string, string> = {
        cpf: '#22c55e',
        cnpj: '#3b82f6',
        email: '#f59e0b',
        phone: '#8b5cf6',
        ip: '#ef4444',
        other: '#6b7280',
    }

    return (
        <div
            className="relative h-full graph-fullscreen graph-surface overflow-hidden"
            ref={containerRef}
            onMouseDown={(event) => {
                if (event.button !== 0) return
                const target = event.target as HTMLElement
                if (target.closest('[data-graph-node]')) return
                event.preventDefault()
                setIsDragging(true)
                dragStartRef.current = { x: event.clientX, y: event.clientY }
                offsetStartRef.current = { ...offset }
            }}
            onMouseMove={(event) => {
                if (!isDragging || !dragStartRef.current || !offsetStartRef.current) return
                const dx = event.clientX - dragStartRef.current.x
                const dy = event.clientY - dragStartRef.current.y
                const nextOffset = {
                    x: offsetStartRef.current.x + dx,
                    y: offsetStartRef.current.y + dy,
                }
                setOffset(clampOffset(nextOffset, zoom))
            }}
            onMouseUp={() => {
                setIsDragging(false)
                dragStartRef.current = null
                offsetStartRef.current = null
            }}
            onMouseLeave={() => {
                setIsDragging(false)
                dragStartRef.current = null
                offsetStartRef.current = null
            }}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
            <div className="absolute top-2 right-2 flex gap-1 z-10">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                        const next = Math.min(zoom + 0.2, MAX_ZOOM)
                        applyZoom(next)
                    }}
                >
                    <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                        const next = Math.max(zoom - 0.2, MIN_ZOOM)
                        applyZoom(next)
                    }}
                >
                    <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                        const el = containerRef.current
                        if (!el) return
                        if (document.fullscreenElement) {
                            document.exitFullscreen?.()
                        } else {
                            el.requestFullscreen?.()
                        }
                    }}
                >
                    <Maximize2 className="h-4 w-4" />
                </Button>
            </div>

            <svg
                viewBox="0 0 400 300"
                className="w-full h-full graph-canvas"
                onClick={() => onSelectNode(null)}
                style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    transformOrigin: 'center',
                }}
            >
                <rect width="100%" height="100%" fill="transparent" pointerEvents="all" />
                {cluster.edges.map((edge, index) => {
                    const source = nodePositions[edge.source]
                    const target = nodePositions[edge.target]
                    if (!source || !target) return null
                    const isLinked = selectedNode
                        ? edge.source === selectedNode || edge.target === selectedNode
                        : true
                    const edgeOpacity = selectedNode ? (isLinked ? 0.85 : 0.08) : 0.4

                    return (
                        <line
                            key={index}
                            x1={source.x}
                            y1={source.y}
                            x2={target.x}
                            y2={target.y}
                            stroke="hsl(var(--border))"
                            strokeWidth={Math.max(0.8, edge.weight * 1.6)}
                            strokeOpacity={edgeOpacity}
                        />
                    )
                })}

                {cluster.nodes.map((node) => {
                    const pos = nodePositions[node.id]
                    if (!pos) return null

                    const isSelected = selectedNode === node.id
                    const isConnected = selectedNode ? connectedNodeIds.has(node.id) : true
                    const nodeOpacity = selectedNode ? (isConnected ? 1 : 0.2) : 1
                    const nodeSize = 6

                    return (
                        <g
                            key={node.id}
                            className="cursor-pointer"
                            data-graph-node
                            onClick={(event) => {
                                event.stopPropagation()
                                onSelectNode(isSelected ? null : node.id)
                            }}
                            onContextMenu={(event) => {
                                event.preventDefault()
                                onOpenDetails(node)
                            }}
                            onMouseEnter={(e) => {
                                const rect = containerRef.current?.getBoundingClientRect()
                                if (!rect) return
                                setHoverNode({
                                    node,
                                    x: e.clientX - rect.left + 8,
                                    y: e.clientY - rect.top + 8,
                                })
                            }}
                            onMouseMove={(e) => {
                                const rect = containerRef.current?.getBoundingClientRect()
                                if (!rect) return
                                setHoverNode((prev) =>
                                    prev
                                        ? {
                                              ...prev,
                                              x: e.clientX - rect.left + 8,
                                              y: e.clientY - rect.top + 8,
                                          }
                                        : null
                                )
                            }}
                            onMouseLeave={() => setHoverNode(null)}
                        >
                            <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={nodeSize}
                                fill={typeColors[node.type] || typeColors.other}
                                fillOpacity={0.2 * nodeOpacity}
                                stroke={typeColors[node.type] || typeColors.other}
                                strokeWidth={isSelected ? 3 : 1.5}
                                className="transition-all"
                                strokeOpacity={nodeOpacity}
                            />
                            <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={nodeSize * 0.3}
                                fill={typeColors[node.type] || typeColors.other}
                                fillOpacity={nodeOpacity}
                            />
                            <text
                                x={pos.x}
                                y={pos.y + nodeSize + 14}
                                textAnchor="middle"
                                className={cn(
                                    'text-[8px] fill-foreground transition-opacity',
                                    !isConnected && 'opacity-40'
                                )}
                            >
                                {node.type.toUpperCase()}
                            </text>
                            <text
                                x={pos.x}
                                y={pos.y + nodeSize + 26}
                                textAnchor="middle"
                                className={cn(
                                    'text-[8px] fill-muted-foreground transition-opacity',
                                    !isConnected && 'opacity-40'
                                )}
                            >
                                {formatHash(node.hash)}
                            </text>
                        </g>
                    )
                })}
            </svg>

            {hoverNode && <GraphTooltip x={hoverNode.x} y={hoverNode.y} node={hoverNode.node} />}

            <div className="absolute top-2 left-2 flex gap-2 rounded-md border bg-card/95 px-2 py-1 shadow-sm">
                {Object.entries(typeColors)
                    .slice(0, 5)
                    .map(([type, color]) => (
                        <div key={type} className="flex items-center gap-1 text-xs">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: color }}
                            />
                            <span className="uppercase">{type}</span>
                        </div>
                    ))}
            </div>
        </div>
    )
}

interface NodeDetailsPanelProps {
    node: GraphNode
    cluster: GraphCluster | null
}

function NodeDetailsPanel({ node, cluster }: NodeDetailsPanelProps) {
    const { t } = useLanguage()

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                    {node.type.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground" title={node.hash}>
                    {formatHash(node.hash)}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-muted-foreground">{t.graph.riskScore}</p>
                    <p className="text-lg font-bold">{(node.riskScore * 100).toFixed(0)}%</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">{t.graph.connections}</p>
                    <p className="text-lg font-bold">{node.connections}</p>
                </div>
            </div>

            <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-2">{t.graph.connectedNodes}</p>
                <div className="space-y-2">
                    {cluster?.edges
                        .filter((e) => e.source === node.id || e.target === node.id)
                        .map((edge, index) => {
                            const connectedNodeId =
                                edge.source === node.id ? edge.target : edge.source
                            const connectedNode = cluster.nodes.find(
                                (n) => n.id === connectedNodeId
                            )
                            if (!connectedNode) return null

                            return (
                                <div
                                    key={index}
                                    className="flex items-center justify-between gap-2 p-2 rounded bg-muted/50 text-sm"
                                >
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                            {connectedNode.type.toUpperCase()}
                                        </Badge>
                                        <span
                                            className="text-muted-foreground"
                                            title={connectedNode.hash}
                                        >
                                            {formatHash(connectedNode.hash)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        peso: {edge.weight.toFixed(2)}
                                    </div>
                                </div>
                            )
                        })}
                </div>
            </div>
        </div>
    )
}

export function GraphExplorerPage() {
    const { t } = useLanguage()
    const [searchQuery, setSearchQuery] = useState('')
    const [cluster, setCluster] = useState<GraphCluster | null>(null)
    const [selectedNode, setSelectedNode] = useState<string | null>(null)
    const [detailsNode, setDetailsNode] = useState<GraphNode | null>(null)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [showAllClusters, setShowAllClusters] = useState(false)
    const [allClustersSearch, setAllClustersSearch] = useState('')
    const graphContainerRef = useRef<HTMLDivElement | null>(null)
    const recentQuery = useQuery({
        queryKey: ['graph', 'recent'],
        queryFn: () => graphApi.search(''),
        retry: false,
    })
    const clusterDetailsMutation = useMutation({
        mutationFn: (clusterId: string) => graphApi.getCluster(clusterId),
    })
    const searchMutation = useMutation({
        mutationFn: (query: string) => graphApi.search(query),
        onSuccess: (clusters) => {
            const firstCluster = clusters[0] ?? null
            setCluster(firstCluster)
            setSelectedNode(null)
            if (firstCluster) {
                clusterDetailsMutation.mutate(firstCluster.id, {
                    onSuccess: (fullCluster) => setCluster(fullCluster),
                })
            }
        },
    })

    const openDetails = (node: GraphNode) => {
        setDetailsNode(node)
        setDetailsOpen(true)
    }

    const handleSearch = () => {
        const trimmed = searchQuery.trim()
        searchMutation.mutate(trimmed)
    }

    const selectCluster = (nextCluster: GraphCluster) => {
        setCluster(nextCluster)
        setSelectedNode(null)
        clusterDetailsMutation.mutate(nextCluster.id, {
            onSuccess: (fullCluster) => setCluster(fullCluster),
        })
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString()
    }

    return (
        <div className="space-y-6 h-[calc(100vh-220px)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h2 className="text-3xl font-heading font-bold">{t.graph.title}</h2>
                    <p className="text-muted-foreground">{t.graph.subtitle}</p>
                    <p className="text-sm text-muted-foreground mt-2">{t.graph.howTo}</p>
                </div>
                <div className="flex gap-2 lg:mt-1">
                    <div className="relative w-full max-w-sm lg:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t.graph.searchPlaceholder}
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Button onClick={handleSearch} disabled={searchMutation.isPending}>
                        <Search className="h-4 w-4 mr-2" />
                        {t.common.search}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100%-140px)]">
                <div className="lg:col-span-3">
                    <Card className="h-full">
                        <CardContent className="p-4 h-full">
                            <GraphVisualization
                                cluster={cluster}
                                selectedNode={selectedNode}
                                onSelectNode={setSelectedNode}
                                onOpenDetails={openDetails}
                                containerRef={graphContainerRef}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                                {t.graph.recentClusters}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {(recentQuery.data ?? []).length === 0 ? (
                                <p className="text-xs text-muted-foreground">
                                    {t.graph.noCluster || 'Sem clusters recentes'}
                                </p>
                            ) : (
                                <>
                                    {(recentQuery.data ?? []).slice(0, 5).map((c) => (
                                        <button
                                            key={c.id}
                                            className={cn(
                                                'w-full text-left rounded border px-3 py-2 hover:bg-accent/40 transition-colors',
                                                cluster?.id === c.id &&
                                                    'border-primary/60 bg-primary/5'
                                            )}
                                            onClick={() => selectCluster(c)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">
                                                    {t.graph.idLabel}
                                                </span>
                                                <span className="font-mono text-xs" title={c.id}>
                                                    {formatHash(c.id)}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex items-center justify-between">
                                                <Badge variant="outline" className="text-xs">
                                                    {c.nodes?.[0]?.type?.toUpperCase() || 'N/A'}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {c.size} {t.graph.nodesLabel}
                                                </span>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                                <span>{t.graph.totalRisk}</span>
                                                <span className="font-medium">
                                                    {(c.totalRisk * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                    {(recentQuery.data ?? []).length > 5 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => setShowAllClusters(true)}
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                {t.graph.viewAll || 'Ver todos os clusters'}
                                                <ChevronRight className="h-4 w-4" />
                                            </span>
                                        </Button>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {cluster && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {t.graph.clusterInfo}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        {t.graph.idLabel}
                                    </span>
                                    <span className="font-mono text-xs" title={cluster.id}>
                                        {formatHash(cluster.id)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        {t.graph.clusterSize}
                                    </span>
                                    <span className="font-medium">
                                        {cluster.size} {t.graph.nodesLabel}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        {t.graph.totalRisk}
                                    </span>
                                    <span className="font-medium">
                                        {(cluster.totalRisk * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        {t.graph.firstConnection}
                                    </span>
                                    <span className="text-sm">
                                        {formatDate(cluster.created_at)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        {t.graph.lastActivity}
                                    </span>
                                    <span className="text-sm">
                                        {formatDate(cluster.last_activity)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                                {t.graph.legendTitle}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Activity className="h-3 w-3 text-primary" />
                                <span>{t.graph.legendConnection}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-primary/70" />
                                <span>{t.graph.legendNodeSize}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-primary/30" />
                                <span>{t.graph.legendNodeColor}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                                <span>{t.graph.legendFallback}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-xl" container={graphContainerRef.current}>
                    <DialogHeader>
                        <DialogTitle>{t.graph.nodeDetails}</DialogTitle>
                    </DialogHeader>
                    {detailsNode && <NodeDetailsPanel node={detailsNode} cluster={cluster} />}
                </DialogContent>
            </Dialog>

            <Dialog open={showAllClusters} onOpenChange={setShowAllClusters}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{t.graph.allClusters || 'Todos os Clusters'}</DialogTitle>
                    </DialogHeader>
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t.graph.searchPlaceholder || 'Buscar clusters...'}
                                className="pl-10"
                                value={allClustersSearch}
                                onChange={(e) => setAllClustersSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2">
                        {(recentQuery.data ?? []).length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                {t.graph.noCluster || 'Sem clusters disponíveis'}
                            </p>
                        ) : (
                            (recentQuery.data ?? [])
                                .filter((c) => {
                                    if (!allClustersSearch.trim()) return true
                                    const searchLower = allClustersSearch.toLowerCase()
                                    return (
                                        c.id.toLowerCase().includes(searchLower) ||
                                        c.nodes?.[0]?.type?.toLowerCase().includes(searchLower)
                                    )
                                })
                                .map((c) => (
                                    <button
                                        key={c.id}
                                        className={cn(
                                            'w-full text-left rounded border px-3 py-3 hover:bg-accent/40 transition-colors',
                                            cluster?.id === c.id && 'border-primary/60 bg-primary/5'
                                        )}
                                        onClick={() => {
                                            selectCluster(c)
                                            setShowAllClusters(false)
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">
                                                {t.graph.idLabel}
                                            </span>
                                            <span className="font-mono text-xs" title={c.id}>
                                                {formatHash(c.id)}
                                            </span>
                                        </div>
                                        <div className="mt-1 flex items-center justify-between">
                                            <Badge variant="outline" className="text-xs">
                                                {c.nodes?.[0]?.type?.toUpperCase() || 'N/A'}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {c.size} {t.graph.nodesLabel}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{t.graph.totalRisk}</span>
                                            <span className="font-medium">
                                                {(c.totalRisk * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{t.graph.lastActivity}</span>
                                            <span>{formatDate(c.last_activity)}</span>
                                        </div>
                                    </button>
                                ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
