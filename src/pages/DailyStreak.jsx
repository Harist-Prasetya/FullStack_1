import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Flame, CheckCircle, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import '../styles/streak.css';

const DAILY_LIMIT = 40000;

const DailyStreak = () => {
  const [streak, setStreak] = useState(0);
  const [todaySpent, setTodaySpent] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateStreak();
  }, []);

  const calculateStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Ambil data 30 hari terakhir
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const { data } = await supabase
        .from('transactions')
        .select('date, amount')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', thirtyDaysAgo.toISOString());

      if (data) {
        processStreakData(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const processStreakData = (transactions) => {
    // 1. Grouping expense per tanggal
    const expenseByDate = {};
    transactions.forEach(t => {
      // Pastikan format YYYY-MM-DD lokal
      const dateKey = t.date; 
      expenseByDate[dateKey] = (expenseByDate[dateKey] || 0) + t.amount;
    });

    // 2. Hitung Pengeluaran Hari Ini
    // Menggunakan toLocaleDateString('en-CA') untuk format YYYY-MM-DD yang konsisten
    const todayStr = new Date().toLocaleDateString('en-CA');
    const spentToday = expenseByDate[todayStr] || 0;
    setTodaySpent(spentToday);

    // 3. Hitung Streak (Mundur dari Kemarin)
    let currentStreak = 0;
    const historyData = [];
    
    // Loop 14 hari ke belakang untuk tampilan kalender
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA');
      
      const spent = expenseByDate[dateStr] || 0; // Jika tidak ada transaksi, dianggap 0 (Hemat)
      const isSuccess = spent <= DAILY_LIMIT;
      const isToday = i === 0;

      // Logic Streak: Hitung berturut-turut dari KEMARIN (i=1)
      if (i > 0) {
        if (isSuccess) {
          currentStreak++;
        } else {
          // Jika putus di tengah jalan, stop counting streak tapi lanjut loop untuk history
          // Tapi kita hanya butuh menghitung streak yang 'aktif' saat ini
          // Jadi kalau kemarin gagal, streak = 0.
        }
      }

      historyData.push({
        date: d,
        dayName: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        dateNum: d.getDate(),
        spent,
        isSuccess,
        isToday
      });
    }

    // Logic tambahan: Jika kemarin GAGAL, streak reset jadi 0. 
    // Kita harus loop lagi khusus untuk menghitung streak yang benar-benar 'unbroken' dari kemarin.
    let realStreak = 0;

    for (let i = 1; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-CA');

    // Jika tidak ada transaksi sama sekali di hari itu → STOP streak
    if (!expenseByDate.hasOwnProperty(dateStr)) {
        break;
    }

    const spent = expenseByDate[dateStr];

    if (spent <= DAILY_LIMIT) {
        realStreak++;
    } else {
        break;
    }
    }


    // Jika hari ini SUDAH gagal, api-nya mungkin bisa kita buat redup/berbeda, 
    // tapi untuk motivasi, streak dihitung dari keberhasilan masa lalu.
    setStreak(realStreak);
    setHistory(historyData.reverse()); // Supaya urutan dari kiri ke kanan (lama ke baru)
  };

  // Progress Bar Color
  const getProgressColor = () => {
    const percent = (todaySpent / DAILY_LIMIT) * 100;
    if (percent > 100) return '#ef4444'; // Merah (Over)
    if (percent > 75) return '#f59e0b';  // Kuning (Warning)
    return '#10b981'; // Hijau (Aman)
  };

  return (
    <div className="streak-container">
      
      {/* 1. HERO FIRE SECTION */}
      <div className="streak-hero">
        <Flame size={120} className="flame-icon" fill={streak > 0 ? "#f97316" : "none"} />
        <div className="streak-count">{streak}</div>
        <div className="streak-label">Days Streak 🔥</div>
        <p style={{marginTop:'10px', fontSize:'14px', opacity:0.8}}>
          {streak > 0 
            ? "Kamu jago hemat! Pertahankan apinya!" 
            : "Ayo mulai hemat hari ini untuk nyalakan api!"}
        </p>
      </div>

      {/* 2. TODAY'S PROGRESS */}
      <div className="today-card">
        <div className="limit-info">
          <span>Hari Ini</span>
          <span style={{color: todaySpent > DAILY_LIMIT ? 'red' : 'inherit'}}>
            {todaySpent.toLocaleString()} / {DAILY_LIMIT.toLocaleString()}
          </span>
        </div>
        
        <div className="progress-bar-bg">
          <div 
            className="progress-bar-fill" 
            style={{
              width: `${Math.min((todaySpent / DAILY_LIMIT) * 100, 100)}%`,
              backgroundColor: getProgressColor()
            }}
          ></div>
        </div>

        <div style={{marginTop: '12px', fontSize: '13px', display:'flex', gap:'8px', alignItems:'center'}}>
          {todaySpent <= DAILY_LIMIT ? (
            <>
              <ShieldCheck size={16} color="var(--success)"/> 
              <span className="text-muted">Masih aman! Jangan boros ya.</span>
            </>
          ) : (
            <>
              <AlertTriangle size={16} color="var(--danger)"/>
              <span style={{color:'var(--danger)', fontWeight:'bold'}}>Yah! Limit hari ini jebol.</span>
            </>
          )}
        </div>
      </div>

      {/* 3. HISTORY GRID */}
      <div className="calendar-card">
        <h3 style={{fontWeight:'bold', marginBottom:'16px'}}>Riwayat 2 Minggu Terakhir</h3>
        <div className="calendar-grid">
          {history.map((day, idx) => (
            <div 
              key={idx} 
              className={`day-box ${day.isToday ? 'today' : (day.isSuccess ? 'success' : 'fail')}`}
            >
              <div className="status-icon">
                {day.isSuccess ? <CheckCircle size={16}/> : <XCircle size={16}/>}
              </div>
              <span>{day.dayName}</span>
              <span style={{fontSize:'10px', opacity:0.7}}>{day.dateNum}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default DailyStreak;