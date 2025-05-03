'use client';

import { useState, useEffect } from 'react';
import { OrderStatus } from '@prisma/client';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Filter, X, Search } from 'lucide-react';
import { OrderActions } from '@/components/order-actions';

interface Category {
  id: number;
  name: string;
}

interface ProductCategory {
  categoryId: number;
  category: Category;
}

interface Size {
  id: number;
  value: string;
}

interface ProductSize {
  sizeId: number;
  size: Size;
}

interface OrderItem {
  id: number;
  quantity: number;
  size?: Size;
  sizeId?: number;
  color?: string;
  productId: number;
  colorVariantId: number;
  colorVariant?: {
    id: number;
    color: string;
    images: {
      url: string;
      isMain: boolean;
    }[];
  };
  product: {
    id: number;
    description: string;
    salePrice?: number | null;
    categories: ProductCategory[];
    sizes: ProductSize[];
    name: string;
    price: number;
    colorVariants: {
      images: {
        url: string;
      }[];
    }[];
  };
}

interface Order {
  id: number;
  customerName: string;
  phoneNumber: string;
  address: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string>('');
  const [exportLoading, setExportLoading] = useState(false);
  
  // Additional filter states
  const [customerNameFilter, setCustomerNameFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [minAmountFilter, setMinAmountFilter] = useState('');
  const [maxAmountFilter, setMaxAmountFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/admin/orders?timestamp=${Date.now()}`);
      
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch orders');
      }
  
      if (Array.isArray(data)) {
        // Log the first order to see its structure
        if (data.length > 0) {
          console.log('First order data:', data[0]);
          if (data[0].items && data[0].items.length > 0) {
            console.log('First order item:', data[0].items[0]);
            console.log('Size information:', data[0].items[0].size);
          }
        }
        
        // Process the orders array
        setOrders(data.map(order => ({
          ...order,
          items: order.items.map((item: OrderItem) => {
            // Log each item's size information
            console.log(`Item ${item.id} size:`, item.size);
            return {
              ...item,
              // Ensure the item structure matches your interface
              product: {
                id: item.product.id,
                name: item.product.name,
                price: item.product.price,
                description: item.product.description,
                salePrice: item.product.salePrice,
                categories: item.product.categories,
                sizes: item.product.sizes
              }
            };
          })
        })));
        setError('');
      } else if (data.error) {
        console.error('Server error:', data.details || data.error);
        setError(data.error);
        setOrders([]);
      } else {
        setError('Invalid response format');
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    setExportLoading(true);
    try {
      // Prepare data for export
      const exportData = orders.map(order => {
        // Flatten order items into a comma-separated string
        const itemsList = order.items.map((item: OrderItem) => 
          `${item.quantity}x ${item.product.name} (${item.size || 'No Size'}${item.color ? `, ${item.color}` : ''})`
        ).join('; ')

        return {
          'ID de la commande': order.id,
          'Date': new Date(order.createdAt).toLocaleDateString(),
          'Nom du client': order.customerName,
          'Numéro de téléphone': order.phoneNumber,
          'Adresse': order.address,
          'Articles': itemsList,
          'Montant total': `${order.totalAmount.toFixed(2)} TND`,
          'Statut': order.status
        }
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 10 }, // Order ID
        { wch: 12 }, // Date
        { wch: 20 }, // Customer Name
        { wch: 15 }, // Phone Number
        { wch: 30 }, // Address
        { wch: 50 }, // Items
        { wch: 15 }, // Total Amount
        { wch: 12 }, // Status
      ];
      ws['!cols'] = colWidths;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Orders');

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const fileName = `orders_export_${date}.xlsx`;

      // Save file
      XLSX.writeFile(wb, fileName);
      toast.success('Orders exported successfully!');
    } catch (error) {
      console.error('Error exporting orders:', error);
      toast.error('Failed to export orders');
    } finally {
      setExportLoading(false);
    }
  };

  // Order updated callback
  const handleOrderUpdated = async () => {
    await fetchOrders();
  };

  // Apply all filters
  const filteredOrders = orders
    .filter(order => statusFilter === 'all' || order.status === statusFilter)
    .filter(order => !customerNameFilter || order.customerName.toLowerCase().includes(customerNameFilter.toLowerCase()))
    .filter(order => !startDateFilter || new Date(order.createdAt) >= new Date(startDateFilter))
    .filter(order => !endDateFilter || new Date(order.createdAt) <= new Date(`${endDateFilter}T23:59:59`))
    .filter(order => !minAmountFilter || order.totalAmount >= parseFloat(minAmountFilter))
    .filter(order => !maxAmountFilter || order.totalAmount <= parseFloat(maxAmountFilter));

  const resetFilters = () => {
    setStatusFilter('all');
    setCustomerNameFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setMinAmountFilter('');
    setMaxAmountFilter('');
  };

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800';
      case 'CONFIRMED':
        return 'bg-indigo-100 text-indigo-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Commandes</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium"
            >
              <Filter size={16} />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button
              onClick={handleExportToExcel}
              disabled={exportLoading || orders.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
            >
              {exportLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                    />
                  </svg>
                  Exporter à Excel
                </>
              )}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4 border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Filtres</h3>
              <button 
                onClick={resetFilters}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X size={14} />
                Reset
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="all">Toutes les commandes</option>
                  {Object.values(OrderStatus).map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Name Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du client</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={customerNameFilter}
                    onChange={(e) => setCustomerNameFilter(e.target.value)}
                    placeholder="Rechercher par nom"
                    className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Amount Range Filter */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant min</label>
                  <input
                    type="number"
                    value={minAmountFilter}
                    onChange={(e) => setMinAmountFilter(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant max</label>
                  <input
                    type="number"
                    value={maxAmountFilter}
                    onChange={(e) => setMaxAmountFilter(e.target.value)}
                    placeholder="1000"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Info du client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details Commande</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{order.customerName}</div>
                    <div className="text-xs text-gray-400">{order.phoneNumber}</div>
                    <div className="text-xs text-gray-400">{order.address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="font-medium">{order.totalAmount.toFixed(2)} TND</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {order.items.map((item, index) => (
                        <div key={item.id} className="mb-1">
                          <strong>{item.quantity}x {item.product.name}</strong>
                          <div className="text-xs mt-1">
                            {item.size ? (
                              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded mr-1">Taille: {item.size.value}</span>
                            ) : item.sizeId ? (
                              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded mr-1">Taille ID: {item.sizeId}</span>
                            ) : null}
                            
                            {item.colorVariant?.color ? (
                              <span className="inline-block bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                                Couleur: {item.colorVariant.color}
                              </span>
                            ) : item.color ? (
                              <span className="inline-block bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                                Couleur: {item.color}
                              </span>
                            ) : null}
                          </div>
                          <span className="text-gray-400"> ({(item.quantity * item.product.price).toFixed(2)} TND)</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <OrderActions 
                      orderId={order.id} 
                      currentStatus={order.status} 
                      onOrderUpdated={handleOrderUpdated}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  Aucune commande trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
