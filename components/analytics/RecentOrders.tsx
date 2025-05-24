'use client';

import { OrderStatus } from '@prisma/client';

interface RecentOrder {
  id: number;
  customerName: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

interface RecentOrdersProps {
  recentOrders: RecentOrder[];
  statusColors: Record<OrderStatus, string>;
}

export default function RecentOrders({ recentOrders, statusColors }: RecentOrdersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Commandes récentes
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Montant
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {recentOrders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-2 text-sm text-gray-900">#{order.id}</td>
                <td className="px-4 py-2 text-sm text-gray-500">
                  {order.customerName}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900">
                  {order.totalAmount.toFixed(2)} TND
                </td>
                <td className="px-4 py-2">
                  <span
                    className="px-2 py-1 text-xs rounded-full"
                    style={{
                      backgroundColor: `${statusColors[order.status]}20`,
                      color: statusColors[order.status],
                    }}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
