import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import { getAccounts } from '../services/accountsService';
import type { Account } from '../lib/types';
import AccountFilters from '../components/accounts/AccountFilters';
import AccountTable from '../components/accounts/AccountTable';
import { exportAccountsCsv } from '../utils/csvExport';

export default function AccountList() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [exportHover, setExportHover] = useState(false);

  useEffect(() => {
    document.title = 'Accounts — Planet Mark AM';
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
    return <div style={{ color: '#9CA3AF', padding: '48px 0', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>Accounts</h1>
          <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '2px' }}>
            Your portfolio — click any column to sort, click RAG dots to update inline
          </p>
        </div>
        <button
          onClick={() => exportAccountsCsv(filtered)}
          onMouseEnter={() => setExportHover(true)}
          onMouseLeave={() => setExportHover(false)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', fontSize: '12px', fontWeight: 500,
            color: '#6B7280', background: exportHover ? '#F5F0E8' : 'transparent',
            border: '1px solid #E5E0D8', borderRadius: '6px', cursor: 'pointer',
            transition: 'background 0.15s', marginTop: '4px',
          }}
        >
          <Download size={13} /> Export CSV
        </button>
      </div>
      <AccountFilters totalCount={accounts.length} filteredCount={filtered.length} />
      <AccountTable accounts={filtered} />
    </div>
  );
}
