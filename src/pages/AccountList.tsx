import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Download, Plus } from 'lucide-react';
import { getAccounts } from '../services/accountsService';
import AddAccountForm from '../components/accounts/AddAccountForm';
import type { Account } from '../lib/types';
import AccountFilters from '../components/accounts/AccountFilters';
import AccountTable from '../components/accounts/AccountTable';
import { exportAccountsCsv } from '../utils/csvExport';

export default function AccountList() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [searchParams] = useSearchParams();

  const loadAccounts = () => {
    getAccounts().then(setAccounts).finally(() => setLoading(false));
  };

  useEffect(() => {
    document.title = 'Accounts — Planet Mark AM';
    loadAccounts();
  }, []);

  const search = (searchParams.get('search') || '').toLowerCase();
  const ragFilter = searchParams.get('rag')?.split(',').filter(Boolean) || [];
  const reportFilter = searchParams.get('report')?.split(',').filter(Boolean) || [];
  const membershipFilter = searchParams.get('membership')?.split(',').filter(Boolean) || [];
  const renewalFilter = searchParams.get('renewal')?.split(',').filter(Boolean) || [];
  const addonsFilter = searchParams.get('addons')?.split(',').filter(Boolean) || [];

  const filtered = accounts.filter((a) => {
    if (search) {
      const match =
        a.company_name.toLowerCase().includes(search) ||
        (a.main_poc || '').toLowerCase().includes(search);
      if (!match) return false;
    }
    if (ragFilter.length > 0) {
      const val = a.rag_status || 'Not set';
      if (!ragFilter.includes(val)) return false;
    }
    if (reportFilter.length > 0) {
      const val = a.report_status || 'Not set';
      if (!reportFilter.includes(val)) return false;
    }
    if (membershipFilter.length > 0) {
      if (!a.membership_level || !membershipFilter.includes(a.membership_level)) return false;
    }
    if (renewalFilter.length > 0) {
      if (!a.renewal_month || !renewalFilter.includes(a.renewal_month)) return false;
    }
    if (addonsFilter.length > 0) {
      const hasAddon = addonsFilter.some((addon) => a.add_ons?.includes(addon));
      if (!hasAddon) return false;
    }
    return true;
  });

  if (loading) {
    return <div style={{ color: '#9CA3AF', padding: '48px 0', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-12"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 m-0">Accounts</h1>
          <p className="text-sm font-semibold text-zinc-500 mt-2 uppercase tracking-widest">
            Your portfolio — click any column to sort, click RAG dots to update inline
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => setShowAddAccount(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white border-none rounded-xl hover:opacity-90 transition-all duration-300 cursor-pointer"
            style={{ backgroundColor: '#16a34a' }}
          >
            <Plus size={16} /> Add Account
          </button>
          <button
            onClick={() => exportAccountsCsv(filtered)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-zinc-700 bg-white/50 backdrop-blur-sm border border-zinc-200/80 rounded-xl hover:bg-white hover:shadow-md transition-all duration-300 cursor-pointer"
          >
            <Download size={16} className="text-zinc-500" /> Export CSV
          </button>
        </div>
      </div>

      {showAddAccount && (
        <AddAccountForm
          onSaved={() => { setShowAddAccount(false); loadAccounts(); }}
          onCancel={() => setShowAddAccount(false)}
        />
      )}
      <AccountFilters totalCount={accounts.length} filteredCount={filtered.length} />
      <AccountTable accounts={filtered} />
    </motion.div>
  );
}
