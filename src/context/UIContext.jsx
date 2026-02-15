import { createContext, useContext, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const UIContext = createContext();

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    // Hilang otomatis setelah 3 detik
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <UIContext.Provider value={{ showToast }}>
      {children}
      
      {/* RENDER TOAST COMPONENT DISINI (GLOBAL) */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            {toast.type === 'success' ? (
              <CheckCircle size={20} color="var(--success)" />
            ) : (
              <XCircle size={20} color="var(--danger)" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
};