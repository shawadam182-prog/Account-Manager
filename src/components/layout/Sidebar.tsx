import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, CheckSquare, Search } from 'lucide-react';

interface SidebarProps {
  accountCount?: number;
  actionCount?: number;
}

export default function Sidebar({ accountCount, actionCount }: SidebarProps) {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, count: undefined },
    { to: '/accounts', label: 'Accounts', icon: Building2, end: false, count: accountCount },
    { to: '/actions', label: 'Actions', icon: CheckSquare, end: false, count: actionCount },
  ];

  return (
    <aside className="w-64 shrink-0 flex flex-col min-h-screen bg-[var(--color-brand-sidebar)]/95 backdrop-blur-2xl border-r border-white/5 shadow-2xl z-20">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3 border-b border-white/5">
        <img
          src="/planetmark-logo.png"
          alt="PlanetMark"
          className="h-7 w-auto drop-shadow-md brightness-110"
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 py-6 px-4 flex flex-col gap-1.5">
        {navItems.map(({ to, label, icon: Icon, end, count }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                isActive
                  ? 'bg-blue-500/15 text-blue-400 font-medium'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <Icon size={18} className="transition-transform duration-200 ease-out group-hover:scale-110" />
              <span>{label}</span>
            </div>
            {count !== undefined && count > 0 && (
              <span className="text-[10px] font-bold min-w-[20px] h-5 inline-flex items-center justify-center rounded-full bg-white/10 text-zinc-400 group-hover:bg-white/20 group-hover:text-zinc-200 transition-colors">
                {count}
              </span>
            )}
          </NavLink>
        ))}

        {/* Search hint */}
        <div className="mt-8 pt-6 border-t border-white/5 px-3 flex items-center gap-2.5 text-xs text-zinc-500 group cursor-pointer hover:text-zinc-300 transition-colors">
          <Search size={14} className="group-hover:scale-110 transition-transform duration-200" />
          <span className="font-medium">Search</span>
          <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-zinc-400 font-mono shadow-sm">
            Cmd+K
          </kbd>
        </div>
      </nav>

      {/* User */}
      <div className="px-4 py-4 m-3 flex items-center gap-3 border border-white/5 rounded-xl bg-white/[0.02] hover:bg-white/5 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-gradient-to-tr from-blue-600 to-blue-400 text-white shadow-lg shadow-blue-900/40 border border-blue-400/20">
          MH
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-200 truncate">Millie Hocking</p>
          <p className="text-xs text-zinc-500 truncate font-medium">Account Manager</p>
        </div>
      </div>
    </aside>
  );
}
