import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Target, Plus, Trash2, Trophy, TrendingUp } from 'lucide-react';
import '../styles/goals.css';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    target_amount: '',
    saved_amount: ''
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setGoals(data);
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('goals').insert([{
      ...newGoal,
      target_amount: Number(newGoal.target_amount),
      saved_amount: Number(newGoal.saved_amount || 0),
      user_id: user.id
    }]);

    setShowForm(false);
    setNewGoal({ title: '', target_amount: '', saved_amount: '' });
    fetchGoals();
  };

  const handleDelete = async (id) => {
    await supabase.from('goals').delete().eq('id', id);
    fetchGoals();
  };

  const totalSaved = goals.reduce((acc, g) => acc + Number(g.saved_amount), 0);
  const totalTarget = goals.reduce((acc, g) => acc + Number(g.target_amount), 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="goals-container">

      {/* ===== HEADER ===== */}
      <div className="goals-header">
        <h2 className="goals-title">Target Impian 🎯</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="add-goal-btn"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* ===== SUMMARY STATS ===== */}
      <div className="goals-summary">
        <div className="summary-card">
          <TrendingUp size={20} />
          <div>
            <p>Total Terkumpul</p>
            <h3>Rp {totalSaved.toLocaleString('id-ID')}</h3>
          </div>
        </div>

        <div className="summary-card">
          <Target size={20} />
          <div>
            <p>Total Target</p>
            <h3>Rp {totalTarget.toLocaleString('id-ID')}</h3>
          </div>
        </div>

        <div className="summary-card highlight">
          <Trophy size={20} />
          <div>
            <p>Progress Keseluruhan</p>
            <h3>{overallProgress.toFixed(0)}%</h3>
          </div>
        </div>
      </div>

      {/* ===== FORM ===== */}
      {showForm && (
        <div className="goal-form-card">
          <form onSubmit={handleAddGoal}>
            <input
              placeholder="Nama Target (cth: Laptop)"
              value={newGoal.title}
              onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
              required
            />

            <input
              type="number"
              placeholder="Harga Barang (Rp)"
              value={newGoal.target_amount}
              onChange={e => setNewGoal({ ...newGoal, target_amount: e.target.value })}
              required
            />

            <input
              type="number"
              placeholder="Uang Terkumpul Saat Ini (Rp)"
              value={newGoal.saved_amount}
              onChange={e => setNewGoal({ ...newGoal, saved_amount: e.target.value })}
            />

            <button type="submit">Simpan Target</button>
          </form>
        </div>
      )}

      {/* ===== GOALS LIST ===== */}
      {goals.length === 0 ? (
        <div className="empty-state">
          <Target size={40} />
          <p>Belum ada target 😢</p>
          <span>Ayo tambahkan target pertamamu!</span>
        </div>
      ) : (
        <div className="goals-list">
          {goals.map((goal) => {
            const progress = Math.min(
              (goal.saved_amount / goal.target_amount) * 100,
              100
            );

            const remaining = goal.target_amount - goal.saved_amount;

            const isCompleted = progress >= 100;

            return (
              <div key={goal.id} className="goal-card">

                <div className="goal-top">
                  <div className="goal-title">
                    <Target size={18} />
                    <span>{goal.title}</span>
                  </div>

                  <div className="goal-actions">
                    {isCompleted && (
                      <span className="completed-badge">
                        <Trophy size={14} /> Achieved
                      </span>
                    )}
                    <Trash2
                      size={18}
                      className="delete-btn"
                      onClick={() => handleDelete(goal.id)}
                    />
                  </div>
                </div>

                <div className="goal-progress-bg">
                  <div
                    className="goal-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="goal-amounts">
                  <span>
                    Terkumpul: Rp {goal.saved_amount.toLocaleString('id-ID')}
                  </span>
                  <span>
                    Target: Rp {goal.target_amount.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="goal-remaining">
                  {isCompleted ? (
                    <span className="success-text">
                      🎉 Target Tercapai!
                    </span>
                  ) : (
                    <span>
                      Sisa: Rp {remaining.toLocaleString('id-ID')}
                    </span>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Goals;
