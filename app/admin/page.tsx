'use client';

import { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { OrderStatus } from '@prisma/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Size {
  id: number;
  value: string;
}

interface StockItem {
  id: number;
  inStockJammel: boolean;
  inStockTunis: boolean;
  inStockSousse: boolean;
  inStockOnline: boolean;
  size: Size;
  colorId: number;
  updatedAt: string;
}

interface ColorVariant {
  id: number;
  color: string;
  images: {
    id: number;
    url: string;
    isMain: boolean;
  }[];
  stocks: StockItem[];
}

interface ProductWithStock {
  id: number;
  name: string;
  colorVariants: ColorVariant[];
  updatedAt: string;
  createdAt: string;
}

interface Analytics {
  totalProducts: number;
  totalOrders: number;
  recentOrders: {
    id: number;
    customerName: string;
    totalAmount: number;
    status: OrderStatus;
    createdAt: string;
  }[];
  salesData: {
    labels: string[];
    data: number[];
  };
  topProducts: {
    name: string;
    sales: number;
  }[];
  ordersByStatus: {
    status: OrderStatus;
    count: number;
    revenue: number;
  }[];
  salesByStatus: Record<OrderStatus, number[]>;
  last7DaysLabels: string[];
  globalStock: {
    totalStock: number;
    inStockAnyLocation: number;
    outOfStockAllLocations: number;
    locationSpecific?: {
      jammel: { inStock: number; outOfStock: number };
      tunis: { inStock: number; outOfStock: number };
      sousse: { inStock: number; outOfStock: number };
      online: { inStock: number; outOfStock: number };
    };
  };
  stockProducts: ProductWithStock[];
}

const statusColors = {
  PENDING: 'rgb(251, 191, 36)',
  CONFIRMED: 'rgb(79, 70, 229)',
  SHIPPED: 'rgb(59, 130, 246)',
  DELIVERED: 'rgb(34, 197, 94)',
  CANCELLED: 'rgb(239, 68, 68)',
};

