import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, CheckSquare } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/accounts', label: 'Accounts', icon: Building2, end: false },
  { to: '/actions', label: 'Actions', icon: CheckSquare, end: false },
];

export default function Sidebar() {
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
        {navItems.map(({ to, label, icon: Icon, end }) => (
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
            {label}
          </NavLink>
        ))}
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
