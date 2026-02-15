import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  Download, Filter, TrendingUp, TrendingDown, ShieldAlert, 
  Target, Lightbulb, Activity, Calendar, Wallet 
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../styles/analytics.css';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

const Analytics = () => {
  const [transactions, setTransactions] = useState([]);
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' | 'yearly'
  const [dateFilter, setDateFilter] = useState(new Date());
  
  // Computed Data States
  const [kpi, setKpi] = useState({ income: 0, expense: 0, savings: 0, healthScore: 0 });
  const [charts, setCharts] = useState({ trend: [], category: [], projection: [] });
  const [insights, setInsights] = useState([]);
  const [goals, setGoals] = useState([]); // Simulasi goals

  useEffect(() => { fetchData(); }, [viewMode, dateFilter]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: true });
    
    // Filter Query based on ViewMode
    const start = new Date(dateFilter.getFullYear(), viewMode === 'monthly' ? dateFilter.getMonth() : 0, 1).toISOString();
    const end = new Date(dateFilter.getFullYear(), viewMode === 'monthly' ? dateFilter.getMonth() + 1 : 12, 0).toISOString();
    
    query = query.gte('date', start).lte('date', end);

    const { data } = await query;
    if (data) {
      setTransactions(data);
      processAnalytics(data);
    }
  };

  // --- CORE LOGIC ENGINE ---
  const processAnalytics = (data) => {
    // 1. KPI Calculation
    const income = data.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const expense = data.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
    const savings = income - expense;
    
    // Health Score Formula: (Savings Rate * 60%) + (Budget Adherence * 40%) - Risk Penalty
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    let score = Math.min(100, Math.max(0, (savingsRate * 1.5) + 40)); 
    if (expense > income) score = 10; // Penalty berat jika defisit

    setKpi({ income, expense, savings, healthScore: Math.round(score) });

    // 2. Chart: Trend Analysis
    const trendMap = {};
    data.forEach(t => {
      const day = new Date(t.date).getDate();
      if (!trendMap[day]) trendMap[day] = { name: day, income: 0, expense: 0 };
      if (t.type === 'income') trendMap[day].income += t.amount;
      else trendMap[day].expense += t.amount;
    });
    setCharts(prev => ({ ...prev, trend: Object.values(trendMap) }));

    // 3. Chart: Category Pie
    const catMap = {};
    data.filter(t => t.type === 'expense').forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    setCharts(prev => ({ 
      ...prev, 
      category: Object.keys(catMap).map(k => ({ name: k, value: catMap[k] })) 
    }));

    // 4. Smart Insights Generator
    const newInsights = [];
    if (expense > income) {
      newInsights.push({ type: 'risk', title: 'Cashflow Alert', msg: 'Pengeluaran melebihi pemasukan bulan ini!' });
    }
    if (savingsRate > 20) {
      newInsights.push({ type: 'opportunity', title: 'Healthy Savings', msg: `Saving rate kamu ${savingsRate.toFixed(0)}%, sangat sehat!` });
    }
    const topCat = Object.keys(catMap).sort((a,b) => catMap[b] - catMap[a])[0];
    if (topCat) {
      newInsights.push({ type: 'info', title: 'Top Spending', msg: `Pengeluaran terbesar ada di kategori: ${topCat}` });
    }
    setInsights(newInsights);

    // 5. Savings Projection (Linear Regression Sederhana)
    const projected = [];
    let currentSav = savings;
    for(let i=1; i<=6; i++) {
        projected.push({ name: `Bulan +${i}`, amount: currentSav + (savings * i) });
    }
    setCharts(prev => ({ ...prev, projection: projected }));

    // Mock Goals Data (Idealnya ambil dari DB)
    setGoals([
        { title: 'Dana Darurat', current: 5000000, target: 10000000 },
        { title: 'Liburan', current: 2000000, target: 5000000 }
    ]);
  };

  // --- EXPORT FUNCTION ---
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Laporan Keuangan - ${dateFilter.toLocaleDateString()}`, 14, 15);
    
    const tableData = transactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.category,
      t.type === 'income' ? 'Masuk' : 'Keluar',
      `Rp ${t.amount.toLocaleString()}`,
      t.description
    ]);

    doc.autoTable({
      head: [['Tanggal', 'Kategori', 'Tipe', 'Jumlah', 'Ket']],
      body: tableData,
      startY: 25,
    });
    doc.save('laporan-keuangan.pdf');
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Tanggal,Kategori,Tipe,Jumlah,Keterangan\n";
    transactions.forEach(t => {
      csvContent += `${t.date},${t.category},${t.type},${t.amount},${t.description}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "data_transaksi.csv");
    document.body.appendChild(link);
    link.click();
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 50) return 'score-good';
    if (score >= 30) return 'score-warning';
    return 'score-danger';
  };

  return (
    <div className="analytics-container">
      
      {/* 1. HEADER & CONTROLS */}
      <div className="glass-header">
        <div className="header-title">
          <h1><Activity size={28}/> Financial Analytics</h1>
          <p className="text-muted text-sm">Analisis performa & kesehatan keuangan</p>
        </div>
        <div className="controls-wrapper">
          <button className={`btn-filter ${viewMode === 'monthly' ? 'active' : ''}`} onClick={() => setViewMode('monthly')}>Bulanan</button>
          <button className={`btn-filter ${viewMode === 'yearly' ? 'active' : ''}`} onClick={() => setViewMode('yearly')}>Tahunan</button>
          <button className="btn-export" onClick={handleExportCSV}><Download size={16}/> CSV</button>
          <button className="btn-export" onClick={handleExportPDF}><Download size={16}/> PDF</button>
        </div>
      </div>

      {/* 2. KPI CARDS */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon" style={{background:'#dcfce7', color:'#166534'}}><TrendingUp size={24}/></div>
          <div className="kpi-label">Total Pemasukan</div>
          <div className="kpi-value">Rp {kpi.income.toLocaleString('id-ID', {notation:'compact'})}</div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-icon" style={{background:'#fee2e2', color:'#991b1b'}}><TrendingDown size={24}/></div>
          <div className="kpi-label">Total Pengeluaran</div>
          <div className="kpi-value">Rp {kpi.expense.toLocaleString('id-ID', {notation:'compact'})}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{background:'#dbeafe', color:'#1e40af'}}><Wallet size={24}/></div>
          <div className="kpi-label">Net Savings</div>
          <div className="kpi-value" style={{color: kpi.savings >= 0 ? 'var(--success)' : 'var(--danger)'}}>
            Rp {kpi.savings.toLocaleString('id-ID', {notation:'compact'})}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{background:'#f3e8ff', color:'#6b21a8'}}><ShieldAlert size={24}/></div>
          <div className="flex justify-between items-center">
            <div className="kpi-label">Health Score</div>
            <span className={`health-score ${getScoreColor(kpi.healthScore)}`}>{kpi.healthScore}/100</span>
          </div>
          <div className="kpi-value">{kpi.healthScore >= 80 ? 'Excellent' : kpi.healthScore >= 50 ? 'Good' : 'Risk'}</div>
        </div>
      </div>

      {/* 3. MAIN CHARTS (Trend & Category) */}
      <div className="charts-grid-main">
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title"><Activity size={18}/> Income vs Expense Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={charts.trend}>
              <defs>
                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
              <XAxis dataKey="name" fontSize={12} stroke="#94a3b8"/>
              <YAxis fontSize={12} stroke="#94a3b8" tickFormatter={(v)=>`${v/1000}k`}/>
              <Tooltip formatter={(v)=>`Rp ${v.toLocaleString()}`}/>
              <Legend/>
              <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#incGrad)" name="Pemasukan" strokeWidth={2}/>
              <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#expGrad)" name="Pengeluaran" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title"><Target size={18}/> Expense Breakdown</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={charts.category} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {charts.category.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v)=>`Rp ${v.toLocaleString()}`}/>
              <Legend wrapperStyle={{fontSize:'12px'}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. INSIGHTS & PROJECTIONS */}
      <div className="insights-grid">
        
        {/* Kolom Kiri: AI Insights */}
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title"><Lightbulb size={18}/> Smart Financial Insights</h3>
          </div>
          <div className="flex flex-col">
            {insights.length > 0 ? insights.map((insight, idx) => (
              <div key={idx} className={`insight-card ${insight.type}`}>
                {insight.type === 'risk' ? <ShieldAlert size={20} className="text-danger"/> : <Lightbulb size={20} className="text-success"/>}
                <div className="insight-text">
                  <h4>{insight.title}</h4>
                  <p>{insight.msg}</p>
                </div>
              </div>
            )) : <p className="text-muted text-sm text-center">Data belum cukup untuk analisis.</p>}
          </div>
        </div>

        {/* Kolom Kanan: Goals & Projection */}
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title"><TrendingUp size={18}/> Savings Projection (6 Mo)</h3>
          </div>
          <div style={{height: '200px', marginBottom: '24px'}}>
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={charts.projection}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                 <XAxis dataKey="name" fontSize={10} hide/>
                 <YAxis hide/>
                 <Tooltip formatter={(v)=>`Rp ${v.toLocaleString()}`}/>
                 <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} dot={{r:4}}/>
               </LineChart>
             </ResponsiveContainer>
          </div>

          <h4 className="font-bold mb-4 text-sm text-muted">Active Goals</h4>
          {goals.map((g, i) => (
            <div key={i} className="goal-item">
              <div className="goal-info">
                <span>{g.title}</span>
                <span>{Math.round((g.current/g.target)*100)}%</span>
              </div>
              <div className="progress-bg">
                <div 
                  className="progress-fill" 
                  style={{
                    width: `${Math.min(100, (g.current/g.target)*100)}%`, 
                    background: COLORS[i % COLORS.length]
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Analytics;