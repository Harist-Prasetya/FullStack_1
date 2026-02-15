import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUI } from '../context/UIContext'; // Import Toast

const Auth = () => {
  const { showToast } = useUI(); // Gunakan Hook Toast
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await supabase.auth.signInWithPassword({ email, password });
      } else {
        result = await supabase.auth.signUp({ email, password });
      }

      const { error, data } = result;

      if (error) throw error;

      if (isLogin) {
        showToast('Login berhasil! Selamat datang kembali 👋', 'success');
      } else {
        // Cek apakah auto-login atau butuh konfirmasi email
        if (data.session) {
          showToast('Registrasi berhasil! Anda sudah login.', 'success');
        } else {
          showToast('Cek email Anda untuk verifikasi akun!', 'success');
        }
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      backgroundColor: 'var(--bg-color)',
      padding: '20px'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 className="font-bold" style={{ fontSize: '24px', marginBottom: '10px', color: 'var(--primary)' }}>
          {isLogin ? 'Welcome Back! 👋' : 'Create Account 🚀'}
        </h1>
        <p className="text-muted" style={{ marginBottom: '24px' }}>
          {isLogin ? 'Masuk untuk kelola uangmu' : 'Mulai perjalanan finansialmu'}
        </p>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
          />
          
          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding: '14px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '10px',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Masuk Sekarang' : 'Daftar Akun')}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
          {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
          <span 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? 'Daftar disini' : 'Login disini'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Auth;