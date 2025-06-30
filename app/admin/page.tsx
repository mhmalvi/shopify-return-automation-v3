"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Package,
  Users,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  Download,
  Settings,
  Bell,
  Sparkles,
  Loader2,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { dataService, type ReturnWithDetails, type DashboardMetrics } from "@/lib/data-service"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

const returnsData: ReturnWithDetails[] = [
  {
    id: "1",
    order_number: "#1001",
    customer_email: "john.doe@example.com",
    reason: "Defective item",
    status: "pending",
    created_at: "2024-01-20T14:30:00Z",
    items: [{ product_name: "T-shirt", quantity: 1, price: 25 }],
  },
  {
    id: "2",
    order_number: "#1002",
    customer_email: "jane.smith@example.com",
    reason: "Wrong size",
    status: "approved",
    created_at: "2024-01-22T10:00:00Z",
    items: [{ product_name: "Jeans", quantity: 1, price: 60 }],
  },
  {
    id: "3",
    order_number: "#1003",
    customer_email: "alice.wang@example.com",
    reason: "Changed mind",
    status: "processed",
    created_at: "2024-01-25T16:45:00Z",
    items: [{ product_name: "Shoes", quantity: 1, price: 80 }],
  },
]

const dashboardMetrics: DashboardMetrics = {
  totalReturns: 150,
  pendingReturns: 20,
  processedReturns: 120,
  totalRefunded: 5000,
}

export default function AdminPage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [metrics, setMetrics] = useState<DashboardMetrics>(dashboardMetrics)
  const [returns, setReturns] = useState<ReturnWithDetails[]>(returnsData)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "processed">("all")

  useEffect(() => {
    if (!user && !authLoading) {
      router.push("/auth")
    }

    loadData()
  }, [user, authLoading, router])

  const loadData = async () => {
    setLoading(true)
    try {
      // Simulate API calls
      // const metricsData = await dataService.getDashboardMetrics()
      // const returnsData = await dataService.getReturns()
      // setMetrics(metricsData)
      setMetrics(dashboardMetrics)
      setReturns(returnsData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/auth")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      })
    }
  }

  const filteredReturns = returns.filter((item) => {
    const matchesSearch =
      item.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customer_email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === "all" || item.status === filterStatus

    return matchesSearch && matchesStatus
  })

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Handle unauthorized state appropriately
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 text-gray-500" />
            <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost">
              <Settings className="w-4 h-4" />
            </Button>
            <Button onClick={handleSignOut} size="sm">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalReturns}</div>
              <div className="text-sm text-green-500 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +12%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Pending Returns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.pendingReturns}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Processed Returns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.processedReturns}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Refunded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.totalRefunded}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="returns" className="space-y-4">
          <TabsList>
            <TabsTrigger value="returns">Returns</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="returns" className="space-y-4">
            {/* Returns Table */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Input
                  type="text"
                  placeholder="Search orders..."
                  className="max-w-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button variant="ghost" className="ml-2">
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.order_number}</TableCell>
                    <TableCell>{item.customer_email}</TableCell>
                    <TableCell>{item.reason}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === "pending"
                            ? "secondary"
                            : item.status === "approved"
                            ? "success"
                            : "destructive"
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm">View Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {/* Analytics Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Returns Over Time</CardTitle>
                  <CardDescription>Monthly return trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={[
                      { month: "Jan", returns: 120 },
                      { month: "Feb", returns: 90 },
                      { month: "Mar", returns: 110 },
                      { month: "Apr", returns: 130 },
                      { month: "May", returns: 100 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="returns" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Return Reasons</CardTitle>
                  <CardDescription>Distribution of return reasons</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Defective", value: 40 },
                          { name: "Wrong Size", value: 30 },
                          { name: "Changed Mind", value: 20 },
                          { name: "Other", value: 10 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {
                          [
                            { name: "Defective", value: 40 },
                            { name: "Wrong Size", value: 30 },
                            { name: "Changed Mind", value: 20 },
                            { name: "Other", value: 10 },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))
                        }
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Manage your store settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertDescription>
                    This is a demo store. Settings are not editable.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
