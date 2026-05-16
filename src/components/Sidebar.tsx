import React from 'react';
import { LayoutDashboard, Users, ShoppingCart, Briefcase, Settings, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/customers', icon: Users, label: 'Customers' },
    { to: '/orders', icon: ShoppingCart, label: 'Inquiries' },
    { to: '/sales', icon: Briefcase, label: 'Sales Team' },
  ];

  return (
    <aside className="w-64 h-screen bg-slate-900 text-white flex flex-col border-r border-slate-800">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight">MAGLINE</h1>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Switchboards (Pvt) Ltd</p>
      </div>
      
      <nav className="flex-1 py-6">
        <ul className="space-y-1">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white border-r-4 border-blue-400' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <link.icon size={18} />
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-6 bg-slate-800 mt-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-sm">AM</div>
          <div>
            <p className="text-xs font-semibold">Aruna Milan</p>
            <p className="text-[10px] text-slate-400">Sales Manager</p>
          </div>
        </div>
        <button className="flex items-center gap-3 text-sm text-slate-400 hover:text-white w-full transition-colors">
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
