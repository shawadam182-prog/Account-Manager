import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, CheckSquare } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/accounts', label: 'Accounts', icon: Building2 },
  { to: '/actions', label: 'Actions', icon: CheckSquare },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-gray-900 text-gray-300 flex flex-col min-h-screen shrink-0">
      <div className="p-5 border-b border-gray-700">
        <h1 className="text-lg font-semibold text-white tracking-tight">Planet Mark</h1>
        <p className="text-xs text-gray-400 mt-0.5">Account Management</p>
      </div>
      <nav className="flex-1 py-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors border-l-2 ${
                isActive
                  ? 'border-emerald-500 text-emerald-400 bg-gray-800/50'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-5 border-t border-gray-700 text-xs text-gray-500">
        Millie Hocking
      </div>
    </aside>
  );
}
