import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUI } from '../context/UIContext';
import { 
  Utensils, Car, ShoppingBag, Zap, Film, HeartPulse, 
  Calendar, CreditCard, Save, ArrowDownCircle, AlertCircle 
} from 'lucide-react';
import '../styles/forms.css';

const EXPENSE_CATEGORIES = [
  { id: 'Makan', icon: <Utensils size={20}/>, label: 'Makan' },
  { id: 'Transport', icon: <Car size={20}/>, label: 'Transport' },
  { id: 'Belanja', icon: <ShoppingBag size={20}/>, label: 'Belanja' },
  { id: 'Tagihan', icon: <Zap size={20}/>, label: 'Tagihan' },
  { id: 'Hiburan', icon: <Film size={20}/>, label: 'Hiburan' },
  { id: 'Kesehatan', icon: <HeartPulse size={20}/>, label: 'Sehat' },
];

const Expense = () => {
  const { showToast } = useUI();
  const [loading, setLoading] = useState(false);
  const [recentExpense, setRecentExpense] = useState([]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Makan',
    description: '',
    amount: '',
    account: 'BCA',
    necessity: 'Need', // Need vs Want
    is_recurring: false
  });

  useEffect(() => { fetchRecent(); }, []);

  const fetchRecent = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .order('created_at', { ascending: false })
      .limit(5);
    if(data) setRecentExpense(data);
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
      if(!amountVal || amountVal <= 0) { showToast("Jumlah valid diperlukan", "error"); setLoading(false); return;}

      const { error } = await supabase.from('transactions').insert([{
        user_id: user.id, type: 'expense', ...formData, amount: amountVal
      }]);

      if (error) throw error;

      showToast('Pengeluaran Dicatat! 💸', 'success');
      setFormData(prev => ({ ...prev, description: '', amount: '' }));
      fetchRecent(); 

    } catch (error) { showToast(error.message, 'error'); } 
    finally { setLoading(false); }
  };

  return (
    <div className="page-container">
      <div className="split-layout">
        
        {/* --- LEFT: INPUT FORM --- */}
        <div className="form-card">
          <div className="bg-blob blob-red"></div>
          
          <div className="form-header">
            <h2 className="form-title text-danger"><ArrowDownCircle size={28}/> Input Pengeluaran</h2>
            <p className="form-subtitle">Jaga cashflow, catat pengeluaranmu.</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* HERO AMOUNT INPUT */}
            <div className="input-group">
              <label className="input-label">Total Belanja</label>
              <div className="amount-wrapper">
                <span className="currency-symbol text-danger">Rp</span>
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
                {EXPENSE_CATEGORIES.map((cat) => (
                  <div 
                    key={cat.id} 
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`category-item expense-theme ${formData.category === cat.id ? 'active' : ''}`}
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
                <label className="input-label"><CreditCard size={14}/> Sumber Dana</label>
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
              <label className="input-label">Keterangan</label>
              <input type="text" name="description" placeholder="Cth: Nasi Padang" value={formData.description} onChange={handleChange} className="modern-input" />
            </div>

            {/* NEED vs WANT TOGGLE (Special UI) */}
            <div className="input-group" style={{background:'#fef2f2', padding: '12px', borderRadius:'12px', border:'1px solid #fee2e2'}}>
              <label className="input-label text-danger flex items-center gap-2"><AlertCircle size={14}/> Prioritas (Wajib isi)</label>
              <div style={{display:'flex', gap:'20px', marginTop:'8px'}}>
                <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer'}}>
                  <input type="radio" name="necessity" value="Need" checked={formData.necessity === 'Need'} onChange={handleChange} style={{accentColor:'var(--danger)', width:'18px', height:'18px'}} />
                  <span style={{fontWeight:'700', fontSize:'14px'}}>Need (Butuh)</span>
                </label>
                <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer'}}>
                  <input type="radio" name="necessity" value="Want" checked={formData.necessity === 'Want'} onChange={handleChange} style={{accentColor:'var(--danger)', width:'18px', height:'18px'}} />
                  <span style={{fontWeight:'700', fontSize:'14px'}}>Want (Ingin)</span>
                </label>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-submit btn-red">
              {loading ? 'Menyimpan...' : <><Save size={20}/> Simpan Pengeluaran</>}
            </button>
          </form>
        </div>

        {/* --- RIGHT: RECENT HISTORY --- */}
        <div className="summary-card">
          <h3 className="summary-title text-danger"><ArrowDownCircle size={18}/> Baru Keluar</h3>
          
          <div className="recent-list">
            {recentExpense.map((t) => (
              <div key={t.id} className="recent-item">
                <div className="recent-info">
                  <p>{t.category}</p>
                  <span>{new Date(t.date).toLocaleDateString('id-ID', {day:'numeric', month:'short'})} • {t.necessity}</span>
                </div>
                <span className="recent-amount text-red">- Rp {t.amount.toLocaleString('id-ID')}</span>
              </div>
            ))}
            {recentExpense.length === 0 && <p className="text-muted text-sm text-center py-4">Belum ada data.</p>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Expense;