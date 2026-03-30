import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const AccountList = lazy(() => import('./pages/AccountList'));
const AccountDetail = lazy(() => import('./pages/AccountDetail'));
const ActionsHub = lazy(() => import('./pages/ActionsHub'));

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#9CA3AF' }}>
      Loading...
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="accounts" element={<AccountList />} />
            <Route path="accounts/:id" element={<AccountDetail />} />
            <Route path="actions" element={<ActionsHub />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
