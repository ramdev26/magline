import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { DashboardStats } from '../types';
import { TrendingUp, Users, ShoppingBag, Package } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(setStats);
  }, []);

  if (!stats) return <div className="p-8 font-mono text-xs">LOADING SYSTEM DATA...</div>;

  const cards = [
    { label: 'TOTAL REVENUE', value: `$${stats.totalSales.toLocaleString()}`, icon: TrendingUp, color: 'text-green-500' },
    { label: 'ACTIVE ORDERS', value: stats.activeOrders, icon: ShoppingBag, color: 'text-blue-500' },
    { label: 'TOTAL CUSTOMERS', value: stats.totalCustomers, icon: Users, color: 'text-purple-500' },
    { label: 'PRODUCT CATEGORIES', value: stats.statsByCategory.length, icon: Package, color: 'text-orange-500' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Performance Overview</h2>
          <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">LIVE</span>
        </div>
        <div className="flex gap-4">
          <button className="px-4 py-2 border border-slate-200 rounded text-sm font-medium bg-white hover:bg-slate-50 transition-colors">Export CSV</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium shadow-sm shadow-blue-200 hover:bg-blue-700 transition-colors">+ New Order</button>
        </div>
      </header>

      <div className="p-8 space-y-8 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{card.label}</span>
                <card.icon size={14} className="text-slate-400" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{card.value}</div>
              <p className="text-[10px] text-green-600 mt-2 font-medium">↑ 12% from last month</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h4 className="font-semibold text-sm">Recent Sales Activity</h4>
              <select className="text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50">
                <option>All Divisions</option>
                <option>LV Low Voltage</option>
                <option>CMS Systems</option>
                <option>MEP Projects</option>
              </select>
            </div>
            <div className="flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Customer</th>
                    <th className="px-6 py-3 font-semibold">Amount</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-900">Alpha Constructions</td>
                    <td className="px-6 py-3 font-mono text-slate-500">$5,000</td>
                    <td className="px-6 py-3 text-slate-500">2026-05-15</td>
                    <td className="px-6 py-3 text-right">
                      <span className="bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded text-[11px] font-medium">Pending</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-900">Beta Electricals</td>
                    <td className="px-6 py-3 font-mono text-slate-500">$12,000</td>
                    <td className="px-6 py-3 text-slate-500">2026-05-10</td>
                    <td className="px-6 py-3 text-right">
                      <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded text-[11px] font-medium">Delivered</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
              <h4 className="font-semibold text-sm mb-4">Category Distribution</h4>
              <div className="space-y-4">
                {stats.statsByCategory.map((cat, i) => (
                  <div key={cat.name}>
                    <div className="flex justify-between text-xs mb-1 font-medium text-slate-600">
                      <span>{cat.name} Systems</span>
                      <span>{Math.round((cat.value / stats.totalSales) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(cat.value / stats.totalSales) * 100}%` }}
                        className={`h-full rounded-full ${i === 0 ? 'bg-slate-900' : i === 1 ? 'bg-blue-600' : 'bg-green-600'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex-1">
              <h4 className="font-semibold text-sm mb-4 text-slate-900">Sales Representatives</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">KP</div>
                    <span className="text-sm font-medium text-slate-700">Kamal Perera</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">$112k</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">NS</div>
                    <span className="text-sm font-medium text-slate-700">Nimal Silva</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">$98k</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
