import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { OrderStatus } from '@prisma/client';

interface SalesLineChartProps {
  salesData: {
    labels: string[];
    data: number[];
  };
  salesByStatus: Record<OrderStatus, number[]>;
  dayTranslations: Record<string, string>;
  statusTranslations: Record<OrderStatus, string>;
  statusColors: Record<OrderStatus, string>;
}

const SalesLineChart: React.FC<SalesLineChartProps> = ({
  salesData,
  salesByStatus,
  dayTranslations,
  statusTranslations,
  statusColors,
}) => {
  // Transform the data to the format expected by recharts
  const chartData = salesData.labels.map((label, index) => {
    const dataPoint: Record<string, any> = {
      name: dayTranslations[label] || label,
      Total: salesData.data[index],
    };

    // Add data for each status
    Object.entries(salesByStatus).forEach(([status, data]) => {
      dataPoint[statusTranslations[status as OrderStatus]] = data[index];
    });

    return dataPoint;
  });

  // Generate lines for each status
  const statusLines = Object.entries(salesByStatus).map(([status]) => (
    <Line
      key={status}
      type="monotone"
      dataKey={statusTranslations[status as OrderStatus]}
      stroke={statusColors[status as OrderStatus]}
      activeDot={{ r: 8 }}
      strokeWidth={2}
    />
  ));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 10,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis 
          dataKey="name" 
          tick={{ fill: '#6b7280' }}
          tickMargin={10}
        />
        <YAxis 
          tick={{ fill: '#6b7280' }}
          tickMargin={10}
          tickFormatter={(value) => `${value} TND`}
          width={80}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#fff', 
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}
          itemStyle={{ color: '#374151' }}
          labelStyle={{ fontWeight: 'bold', color: '#111827' }}
          formatter={(value: any, name: any, props: any) => [`${value} TND`, name]}
        />
        <Legend 
          wrapperStyle={{ paddingTop: 10 }}
          iconType="circle"
        />
        <Line
          type="monotone"
          dataKey="Total"
          stroke="#000000"
          activeDot={{ r: 8 }}
          strokeWidth={3}
      
        />
        {statusLines}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SalesLineChart;