// French translations for order statuses
const statusTranslations = {
  PENDING: 'En Attente',
  CONFIRMED: 'Confirmée',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

// French translations for days of the week
const dayTranslations: Record<string, string> = {
  'Mon': 'Lun',
  'Tue': 'Mar',
  'Wed': 'Mer',
  'Thu': 'Jeu',
  'Fri': 'Ven',
  'Sat': 'Sam',
  'Sun': 'Dim',
  'Monday': 'Lundi',
  'Tuesday': 'Mardi',
  'Wednesday': 'Mercredi',
  'Thursday': 'Jeudi',
  'Friday': 'Vendredi',
  'Saturday': 'Samedi',
  'Sunday': 'Dimanche'
};

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalProducts: 0,
    totalOrders: 0,
    recentOrders: [],
    salesData: {
      labels: [],
      data: [],
    },
    topProducts: [],
    ordersByStatus: [],
    salesByStatus: {} as Record<OrderStatus, number[]>,
    last7DaysLabels: [],
    globalStock: {
      totalStock: 0,
      inStockAnyLocation: 0,
      outOfStockAllLocations: 0,
      locationSpecific: {
        jammel: { inStock: 0, outOfStock: 0 },
        tunis: { inStock: 0, outOfStock: 0 },
        sousse: { inStock: 0, outOfStock: 0 },
        online: { inStock: 0, outOfStock: 0 }
      },
    },
    stockProducts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // Flattened stock rows for pagination
  const flattenedStockRows = analytics.stockProducts.flatMap(product => 
    product.colorVariants.flatMap(variant => 
      variant.stocks.map(stock => ({
        product,
        variant,
        stock
      }))
    )
  );

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch analytics data
      const analyticsResponse = await fetch('/api/admin/analytics');
      if (!analyticsResponse.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const analyticsData = await analyticsResponse.json();
      
      // Fetch stock data
      const stockResponse = await fetch('/api/admin/stock');
      if (!stockResponse.ok) {
        throw new Error('Failed to fetch stock data');
      }
      const stockData = await stockResponse.json();
      
      // Combine the data
      setAnalytics({
        ...analyticsData,
        stockProducts: stockData.products || []
      });
      setError('');
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const salesChartData = {
    labels: analytics.salesData.labels.map(label => dayTranslations[label as keyof typeof dayTranslations] || label),
    datasets: [
      {
        label: 'Total Ventes',
        data: analytics.salesData.data,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      ...Object.entries(analytics.salesByStatus).map(([status, data]) => ({
        label: `${statusTranslations[status as OrderStatus]} Ventes`,
        data: data,
        fill: false,
        borderColor: statusColors[status as OrderStatus],
        tension: 0.1,
        hidden: true,
      })),
    ],
  };

  const orderStatusChartData = {
    labels: analytics.ordersByStatus.map((item) => statusTranslations[item.status]),
    datasets: [
      {
        data: analytics.ordersByStatus.map((item) => item.count),
        backgroundColor: analytics.ordersByStatus.map(
          (item) => statusColors[item.status]
        ),
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            // Translate day in tooltip title if it's a day of the week
            const title = context[0]?.label || '';
            return dayTranslations[title] || title;
          }
        }
      }
    },
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total des produits</h3>
          <p className="text-3xl font-bold text-indigo-600">
            {analytics.totalProducts}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total des commandes</h3>
          <p className="text-3xl font-bold text-indigo-600">
            {analytics.totalOrders}
          </p>
        </div>
      </div>

      {/* Stock Management Section with Size Details */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Gestion des stocks par taille
          </h3>
          <p className="text-sm text-gray-500">{flattenedStockRows.length} lignes</p>
          {analytics.stockProducts && analytics.stockProducts.length > 0 && (
            <a href="/admin/stock" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center">
              Voir tous les stocks 
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          )}
        </div>
        
        {analytics.stockProducts && analytics.stockProducts.length > 0 ? (
          <>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Couleur</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taille</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Jammel</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tunis</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sousse</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Online</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière MAJ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {flattenedStockRows
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map(({ product, variant, stock }) => (
                          <tr key={`${product.id}-${variant.id}-${stock.id}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <p className="text-sm font-medium text-gray-900">{product.name}</p>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                {variant.images && variant.images.length > 0 ? (
                                  <div className="w-8 h-8 rounded-full overflow-hidden mr-2 border border-gray-200">
                                    <img 
                                      src={variant.images[0].url} 
                                      alt={variant.color} 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 flex items-center justify-center">
                                    <span className="text-xs text-gray-500">N/A</span>
                                  </div>
                                )}
                                <span className="text-sm">{variant.color}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-sm font-medium text-blue-700">
                                {stock.size?.value || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <span className={`inline-flex items-center justify-center w-20 px-2 py-1 rounded-md text-xs font-medium ${stock.inStockJammel ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {stock.inStockJammel ? 'En stock' : 'Rupture'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <span className={`inline-flex items-center justify-center w-20 px-2 py-1 rounded-md text-xs font-medium ${stock.inStockTunis ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {stock.inStockTunis ? 'En stock' : 'Rupture'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <span className={`inline-flex items-center justify-center w-20 px-2 py-1 rounded-md text-xs font-medium ${stock.inStockSousse ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {stock.inStockSousse ? 'En stock' : 'Rupture'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <span className={`inline-flex items-center justify-center w-20 px-2 py-1 rounded-md text-xs font-medium ${stock.inStockOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {stock.inStockOnline ? 'En stock' : 'Rupture'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-500">
                              {new Date(stock.updatedAt).toLocaleDateString()}
                            </td>
                          </tr>
                    ))}
                  
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Afficher</span>
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when changing items per page
                  }}
                  className="border border-gray-300 rounded-md text-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-500">éléments par page</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, Math.ceil(flattenedStockRows.length / itemsPerPage)) }, (_, i) => {
                    const pageNum = i + 1;
                    const totalPages = Math.ceil(flattenedStockRows.length / itemsPerPage);
                    
                    // Show first page, last page, current page, and pages around current
                    if (
                      pageNum === 1 || 
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded-md ${currentPage === pageNum ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      (pageNum === 2 && currentPage > 3) ||
                      (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                    ) {
                      return <span key={pageNum} className="px-2">...</span>;
                    }
                    return null;
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(flattenedStockRows.length / itemsPerPage)))}
                  disabled={currentPage >= Math.ceil(flattenedStockRows.length / itemsPerPage)}
                  className={`px-3 py-1 rounded-md ${currentPage >= Math.ceil(flattenedStockRows.length / itemsPerPage) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="text-sm text-gray-500">
                Affichage de {Math.min((currentPage - 1) * itemsPerPage + 1, flattenedStockRows.length)} à {Math.min(currentPage * itemsPerPage, flattenedStockRows.length)} sur {flattenedStockRows.length} lignes
              </div>
            </div>
          </>
          ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500 font-medium">Aucune information de stock disponible</p>
            <p className="text-gray-400 text-sm mt-1">Les données de stock s'afficheront ici une fois disponibles</p>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Commandes Recentes
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Client
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Montant
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">#{order.id}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {order.customerName}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {order.totalAmount.toFixed(2)} TND
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${
                          order.status === 'DELIVERED'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'SHIPPED'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'CONFIRMED'
                            ? 'bg-indigo-100 text-indigo-800'
                            : order.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {statusTranslations[order.status] || order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Résumé des statuts des commandes
          </h3>
          <div className="space-y-4">
            {analytics.ordersByStatus.map((statusData) => (
              <div
                key={statusData.status}
                className="flex items-center justify-between"
              >
                <div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                    ${
                      statusData.status === 'DELIVERED'
                        ? 'bg-green-100 text-green-800'
                        : statusData.status === 'SHIPPED'
                        ? 'bg-blue-100 text-blue-800'
                        : statusData.status === 'CONFIRMED'
                        ? 'bg-indigo-100 text-indigo-800'
                        : statusData.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {statusTranslations[statusData.status] || statusData.status}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Commandes: </span>
                  <span className="font-medium text-gray-900">
                    {statusData.count}
                  </span>
                  <span className="mx-2 text-gray-300">|</span>
                  <span className="text-gray-500">Montant: </span>
                  <span className="font-medium text-gray-900">
                    {statusData.revenue.toFixed(2)} TND
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
    

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Aperçu des ventes
          </h3>
          <Line data={salesChartData} options={chartOptions} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Commandes par Statut
          </h3>
          <div className="aspect-square relative">
            <Doughnut
              data={orderStatusChartData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    position: 'right' as const,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}