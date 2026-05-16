import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { DashboardStats } from '../types';
import { formatLKR } from '../utils/currency';
import { TrendingUp, Users, ShoppingBag, Package } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStats = () => {
    fetch('/api/dashboard')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load dashboard');
        return res.json();
      })
      .then(setStats)
      .catch(() => setError('Unable to load dashboard data. Check database connection.'));
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-sm text-red-600">
        {error}
      </motion.div>
    );
  }

  if (!stats) return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 font-mono text-xs">LOADING SYSTEM DATA...</motion.div>;

  const cards = [
    { label: 'TOTAL REVENUE (LKR)', value: formatLKR(stats.totalSales), icon: TrendingUp, color: 'text-green-500' },
    { label: 'ACTIVE ORDERS', value: stats.activeOrders, icon: ShoppingBag, color: 'text-blue-500' },
    { label: 'TOTAL CUSTOMERS', value: stats.totalCustomers, icon: Users, color: 'text-purple-500' },
    { label: 'PRODUCT CATEGORIES', value: stats.statsByCategory.length, icon: Package, color: 'text-orange-500' },
  ];

  const getTenderStyle = (value: string | null) => {
    if (value === 'Tender') return 'bg-purple-50 text-purple-700';
    if (value === 'Ongoing') return 'bg-blue-50 text-blue-700';
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Performance Overview</h2>
          <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">LIVE</span>
        </motion.div>
        <div className="flex gap-4">
          <Link
            to="/orders"
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium shadow-sm shadow-blue-200 hover:bg-blue-700 transition-colors"
          >
            + New Inquiry
          </Link>
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 + 0.1 }}
                className="flex items-center justify-between mb-2"
              >
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{card.label}</span>
                <card.icon size={14} className="text-slate-400" />
              </motion.div>
              <div className="text-2xl font-bold text-slate-900">{card.value}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="p-4 border-b border-slate-100"
            >
              <h4 className="font-semibold text-sm">Recent Sales Activity</h4>
            </motion.div>
            <div className="flex-1">
              {stats.recentOrders.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-6 py-12 text-center text-sm text-slate-400"
                >
                  No orders yet. Create your first order to see activity here.
                </motion.p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3 font-semibold">S/N</th>
                      <th className="px-6 py-3 font-semibold">Customer</th>
                      <th className="px-6 py-3 font-semibold">Project</th>
                      <th className="px-6 py-3 font-semibold">Quotation (LKR)</th>
                      <th className="px-6 py-3 font-semibold">Received</th>
                      <th className="px-6 py-3 font-semibold text-right">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.recentOrders.map((order, i) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.05 }}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-3 font-mono text-slate-500">{order.serialNo}</td>
                        <td className="px-6 py-3 font-medium text-slate-900">{order.customerName}</td>
                        <td className="px-6 py-3 text-slate-600">{order.projectName ?? '—'}</td>
                        <td className="px-6 py-3 font-mono text-slate-500">{formatLKR(order.amount)}</td>
                        <td className="px-6 py-3 text-slate-500">{order.date || '—'}</td>
                        <td className="px-6 py-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${getTenderStyle(order.ongoingTender)}`}>
                            {order.ongoingTender ?? '—'}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-col gap-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm"
            >
              <h4 className="font-semibold text-sm mb-4">Category Distribution</h4>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
                className="space-y-4"
              >
                {stats.statsByCategory.map((cat, i) => {
                  const pct = stats.totalSales > 0 ? Math.round((cat.value / stats.totalSales) * 100) : 0;
                  return (
                    <motion.div
                      key={cat.name}
                      variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
                    >
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.55 + i * 0.06 }}
                        className="flex justify-between text-xs mb-1 font-medium text-slate-600"
                      >
                        <span>{cat.name} Systems</span>
                        <span>{pct}% · {formatLKR(cat.value)}</span>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ delay: 0.6 + i * 0.06, duration: 0.35 }}
                        style={{ transformOrigin: 'left' }}
                        className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.65 + i * 0.06, duration: 0.5 }}
                          className={`h-full rounded-full ${i === 0 ? 'bg-slate-900' : i === 1 ? 'bg-blue-600' : 'bg-green-600'}`}
                        />
                      </motion.div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex-1"
            >
              <h4 className="font-semibold text-sm mb-4 text-slate-900">Sales Representatives</h4>
              {stats.topSalesPersons.length === 0 ? (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-slate-400">
                  No sales team members yet.
                </motion.p>
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
                  className="space-y-4"
                >
                  {stats.topSalesPersons.map((person) => (
                    <motion.div
                      key={person.id}
                      variants={{ hidden: { opacity: 0, x: 8 }, visible: { opacity: 1, x: 0 } }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                          {person.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{person.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{formatLKR(person.totalSales)}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;

