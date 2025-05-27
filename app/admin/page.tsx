'use client';

import { useState, useEffect } from 'react';
import { OrderStatus } from '@prisma/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import SalesLineChart from '@/components/charts/SalesLineChart';
import OrderStatusDonutChart from '@/components/charts/OrderStatusDonutChart';
import OrdersByStatusChart from '@/components/charts/OrdersByStatusChart';
import SMSMarketingAnalytics from '@/components/analytics/SMSMarketingAnalytics';
import TopOrderedProducts from '@/components/analytics/TopOrderedProducts';
import GeneralStats from '@/components/analytics/GeneralStats';
import StockSummary from '@/components/analytics/StockSummary';
import RecentOrders from '@/components/analytics/RecentOrders';
import OrderStatusSummary from '@/components/analytics/OrderStatusSummary';

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
  orderCountByStatus: Record<OrderStatus, number[]>;
  last7DaysLabels: string[];
  monthlyData: {
    labels: string[];
    salesByStatus: Record<OrderStatus, number[]>;
  };
  allTimeData: {
    labels: string[];
    salesByStatus: Record<OrderStatus, number[]>;
  };
  // Add actual order counts by status
  actualOrderCountsByStatus: Record<OrderStatus, number>;
  globalStock: {
    totalStock: number;
    inStockOnline: number;
    outOfStockOnline: number;
  };
  stockProducts: ProductWithStock[];
}

interface SMSAnalytics {
  subscriberGrowth: {
    labels: string[];
    newSubscribers: number[];
    totalSubscribers: number[];
  };
  notificationConversion: {
    labels: string[];
    conversionRates: number[];
  };
  campaignPerformance: {
    source: string;
    count: number;
  }[];
  subscriberCount: number;
  notificationCount: number;
  convertedNotificationCount: number;
}

interface TopProduct {
  id: number;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
  imageUrl?: string;
  color?: string;
  pendingOrders: number;     // PENDING
  confirmedOrders: number;   // CONFIRMED
  shippedOrders: number;     // SHIPPED
  deliveredOrders: number;   // DELIVERED
  cancelledOrders: number;   // CANCELLED
}

interface DataFeatures {
  smsAnalytics: SMSAnalytics;
  topOrderedProducts: TopProduct[];
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
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [dataFeatures, setDataFeatures] = useState<DataFeatures | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Flatten stock data for easier display
  const flattenedStockRows = analytics?.stockProducts?.flatMap(product =>
    product.colorVariants.flatMap(variant =>
      variant.stocks.map(stock => ({
        product,
        variant,
        stock,
      })))
  ) || [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch analytics data
        const analyticsResponse = await fetch('/api/admin/analytics');
        if (!analyticsResponse.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);

        // Fetch data features (SMS analytics and top ordered products)
        const dataFeaturesResponse = await fetch('/api/admin/data-features');
        if (!dataFeaturesResponse.ok) {
          throw new Error('Failed to fetch data features');
        }
        const dataFeaturesData = await dataFeaturesResponse.json();
        setDataFeatures(dataFeaturesData);

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

      {/* General Statistics */}
      {analytics && (
        <GeneralStats
          totalProducts={analytics.totalProducts}
          totalOrders={analytics.totalOrders}
        />
      )}



      {/* Recent Orders and Order Status Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {analytics?.recentOrders && <RecentOrders recentOrders={analytics.recentOrders} />}

        {analytics?.ordersByStatus && (
          <OrderStatusSummary
            ordersByStatus={analytics.ordersByStatus}
            statusTranslations={statusTranslations}
          />
        )}
      </div>

      {/* Sales Overview and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Aperçu des ventes
          </h3>
          {analytics && (
            <SalesLineChart
              salesData={analytics.salesData}
              salesByStatus={analytics.salesByStatus}
              dayTranslations={dayTranslations}
              statusTranslations={statusTranslations}
              statusColors={statusColors}
            />
          )}
        </div>

        {dataFeatures && (
          <TopOrderedProducts products={dataFeatures.topOrderedProducts} />
        )}
      </div>

      {/* Order Status Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Commandes par Statut
          </h3>
          <div className="relative">
            {analytics && (
              <OrderStatusDonutChart
                ordersByStatus={analytics.ordersByStatus}
                statusTranslations={statusTranslations}
                statusColors={statusColors}
                valueType="count"
              />
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Nombre de commandes par statut et jour
          </h3>
          {analytics && (
            <OrdersByStatusChart
              salesByStatus={analytics.orderCountByStatus}
              labels={analytics.last7DaysLabels}
              monthlyData={{
                labels: analytics.monthlyData.labels,
                salesByStatus: analytics.monthlyData.salesByStatus
              }}
              allTimeData={{
                labels: analytics.allTimeData.labels,
                salesByStatus: analytics.allTimeData.salesByStatus
              }}
              statusTranslations={statusTranslations}
              dayTranslations={dayTranslations}
              statusColors={statusColors}
              actualOrderCountsByStatus={analytics.actualOrderCountsByStatus}
            />
          )}
        </div>
      </div>

      {/* SMS Marketing Analytics */}
      {dataFeatures && (
        <div className="mb-8">
          <SMSMarketingAnalytics
            subscriberGrowth={dataFeatures.smsAnalytics.subscriberGrowth}
            notificationConversion={dataFeatures.smsAnalytics.notificationConversion}
            campaignPerformance={dataFeatures.smsAnalytics.campaignPerformance}
            subscriberCount={dataFeatures.smsAnalytics.subscriberCount}
            notificationCount={dataFeatures.smsAnalytics.notificationCount}
            convertedNotificationCount={dataFeatures.smsAnalytics.convertedNotificationCount}
          />
        </div>
      )}

      <div>
        <StockSummary globalStock={analytics?.globalStock || { totalStock: 0, inStockOnline: 0, outOfStockOnline: 0 }} />
      </div>
      {/* Stock Management Section with Size Details */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Gestion des stocks par taille
          </h3>
          <p className="text-sm text-gray-500">{flattenedStockRows.length} lignes</p>
          {analytics?.stockProducts && analytics.stockProducts.length > 0 && (
            <a href="/admin/stock" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center">
              Voir tous les stocks
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          )}
        </div>

        {analytics?.stockProducts && analytics.stockProducts.length > 0 ? (
          <>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Couleur</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taille</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière MAJ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {flattenedStockRows
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map(({ product, variant, stock }, index) => (
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
                            {typeof stock.size === 'object' ? stock.size?.value : typeof stock.size === 'string' ? stock.size : 'N/A'}
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


    </div>
  );
}
