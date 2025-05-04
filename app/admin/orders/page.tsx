'use client';

import { useState, useEffect } from 'react';
import { OrderStatus } from '@prisma/client';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Filter, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
    images: {
      url: string;
    }[];
    url: string;
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
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
                sizes: item.product.sizes,
                colorVariants: item.product.colorVariants || [],
                images: item.product.images || [],
                url: item.product.url || ''
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
      // Create an array to hold all rows for the export
      // Each order item will be on its own row, similar to the image
      interface ExportRow {
        'N° com.': number;
        'Date': string;
        'Nom du client': string;
        'Numéro de téléphone': string;
        'Adresse': string;
        'Articles': string;
        'Taille': string;
        'Couleur': string;
        'Prix unitaire': string;
        'Montant total': string;
        'Statut': string;
      }
      
      const exportRows: ExportRow[] = [];
      
      // Process each order and create separate rows for each item
      orders.forEach(order => {
        // If order has no items, create one row with just the order info
        if (!order.items || order.items.length === 0) {
          exportRows.push({
            'N° com.': order.id,
            'Date': new Date(order.createdAt).toLocaleDateString('fr-FR'),
            'Nom du client': order.customerName,
            'Numéro de téléphone': order.phoneNumber,
            'Adresse': order.address,
            'Articles': 'Aucun article',
            'Taille': '',
            'Couleur': '',
            'Prix unitaire': '',
            'Montant total': `${order.totalAmount.toFixed(2)} TND`,
            'Statut': order.status
          });
        } else {
          // Create a row for each item in the order
          order.items.forEach(item => {
            exportRows.push({
              'N° com.': order.id,
              'Date': new Date(order.createdAt).toLocaleDateString('fr-FR'),
              'Nom du client': order.customerName,
              'Numéro de téléphone': order.phoneNumber,
              'Adresse': order.address,
              'Articles': item.product.name,
              'Taille': item.size ? item.size.value : (item.sizeId ? `ID: ${item.sizeId}` : 'N/A'),
              'Couleur': item.colorVariant?.color || item.color || 'N/A',
              'Prix unitaire': `${item.product.price.toFixed(2)} TND`,
              'Montant total': `${order.totalAmount.toFixed(2)} TND`,
              'Statut': order.status
            });
          });
        }
      });

      // Create a new workbook
      const wb = XLSX.utils.book_new();
      
      // Convert the data to a worksheet
      const ws = XLSX.utils.json_to_sheet(exportRows);
      
      // Set column widths for better readability
      const colWidths = [
        { wch: 8 },   // N° com.
        { wch: 12 },  // Date
        { wch: 20 },  // Nom du client
        { wch: 15 },  // Numéro de téléphone
        { wch: 25 },  // Adresse
        { wch: 30 },  // Articles
        { wch: 10 },  // Taille
        { wch: 15 },  // Couleur
        { wch: 12 },  // Prix unitaire
        { wch: 12 },  // Montant total
        { wch: 12 }   // Statut
      ];
      
      ws['!cols'] = colWidths;
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Commandes');
      
      // Generate the Excel file
      const now = new Date();
      const dateStr = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
      XLSX.writeFile(wb, `commandes_export_${dateStr}.xlsx`);
      
      toast.success('Export réussi !');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setExportLoading(false);
    }
  };

  // Order updated callback
  const handleOrderUpdated = () => {
    fetchOrders();
  };

  // Apply all filters
  const filteredOrders = orders
    .filter(order => statusFilter === 'all' || order.status === statusFilter)
    .filter(order => !customerNameFilter || order.customerName.toLowerCase().includes(customerNameFilter.toLowerCase()))
    .filter(order => !startDateFilter || new Date(order.createdAt) >= new Date(startDateFilter))
    .filter(order => !endDateFilter || new Date(order.createdAt) <= new Date(`${endDateFilter}T23:59:59`))
    .filter(order => !minAmountFilter || order.totalAmount >= parseFloat(minAmountFilter))
    .filter(order => !maxAmountFilter || order.totalAmount <= parseFloat(maxAmountFilter));
    
  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };


  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-gray-500';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800 border-gray-500';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 border-gray-500';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-gray-500';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-500';
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
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Exporter à Excel
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher par nom de client..."
            value={customerNameFilter}
            onChange={(e) => {
              setCustomerNameFilter(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }}
            className="pl-10 pr-10 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {customerNameFilter && (
            <button
              onClick={() => {
                setCustomerNameFilter('');
                setCurrentPage(1); // Reset to first page when clearing search
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Status filter buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => {
              setStatusFilter('all');
              setCurrentPage(1); // Reset to first page when changing filter
            }}
            className={`px-3 py-1 rounded-full text-sm ${
              statusFilter === 'all'
                ? 'bg-indigo-100 text-indigo-800 font-medium'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Tous
          </button>
          {Object.values(OrderStatus).map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1); // Reset to first page when changing filter
              }}
              className={`px-3 py-1 rounded-full text-sm ${
                statusFilter === status
                  ? 'bg-indigo-100 text-indigo-800 font-medium'
                  : `${getStatusBadgeClass(status)} hover:opacity-80`
              }`}
            >
              {status}
            </button>
          ))}
        </div>
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
              currentItems.map((order) => (
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
                      {order.items.map((item) => (
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
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  Aucune commande trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* Pagination */}
        {filteredOrders.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredOrders.length)} sur {filteredOrders.length} commandes
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`h-8 w-8 p-0 flex items-center justify-center rounded-md ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Logic to show pages around current page
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => paginate(pageNum)}
                    className={`h-8 w-8 p-0 flex items-center justify-center rounded-md ${currentPage === pageNum ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`h-8 w-8 p-0 flex items-center justify-center rounded-md ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Afficher</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page when changing items per page
                }}
                className="h-8 rounded-md border-gray-300 text-sm px-2"
              >
                {[5, 10, 25, 50].map(value => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
              <span className="text-sm text-gray-500">par page</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
