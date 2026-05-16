import React, { useEffect, useState } from 'react';
import { SalesPerson, SalesManager } from '../types';
import { Briefcase, User, Award, ShieldCheck, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';

const SalesTeam = () => {
  const [team, setTeam] = useState<{ persons: SalesPerson[], managers: SalesManager[] } | null>(null);

  useEffect(() => {
    fetch('/api/sales')
      .then(res => res.json())
      .then(setTeam);
  }, []);

  if (!team) return <div className="p-8 font-mono text-xs italic">ACCESSING_SECURE_HR_LAYER...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-900 text-nowrap">Sales Infrastructure</h2>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">HR_LAYER: ACTIVE</span>
        </div>
      </header>

      <div className="p-8 space-y-12">
        <section>
          <div className="flex items-center gap-2 mb-6 text-slate-500">
            <ShieldCheck size={16} />
            <h3 className="text-xs font-bold uppercase tracking-widest">Leadership & Management</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.managers.map((manager) => (
              <div key={manager.id} className="bg-slate-900 text-white p-6 rounded-lg relative overflow-hidden group shadow-lg">
                 <div className="relative z-10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sales Manager</p>
                    <h4 className="text-xl font-bold mb-4">{manager.name}</h4>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                       <Briefcase size={12} />
                       Division: {manager.department}
                    </div>
                 </div>
                 <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <User size={120} />
                 </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-6 text-slate-500">
            <Award size={16} />
            <h3 className="text-xs font-bold uppercase tracking-widest">Performance Metrics</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {team.persons.map((person) => (
              <div key={person.id} className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-1">{person.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Senior Sales Executive</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600 tracking-tighter">{person.performance}%</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">KPI Score</div>
                  </div>
                </div>

                <div className="space-y-3 relative z-10">
                  <div className="text-[11px] font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div> Recent Closures
                  </div>
                  {person.history.map((orderId) => (
                    <div key={orderId} className="flex justify-between items-center bg-slate-50 p-4 rounded-md border border-slate-100 group hover:border-blue-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <ShoppingBag size={14} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">Inquiry {orderId}</span>
                      </div>
                      <span className="text-[10px] font-bold text-green-600 uppercase bg-green-50 px-2 py-0.5 rounded">Settled</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SalesTeam;
