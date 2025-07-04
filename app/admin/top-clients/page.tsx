'use client';

import { useState, useEffect } from 'react';
import { Search, ArrowUpDown, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { TableHead } from '@/components/ui/table';

interface Order {
  id: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  createdAt: string;
}

interface OrdersByStatus {
  PENDING?: number;
  CONFIRMED?: number;
  SHIPPED?: number;
  DELIVERED?: number;
  CANCELLED?: number;
}

interface TopClient {
  id: number | string;
  username: string;
  email: string;
  phoneNumber?: string;
  orderCount: number;
  totalSpent: number;
  fidelityPoints: number;
  lastOrderDate: string;
  isGuest?: boolean;
  ordersByStatus?: OrdersByStatus;
  recentOrders?: Order[];
}

export default function TopClientsPage() {
  const [clients, setClients] = useState<TopClient[]>([]);
  const [filteredClients, setFilteredClients] = useState<TopClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof TopClient;
    direction: 'ascending' | 'descending';
  }>({
    key: 'orderCount',
    direction: 'descending',
  });
  
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchTopClients();
  }, [statusFilter]);

  useEffect(() => {
    // Filter clients based on search term
    if (searchTerm.trim() === '') {
      setFilteredClients(clients);
    } else {
      const lowercasedTerm = searchTerm.toLowerCase();
      const filtered = clients.filter(
        client =>
          client.username.toLowerCase().includes(lowercasedTerm) ||
          client.email.toLowerCase().includes(lowercasedTerm) ||
          (client.phoneNumber && client.phoneNumber.includes(lowercasedTerm))
      );
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);

  const fetchTopClients = async () => {
    try {
      setLoading(true);
      const url = statusFilter 
        ? `/api/admin/top-clients?status=${statusFilter}` 
        : '/api/admin/top-clients';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch top clients');
      }
      const data = await response.json();
      setClients(data.clients);
      setFilteredClients(data.clients);
    } catch (err) {
      console.error('Error fetching top clients:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch top clients');
    } finally {
      setLoading(false);
    }
  };

  const requestSort = (key: keyof TopClient) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });

    // Sort the filtered clients
    const sortedClients = [...filteredClients].sort((a, b) => {
      // Handle null, undefined, or non-comparable values
      const valueA = a[key] ?? '';
      const valueB = b[key] ?? '';
      
      if (valueA < valueB) {
        return direction === 'ascending' ? -1 : 1;
      }
      if (valueA > valueB) {
        return direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    setFilteredClients(sortedClients);
  };

  const getSortIcon = (key: keyof TopClient) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortConfig.direction === 'ascending' ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Top Clients</h1>
        <p className="mt-2 text-sm text-gray-600">
          Liste des clients qui ont passé le plus de commandes
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex-shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="CONFIRMED">Confirmées</option>
                <option value="SHIPPED">Expédiées</option>
                <option value="DELIVERED">Livrées</option>
                <option value="CANCELLED">Annulées</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('username')}
                >
                  <div className="flex items-center">
                    Client
                    {getSortIcon('username')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('email')}
                >
                  <div className="flex items-center">
                    Email / Téléphone
                    {getSortIcon('email')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('isGuest')}
                >
                  <div className="flex items-center">
                    Type
                    {getSortIcon('isGuest')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('orderCount')}
                >
                  <div className="flex items-center">
                    Commandes
                    {getSortIcon('orderCount')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('totalSpent')}
                >
                  <div className="flex items-center">
                    Total dépensé
                    {getSortIcon('totalSpent')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('fidelityPoints')}
                >
                  <div className="flex items-center">
                    Points fidélité
                    {getSortIcon('fidelityPoints')}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('lastOrderDate')}
                >
                  <div className="flex items-center">
                    Dernière commande
                    {getSortIcon('lastOrderDate')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">Chargement des données...</p>
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    Aucun client trouvé
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{client.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{client.isGuest ? client.phoneNumber : client.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${client.isGuest ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                        {client.isGuest ? 'Invité' : 'Inscrit'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.orderCount}</div>
                      {client.ordersByStatus && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {client.ordersByStatus.PENDING && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                              {client.ordersByStatus.PENDING} en attente
                            </span>
                          )}
                          {client.ordersByStatus.CONFIRMED && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                              {client.ordersByStatus.CONFIRMED} confirmées
                            </span>
                          )}
                          {client.ordersByStatus.SHIPPED && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              {client.ordersByStatus.SHIPPED} expédiées
                            </span>
                          )}
                          {client.ordersByStatus.DELIVERED && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              {client.ordersByStatus.DELIVERED} livrées
                            </span>
                          )}
                          {client.ordersByStatus.CANCELLED && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              {client.ordersByStatus.CANCELLED} annulées
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.totalSpent.toFixed(2)} TND</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.fidelityPoints}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {client.lastOrderDate 
                          ? new Date(client.lastOrderDate).toLocaleDateString()
                          : '—'}
                      </div>
                      {client.recentOrders && client.recentOrders.length > 0 && (
                        <div className="mt-1">
                          {client.recentOrders.map((order) => (
                            <div key={order.id} className="mt-1 flex items-center">
                              <span className="mr-1 text-xs text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString()}:
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                                ${order.status === 'PENDING' ? 'bg-orange-100 text-orange-800' : ''}
                                ${order.status === 'CONFIRMED' ? 'bg-indigo-100 text-indigo-800' : ''}
                                ${order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' : ''}
                                ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : ''}
                                ${order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : ''}
                              `}>
                                {order.status === 'PENDING' && 'En attente'}
                                {order.status === 'CONFIRMED' && 'Confirmée'}
                                {order.status === 'SHIPPED' && 'Expédiée'}
                                {order.status === 'DELIVERED' && 'Livrée'}
                                {order.status === 'CANCELLED' && 'Annulée'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}