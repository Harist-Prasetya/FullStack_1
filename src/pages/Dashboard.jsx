import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  TrendingUp, 
  CreditCard,
  Plus
} from 'lucide-react';
import { 
  AreaChart, Area, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import '../styles/dashboard.css'; 

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [chartData, setChartData] = useState([]);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Halo');

  useEffect(() => {
    fetchData();
    setGreeting(getGreeting());
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi ☀️';
    if (hour < 15) return 'Selamat Siang 🌤️';
    if (hour < 18) return 'Selamat Sore 🌇';
    return 'Selamat Malam 🌙';
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email.split('@')[0]);

      let { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;

      if (data) {
        const income = data.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
        const expense = data.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
        setSummary({ income, expense, balance: income - expense });

        const grouped = data.reduce((acc, curr) => {
          const date = new Date(curr.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
          if (!acc[date]) acc[date] = { name: date, income: 0, expense: 0 };
          if (curr.type === 'income') acc[date].income += curr.amount;
          else acc[date].expense += curr.amount;
          return acc;
        }, {});
        setChartData(Object.values(grouped));
        setTransactions(data.reverse());
      }
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-container">Memuat Dashboard...</div>;

  return (
    <div>
      {/* HEADER dengan Greeting Dinamis */}
      <div className="dashboard-header animate-entry">
        <div>
          <h1 className="header-title">{greeting}, <span className="text-primary">{userEmail}</span></h1>
          <p className="header-subtitle">Yuk cek kondisi keuangan kita hari ini!</p>
        </div>
        <Link to="/income" className="btn-quick-input">
          <Plus size={18} strokeWidth={3} />
          <span>Tambah Data</span>
        </Link>
      </div>

      {/* STATS GRID */}
      <div className="stats-grid">
        
        {/* Card 1: Saldo Utama (Animated Gradient) */}
        <div className="atm-card animate-entry delay-1">
          <div className="atm-deco deco-1"></div>
          <div className="atm-deco deco-2"></div>
          
          <div className="atm-header">
            <div className="icon-blur-bg">
              <Wallet color="white" size={24} />
            </div>
            <span className="atm-badge">Active Wallet</span>
          </div>
          <div>
            <p className="atm-label">Total Saldo</p>
            <h2 className="atm-balance">
              Rp {summary.balance.toLocaleString('id-ID')}
            </h2>
          </div>
        </div>

        {/* Card 2: Income */}
        <div className="stat-card income-card animate-entry delay-2">
          <div className="stat-icon-wrapper income">
            <ArrowUpCircle size={28} />
          </div>
          <span className="stat-label">Pemasukan</span>
          <span className="stat-value success">
            Rp {summary.income.toLocaleString('id-ID', { notation: 'compact' })}
          </span>
        </div>

        {/* Card 3: Expense */}
        <div className="stat-card expense-card animate-entry delay-3">
          <div className="stat-icon-wrapper expense">
            <ArrowDownCircle size={28} />
          </div>
          <span className="stat-label">Pengeluaran</span>
          <span className="stat-value danger">
            Rp {summary.expense.toLocaleString('id-ID', { notation: 'compact' })}
          </span>
        </div>
      </div>

      {/* DASHBOARD CONTENT GRID */}
      <div className="dashboard-grid animate-entry delay-3">
        
        {/* KOLOM KIRI: GRAFIK */}
        <div className="chart-card">
          <div className="section-header">
             <h3 className="section-title">
               <div style={{background:'#eff6ff', padding:8, borderRadius:10}}>
                 <TrendingUp size={20} className="text-primary"/>
               </div>
               Analisa Arus Kas
             </h3>
          </div>
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KOLOM KANAN: RIWAYAT */}
        <div className="list-card">
          <div className="section-header">
            <h3 className="section-title">Transaksi Terakhir</h3>
            <Link to="/analytics" className="see-all-link">Lihat Semua</Link>
          </div>
          
          <div className="transactions-list">
            {transactions.slice(0, 5).map((t) => (
              <div key={t.id} className="transaction-item">
                <div className="t-info">
                  <div className={`icon-box ${t.type === 'income' ? 'income' : 'expense'}`}>
                    {t.type === 'income' ? <ArrowUpCircle size={20}/> : <CreditCard size={20}/>}
                  </div>
                  <div>
                    <p className="t-category">{t.category}</p>
                    <p className="t-date">
                      {new Date(t.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})} • {t.account}
                    </p>
                  </div>
                </div>
                <span className={`t-amount ${t.type === 'income' ? 'income' : 'expense'}`}>
                  {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString('id-ID')}
                </span>
              </div>
            ))}
            {transactions.length === 0 && <p className="no-data">Belum ada transaksi.</p>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;