'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  Package2,
  TrendingUp,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface StatsData {
  overview: {
    totalProducts: number
    totalOrders: number
    totalClients: number
    totalRevenue: number
    totalStock: number
    inStockCount: number
    outOfStockCount: number
  }
  ordersByStatus: Array<{
    status: string
    _count: number
  }>
  topProducts: Array<{
    id: number
    name: string
    orderCount: number
    price: number
  }>
  recentOrders: Array<{
    id: number
    customerName: string
    totalAmount: number
    status: string
    createdAt: string
  }>
  clientStats: {
    avgFidelityPoints: number
    subscribedCount: number
  }
}

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  subtitle, 
  trend 
}: { 
  title: string
  value: string | number
  icon: any
  subtitle?: string
  trend?: {
    value: number
    label: string
  }
}) => (
  <Card className="hover:shadow-lg transition-shadow duration-200">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
        <Icon className="h-4 w-4 text-blue-500" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold mb-1">{value}</div>
      {(subtitle || trend) && (
        <div className="flex items-center text-xs space-x-2">
          {trend && (
            <div className={`flex items-center ${trend.value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend.value >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              <span className="ml-1">{Math.abs(trend.value)}%</span>
            </div>
          )}
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>
      )}
    </CardContent>
  </Card>
)

const DashboardCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <Card className="hover:shadow-lg transition-shadow duration-200">
    <CardHeader>
      <CardTitle className="text-lg font-semibold text-blue-900">{title}</CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
)

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {status}
    </span>
  )
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats')
        if (!response.ok) throw new Error('Failed to fetch statistics')
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Error fetching statistics:', error)
        toast.error('Failed to fetch statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading || !stats) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-blue-900">Tableau de Bord</h1>
        <p className="text-sm text-muted-foreground">
          Dernière mise à jour: {formatDate(new Date().toISOString())}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Total Produits"
          value={stats.overview.totalProducts}
          icon={Package}
          trend={{ value: 12, label: 'vs last month' }}
        />
        <StatCard
          title="Total Commandes"
          value={stats.overview.totalOrders}
          icon={ShoppingCart}
          trend={{ value: 8, label: 'vs last month' }}
        />
        <StatCard
          title="Total Clients"
          value={stats.overview.totalClients}
          icon={Users}
          trend={{ value: 5, label: 'vs last month' }}
        />
        <StatCard
          title="Revenu Total"
          value={`${stats.overview.totalRevenue.toFixed(2)} DT`}
          icon={DollarSign}
          trend={{ value: 15, label: 'vs last month' }}
        />
        <StatCard
          title="Stock Disponible"
          value={stats.overview.inStockCount}
          icon={Package2}
          trend={{ value: -3, label: 'vs last month' }}
        />
        <StatCard
          title="Stock Épuisé"
          value={stats.overview.outOfStockCount}
          icon={Package2}
          trend={{ value: -3, label: 'vs last month' }}
        />
        <StatCard
          title="Points Fidélité"
          value={stats.clientStats.avgFidelityPoints}
          icon={TrendingUp}
          subtitle={`${stats.clientStats.subscribedCount} abonnés`}
        />
      </div>

      {/* Stock and Client Stats */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <DashboardCard title="État du Stock">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-green-700">En Stock</h3>
              <p className="text-3xl font-bold text-green-600">{stats.overview.inStockCount}</p>
              <p className="text-sm text-green-500">
                {Math.round((stats.overview.inStockCount / stats.overview.totalStock) * 100)}% du stock total
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-red-700">Épuisé</h3>
              <p className="text-3xl font-bold text-red-600">{stats.overview.outOfStockCount}</p>
              <p className="text-sm text-red-500">
                {Math.round((stats.overview.outOfStockCount / stats.overview.totalStock) * 100)}% du stock total
              </p>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Résumé du Stock</h3>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500" 
                style={{ 
                  width: `${Math.round((stats.overview.inStockCount / stats.overview.totalStock) * 100)}%` 
                }}
              ></div>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>Total: {stats.overview.totalStock} articles</span>
              <span>{Math.round((stats.overview.inStockCount / stats.overview.totalStock) * 100)}% disponible</span>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Statistiques Clients">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-blue-700">Points de Fidélité</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.clientStats.avgFidelityPoints}</p>
              <p className="text-sm text-blue-500">
                Points moyens par client
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-purple-700">Abonnés</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.clientStats.subscribedCount}</p>
              <p className="text-sm text-purple-500">
                Clients abonnés à la newsletter
              </p>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Commandes Récentes</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.customerName}
                      </TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell className="text-right">{order.totalAmount} DT</TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Products and Orders */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <DashboardCard title="Produits les Plus Vendus">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead className="text-right">Ventes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">{product.price} DT</TableCell>
                    <TableCell className="text-right">{product.orderCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DashboardCard>

        <DashboardCard title="Commandes Récentes">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.customerName}
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell className="text-right">{order.totalAmount} DT</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DashboardCard>
      </div>
    </div>
  )
}
