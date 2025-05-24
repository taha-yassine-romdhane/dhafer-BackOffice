'use client';

import { useState } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

interface SubscriberGrowth {
  labels: string[];
  newSubscribers: number[];
  totalSubscribers: number[];
}

interface NotificationConversion {
  labels: string[];
  conversionRates: number[];
}

interface CampaignSource {
  source: string;
  count: number;
}

interface SMSAnalyticsProps {
  subscriberGrowth: SubscriberGrowth;
  notificationConversion: NotificationConversion;
  campaignPerformance: CampaignSource[];
  subscriberCount: number;
  notificationCount: number;
  convertedNotificationCount: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function SMSMarketingAnalytics({
  subscriberGrowth,
  notificationConversion,
  campaignPerformance,
  subscriberCount,
  notificationCount,
  convertedNotificationCount
}: SMSAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'growth' | 'conversion' | 'sources'>('growth');

  // Calculate overall conversion rate
  const overallConversionRate = notificationCount > 0 
    ? Math.round((convertedNotificationCount / notificationCount) * 100) 
    : 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Analyse Marketing SMS
        </h3>
        <div className="flex space-x-2">
          <span className="text-sm text-gray-500">
            {subscriberCount} abonnés SMS
          </span>
          <span className="mx-2 text-gray-300">|</span>
          <span className="text-sm text-gray-500">
            Taux de conversion: {overallConversionRate}%
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setActiveTab('growth')}
          className={`px-3 py-1 text-sm rounded-full ${
            activeTab === 'growth'
              ? 'bg-indigo-100 text-indigo-800 font-medium'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Croissance des abonnés
        </button>
        <button
          onClick={() => setActiveTab('conversion')}
          className={`px-3 py-1 text-sm rounded-full ${
            activeTab === 'conversion'
              ? 'bg-indigo-100 text-indigo-800 font-medium'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Taux de conversion
        </button>
        <button
          onClick={() => setActiveTab('sources')}
          className={`px-3 py-1 text-sm rounded-full ${
            activeTab === 'sources'
              ? 'bg-indigo-100 text-indigo-800 font-medium'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          Sources d'abonnés
        </button>
      </div>

      {/* Chart area */}
      <div className="h-80">
        {activeTab === 'growth' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={subscriberGrowth.labels.map((label, index) => ({
                name: label,
                "Nouveaux abonnés": subscriberGrowth.newSubscribers[index],
                "Total abonnés": subscriberGrowth.totalSubscribers[index],
              }))}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="Nouveaux abonnés"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="Total abonnés"
                stroke="#82ca9d"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'conversion' && (
          <div className="h-full flex flex-col">
            {/* Summary Card */}
            <div className="bg-indigo-50 p-4 rounded-lg mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-600 font-medium">Taux de conversion global</p>
                  <p className="text-2xl font-bold text-indigo-900">{overallConversionRate}%</p>
                  <p className="text-xs text-indigo-500 mt-1">
                    {convertedNotificationCount} conversions sur {notificationCount} notifications
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={notificationConversion.labels.map((label, index) => ({
                    name: label,
                    "Taux de conversion (%)": notificationConversion.conversionRates[index],
                    "Conversions": convertedNotificationCount > 0 ? 
                      Math.round((notificationConversion.conversionRates[index] / 100) * (notificationCount / notificationConversion.labels.length)) : 0,
                    "Non converties": convertedNotificationCount > 0 ? 
                      Math.round(((100 - notificationConversion.conversionRates[index]) / 100) * (notificationCount / notificationConversion.labels.length)) : 0
                  }))}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  barGap={0}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    yAxisId="left"
                    orientation="left"
                    stroke="#6366f1"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#10b981"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'Taux de conversion (%)') {
                        return [`${value}%`, name];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="Taux de conversion (%)"
                    name="Taux de conversion"
                    fill="#6366f1"
                    radius={[4, 0, 0, 4]}
                    animationDuration={1500}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="Conversions"
                    name="Conversions (nombre)"
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Moyenne</p>
                <p className="font-medium">
                  {notificationConversion.conversionRates.length > 0 
                    ? Math.round(notificationConversion.conversionRates.reduce((a, b) => a + b, 0) / notificationConversion.conversionRates.length)
                    : 0}%
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Total conversions</p>
                <p className="font-medium text-emerald-600">
                  {convertedNotificationCount}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Total notifications</p>
                <p className="font-medium">
                  {notificationCount}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Taux de conversion</p>
                <p className="font-medium">
                  {overallConversionRate}%
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sources' && (
          <ResponsiveContainer width="100%" height="100%">
            <div className="flex h-full">
              <div className="w-1/2 h-full">
                <PieChart width={500} height={350}>
                  <Pie
                    data={campaignPerformance}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="source"
                    label={({ source, percent }) => `${source}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {campaignPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value} abonnés`, props.payload.source]} />
                </PieChart>
              </div>
              <div className="w-1/2 h-full">
                <div className="h-full flex flex-col justify-center">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">Sources d'abonnés</h4>
                  <div className="space-y-2">
                    {campaignPerformance.map((source, index) => (
                      <div key={index} className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-gray-600">{source.source}: </span>
                        <span className="text-sm font-medium ml-1">{source.count} abonnés</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">Total abonnés SMS</div>
          <div className="text-2xl font-bold text-indigo-600">{subscriberCount}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">Notifications envoyées</div>
          <div className="text-2xl font-bold text-indigo-600">{notificationCount}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">Taux de conversion</div>
          <div className="text-2xl font-bold text-indigo-600">{overallConversionRate}%</div>
        </div>
      </div>
    </div>
  );
}
