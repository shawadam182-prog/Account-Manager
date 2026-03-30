import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import CommandPalette from '../ui/CommandPalette';
import type { Account, Action } from '../../lib/types';
import { getAccounts } from '../../services/accountsService';
import { getAllOpenActions } from '../../services/actionsService';

export default function Layout() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [actions, setActions] = useState<Action[]>([]);

  useEffect(() => {
    getAccounts().then(setAccounts);
    getAllOpenActions().then(setActions);
  }, []);

  return (
    <div className="flex min-h-screen relative overflow-hidden bg-[var(--color-brand-background)] text-[var(--color-brand-text)] selection:bg-brand-primary/20">
      <div className="ambient-glow" />
      <Sidebar accountCount={accounts.length} actionCount={actions.filter(a => a.status === 'Open').length} />
      <main className="flex-1 overflow-auto content-layer scroll-smooth">
        <div className="p-8 max-w-screen-xl mx-auto">
          <Outlet />
        </div>
      </main>
      <CommandPalette accounts={accounts} actions={actions} />
    </div>
  );
}
