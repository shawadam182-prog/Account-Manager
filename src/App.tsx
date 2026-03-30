import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import AccountList from './pages/AccountList';
import AccountDetail from './pages/AccountDetail';
import ActionsHub from './pages/ActionsHub';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="accounts" element={<AccountList />} />
          <Route path="accounts/:id" element={<AccountDetail />} />
          <Route path="actions" element={<ActionsHub />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
