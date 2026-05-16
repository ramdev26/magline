import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import { ShoppingCart, Filter, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-50 text-green-700';
      case 'Pending': return 'bg-yellow-50 text-yellow-700';
      case 'Shipped': return 'bg-blue-50 text-blue-700';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'LV': return 'bg-slate-900';
      case 'CMS': return 'bg-blue-600';
      case 'MEP': return 'bg-green-600';
      default: return 'bg-slate-400';
    }
  };

  const [showModal, setShowModal] = useState(false);
  const [newOrder, setNewOrder] = useState({ 
    customerId: '1', 
    amount: 0, 
    status: 'Pending' as const, 
    category: 'LV' as const, 
    date: new Date().toISOString().split('T')[0],
    salesPersonId: 'S001'
  });

  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    });
    if (res.ok) {
      const added = await res.json();
      setOrders([...orders, added]);
      setShowModal(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Inquiries & Quotes</h2>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">TOTAL: {orders.length}</span>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium shadow-sm shadow-blue-200 hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <ShoppingCart size={16} /> Create Order
        </button>
      </header>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
               <div className="col-span-full py-12 text-center text-sm text-slate-400 italic">Fetching order stream...</div>
          ) : orders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col"
            >
              <div className="px-5 py-4 border-b border-slate-50 flex justify-between items-center">
                 <span className={`px-2 py-1 rounded-md text-[10px] font-bold text-white ${getCategoryColor(order.category)}`}>
                   {order.category}
                 </span>
                 <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${getStatusColor(order.status)}`}>
                   {order.status}
                 </span>
              </div>
              
              <div className="p-5 flex-1">
                <div className="text-lg font-bold text-slate-900 mb-4">{order.id}</div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Value</span>
                    <span className="font-mono font-bold text-slate-900">${order.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Scheduled</span>
                    <span className="text-slate-700">{order.date}</span>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">KP</div>
                    <span className="text-xs font-medium text-slate-600">Kamal Perera</span>
                 </div>
                 <button className="text-blue-600 hover:text-blue-800 transition-colors">
                   <ArrowUpRight size={16} />
                 </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-8 max-w-md w-full border border-slate-200 shadow-2xl"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-6">Log New System Inquiry</h3>
            <form onSubmit={handleAddOrder} className="space-y-5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category Selection</label>
                <div className="grid grid-cols-3 gap-2">
                  {['LV', 'CMS', 'MEP'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewOrder({ ...newOrder, category: cat as any })}
                      className={`py-2 px-3 rounded-lg border font-semibold transition-all ${
                        newOrder.category === cat 
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Est. Quoted Amount (USD)</label>
                <input 
                  type="number" 
                  className="w-full rounded-lg border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 p-3 bg-slate-50 font-mono"
                  value={newOrder.amount}
                  onChange={e => setNewOrder({ ...newOrder, amount: Number(e.target.value) })}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 px-4 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-lg bg-blue-600 text-white font-semibold shadow-sm shadow-blue-200 hover:bg-blue-700 transition-colors"
                >
                  Commit Log
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Orders;
