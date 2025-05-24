import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip 
} from 'recharts';
import { OrderStatus } from '@prisma/client';

interface OrderStatusDonutChartProps {
  ordersByStatus: {
    status: OrderStatus;
    count: number;
    revenue: number;
  }[];
  statusTranslations: Record<OrderStatus, string>;
  statusColors: Record<OrderStatus, string>;
  valueType?: 'count' | 'revenue';
}

const OrderStatusDonutChart: React.FC<OrderStatusDonutChartProps> = ({
  ordersByStatus,
  statusTranslations,
  statusColors,
  valueType = 'count'
}) => {
  // Transform the data to the format expected by recharts
  const chartData = ordersByStatus.map((item) => ({
    name: statusTranslations[item.status],
    value: valueType === 'count' ? item.count : item.revenue,
    status: item.status,
  }));

  // Custom tooltip to show both count and percentage
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = chartData.reduce((sum, item) => sum + item.value, 0);
      const percentage = ((data.value / total) * 100).toFixed(1);
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-sm">
          <p className="font-semibold text-gray-800">{data.name}</p>
          <p className="text-gray-600">
            {valueType === 'count' ? 'Commandes' : 'Revenu'}: <span className="font-medium">{valueType === 'count' ? data.value : `${data.value.toFixed(2)} TND`}</span>
          </p>
          <p className="text-gray-600">
            Pourcentage: <span className="font-medium">{percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom legend that shows the count/revenue alongside the name
  const renderCustomizedLegend = (props: any) => {
    const { payload } = props;
    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
      <ul className="flex flex-col space-y-2 mt-4">
        {payload.map((entry: any, index: number) => {
          const percentage = ((chartData[index].value / total) * 100).toFixed(1);
          return (
            <li key={`item-${index}`} className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-700">{entry.value}</span>
              <span className="text-sm text-gray-500 ml-2">
                ({valueType === 'count' ? chartData[index].value : `${chartData[index].value.toFixed(2)} TND`} · {percentage}%)
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={120}
          fill="#8884d8"
          paddingAngle={2}
          dataKey="value"
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={statusColors[entry.status]} 
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          content={renderCustomizedLegend}
          layout="vertical"
          verticalAlign="middle"
          align="right"
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default OrderStatusDonutChart;
