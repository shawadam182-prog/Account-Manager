import { Link } from 'react-router-dom';
import type { Account } from '../../lib/types';
import RAGBadge from '../ui/RAGBadge';
import StatusBadge from '../ui/StatusBadge';
import MembershipBadge from '../ui/MembershipBadge';

export default function AccountTable({ accounts }: { accounts: Account[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Company Name</th>
            <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Membership</th>
            <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Add-Ons</th>
            <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Report Status</th>
            <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">RAG</th>
            <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">POC</th>
            <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Renewal</th>
            <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Deadline</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {accounts.map((a) => {
            const deadlinePast = a.reporting_deadline && new Date(a.reporting_deadline) < new Date();
            return (
              <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <Link to={`/accounts/${a.id}`} className="text-emerald-600 hover:text-emerald-700 font-medium">
                    {a.company_name}
                  </Link>
                </td>
                <td className="py-3 px-4"><MembershipBadge level={a.membership_level} /></td>
                <td className="py-3 px-4">
                  <div className="flex gap-1 flex-wrap">
                    {a.add_ons?.filter(Boolean).map((addon) => (
                      <span key={addon} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                        {addon}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4"><StatusBadge status={a.report_status} /></td>
                <td className="py-3 px-4"><RAGBadge status={a.rag_status} /></td>
                <td className="py-3 px-4 text-gray-600">{a.main_poc || '-'}</td>
                <td className="py-3 px-4 text-gray-600">{a.renewal_month || '-'}</td>
                <td className={`py-3 px-4 ${deadlinePast ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                  {a.reporting_deadline
                    ? new Date(a.reporting_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
