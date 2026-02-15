import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, PieChart, Target, LogOut, TrendingUp, Flame } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Sidebar = () => {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="sidebar">
      <div style={{ padding: '0 10px 30px 10px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>MoneyApp | HDP</h2>
      </div>

      <nav style={{ flex: 1 }}>
        <Link to="/" className={`sidebar-link ${isActive('/')}`}>
          <LayoutDashboard size={20} /> Dashboard
        </Link>
        <Link to="/income" className={`sidebar-link ${isActive('/income')}`}>
          <Wallet size={20} /> Pemasukan
        </Link>
        <Link to="/expense" className={`sidebar-link ${isActive('/expense')}`}>
          <TrendingUp size={20} /> Pengeluaran
        </Link>
        <Link to="/analytics" className={`sidebar-link ${isActive('/analytics')}`}>
          <PieChart size={20} /> Analitik
        </Link>
        <Link to="/goals" className={`sidebar-link ${isActive('/goals')}`}>
          <Target size={20} /> Goals
        </Link>
        <Link to="/streak" className={`sidebar-link ${isActive('/streak')}`}>
          <Flame size={20} color="#f97316" /> Challenge 40k
        </Link>
      </nav>

      <button 
        onClick={handleLogout}
        className="sidebar-link" 
        style={{ color: 'var(--danger)', marginTop: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%' }}
      >
        <LogOut size={20} /> Logout
      </button>
    </div>
  );
};

export default Sidebar;