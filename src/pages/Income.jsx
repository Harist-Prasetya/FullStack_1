import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUI } from '../context/UIContext';
import { 
  DollarSign, Calendar, CreditCard, CheckCircle, 
  Briefcase, Gift, TrendingUp, Wallet, ArrowUpCircle 
} from 'lucide-react';
import '../styles/forms.css';

const CATEGORIES = [
  { id: 'Gaji', icon: <Briefcase size={20}/>, label: 'Gaji' },
  { id: 'Freelance', icon: <DollarSign size={20}/>, label: 'Freelance' },
  { id: 'Bonus', icon: <Gift size={20}/>, label: 'Bonus' },
  { id: 'Investasi', icon: <TrendingUp size={20}/>, label: 'Investasi' },
  { id: 'Lainnya', icon: <Wallet size={20}/>, label: 'Lainnya' },
];

const Income = () => {
  const { showToast } = useUI();
  const [loading, setLoading] = useState(false);
  const [recentIncome, setRecentIncome] = useState([]);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Gaji',
    description: '',
    amount: '',
    account: 'BCA',
    is_recurring: false
  });

  // Fetch Data Terakhir untuk Sidebar
  useEffect(() => {
    fetchRecent();
  }, []);

  const fetchRecent = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'income')
      .order('created_at', { ascending: false })
      .limit(5);
    if(data) setRecentIncome(data);
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCategorySelect = (catId) => {
    setFormData(prev => ({ ...prev, category: catId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { showToast("Sesi habis.", "error"); return; }
      
      const amountVal = parseFloat(formData.amount);
      if(!amountVal || amountVal <= 0) { showToast("Masukkan jumlah valid", "error"); setLoading(false); return;}

      const { error } = await supabase.from('transactions').insert([{
        user_id: user.id, type: 'income', ...formData, amount: amountVal
      }]);

      if (error) throw error;

      showToast('Pemasukan Berhasil! 🤑', 'success');
      setFormData(prev => ({ ...prev, description: '', amount: '' }));
      fetchRecent(); // Refresh sidebar

    } catch (error) { showToast(error.message, 'error'); } 
    finally { setLoading(false); }
  };

  return (
    <div className="page-container">
      <div className="split-layout">
        
        {/* --- LEFT: INPUT FORM --- */}
        <div className="form-card">
          <div className="bg-blob blob-green"></div>
          
          <div className="form-header">
            <h2 className="form-title text-success"><ArrowUpCircle size={28}/> Input Pemasukan</h2>
            <p className="form-subtitle">Catat setiap sen yang masuk ke dompetmu.</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* HERO AMOUNT INPUT */}
            <div className="input-group">
              <label className="input-label">Jumlah Pemasukan</label>
              <div className="amount-wrapper">
                <span className="currency-symbol">Rp</span>
                <input 
                  type="number" name="amount" placeholder="0" 
                  value={formData.amount} onChange={handleChange} 
                  className="amount-input" autoFocus
                />
              </div>
            </div>

            {/* CATEGORY GRID */}
            <div className="input-group">
              <label className="input-label">Kategori</label>
              <div className="category-grid">
                {CATEGORIES.map((cat) => (
                  <div 
                    key={cat.id} 
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`category-item income-theme ${formData.category === cat.id ? 'active' : ''}`}
                  >
                    <div className="cat-icon">{cat.icon}</div>
                    <span className="cat-name">{cat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* DATE & ACCOUNT */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label className="input-label"><Calendar size={14}/> Tanggal</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} className="modern-input" />
              </div>
              <div>
                <label className="input-label"><CreditCard size={14}/> Akun</label>
                <select name="account" value={formData.account} onChange={handleChange} className="modern-input">
                  <option value="BCA">BCA</option>
                  <option value="Mandiri">Mandiri</option>
                  <option value="Jago">Jago</option>
                  <option value="Cash">Tunai</option>
                </select>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="input-group">
              <label className="input-label">Catatan (Opsional)</label>
              <input type="text" name="description" placeholder="Contoh: Project Desain" value={formData.description} onChange={handleChange} className="modern-input" />
            </div>

            {/* RECURRING TOGGLE */}
            <label className="toggle-wrapper">
              <input type="checkbox" name="is_recurring" checked={formData.is_recurring} onChange={handleChange} className="toggle-checkbox" />
              <span className="toggle-text">Pendapatan Rutin (Bulanan)</span>
            </label>

            <button type="submit" disabled={loading} className="btn-submit btn-green">
              {loading ? 'Menyimpan...' : <><CheckCircle size={20}/> Simpan Pemasukan</>}
            </button>
          </form>
        </div>

        {/* --- RIGHT: RECENT HISTORY --- */}
        <div className="summary-card">
          <h3 className="summary-title text-success"><TrendingUp size={18}/> Riwayat Masuk</h3>
          
          <div className="recent-list">
            {recentIncome.map((t) => (
              <div key={t.id} className="recent-item">
                <div className="recent-info">
                  <p>{t.category}</p>
                  <span>{new Date(t.date).toLocaleDateString('id-ID', {day:'numeric', month:'short'})} • {t.account}</span>
                </div>
                <span className="recent-amount text-green">+ Rp {t.amount.toLocaleString('id-ID')}</span>
              </div>
            ))}
            {recentIncome.length === 0 && <p className="text-muted text-sm text-center py-4">Belum ada data baru.</p>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Income;