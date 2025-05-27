import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { OrderStatus } from '@prisma/client';

interface OrdersByStatusChartProps {
  salesByStatus: Record<OrderStatus, number[]>;
  labels: string[];
  statusTranslations: Record<OrderStatus, string>;
  statusColors: Record<OrderStatus, string>;
  dayTranslations: Record<string, string>;
  monthlyData?: {
    salesByStatus: Record<OrderStatus, number[]>;
    labels: string[];
  };
  allTimeData?: {
    salesByStatus: Record<OrderStatus, number[]>;
    labels: string[];
  };
  // Add the actual order counts by status
  actualOrderCountsByStatus?: Record<OrderStatus, number>;
}

const OrdersByStatusChart: React.FC<OrdersByStatusChartProps> = ({
  salesByStatus,
  labels,
  statusTranslations,
  statusColors,
  dayTranslations,
  monthlyData,
  allTimeData,
  actualOrderCountsByStatus,
}) => {
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'all'>('week');
  
  // Select the appropriate data based on the selected time period
  const selectedData = {
    salesByStatus: timePeriod === 'week' ? salesByStatus : 
                   timePeriod === 'month' ? (monthlyData?.salesByStatus || salesByStatus) : 
                   (allTimeData?.salesByStatus || salesByStatus),
    labels: timePeriod === 'week' ? labels : 
            timePeriod === 'month' ? (monthlyData?.labels || labels) : 
            (allTimeData?.labels || labels)
  };
  // Transform the data to the format expected by recharts
  const chartData = selectedData.labels.map((label, index) => {
    // Format the date to be more compact (e.g., '18 Mai')
    const formattedDate = label.includes('T')
      ? new Date(label).toLocaleDateString('fr-FR', { 
          day: '2-digit', 
          month: 'short' 
        }).replace('.', '') // Remove period after month
      : dayTranslations[label] || label;
    const dataPoint: Record<string, any> = {
      name: formattedDate,
    };

    // Add count for each status
    Object.entries(selectedData.salesByStatus).forEach(([status, data]) => {
      // Use the actual count data directly - no need for approximation
      dataPoint[statusTranslations[status as OrderStatus]] = data[index] || 0;
      
      // Also store the actual total count for reference in the tooltip
      if (actualOrderCountsByStatus && actualOrderCountsByStatus[status as OrderStatus]) {
        dataPoint[`${statusTranslations[status as OrderStatus]}Total`] = 
          actualOrderCountsByStatus[status as OrderStatus];
      }
    });

    return dataPoint;
  });

  // Custom tooltip to show more detailed information
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Calculate daily orders for the chart display
      const dailyOrders = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
      
      // Get the actual date from the label
      const formattedDate = label;
      
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-md shadow-sm">
          <p className="font-semibold text-gray-800 mb-2">{formattedDate}</p>
          {payload.map((entry: any, index: number) => {
            // Get the total value from the data point
            const totalKey = `${entry.name}Total`;
            const totalValue = entry.payload[totalKey];
              
            return (
              <div key={index} className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-700">{entry.name}:</span>
                </div>
                <span className="text-sm font-medium text-gray-900 ml-4">
                  {entry.value} commandes {totalValue ? 
                    `(${totalValue} total)` : ''}
                </span>
              </div>
            );
          })}
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">Total pour ce jour:</span>
              <span className="text-sm font-bold text-gray-900">{dailyOrders} commandes</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Generate lines for each status
  const statusLines = Object.entries(salesByStatus).map(([status]) => (
    <Line
      key={status}
      type="monotone"
      dataKey={statusTranslations[status as OrderStatus]}
      stroke={statusColors[status as OrderStatus]}
      strokeWidth={2}
      dot={{ r: 4, strokeWidth: 2 }}
      activeDot={{ r: 6, strokeWidth: 2 }}
    />
  ));

  return (
    <>
      <div className="flex justify-end mb-4 space-x-2">
        <button 
          onClick={() => setTimePeriod('week')} 
          className={`px-3 py-1 text-sm rounded-md ${timePeriod === 'week' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Semaine
        </button>
        <button 
          onClick={() => setTimePeriod('month')} 
          className={`px-3 py-1 text-sm rounded-md ${timePeriod === 'month' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          disabled={!monthlyData}
        >
          Mois
        </button>
        <button 
          onClick={() => setTimePeriod('all')} 
          className={`px-3 py-1 text-sm rounded-md ${timePeriod === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          disabled={!allTimeData}
        >
          Tout
        </button>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 50,
            left: 30,
            bottom: 50,
          }}
        >
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis 
          dataKey="name" 
          tick={{ fill: '#6b7280', fontSize: 12 }}
          tickMargin={10}
          height={40}
          interval={0}
        />
        <YAxis 
          tick={{ fill: '#6b7280' }}
          tickMargin={10}
          allowDecimals={false}
          domain={[0, 'auto']}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ paddingTop: 10 }}
          iconType="circle"
        />
        <ReferenceLine y={0} stroke="#666" />
        {statusLines}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
};

export default OrdersByStatusChart;
