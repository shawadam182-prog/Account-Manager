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
    <div className="flex min-h-screen">
      <Sidebar accountCount={accounts.length} actionCount={actions.filter(a => a.status === 'Open').length} />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-screen-xl mx-auto">
          <Outlet />
        </div>
      </main>
      <CommandPalette accounts={accounts} actions={actions} />
    </div>
  );
}
