import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, CheckSquare, Search } from 'lucide-react';

interface SidebarProps {
  accountCount?: number;
  actionCount?: number;
}

export default function Sidebar({ accountCount, actionCount }: SidebarProps) {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, count: undefined as number | undefined },
    { to: '/accounts', label: 'Accounts', icon: Building2, end: false, count: accountCount },
    { to: '/actions', label: 'Actions', icon: CheckSquare, end: false, count: actionCount },
  ];

  return (
    <aside
      className="w-60 shrink-0 flex flex-col min-h-screen"
      style={{ background: '#0B1A2E' }}
    >
      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <img
          src="/planetmark-logo.png"
          alt="PlanetMark"
          style={{ height: '28px', width: 'auto' }}
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-3">
        {navItems.map(({ to, label, icon: Icon, end, count }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${
                isActive
                  ? 'font-medium'
                  : 'font-normal'
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: isActive ? '#60A5FA' : 'rgba(255,255,255,0.5)',
            })}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              if (!el.getAttribute('aria-current')) {
                el.style.background = 'rgba(255,255,255,0.05)';
                el.style.color = 'rgba(255,255,255,0.75)';
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              if (!el.getAttribute('aria-current')) {
                el.style.background = 'transparent';
                el.style.color = 'rgba(255,255,255,0.5)';
              }
            }}
          >
            <Icon size={16} />
            <span style={{ flex: 1 }}>{label}</span>
            {count !== undefined && count > 0 && (
              <span style={{
                fontSize: '11px', fontWeight: 600,
                minWidth: '20px', height: '18px',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '9px',
                background: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.5)',
              }}>
                {count}
              </span>
            )}
          </NavLink>
        ))}

        {/* Search hint */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px', marginTop: '12px',
            fontSize: '12px', color: 'rgba(255,255,255,0.25)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            paddingTop: '16px',
          }}
        >
          <Search size={13} />
          <span>Search</span>
          <kbd style={{
            marginLeft: 'auto', fontSize: '10px',
            padding: '1px 5px', borderRadius: '3px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.3)',
          }}>
            Ctrl+K
          </kbd>
        </div>
      </nav>

      {/* User */}
      <div
        className="px-6 py-4 flex items-center gap-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
          style={{ background: '#3B82F6', color: 'white' }}
        >
          MH
        </div>
        <div>
          <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Millie Hocking</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Account Manager</p>
        </div>
      </div>
    </aside>
  );
}
