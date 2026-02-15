// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { LayoutDashboard, PlusCircle, PieChart, Target } from 'lucide-react';

// Import Provider & Components
import { UIProvider } from './context/UIContext';
import Sidebar from './components/Sidebar';

// Import Pages
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Expense from './pages/Expense';
import Analytics from './pages/Analytics';
import Goals from './pages/Goals';
import DailyStreak from './pages/DailyStreak';

// Wrapper Component untuk Layout Logic
const AppLayout = ({ children }) => {
  const location = useLocation();
  // Sembunyikan sidebar/nav jika di halaman login
  if (location.pathname === '/auth') return children;

  return (
    <div className="app-layout">
      {/* SIDEBAR (Hanya muncul di Desktop via CSS) */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <div className="main-content">
        {children}
      </div>

      {/* BOTTOM NAV (Hanya muncul di Mobile via CSS) */}
      <nav className="bottom-nav mobile-nav">
        <Link to="/" className="nav-item"><LayoutDashboard size={20}/></Link>
        <Link to="/analytics" className="nav-item"><PieChart size={20}/></Link>
        <Link to="/income" className="nav-btn-main"><PlusCircle size={28}/></Link>
        <Link to="/goals" className="nav-item"><Target size={20}/></Link>
        <Link to="/expense" className="nav-item"><span>Exp</span></Link>
      </nav>
    </div>
  );
};

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <UIProvider>
        <Auth /> {/* Auth sekarang pakai UIProvider juga biar bisa toast */}
      </UIProvider>
    );
  }

  return (
    <UIProvider>
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/income" element={<Income />} />
            <Route path="/expense" element={<Expense />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/streak" element={<DailyStreak />} />
          </Routes>
        </AppLayout>
      </Router>
    </UIProvider>
  );
}

export default App;