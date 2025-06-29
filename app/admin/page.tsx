"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import {
  ArrowUpRight,
  Package,
  RefreshCw,
  DollarSign,
  Search,
  Download,
  CheckCircle,
  XCircle,
  Sparkles,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { dataService, type ReturnWithDetails, type DashboardMetrics } from "@/lib/data-service"

export default function AdminDashboard() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [returns, setReturns] = useState<ReturnWithDetails[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [returnTrends, setReturnTrends] = useState<any[]>([])
  const [returnReasons, setReturnReasons] = useState<any[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Use demo merchant ID - in real app, get from auth context
  const merchantId = "550e8400-e29b-41d4-a716-446655440000"

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    loadReturns()
  }, [statusFilter, searchQuery])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load metrics
      const metricsData = await dataService.getDashboardMetrics(merchantId)
      setMetrics(metricsData)

      // Load trend data
      const trends = await dataService.getReturnTrends(merchantId, 30)
      setReturnTrends(trends.slice(-7)) // Last 7 days

      // Load return reasons
      const reasons = await dataService.getReturnReasons(merchantId)
      setReturnReasons(reasons)

      // Load initial returns
      await loadReturns()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadReturns = async () => {
    try {
      const { returns: returnsData } = await dataService.getReturns(merchantId, {
        status: statusFilter,
        search: searchQuery,
        limit: 50,
      })
      setReturns(returnsData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load returns",
        variant: "destructive",
      })
    }
  }

  const handleReturnAction = async (returnId: string, action: "approve" | "reject") => {
    setActionLoading(returnId)
    try {
      const newStatus = action === "approve" ? "approved" : "rejected"
      const success = await dataService.updateReturnStatus(returnId, newStatus, merchantId)

      if (success) {
        // Update local state
        setReturns(returns.map((ret) => (ret.id === returnId ? { ...ret, status: newStatus } : ret)))

        toast({
          title: "Success",
          description: `Return ${action}d successfully`,
        })
      } else {
        throw new Error(`Failed to ${action} return`)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} return`,
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      requested: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      in_transit: "bg-blue-100 text-blue-800",
      completed: "bg-gray-100 text-gray-800",
    } as const

    return <Badge className={colors[status as keyof typeof colors]}>{status.replace("_", " ")}</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Returns Dashboard</h1>
              <p className="text-gray-600">Manage and optimize your returns process</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button size="sm" onClick={loadDashboardData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Debug Panel - Remove in production */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-yellow-900 mb-2">🔧 Debug Panel</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                const response = await fetch("/api/debug/database")
                const result = await response.json()
                console.log("Database diagnostic:", result)
                toast({
                  title: "Database Diagnostic",
                  description: `Connection: ${result.success ? "OK" : "Failed"}. Check console for details.`,
                  variant: result.success ? "default" : "destructive",
                })
              } catch (error) {
                console.error("Diagnostic failed:", error)
              }
            }}
          >
            🔍 Check Database
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                const response = await fetch("/api/debug/seed", { method: "POST" })
                const result = await response.json()
                console.log("Seed result:", result)
                if (result.success) {
                  toast({
                    title: "Data Seeded Successfully!",
                    description: "Demo data has been inserted. Refreshing dashboard...",
                  })
                  // Refresh the dashboard data
                  setTimeout(() => {
                    loadDashboardData()
                  }, 1000)
                } else {
                  throw new Error(result.error)
                }
              } catch (error) {
                console.error("Seeding failed:", error)
                toast({
                  title: "Seeding Failed",
                  description: "Check console for details",
                  variant: "destructive",
                })
              }
            }}
          >
            🌱 Seed Demo Data
          </Button>
        </div>
        <p className="text-xs text-yellow-700 mt-2">
          Use these tools to diagnose and fix database issues. Check browser console for detailed logs.
        </p>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="returns">Returns Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.totalReturns}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <ArrowUpRight className="h-3 w-3 mr-1 text-green-600" />+{metrics.totalReturnsChange}% from last
                      month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Exchange Rate</CardTitle>
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.exchangeRate}%</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <ArrowUpRight className="h-3 w-3 mr-1 text-green-600" />+{metrics.exchangeRateChange}% from last
                      month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">AI Acceptance</CardTitle>
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.aiAcceptanceRate}%</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <ArrowUpRight className="h-3 w-3 mr-1 text-green-600" />+{metrics.aiAcceptanceRateChange}% from
                      last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue Saved</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${metrics.revenueSaved}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <ArrowUpRight className="h-3 w-3 mr-1 text-green-600" />+{metrics.revenueSavedChange}% from last
                      month
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Return Trends</CardTitle>
                  <CardDescription>Daily returns and exchanges over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={returnTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString()} />
                      <YAxis />
                      <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString()} />
                      <Line type="monotone" dataKey="returns" stroke="#8884d8" name="Returns" />
                      <Line type="monotone" dataKey="exchanges" stroke="#82ca9d" name="Exchanges" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Return Reasons</CardTitle>
                  <CardDescription>Breakdown of why customers return items</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={returnReasons}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {returnReasons.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Returns Management Tab */}
          <TabsContent value="returns" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search by email or order number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="requested">Requested</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Returns Table */}
            <Card>
              <CardHeader>
                <CardTitle>Return Requests</CardTitle>
                <CardDescription>Manage and process customer return requests</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>AI Suggestion</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returns.map((returnItem) => (
                      <TableRow key={returnItem.id}>
                        <TableCell className="font-medium">#{returnItem.shopify_order_id}</TableCell>
                        <TableCell>{returnItem.customer_email}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {returnItem.return_items.map((item, idx) => (
                              <div key={idx}>
                                {item.product_name} (x{item.quantity})
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{returnItem.reason}</TableCell>
                        <TableCell>
                          {returnItem.ai_suggestions.length > 0 ? (
                            <div className="flex items-center space-x-2">
                              <Sparkles className="w-4 h-4 text-blue-600" />
                              <div className="text-sm">
                                <div className="font-medium">{returnItem.ai_suggestions[0].suggested_product_name}</div>
                                <div className="text-gray-500">
                                  {Math.round(returnItem.ai_suggestions[0].confidence_score * 100)}% confidence
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(returnItem.status)}</TableCell>
                        <TableCell>${returnItem.total_amount}</TableCell>
                        <TableCell>
                          {returnItem.status === "requested" && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleReturnAction(returnItem.id, "approve")}
                                disabled={actionLoading === returnItem.id}
                              >
                                {actionLoading === returnItem.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                )}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReturnAction(returnItem.id, "reject")}
                                disabled={actionLoading === returnItem.id}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {returns.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No returns found matching your criteria</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Performance</CardTitle>
                  <CardDescription>Returns vs Exchanges trend</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={returnTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString()} />
                      <YAxis />
                      <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString()} />
                      <Bar dataKey="returns" fill="#8884d8" name="Returns" />
                      <Bar dataKey="exchanges" fill="#82ca9d" name="Exchanges" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Performance</CardTitle>
                  <CardDescription>AI suggestion acceptance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Overall Acceptance Rate</span>
                      <span className="text-2xl font-bold">{metrics?.aiAcceptanceRate || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${metrics?.aiAcceptanceRate || 0}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Suggestions Made</div>
                        <div className="font-semibold">
                          {returns.reduce((sum, ret) => sum + ret.ai_suggestions.length, 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Accepted</div>
                        <div className="font-semibold">
                          {returns.reduce(
                            (sum, ret) => sum + ret.ai_suggestions.filter((s) => s.accepted === true).length,
                            0,
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
