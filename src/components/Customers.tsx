import React, { useEffect, useState } from 'react';
import { Customer } from '../types';
import { UserPlus, Search, MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        setCustomers(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Customer Registry</h2>
          <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">ACTIVE: {customers.length}</span>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium shadow-sm shadow-blue-200 hover:bg-blue-700 transition-colors flex items-center gap-2">
          <UserPlus size={16} /> Register Customer
        </button>
      </header>

      <div className="p-8">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by company, contact or email..." 
              className="flex-1 bg-transparent border-none text-sm focus:ring-0 text-slate-600"
            />
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4 font-semibold">Company Instance</th>
                <th className="px-6 py-4 font-semibold">Contact Person</th>
                <th className="px-6 py-4 font-semibold">Contact Methods</th>
                <th className="px-6 py-4 font-semibold">Operating Base</th>
                <th className="px-6 py-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic text-slate-700">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">Loading data repository...</td></tr>
              ) : customers.map((customer, i) => (
                <motion.tr 
                  key={customer.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group not-italic"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-slate-900">{customer.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase">ID: {customer.id}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{customer.contact}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600">{customer.email}</div>
                    <div className="text-[11px] text-slate-400 font-medium">{customer.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500 uppercase">{customer.address}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-slate-900 transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Customers;
