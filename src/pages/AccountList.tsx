import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAccounts } from '../services/accountsService';
import type { Account } from '../lib/types';
import AccountFilters from '../components/accounts/AccountFilters';
import AccountTable from '../components/accounts/AccountTable';

export default function AccountList() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    getAccounts().then(setAccounts).finally(() => setLoading(false));
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
    return <div className="text-gray-400 py-12 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>Accounts</h1>
        <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '2px' }}>
          Your portfolio — click any column to sort, click RAG dots to update inline
        </p>
      </div>
      <AccountFilters totalCount={accounts.length} filteredCount={filtered.length} />
      <AccountTable accounts={filtered} />
    </div>
  );
}
